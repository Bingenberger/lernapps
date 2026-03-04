import {
  NUMBER_SPACE,
  PRICE_FORMAT,
  TASK_MODE,
  CENT_ENDINGS,
  CENT_DIFFICULTY,
} from "./config.js";

const EURO_CENT_DENOMS = [1, 2, 5, 10, 20, 50];

export function formatEUR(cents, priceFormat = PRICE_FORMAT.EURO_CENT) {
  const safeCents = Math.max(0, Math.trunc(cents));
  if (priceFormat === PRICE_FORMAT.EURO_ONLY) {
    return `${Math.trunc(safeCents / 100)} €`;
  }
  const euros = Math.trunc(safeCents / 100);
  const rem = String(safeCents % 100).padStart(2, "0");
  return `${euros},${rem} €`;
}

export function sumCents(values) {
  return values.reduce((acc, value) => acc + value, 0);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

export function shuffleArray(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getCentPart(centDifficulty) {
  if (centDifficulty === CENT_DIFFICULTY.FREE) {
    return randomInt(0, 99);
  }
  return randomChoice(CENT_ENDINGS[centDifficulty] || CENT_ENDINGS[CENT_DIFFICULTY.VERY_EASY]);
}

export function getAvailableDenominations(settings) {
  const hasCents = settings.priceFormat === PRICE_FORMAT.EURO_CENT;
  const denoms = [];

  if (hasCents) {
    EURO_CENT_DENOMS.forEach((value) => {
      denoms.push({ value, label: `${value} ct`, kind: "coin" });
    });
  }

  denoms.push({ value: 100, label: "1 €", kind: "coin" });
  denoms.push({ value: 200, label: "2 €", kind: "coin" });

  if (settings.numberSpace === NUMBER_SPACE.UP_TO_10) {
    if (settings.mode === TASK_MODE.CHANGE) {
      denoms.push({ value: 1000, label: "10 €", kind: "note" });
    }
    return denoms;
  }

  if (settings.numberSpace === NUMBER_SPACE.UP_TO_20) {
    denoms.push({ value: 500, label: "5 €", kind: "note" });
    denoms.push({ value: 1000, label: "10 €", kind: "note" });
    if (settings.mode === TASK_MODE.CHANGE) {
      denoms.push({ value: 2000, label: "20 €", kind: "note" });
    }
    return denoms;
  }

  denoms.push({ value: 500, label: "5 €", kind: "note" });
  denoms.push({ value: 1000, label: "10 €", kind: "note" });
  denoms.push({ value: 2000, label: "20 €", kind: "note" });
  denoms.push({ value: 5000, label: "50 €", kind: "note" });
  if (settings.mode === TASK_MODE.CHANGE) {
    denoms.push({ value: 10000, label: "100 €", kind: "note" });
  }

  return denoms;
}

export function isSolvable(targetCents, availableDenoms) {
  if (targetCents < 0) {
    return false;
  }
  if (targetCents === 0) {
    return true;
  }

  const values = availableDenoms.map((d) => d.value).filter((v) => v > 0);
  const reachable = new Array(targetCents + 1).fill(false);
  reachable[0] = true;

  for (let amount = 1; amount <= targetCents; amount += 1) {
    reachable[amount] = values.some((v) => amount - v >= 0 && reachable[amount - v]);
  }

  return reachable[targetCents];
}

export function makePriceCents(settings) {
  const euroOnly = settings.priceFormat === PRICE_FORMAT.EURO_ONLY;

  if (settings.numberSpace === NUMBER_SPACE.UP_TO_10) {
    const euros = randomInt(1, 9);
    if (euroOnly) {
      return euros * 100;
    }
    return euros * 100 + getCentPart(settings.centDifficulty);
  }

  if (settings.numberSpace === NUMBER_SPACE.UP_TO_20) {
    const euros = randomInt(1, 19);
    if (euroOnly) {
      return euros * 100;
    }
    return euros * 100 + getCentPart(settings.centDifficulty);
  }

  if (euroOnly) {
    return randomInt(1, 99) * 100;
  }

  const euros = randomInt(1, 99);
  return euros * 100 + getCentPart(settings.centDifficulty);
}
