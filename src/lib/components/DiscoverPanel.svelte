<script lang="ts">
  import {
    activeIso2,
    activeMode,
    discoverResult,
    zoomToCountry,
  } from "../stores/mapStore";
  import type { PredictResponse } from "../types";

  const API_BASE = "http://localhost:8000";

  // State
  let word = "";
  let loading = false;
  let error = "";

  // Mirror the store locally for rendering
  let result: PredictResponse | null = null;
  discoverResult.subscribe((v) => (result = v));

  // Katakana validation
  const KATAKANA_RE = /^[\u30A0-\u30FF\u30FC\u30FB\u30FE\u30FD]+$/;

  function isKatakana(s: string): boolean {
    return KATAKANA_RE.test(s.trim());
  }

  // Prediction
  async function predict() {
    error = "";
    const trimmed = word.trim();

    if (!trimmed) {
      error = "単語を入力してください。 Please enter a word.";
      return;
    }
    if (!isKatakana(trimmed)) {
      error =
        "カタカナで入力してください。 Input must be katakana (e.g. コーヒー).";
      return;
    }

    loading = true;

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Server error: ${res.status}`);
      }

      const data: PredictResponse = await res.json();
      discoverResult.set(data);

      // Highlight the predicted country on the map
      activeIso2.set(data.prediction.iso2);
      activeMode.set("discover");
      zoomToCountry.set(data.prediction.iso2);
    } catch (e: any) {
      error = e.message ?? "Unknown error";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") predict();
  }

  function reset() {
    word = "";
    error = "";
    discoverResult.set(null);
    activeIso2.set(null);
  }

  function flag(iso2: string): string {
    return `https://flagpedia.net/data/flags/normal/${iso2.toLowerCase()}.png`;
  }
</script>

<div class="discover-panel">
  <!-- Instructions -->
  <div class="intro">
    <p class="intro-jp">外来語の語源を調べる</p>
    <p class="intro-en">
      Enter a katakana word to discover its donor language.
    </p>
    <p class="intro-note">
      <strong>Note:</strong> Classification is limited to
      <strong>English · French · German</strong>, the top 3 European donors in
      JMdict.
    </p>
  </div>

  <!-- Input row -->
  <div class="input-row">
    <input
      type="text"
      class="katakana-input"
      class:error-state={!!error}
      bind:value={word}
      on:keydown={handleKeydown}
      placeholder="コーヒー"
      spellcheck="false"
      autocomplete="off"
      aria-label="Katakana word input"
      disabled={loading}
    />
    <button
      class="predict-btn"
      on:click={predict}
      disabled={loading || !word.trim()}
    >
      {#if loading}
        <span class="btn-spinner" />
      {:else}
        <span class="btn-kanji">分析</span>
        <span class="btn-en">Analyze</span>
      {/if}
    </button>
  </div>

  {#if error}
    <p class="error-msg">⚠ {error}</p>
  {/if}

  <!-- Result card -->
  {#if result}
    <div class="result-card">
      <!-- Header -->
      <div class="result-header">
        <span class="result-label">予測結果 · Prediction</span>
        <button class="reset-btn" on:click={reset} title="Clear result"
          >✕</button
        >
      </div>

      <!-- Word being classified -->
      <div class="result-word">{result.word}</div>

      <!-- Top prediction -->
      <div class="top-prediction">
        <img
          class="pred-flag"
          src={flag(result.prediction.iso2)}
          alt={result.prediction.country}
        />
        <div class="pred-info">
          <span class="pred-language">{result.prediction.language}</span>
          <span class="pred-country">{result.prediction.country}</span>
        </div>
        <span class="pred-pct"
          >{(result.prediction.confidence * 100).toFixed(1)}%</span
        >
      </div>

      <!-- All 3 score bars -->
      <div class="score-bars">
        {#each result.all_scores as score}
          <div class="score-row">
            <img
              class="score-flag"
              src={flag(score.iso2)}
              alt={score.language}
            />
            <span class="score-lang">{score.language}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width:{(score.confidence * 100).toFixed(
                  1,
                )}%; background:{score.color}"
              />
            </div>
            <span class="score-pct">{(score.confidence * 100).toFixed(1)}%</span
            >
          </div>
        {/each}
      </div>

      <p class="confidence-note">
        Confidence is derived from the SVM decision function via softmax —
        useful for ranking, not strict probability.
      </p>
    </div>
  {:else if !error}
    <!-- Idle hint with example words -->
    <div class="example-hints">
      <p class="hints-label">Try these examples:</p>
      <div class="hints-grid">
        {#each ["コーヒー", "アルバイト", "テレビ", "バレエ", "ハンバーガー", "アンケート"] as ex}
          <button
            class="hint-chip"
            on:click={() => {
              word = ex;
              predict();
            }}>{ex}</button
          >
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .discover-panel {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Intro */
  .intro {
    background: var(--clr-card-bg);
    border-bottom: 3px solid var(--clr-accent);
    border-radius: 0;
    padding: 16px 20px;
    margin: -16px -16px 0 -16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 160px;
    justify-content: center;
  }

  .intro-jp {
    font-family: var(--font-heading);
    font-size: 1rem;
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
  }

  .intro-note strong {
    color: var(--clr-accent);
  }

  /* Input row */
  .input-row {
    display: flex;
    gap: 8px;
  }

  .katakana-input {
    flex: 1;
    padding: 7px 14px;
    font-family: "Noto Sans JP", sans-serif;
    font-size: 1.1rem;
    border: 1.5px solid var(--clr-border);
    border-radius: var(--radius-card);
    background: var(--clr-card-bg);
    color: var(--clr-header);
    outline: none;
    transition:
      border-color var(--transition),
      box-shadow var(--transition);
    letter-spacing: 0.06em;
  }

  .katakana-input:focus {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 3px rgba(191, 49, 49, 0.12);
  }

  .katakana-input.error-state {
    border-color: #e0a020;
    box-shadow: 0 0 0 3px rgba(224, 160, 32, 0.12);
  }

  .katakana-input:disabled {
    opacity: 0.6;
  }

  .predict-btn {
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
  }

  .predict-btn:hover:not(:disabled) {
    background: #a02828;
    transform: translateY(-1px);
  }

  .predict-btn:disabled {
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

  /* Error */
  .error-msg {
    font-size: 0.78rem;
    color: #a07020;
    background: #fff8e8;
    border: 1px solid #f0d080;
    border-radius: 4px;
    padding: 7px 10px;
  }

  /* Result card */
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

  .result-word {
    font-family: "Noto Sans JP", sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--clr-header);
    letter-spacing: 0.08em;
    line-height: 1;
  }

  /* Top prediction pill */
  .top-prediction {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--clr-sakura);
    border-radius: var(--radius-card);
    padding: 12px 14px;
    border: 1px solid #f0c0c0;
  }

  .pred-flag {
    width: 48px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
  }

  .pred-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pred-language {
    font-family: var(--font-heading);
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--clr-header);
  }

  .pred-country {
    font-size: 0.75rem;
    color: var(--clr-text-light);
  }

  .pred-pct {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--clr-accent);
  }

  /* Score bars */
  .score-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
  }

  .score-flag {
    width: 28px;
    height: 21px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .score-lang {
    width: 68px;
    flex-shrink: 0;
    color: var(--clr-text);
    font-weight: 500;
  }

  .bar-track {
    flex: 1;
    height: 7px;
    background: var(--clr-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .score-pct {
    width: 40px;
    text-align: right;
    color: var(--clr-text-light);
    font-size: 0.72rem;
  }

  .confidence-note {
    font-size: 0.68rem;
    color: var(--clr-text-light);
    line-height: 1.4;
    border-top: 1px solid var(--clr-border);
    padding-top: 8px;
    font-style: italic;
  }

  /* Example hints */
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
    font-family: "Noto Sans JP", sans-serif;
    font-size: 0.9rem;
    color: var(--clr-header);
    cursor: pointer;
    transition: all var(--transition);
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .hint-chip:hover {
    background: var(--clr-sakura);
    border-color: var(--clr-accent);
    color: var(--clr-accent);
    transform: translateY(-1px);
    box-shadow: var(--shadow-card);
  }
</style>
