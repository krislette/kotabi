<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import * as topojson from "topojson-client";
  import {
    activeIso2,
    activeMode,
    zoomToCountry,
    zoomToCountries,
    highlightedIso2s,
  } from "../stores/mapStore";
  import { ISO2_TO_NUMERIC } from "../isoMapping";
  import type { GairagioData } from "../types";

  export let data: GairagioData;

  // Pre-compute lookups
  const NUMERIC_TO_ISO2: Record<number, string> = Object.fromEntries(
    Object.entries(ISO2_TO_NUMERIC).map(([iso2, num]) => [num, iso2]),
  );

  // Map colors
  const JP_PALETTE = [
    "#c8a96e", // 山吹 yamabuki (gold)
    "#7b9e87", // 常磐 tokiwa (evergreen)
    "#c47a4a", // 煉瓦 renga (brick red)
    "#c47e6b", // 柿 kaki (persimmon)
    "#9b7fa6", // 藤 fuji (wisteria)
    "#7aab8a", // 若竹 wakatake (bamboo green)
    "#c4956a", // 黄土 oudo (ochre)
    "#a67c52", // 茶 cha (tea brown)
    "#b87c8a", // 桃 momo (peach/plum)
    "#8a9e6e", // 苔 koke (moss)
    "#c4a882", // 砂 suna (sand)
    "#8faa5a", // 黄緑 kiro (yellow-green)
  ];

  // iso2 codes that have at least one loanword in the dataset
  const countriesWithData = new Set<string>(
    Object.values(data)
      .map((v) => v.iso2)
      .filter((iso2) => iso2 !== "XX"),
  );
  // Treat US as an English-speaking country alongside GB
  countriesWithData.add("US");

  // iso2 -> { country name, total word count } for tooltip
  const iso2Info: Record<string, { country: string; count: number }> = {};
  for (const meta of Object.values(data)) {
    if (meta.iso2 === "XX") continue;
    if (!iso2Info[meta.iso2]) {
      iso2Info[meta.iso2] = { country: meta.country, count: 0 };
    }
    iso2Info[meta.iso2].count += meta.words.length;
  }

  // Mirror GB info for US since they share English loanwords
  if (iso2Info["GB"]) {
    iso2Info["US"] = { country: "United States", count: iso2Info["GB"].count };
  }

  // Map dimensions
  const W = 960;
  const H = 480;

  // DOM refs & D3 state
  let svgEl: SVGSVGElement;
  let container: HTMLDivElement;
  let mapGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null =
    null;

  let projectionRef: d3.GeoProjection | null = null;
  let zoomRef: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  let worldRef: any = null;

  let loading = true;
  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipCountry = "";
  let tooltipCount = 0;

  // Fill helpers
  function getFill(
    iso2: string | undefined,
    current: string | null,
    highlights: string[],
  ): string {
    if (!iso2) return "var(--clr-land-empty)";
    if (iso2 === current || highlights.includes(iso2))
      return "var(--clr-accent)";
    if (iso2 === "US") return getCountryColor("US");
    if (countriesWithData.has(iso2)) return getCountryColor(iso2);
    return "var(--clr-land-empty)";
  }

  function updateFills(current: string | null, highlights: string[]) {
    if (!mapGroup) return;
    mapGroup
      .selectAll<SVGPathElement, d3.GeoPermissibleObjects>("path.country")
      .attr("fill", (d: any) =>
        getFill(NUMERIC_TO_ISO2[+d.id], current, highlights),
      );
  }

  function getCountryColor(iso2: string): string {
    let hash = 0;
    for (let i = 0; i < iso2.length; i++) {
      hash = iso2.charCodeAt(i) + ((hash << 5) - hash);
    }
    return JP_PALETTE[Math.abs(hash) % JP_PALETTE.length];
  }

  // Re-run whenever activeIso2 changes
  $: updateFills($activeIso2, $highlightedIso2s);

  $: if ($zoomToCountry && projectionRef && zoomRef && worldRef && svgEl) {
    const iso2 = $zoomToCountry;
    const numericId = ISO2_TO_NUMERIC[iso2];
    const countries = topojson.feature(
      worldRef,
      worldRef.objects.countries as any,
    );
    const feature = (countries as any).features.find(
      (f: any) => +f.id === numericId,
    );
    if (feature) {
      const [[x0, y0], [x1, y1]] = d3
        .geoPath()
        .projection(projectionRef)
        .bounds(feature);
      const dx = x1 - x0,
        dy = y1 - y0;
      const scale = Math.min(8, 0.9 / Math.max(dx / W, dy / H));
      const tx = W / 2 - scale * (x0 + dx / 2);
      const ty = H / 2 - scale * (y0 + dy / 2);
      d3.select(svgEl)
        .transition()
        .duration(750)
        .call(
          zoomRef.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale),
        );
    }
    zoomToCountry.set(null);
  }

  $: if (
    $zoomToCountries.length &&
    projectionRef &&
    zoomRef &&
    worldRef &&
    svgEl
  ) {
    const countries = topojson.feature(
      worldRef,
      worldRef.objects.countries as any,
    );
    const features = $zoomToCountries
      .map((iso2) => ISO2_TO_NUMERIC[iso2])
      .map((id) => (countries as any).features.find((f: any) => +f.id === id))
      .filter(Boolean);

    if (features.length) {
      const path = d3.geoPath().projection(projectionRef);
      // merge all bounding boxes
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const f of features) {
        const [[fx0, fy0], [fx1, fy1]] = path.bounds(f);
        x0 = Math.min(x0, fx0);
        y0 = Math.min(y0, fy0);
        x1 = Math.max(x1, fx1);
        y1 = Math.max(y1, fy1);
      }
      const dx = x1 - x0,
        dy = y1 - y0;
      const scale = Math.min(8, 0.9 / Math.max(dx / W, dy / H));
      const tx = W / 2 - scale * (x0 + dx / 2);
      const ty = H / 2 - scale * (y0 + dy / 2);
      d3.select(svgEl)
        .transition()
        .duration(750)
        .call(
          zoomRef.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale),
        );
    }
    zoomToCountries.set([]);
  }

  // Mount: fetch topology & draw
  onMount(async () => {
    const world = await d3.json<any>(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    );
    loading = false;

    const countries = topojson.feature(world, world.objects.countries as any);
    worldRef = world;

    const projection = d3
      .geoNaturalEarth1()
      .scale(153)
      .translate([W / 2, H / 2]);

    projectionRef = projection;

    const pathGen = d3.geoPath().projection(projection);

    const svg = d3.select(svgEl);

    // Ocean fill
    svg
      .append("rect")
      .attr("class", "ocean")
      .attr("width", W)
      .attr("height", H)
      .attr("fill", "var(--clr-ocean)");

    // Map group (receives zoom transform)
    const g = svg.append("g").attr("class", "map-group");
    mapGroup = g;

    // Draw countries
    g.selectAll<SVGPathElement, any>("path.country")
      .data((countries as any).features)
      .join("path")
      .attr("class", "country")
      .attr("d", pathGen as any)
      .attr("fill", (d: any) =>
        getFill(NUMERIC_TO_ISO2[+d.id], $activeIso2, $highlightedIso2s),
      )
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.4)
      .style("cursor", (d: any) => {
        return countriesWithData.has(NUMERIC_TO_ISO2[+d.id])
          ? "pointer"
          : "default";
      })
      .on("mouseenter", function (event: MouseEvent, d: any) {
        const iso2 = NUMERIC_TO_ISO2[+d.id];
        const info = iso2Info[iso2];
        if (info) {
          // Highlight on hover (unless it's the active country)
          if (iso2 !== $activeIso2 && !$highlightedIso2s.includes(iso2)) {
            d3.select(this).attr("fill", "var(--clr-gold-hover)");
          }
          // Show tooltip
          const rect = container.getBoundingClientRect();
          tooltipVisible = true;
          tooltipX = event.clientX - rect.left + 12;
          tooltipY = event.clientY - rect.top - 10;
          tooltipCountry = info.country;
          tooltipCount = info.count;
        }
      })
      .on("mousemove", (event: MouseEvent) => {
        if (!tooltipVisible) return;
        const rect = container.getBoundingClientRect();
        tooltipX = event.clientX - rect.left + 12;
        tooltipY = event.clientY - rect.top - 10;
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        const iso2 = NUMERIC_TO_ISO2[+d.id];
        d3.select(this).attr(
          "fill",
          getFill(iso2, $activeIso2, $highlightedIso2s),
        );
        tooltipVisible = false;
      })
      .on("click", (_event: MouseEvent, d: any) => {
        const iso2 = NUMERIC_TO_ISO2[+d.id];
        if (countriesWithData.has(iso2)) {
          activeIso2.set(iso2);
          activeMode.set("explore");
        }
      });

    // Zoom & pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .extent([
        [0, 0],
        [W, H],
      ])
      .translateExtent([
        [0, 0],
        [W, H],
      ])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);
    zoomRef = zoom;
  });

  onDestroy(() => {
    // D3 tooltip cleanup handled by Svelte's {#if} block
  });
</script>

<div class="map-root" bind:this={container}>
  {#if loading}
    <div class="map-loading">
      <span class="spinner" />
      <span>地図を読み込み中…</span>
    </div>
  {/if}

  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMid meet"
    class="map-svg"
  />

  <!-- Tooltip -->
  {#if tooltipVisible}
    <div class="map-tooltip" style="left:{tooltipX}px; top:{tooltipY}px">
      <span class="tooltip-country">{tooltipCountry}</span>
      <span class="tooltip-count"
        >{tooltipCount.toLocaleString()} loanwords</span
      >
    </div>
  {/if}

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item">
      <span class="swatch" style="background:var(--clr-gold)" />
      <span>Has loanwords</span>
    </div>
    <div class="legend-item">
      <span class="swatch" style="background:var(--clr-accent)" />
      <span>Selected</span>
    </div>
    <div class="legend-item">
      <span
        class="swatch"
        style="background:var(--clr-land-empty); border:1px solid var(--clr-border)"
      />
      <span>No data</span>
    </div>
    <div class="legend-hint">Scroll to zoom · Click to explore</div>
  </div>
</div>

<style>
  .map-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--clr-ocean);
  }

  .map-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Loading */
  .map-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: var(--font-body);
    color: var(--clr-text-light);
    font-size: 0.9rem;
    z-index: 10;
    background: var(--clr-bg);
  }

  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid var(--clr-border);
    border-top-color: var(--clr-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Tooltip */
  .map-tooltip {
    position: absolute;
    pointer-events: none;
    background: var(--clr-header);
    color: #fff;
    padding: 6px 10px;
    border-radius: var(--radius-card);
    font-family: var(--font-body);
    font-size: 0.78rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 20;
    white-space: nowrap;
    box-shadow: var(--shadow-lift);
  }

  .tooltip-country {
    font-weight: 600;
    font-size: 0.85rem;
  }

  .tooltip-count {
    color: var(--clr-gold);
    font-size: 0.75rem;
  }

  /* Legend */
  .legend {
    position: absolute;
    bottom: 12px;
    left: 14px;
    background: rgba(250, 246, 240, 0.92);
    border: 1px solid var(--clr-border);
    border-radius: var(--radius-card);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-family: var(--font-body);
    font-size: 0.73rem;
    color: var(--clr-text-light);
    backdrop-filter: blur(4px);
    pointer-events: none;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .legend-hint {
    margin-top: 3px;
    border-top: 1px solid var(--clr-border);
    padding-top: 4px;
    font-size: 0.68rem;
    color: #aaa;
  }
</style>
