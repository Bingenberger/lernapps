export const APP_NAME = "Schlaufuchs Mathe";

export const STORAGE_KEYS = {
  settings: "schlaufuchs-mathe.settings.v1",
};

export const GAME_PHASE = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  RESULT: "RESULT",
};

export const LEVEL_MODE = {
  ADDITION: "addition",
  SUBTRACTION: "subtraction",
  VERLIEBTE: "verliebte",
  ADDITION_GAP: "addition_gap",
  SUBTRACTION_GAP: "subtraction_gap",
  MIXED: "mixed",
};

export const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  SMART: "smart",
  HARD: "hard",
};

export const DEFAULT_SETTINGS = {
  levelMode: LEVEL_MODE.MIXED,
  difficulty: DIFFICULTY.EASY,
  soundsEnabled: false,
};

export const TASKS_PER_ROUND = 10;

export const LEVEL_OPTIONS = [
  { id: LEVEL_MODE.ADDITION, label: "Addition", emoji: "+" },
  { id: LEVEL_MODE.SUBTRACTION, label: "Subtraktion", emoji: "-" },
  { id: LEVEL_MODE.VERLIEBTE, label: "Verliebte Zahlen", emoji: "10" },
  { id: LEVEL_MODE.ADDITION_GAP, label: "Add. Lücke", emoji: "+?" },
  { id: LEVEL_MODE.SUBTRACTION_GAP, label: "Sub. Lücke", emoji: "-?" },
  { id: LEVEL_MODE.MIXED, label: "Wilder Mix", emoji: "*" },
];

export const DIFFICULTY_OPTIONS = [
  { id: DIFFICULTY.EASY, label: "Leicht", desc: "Punkte sichtbar" },
  { id: DIFFICULTY.MEDIUM, label: "Mittel", desc: "Punkte kurz sichtbar" },
  { id: DIFFICULTY.SMART, label: "Smart", desc: "Passt Zeit an" },
  { id: DIFFICULTY.HARD, label: "Schwer", desc: "Ohne Punkte" },
];
