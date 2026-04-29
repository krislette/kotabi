<script lang="ts">
  import {
    highlightedIso2s,
    zoomToCountries,
    discoverResult,
    activeIso2,
    ytPlayerStore,
  } from "../stores/mapStore";
  import type { EmotionResponse } from "../types";

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  const EMOTION_EMOJI: Record<string, string> = {
    joy: "😊",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    surprise: "😲",
    disgust: "🤢",
    neutral: "😐",
  };

  let text = "";
  let loading = false;
  let error = "";
  let result: EmotionResponse | null = null;
  let musicIndex = 0; // which song in the playlist is currently showing
  let initialVideoId = "";

  async function detect() {
    error = "";
    const trimmed = text.trim();
    if (!trimmed) {
      error = "Please describe how you're feeling.";
      return;
    }

    loading = true;
    try {
      const res = await fetch(`${API_BASE}/emotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Server error: ${res.status}`);
      }

      result = await res.json();
      musicIndex = 0;
      initialVideoId = result!.music_list[0].video_id;

      // Clear any leftover discover highlights
      discoverResult.set(null);
      activeIso2.set(null);

      // Highlight loanword origin countries; treat GB as GB+US (same as Discover panel)
      const isos = [
        ...new Set(
          result!.loanwords.flatMap((w) =>
            w.iso2 === "GB" ? ["GB", "US"] : [w.iso2],
          ),
        ),
      ];
      highlightedIso2s.set(isos);
      zoomToCountries.set(isos);
    } catch (e: any) {
      error = e.message ?? "Unknown error";
    } finally {
      loading = false;
    }
  }

  // Use an object so the closure always reads the latest value by reference
  const state = { transitioning: false };

  function nextSong() {
    if (!result) return;
    state.transitioning = true;
    musicIndex = (musicIndex + 1) % result.music_list.length;
    ytPlayer?.loadVideoById(result.music_list[musicIndex].video_id);
  }

  function prevSong() {
    if (!result) return;
    state.transitioning = true;
    musicIndex =
      (musicIndex - 1 + result.music_list.length) % result.music_list.length;
    ytPlayer?.loadVideoById(result.music_list[musicIndex].video_id);
  }

  import { onMount, onDestroy } from "svelte";

  let iframeEl: HTMLIFrameElement;
  let ytPlayer: any = null;

  // Load the YT IFrame API script once
  onMount(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  onDestroy(() => {
    ytPlayer?.destroy();
    ytPlayer = null;
  });

  // Re-bind YT.Player every time the iframe is (re)rendered
  function bindYTPlayer(node: HTMLIFrameElement) {
    iframeEl = node;
    const tryBind = () => {
      if ((window as any).YT?.Player) {
        ytPlayer?.destroy();
        ytPlayer = new (window as any).YT.Player(node, {
          events: {
            onStateChange: (e: any) => {
              if (e.data === 1) state.transitioning = false;
              if (e.data === 0 && !state.transitioning) nextSong();
            },
            onReady: () => {
              ytPlayerStore.set(ytPlayer);
            },
          },
        });
      } else {
        // API not ready yet — wait for it
        (window as any).onYouTubeIframeAPIReady = tryBind;
      }
    };
    tryBind();
    return {
      destroy() {
        ytPlayer?.destroy();
        ytPlayer = null;
        ytPlayerStore.set(null);
      },
    };
  }

  function reset() {
    result = null;
    text = "";
    error = "";
    musicIndex = 0;
    highlightedIso2s.set([]);
    zoomToCountries.set([]);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      detect();
    }
  }

  function flag(iso2: string): string {
    return `https://flagpedia.net/data/flags/normal/${iso2.toLowerCase()}.png`;
  }

  $: currentSong = result?.music_list[musicIndex];
</script>

<div class="feel-panel">
  <!-- Intro -->
  <div class="intro">
    <p class="intro-jp">感情の旅</p>
    <p class="intro-en">Tell us how you're feeling in plain English.</p>
    <p class="intro-note">
      We'll <strong>detect your emotion</strong>, recommend a
      <strong>song</strong> for your mood, and surface
      <strong>loanwords</strong> from the map that relate to how you feel.
    </p>
  </div>

  <!-- Input -->
  <div class="input-area">
    <textarea
      class="feel-input"
      class:error-state={!!error}
      bind:value={text}
      on:keydown={handleKeydown}
      placeholder="e.g. I feel nostalgic and a little tired..."
      rows="3"
      disabled={loading}
      aria-label="Emotion text input"
    />
    <button
      class="detect-btn"
      on:click={detect}
      disabled={loading || !text.trim()}
    >
      {#if loading}
        <span class="btn-spinner" />
      {:else}
        <span class="btn-kanji">感じる</span>
        <span class="btn-en">Detect</span>
      {/if}
    </button>
  </div>

  {#if error}
    <p class="error-msg">⚠ {error}</p>
  {/if}

  {#if result && currentSong}
    <div class="result-card">
      <div class="result-header">
        <span class="result-label">感情結果 · Emotion Result</span>
        <button class="reset-btn" on:click={reset} title="Clear">✕</button>
      </div>

      <!-- Detected emotion badge -->
      <div class="emotion-badge">
        <span class="emotion-emoji"
          >{EMOTION_EMOJI[result.emotion] ?? "🎭"}</span
        >
        <span class="emotion-label">{result.emotion}</span>
      </div>

      <!-- Music section -->
      <div class="section-title">Japanese Music for Your Mood</div>

      <div class="music-header">
        <span class="music-title">{currentSong.title}</span>
        <span class="vid-counter"
          >{musicIndex + 1} / {result.music_list.length}</span
        >
      </div>

      <div class="video-wrapper">
        <iframe
          id="yt-feel-player"
          src="https://www.youtube.com/embed/{initialVideoId}?enablejsapi=1&autoplay=1"
          title={currentSong.title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          use:bindYTPlayer
        />
      </div>

      <div class="vid-nav">
        <button class="vid-btn" on:click={prevSong} title="Previous song"
          >◀ Prev</button
        >
        <button class="vid-btn" on:click={nextSong} title="Next song"
          >Next ▶</button
        >
      </div>

      <!-- Loanword recommendations -->
      <div class="section-title">Related Loanwords</div>
      <div class="loanword-list">
        {#each result.loanwords as word}
          <div class="loanword-card">
            {#if word.iso2 === "GB"}
              <div class="lw-flag-split">
                <img class="flag-left" src={flag("GB")} alt="GB" />
                <img class="flag-right" src={flag("US")} alt="US" />
              </div>
            {:else}
              <img class="lw-flag" src={flag(word.iso2)} alt={word.language} />
            {/if}
            <div class="lw-info">
              <span class="lw-katakana">{word.katakana}</span>
              <span class="lw-meaning">{word.meaning}</span>
            </div>
            <span class="lw-lang">{word.language}</span>
          </div>
        {/each}
      </div>
      <p class="map-note">✦ Origin countries are highlighted on the map</p>
    </div>
  {:else if !error}
    <div class="example-hints">
      <p class="hints-label">Try these examples:</p>
      <div class="hints-grid">
        {#each ["I feel happy and excited", "I'm feeling sad and lonely", "I'm so angry right now", "I feel scared", "I'm surprised!", "This is disgusting", "Just a normal day"] as ex}
          <button
            class="hint-chip"
            on:click={() => {
              text = ex;
              detect();
            }}>{ex}</button
          >
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .feel-panel {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .intro {
    background: var(--clr-card-bg);
    border-bottom: 2px solid var(--clr-accent);
    border-radius: 0;
    padding: 16px 20px;
    margin: -16px -16px 0 -16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 160px;
    justify-content: center;
  }

  .intro-jp {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--clr-header);
    text-align: center;
  }

  .intro-en {
    font-size: 0.8rem;
    color: var(--clr-text-light);
    text-align: center;
  }

  .intro-note {
    font-size: 0.73rem;
    color: var(--clr-text-light);
    margin-top: 4px;
    background: var(--clr-sakura);
    padding: 5px 8px;
    border-radius: 4px;
    text-align: center;
  }

  .intro-note strong {
    color: var(--clr-accent);
  }

  .input-area {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .feel-input {
    flex: 1;
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 0.9rem;
    border: 1.5px solid var(--clr-border);
    border-radius: var(--radius-card);
    background: var(--clr-card-bg);
    color: var(--clr-header);
    outline: none;
    resize: none;
    transition:
      border-color var(--transition),
      box-shadow var(--transition);
    line-height: 1.5;
  }

  .feel-input:focus {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 3px rgba(191, 49, 49, 0.12);
  }

  .feel-input.error-state {
    border-color: #e0a020;
  }
  .feel-input:disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .detect-btn {
    padding: 7px 14px;
    background: var(--clr-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-card);
    cursor: pointer;
    font-family: var(--font-body);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    transition:
      background var(--transition),
      transform var(--transition);
    min-width: 64px;
    height: 72px;
    flex-shrink: 0;
  }

  .detect-btn:hover:not(:disabled) {
    background: #a02828;
    transform: translateY(-1px);
  }
  .detect-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn-kanji {
    font-size: 1rem;
    font-weight: 700;
  }
  .btn-en {
    font-size: 0.6rem;
    opacity: 0.8;
    letter-spacing: 0.05em;
  }

  .btn-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-msg {
    font-size: 0.78rem;
    color: #a07020;
    background: #fff8e8;
    border: 1px solid #f0d080;
    border-radius: 4px;
    padding: 7px 10px;
  }

  .result-card {
    background: var(--clr-card-bg);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid var(--clr-border);
    animation: fadeSlideIn 0.25s ease;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .result-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--clr-text-light);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .reset-btn {
    background: transparent;
    border: none;
    color: var(--clr-text-light);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background var(--transition);
  }

  .reset-btn:hover {
    background: var(--clr-sakura);
    color: var(--clr-accent);
  }

  .emotion-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--clr-sakura);
    border-radius: var(--radius-card);
    padding: 10px 14px;
    border: 1px solid #f0c0c0;
  }

  .emotion-emoji {
    font-size: 2rem;
    line-height: 1;
  }

  .emotion-label {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--clr-header);
    text-transform: capitalize;
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--clr-text-light);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-top: 1px solid var(--clr-border);
    padding-top: 10px;
  }

  .music-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .music-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--clr-header);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .music-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .music-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--clr-header);
    flex: 1;
    min-width: 0;
  }

  .vid-counter {
    font-size: 0.7rem;
    color: var(--clr-text-light);
    font-weight: 600;
    flex-shrink: 0;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    border-radius: var(--radius-card);
    overflow: hidden;
  }

  .video-wrapper iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-card);
  }

  .vid-nav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: -4px;
  }

  .vid-btn {
    flex: 1;
    background: var(--clr-card-bg);
    color: var(--clr-header);
    border: 1px solid var(--clr-border);
    border-radius: var(--radius-card);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all var(--transition);
    letter-spacing: 0.04em;
  }

  .vid-btn:hover {
    background: var(--clr-sakura);
    border-color: var(--clr-accent);
    color: var(--clr-accent);
    transform: translateY(-1px);
  }

  .loanword-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .loanword-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--clr-bg);
    border: 1px solid var(--clr-border);
    border-left: 3px solid var(--clr-gold);
    border-radius: var(--radius-card);
    padding: 8px 10px;
    transition:
      border-color var(--transition),
      transform var(--transition);
  }

  .loanword-card:hover {
    border-left-width: 5px;
    transform: translateY(-1px);
  }

  .lw-flag {
    width: 28px;
    height: 21px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .lw-flag-split {
    position: relative;
    width: 28px;
    height: 21px;
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .flag-left {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }

  .flag-right {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }

  .lw-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .lw-katakana {
    font-family: "Noto Sans JP", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--clr-header);
  }

  .lw-meaning {
    font-size: 0.7rem;
    color: var(--clr-text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lw-lang {
    font-size: 0.68rem;
    color: var(--clr-accent);
    font-weight: 600;
    flex-shrink: 0;
  }

  .map-note {
    font-size: 0.7rem;
    color: var(--clr-text-light);
    font-style: italic;
    text-align: center;
  }

  .example-hints {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .hints-label {
    font-size: 0.78rem;
    color: var(--clr-text-light);
    font-weight: 500;
  }

  .hints-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .hint-chip {
    background: var(--clr-card-bg);
    border: 1px solid var(--clr-border);
    border-radius: 20px;
    padding: 5px 12px;
    font-family: var(--font-body);
    font-size: 0.78rem;
    color: var(--clr-header);
    cursor: pointer;
    transition: all var(--transition);
    font-weight: 500;
  }

  .hint-chip:hover {
    background: var(--clr-sakura);
    border-color: var(--clr-accent);
    color: var(--clr-accent);
    transform: translateY(-1px);
    box-shadow: var(--shadow-card);
  }
</style>
