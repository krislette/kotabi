<script lang="ts">
  import { activeIso2 } from "../stores/mapStore";
  import type { GairagioData, WordEntry } from "../types";

  export let data: GairagioData;

  const PAGE_SIZE = 40;

  // Derived state
  interface CountryView {
    country: string;
    languages: string;
    iso2: string;
    words: WordEntry[];
  }

  let view: CountryView | null = null;
  let page = 0;
  let search = "";
  let loadMoreEl: HTMLButtonElement;

  $: {
    const iso2 = $activeIso2;
    if (!iso2) {
      view = null;
    } else {
      // Collect ALL language entries that map to this iso2
      const entries = Object.values(data).filter((m) => m.iso2 === iso2);
      if (entries.length === 0) {
        view = null;
      } else {
        const allWords = entries.flatMap((e) => e.words);
        const langNames = [...new Set(entries.map((e) => e.language))].join(
          " · ",
        );
        view = {
          country: entries[0].country,
          languages: langNames,
          iso2,
          words: allWords,
        };
        page = 0;
      }
    }
  }

  $: filteredWords =
    view?.words.filter(
      (w) =>
        !search ||
        w.katakana.includes(search) ||
        w.meaning?.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  $: pagedWords = filteredWords.slice(0, (page + 1) * PAGE_SIZE);
  $: hasMore = pagedWords.length < filteredWords.length;

  function loadMore() {
    page++;
  }

  function getFlagUrl(iso2: string): string {
    return `https://flagpedia.net/data/flags/normal/${iso2.toLowerCase()}.png`;
  }
</script>

<div class="explore-panel">
  {#if !view}
    <!-- Empty state -->
    <div class="empty-state">
      <div class="empty-kanji">地図</div>
      <p class="empty-lead">
        Click any <span class="highlight">golden country</span> on the map
      </p>
      <p class="empty-sub">
        to explore the Japanese loanwords borrowed from that language.
      </p>
    </div>
  {:else}
    <!-- Country header -->
    <div class="country-header">
      <div class="header-top">
        <img class="flag-img" src={getFlagUrl(view.iso2)} alt={view.country} />
      </div>
      <div class="country-name">{view.country}</div>
      <div class="language-tags">
        {#each view.languages.split(" · ") as lang}
          <span class="lang-tag">{lang}</span>
        {/each}
      </div>
      <div class="word-count">
        {view.words.length.toLocaleString()} loanwords in JMdict
      </div>
    </div>

    <!-- Search bar -->
    <div class="search-bar">
      <input
        type="text"
        bind:value={search}
        placeholder="Search katakana or meaning..."
        class="search-input"
      />
      {#if search}
        <button class="clear-btn" on:click={() => (search = "")}>✕</button>
      {/if}
    </div>

    <!-- Word grid -->
    <div class="word-grid">
      {#each pagedWords as word (word.katakana + word.meaning)}
        <div class="word-card">
          <span class="katakana">{word.katakana}</span>
          {#if word.meaning}
            <span class="meaning">{word.meaning}</span>
          {/if}
        </div>
      {/each}

      {#if hasMore}
        <button class="load-more" on:click={loadMore} bind:this={loadMoreEl}>
          もっと見る · Show more
          <span class="count-remaining">
            ({(filteredWords.length - pagedWords.length).toLocaleString()} remaining)
          </span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .explore-panel {
    flex: 1;
    overflow: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
    gap: 10px;
    color: var(--clr-text-light);
  }

  .empty-kanji {
    font-family: var(--font-heading);
    font-size: 3.5rem;
    color: var(--clr-border);
    line-height: 1;
    margin-bottom: 8px;
  }

  .empty-lead {
    font-size: 0.95rem;
    color: var(--clr-text);
    font-weight: 500;
  }

  .highlight {
    color: var(--clr-gold);
    font-weight: 700;
  }

  .empty-sub {
    font-size: 0.82rem;
    color: var(--clr-text-light);
    max-width: 220px;
  }

  /* Country header */
  .country-header {
    padding: 16px 20px;
    background: var(--clr-card-bg);
    border-bottom: 3px solid var(--clr-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    min-height: 160px;
    justify-content: center;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .flag-img {
    width: 48px;
    height: 32px;
    object-fit: cover;
    border-radius: 3px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }

  .country-name {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--clr-header);
    line-height: 1;
  }

  .language-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
  }

  .lang-tag {
    background: var(--clr-sakura);
    color: var(--clr-accent);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
  }

  .word-count {
    font-size: 0.8rem;
    color: var(--clr-text-light);
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--clr-border);
    background: var(--clr-bg);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    padding: 7px 14px;
    font-family: var(--font-body);
    font-size: 0.85rem;
    border: 1.5px solid var(--clr-border);
    border-radius: var(--radius-card);
    background: var(--clr-card-bg);
    color: var(--clr-header);
    outline: none;
    transition:
      border-color var(--transition),
      box-shadow var(--transition);
  }

  .search-input:focus {
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 3px rgba(191, 49, 49, 0.12);
  }

  .clear-btn {
    padding: 6px 10px;
    background: transparent;
    border: 1px solid var(--clr-border);
    border-radius: var(--radius-card);
    color: var(--clr-text-light);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--transition);
  }

  .clear-btn:hover {
    border-color: var(--clr-accent);
    color: var(--clr-accent);
  }

  /* Word grid */
  .word-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px;
    overflow-y: auto;
    min-height: 0;
    align-content: start;
  }

  .word-card {
    background: var(--clr-card-bg);
    border-radius: var(--radius-card);
    border-left: 2px solid var(--clr-gold);
    padding: 10px 12px;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 3px;
    height: fit-content;
    transition:
      transform var(--transition),
      box-shadow var(--transition);
    cursor: default;
  }

  .word-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lift);
  }

  .katakana {
    font-family: "Noto Sans JP", sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--clr-header);
    letter-spacing: 0.04em;
  }

  .meaning {
    font-size: 0.72rem;
    color: var(--clr-text-light);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .word-card:hover .meaning {
    -webkit-line-clamp: unset;
    line-clamp: unset;
    overflow: visible;
  }

  /* Load more */
  .load-more {
    padding: 10px;
    background: transparent;
    border: 1px dashed var(--clr-border);
    border-radius: var(--radius-card);
    color: var(--clr-text-light);
    font-family: var(--font-body);
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all var(--transition);
    width: 100%;
  }

  .load-more:hover {
    border-color: var(--clr-accent);
    color: var(--clr-accent);
    background: var(--clr-sakura);
  }

  .count-remaining {
    color: var(--clr-accent);
    font-size: 0.72rem;
  }
</style>
