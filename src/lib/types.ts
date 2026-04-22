export interface WordEntry {
  katakana: string;
  meaning: string;
}

export interface LanguageMeta {
  language: string;
  country: string;
  iso2: string;
  words: WordEntry[];
}

// Shape of the exported gairaigo_full.json
export type GairagioData = Record<string, LanguageMeta>;

// One language's score from /predict
export interface LanguageScore {
  language: string;
  country: string;
  iso2: string;
  confidence: number; // 0–1, softmax of SVM decision function
  color: string; // hex color for that language
}

// Full predict response
export interface PredictResponse {
  word: string;
  prediction: LanguageScore;
  all_scores: LanguageScore[];
}
