<script lang="ts">
  import { activeMode, ytPlayerStore } from "./lib/stores/mapStore";
  import WorldMap from "./lib/components/WorldMap.svelte";
  import ExplorePanel from "./lib/components/ExplorePanel.svelte";
  import DiscoverPanel from "./lib/components/DiscoverPanel.svelte";
  import FeelPanel from "./lib/components/FeelPanel.svelte";
  import type { GairagioData } from "./lib/types";

  // Load gairaigo data
  import rawData from "./data/gairaigo_full.json";
  const data = rawData as GairagioData;

  // Pre-compute country count for the header stat
  const countryCount = new Set(
    Object.values(data)
      .map((m) => m.iso2)
      .filter((iso2) => iso2 !== "XX"),
  ).size;

  const wordCount = Object.values(data).reduce((s, m) => s + m.words.length, 0);

  let volume = 100;

  function onVolumeChange(e: Event) {
    volume = +(e.target as HTMLInputElement).value;
    $ytPlayerStore?.setVolume(volume);
  }

  function setMode(mode: "explore" | "discover" | "feel") {
    activeMode.set(mode);
  }
</script>

<div id="app-shell">
  <!-- Header -->
  <header class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <div class="header-title">
          <span class="title-jp">語旅</span>
          <span class="title-divider">·</span>
          <span class="title-en">Kotabi</span>
        </div>
        <p class="header-sub">
          Explore Japanese loanwords (外来語) and their donor languages across
          the world
        </p>
      </div>

      <div class="header-stats">
        <div class="stat">
          <span class="stat-num">{countryCount}</span>
          <span class="stat-label">countries</span>
        </div>
        <div class="stat-sep">·</div>
        <div class="stat">
          <span class="stat-num">{wordCount.toLocaleString()}</span>
          <span class="stat-label">loanwords</span>
        </div>
        <div class="stat-sep">·</div>
        <div class="stat">
          <span class="stat-num">JMdict</span>
          <span class="stat-label">source</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="app-main">
    <!-- Map (left column) -->
    <section class="map-section">
      <WorldMap {data} />
    </section>

    <!-- Panel (right column) -->
    <aside class="panel-section">
      <!-- Tab bar -->
      <div class="tab-bar" role="tablist">
        <button
          class="tab"
          class:active={$activeMode === "explore"}
          role="tab"
          aria-selected={$activeMode === "explore"}
          on:click={() => setMode("explore")}
        >
          <span class="tab-jp">探索</span>
          <span class="tab-en">Explore</span>
        </button>
        <button
          class="tab"
          class:active={$activeMode === "discover"}
          role="tab"
          aria-selected={$activeMode === "discover"}
          on:click={() => setMode("discover")}
        >
          <span class="tab-jp">発見</span>
          <span class="tab-en">Discover</span>
          <span class="tab-badge">AI</span>
        </button>
        <button
          class="tab"
          class:active={$activeMode === "feel"}
          role="tab"
          aria-selected={$activeMode === "feel"}
          on:click={() => setMode("feel")}
        >
          <span class="tab-jp">感情</span>
          <span class="tab-en">Feel</span>
          <span class="tab-badge">NEW</span>
        </button>
      </div>

      <!-- Panel content (swaps based on mode) -->
      <div class="panel-body">
        <div class="panel-slot" class:hidden={$activeMode !== "explore"}>
          <ExplorePanel {data} />
        </div>
        <div class="panel-slot" class:hidden={$activeMode !== "discover"}>
          <DiscoverPanel />
        </div>
        <div class="panel-slot" class:hidden={$activeMode !== "feel"}>
          <FeelPanel />
        </div>
      </div>
    </aside>
  </main>

  <!-- Footer -->
  <footer class="app-footer">
    <span
      >Dataset: <a
        href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project"
        target="_blank"
        rel="noopener">JMdict / EDICT</a
      > · CC BY-SA 4.0</span
    >
    <span class="footer-dot">·</span>
    <span>AI model: LinearSVC · character n-gram TF-IDF · 85.29% accuracy</span>
    <span class="footer-dot">·</span>
    <span>Emotion model: j-hartmann/emotion-english-distilroberta-base</span>
    <span class="footer-dot">·</span>
    <span>COSC 402</span>
    {#if $ytPlayerStore}
      <span class="footer-dot">·</span>
      <label class="vol-control" aria-label="Music volume">
        🔊
        <input
          type="range"
          min="0"
          max="100"
          bind:value={volume}
          on:input={onVolumeChange}
          class="vol-slider"
        />
      </label>
    {/if}
  </footer>
</div>

<style>
  /* Shell layout */
  #app-shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Header */
  .app-header {
    flex-shrink: 0;
    background-color: #1c2b4a;

    /* Seigaiha (青海波) wave-scale CSS pattern */
    background-image: radial-gradient(
        circle at 100% 150%,
        #1c2b4a 24%,
        #243558 25%,
        #243558 28%,
        #1c2b4a 29%,
        #1c2b4a 36%,
        #243558 36%,
        #243558 40%,
        transparent 40%,
        transparent
      ),
      radial-gradient(
        circle at 0% 150%,
        #1c2b4a 24%,
        #243558 25%,
        #243558 28%,
        #1c2b4a 29%,
        #1c2b4a 36%,
        #243558 36%,
        #243558 40%,
        transparent 40%,
        transparent
      ),
      radial-gradient(
        circle at 50% 100%,
        #243558 10%,
        #1c2b4a 11%,
        #1c2b4a 23%,
        #243558 24%,
        #243558 30%,
        #1c2b4a 31%,
        #1c2b4a 43%,
        #243558 44%,
        #243558 50%,
        #1c2b4a 51%,
        #1c2b4a 63%,
        #243558 64%,
        #243558 71%,
        transparent 71%,
        transparent
      ),
      radial-gradient(
        circle at 100% 50%,
        #243558 5%,
        #1c2b4a 6%,
        #1c2b4a 15%,
        #243558 16%,
        #243558 20%,
        #1c2b4a 21%,
        #1c2b4a 29%,
        #243558 30%,
        #243558 34%,
        #1c2b4a 35%,
        #1c2b4a 44%,
        #243558 44%,
        #243558 49%,
        transparent 50%,
        transparent
      ),
      radial-gradient(
        circle at 0% 50%,
        #243558 5%,
        #1c2b4a 6%,
        #1c2b4a 15%,
        #243558 16%,
        #243558 20%,
        #1c2b4a 21%,
        #1c2b4a 29%,
        #243558 30%,
        #243558 34%,
        #1c2b4a 35%,
        #1c2b4a 44%,
        #243558 44%,
        #243558 49%,
        transparent 50%,
        transparent
      );
    background-size: 80px 40px;

    border-bottom: 3px solid var(--clr-accent);
    padding: 0 24px;
  }

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 12px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .header-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .title-jp {
    font-family: "Shippori Mincho B1", serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.06em;
  }

  .title-divider {
    color: var(--clr-accent);
    font-size: 1rem;
  }

  .title-en {
    font-family: "Shippori Mincho B1", serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.04em;
  }

  .header-sub {
    font-family: "Noto Sans JP", sans-serif;
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.02em;
  }

  /* Stats cluster */
  .header-stats {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  .stat-num {
    font-family: "Shippori Mincho B1", serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--clr-gold);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .stat-sep {
    color: rgba(255, 255, 255, 0.2);
    font-size: 1rem;
    padding: 0 2px;
  }

  /* ── Main layout ──────────────────────────────────────────────── */
  .app-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .map-section {
    flex: 3; /* ~60% */
    min-width: 0;
    border-right: 1px solid var(--clr-border);
    background: var(--clr-bg);
    overflow: hidden;
  }

  .panel-section {
    flex: 2; /* ~40% */
    min-width: 280px;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    background: var(--clr-bg);
    overflow: hidden;
  }

  /* Tab bar */
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--clr-border);
    flex-shrink: 0;
    background: var(--clr-card-bg);
  }

  .tab {
    flex: 1;
    padding: 10px 8px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all var(--transition);
    position: relative;
  }

  .tab:hover {
    background: var(--clr-bg);
    border-bottom-color: var(--clr-gold);
  }

  .tab.active {
    border-bottom-color: var(--clr-accent);
    background: var(--clr-bg);
  }

  .tab-jp {
    font-family: "Shippori Mincho B1", serif;
    font-size: 1rem;
    font-weight: 800;
    color: var(--clr-header);
    line-height: 1;
    transition: color var(--transition);
  }

  .tab.active .tab-jp {
    color: var(--clr-accent);
  }

  .tab-en {
    font-size: 0.62rem;
    font-weight: 600;
    color: var(--clr-text-light);
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  .tab-badge {
    position: absolute;
    top: 6px;
    right: 20px;
    background: var(--clr-accent);
    color: #fff;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 10px;
    letter-spacing: 0.06em;
  }

  /* Panel body */
  .panel-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel-slot {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel-slot.hidden {
    display: none;
  }

  /* Footer */
  .app-footer {
    flex-shrink: 0;
    background: var(--clr-header);
    border-top: 3px solid var(--clr-accent);
    padding: 6px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: "Noto Sans JP", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    flex-wrap: wrap;
  }

  .app-footer a {
    color: var(--clr-gold);
    text-decoration: none;
  }

  .app-footer a:hover {
    text-decoration: underline;
  }

  .footer-dot {
    color: rgba(255, 255, 255, 0.2);
  }

  .vol-control {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }

  .vol-slider {
    width: 70px;
    accent-color: var(--clr-gold);
    cursor: pointer;
  }
</style>
