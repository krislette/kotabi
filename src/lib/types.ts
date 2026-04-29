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
  confidence: number;
  color: string;
}

// Full predict response
export interface PredictResponse {
  word: string;
  prediction: LanguageScore;
  all_scores: LanguageScore[];
}

// One song entry in the emotion music playlist
export interface MusicEntry {
  title: string;
  video_id: string;
}

// Loanword entry from /emotion
export interface LoanwordResult {
  katakana: string;
  meaning: string;
  language: string;
  iso2: string;
}

// Full emotion response from /emotion
export interface EmotionResponse {
  text: string;
  emotion: string;
  music_list: MusicEntry[];
  loanwords: LoanwordResult[];
}
