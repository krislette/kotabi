import { writable } from "svelte/store";
import type { PredictResponse } from "../types";

// Currently active panel tab
export type AppMode = "explore" | "discover";
export const activeMode = writable<AppMode>("explore");

/**
 * ISO 3166-1 alpha-2 code of the currently highlighted country.
 * - Set by clicking a country on the map (explore mode)
 * - Set by an AI prediction result (discover mode)
 */
export const activeIso2 = writable<string | null>(null);

// The latest prediction from the /predict endpoint
export const discoverResult = writable<PredictResponse | null>(null);

// Triggers the map to zoom to a country by iso2
export const zoomToCountry = writable<string | null>(null);
