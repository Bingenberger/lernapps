export const APP_NAME = "Kaufladen: Geld lernen";

export const STORAGE_KEYS = {
  settings: "kaufladen.settings.v1",
  stats: "kaufladen.sessionStats.v1",
};

export const NUMBER_SPACE = {
  UP_TO_10: "UP_TO_10",
  UP_TO_20: "UP_TO_20",
  UP_TO_100: "UP_TO_100",
};

export const PRICE_FORMAT = {
  EURO_ONLY: "EURO_ONLY",
  EURO_CENT: "EURO_CENT",
};

export const CENT_DIFFICULTY = {
  VERY_EASY: "VERY_EASY",
  EASY: "EASY",
  FREE: "FREE",
};

export const TASK_MODE = {
  PAY_EXACT: "PAY_EXACT",
  CHANGE: "CHANGE",
  SHOPPING_LIST: "SHOPPING_LIST",
};

export const PURCHASE_MODE = {
  SINGLE: "SINGLE",
  MULTI: "MULTI",
};

export const HELP_MODE = {
  WITH_HELP: "WITH_HELP",
  WITHOUT_HELP: "WITHOUT_HELP",
};

export const APP_PHASE = {
  SETUP: "SETUP",
  TASK_PAY: "TASK_PAY",
  TASK_CHANGE: "TASK_CHANGE",
  RESULT: "RESULT",
};

export const TASKS_PER_SESSION = 10;

export const DEFAULT_SETTINGS = {
  numberSpace: NUMBER_SPACE.UP_TO_20,
  priceFormat: PRICE_FORMAT.EURO_ONLY,
  centDifficulty: CENT_DIFFICULTY.VERY_EASY,
  mode: TASK_MODE.PAY_EXACT,
  purchaseMode: PURCHASE_MODE.SINGLE,
  helpMode: HELP_MODE.WITH_HELP,
  soundsEnabled: false,
};

export const NUMBER_SPACE_DEFAULT_FORMAT = {
  [NUMBER_SPACE.UP_TO_10]: PRICE_FORMAT.EURO_ONLY,
  [NUMBER_SPACE.UP_TO_20]: PRICE_FORMAT.EURO_ONLY,
  [NUMBER_SPACE.UP_TO_100]: PRICE_FORMAT.EURO_CENT,
};

export const CENT_ENDINGS = {
  [CENT_DIFFICULTY.VERY_EASY]: [0, 50],
  [CENT_DIFFICULTY.EASY]: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
};

export const PRODUCT_CATALOG = [
  { name: "Apfel", icon: "APL", image: "assets/products/apfel.webp" },
  { name: "Brot", icon: "BRT", image: "assets/products/brot.webp" },
  { name: "Milch", icon: "MLK", image: "assets/products/milch.webp" },
  { name: "Saft", icon: "SFT", image: "assets/products/orangensaft.webp" },
  { name: "Banane", icon: "BAN", image: "assets/products/banane.webp" },
  { name: "Keks", icon: "KKS", image: "assets/products/schokolade.webp" },
  { name: "Joghurt", icon: "JGT", image: "assets/products/joghurt.webp" },
  { name: "Kakao", icon: "KAK", image: "assets/products/kakao.webp" },
  { name: "Müsli", icon: "MSL", image: "assets/products/muesli.webp" },
  { name: "Käse", icon: "KSE", image: "assets/products/kaese.webp" },
];

export function getDefaultPriceFormat(numberSpace) {
  return NUMBER_SPACE_DEFAULT_FORMAT[numberSpace] || PRICE_FORMAT.EURO_ONLY;
}

export function isPriceFormatAllowed(numberSpace, priceFormat) {
  if (numberSpace === NUMBER_SPACE.UP_TO_10) {
    return (
      priceFormat === PRICE_FORMAT.EURO_ONLY ||
      priceFormat === PRICE_FORMAT.EURO_CENT
    );
  }
  if (numberSpace === NUMBER_SPACE.UP_TO_20) {
    return (
      priceFormat === PRICE_FORMAT.EURO_ONLY ||
      priceFormat === PRICE_FORMAT.EURO_CENT
    );
  }
  if (numberSpace === NUMBER_SPACE.UP_TO_100) {
    return (
      priceFormat === PRICE_FORMAT.EURO_ONLY ||
      priceFormat === PRICE_FORMAT.EURO_CENT
    );
  }
  return false;
}
