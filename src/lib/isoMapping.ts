/**
 * Maps ISO 3166-1 alpha-2 country codes (used in gairaigo_full.json)
 * to the numeric ISO codes used as feature IDs in world-atlas countries-110m.json.
 *
 * Only countries that appear as donor languages in JMdict are listed here.
 * The reverse mapping (numeric to iso2) is built at runtime in WorldMap.svelte.
 */
export const ISO2_TO_NUMERIC: Record<string, number> = {
  // European donors
  GB: 826, // English  -> United Kingdom
  US: 840, // English  -> United States
  FR: 250, // French   -> France
  DE: 276, // German   -> Germany
  PT: 620, // Portuguese
  ES: 724, // Spanish
  IT: 380, // Italian / Latin
  NL: 528, // Dutch
  RU: 643, // Russian
  SE: 752, // Swedish
  NO: 578, // Norwegian
  DK: 208, // Danish
  FI: 246, // Finnish
  GR: 300, // Greek
  PL: 616, // Polish
  CZ: 203, // Czech
  HU: 348, // Hungarian
  RO: 642, // Romanian

  // East / Southeast Asian donors
  CN: 156, // Chinese
  KR: 410, // Korean
  VN: 704, // Vietnamese
  MY: 458, // Malay
  PH: 608, // Tagalog / Filipino
  ID: 360, // Indonesian
  TH: 764, // Thai
  MM: 104, // Burmese
  KH: 116, // Khmer

  // South Asian donors
  IN: 356, // Sanskrit / Hindi / Tamil
  PK: 586, // Urdu
  BD: 50, // Bengali

  // Middle Eastern donors
  SA: 682, // Arabic
  IR: 364, // Persian
  TR: 792, // Turkish

  // African donors
  TZ: 834, // Swahili
  ET: 231, // Amharic

  // Americas donors
  JP: 392, // Ainu (native Japanese -> same country)
  PY: 600, // Guaraní
  PE: 604, // Quechua
  MX: 484, // Nahuatl

  // Middle East
  IL: 376, // Hebrew

  // Oceania
  NZ: 554, // Māori
};
