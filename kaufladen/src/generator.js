import { PRODUCT_CATALOG, NUMBER_SPACE, TASK_MODE, PURCHASE_MODE, PRICE_FORMAT, CENT_DIFFICULTY } from "./config.js";
import {
  makePriceCents,
  randomChoice,
  randomInt,
  shuffleArray,
  getAvailableDenominations,
  isSolvable,
} from "./money.js";

function pickProducts(count) {
  return shuffleArray(PRODUCT_CATALOG).slice(0, count);
}

function splitIntegerTotal(total, parts) {
  if (parts < 1 || total < parts) {
    return null;
  }

  const cuts = [];
  for (let i = 0; i < parts - 1; i += 1) {
    cuts.push(randomInt(1, total - 1));
  }
  cuts.sort((a, b) => a - b);

  const segments = [];
  let prev = 0;
  for (const cut of cuts) {
    segments.push(cut - prev);
    prev = cut;
  }
  segments.push(total - prev);

  if (segments.some((value) => value <= 0)) {
    return null;
  }
  return segments;
}

function getPriceStepCents(settings) {
  if (settings.priceFormat === PRICE_FORMAT.EURO_ONLY) {
    return 100;
  }
  if (settings.centDifficulty === CENT_DIFFICULTY.VERY_EASY) {
    return 50;
  }
  if (settings.centDifficulty === CENT_DIFFICULTY.EASY) {
    return 10;
  }
  return 1;
}

function splitTotalIntoItems(totalCents, parts, settings) {
  if (parts === 1) {
    return [totalCents];
  }

  const step = getPriceStepCents(settings);
  if (totalCents % step !== 0) {
    return null;
  }

  const unitsTotal = totalCents / step;
  const units = splitIntegerTotal(unitsTotal, parts);
  if (!units) {
    return null;
  }
  return units.map((value) => value * step);
}

function makeSuggestedPayment(settings, targetTotalCents) {
  if (settings.numberSpace === NUMBER_SPACE.UP_TO_10) {
    return 1000;
  }
  if (settings.numberSpace === NUMBER_SPACE.UP_TO_20) {
    return 2000;
  }

  const options = [1000, 2000, 5000, 10000]
    .filter((amount) => amount > targetTotalCents)
    .filter((amount) => amount - targetTotalCents <= 5000);

  if (options.length > 0) {
    return randomChoice(options);
  }
  return 10000;
}

function buildTaskBase(settings, id) {
  const targetTotalCents = makePriceCents(settings);
  const isMulti = settings.purchaseMode === PURCHASE_MODE.MULTI;
  const desiredCount = isMulti ? randomInt(2, 3) : 1;
  const step = getPriceStepCents(settings);
  const maxCount = Math.max(1, Math.trunc(targetTotalCents / step));
  const itemCount = Math.max(1, Math.min(desiredCount, maxCount));
  const split = splitTotalIntoItems(targetTotalCents, itemCount, settings);

  if (!split) {
    return null;
  }

  const products = pickProducts(itemCount);
  const items = split.map((priceCents, index) => ({
    name: products[index].name,
    icon: products[index].icon,
    image: products[index].image,
    priceCents,
  }));

  return {
    id,
    mode: settings.mode,
    items,
    targetTotalCents,
  };
}

export function makeTask(settings, id) {
  const availableDenoms = getAvailableDenominations(settings);
  let task = null;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const base = buildTaskBase(settings, id);
    if (!base) {
      continue;
    }

    if (settings.mode === TASK_MODE.PAY_EXACT) {
      if (isSolvable(base.targetTotalCents, availableDenoms)) {
        task = {
          ...base,
          suggestedPaymentCents: null,
          correctChangeCents: null,
        };
        break;
      }
      continue;
    }

    const payment = makeSuggestedPayment(settings, base.targetTotalCents);
    const change = payment - base.targetTotalCents;
    if (payment <= base.targetTotalCents) {
      continue;
    }

    if (!isSolvable(base.targetTotalCents, availableDenoms)) {
      continue;
    }
    if (!isSolvable(change, availableDenoms)) {
      continue;
    }

    task = {
      ...base,
      suggestedPaymentCents: payment,
      correctChangeCents: change,
    };
    break;
  }

  if (!task) {
    throw new Error("Keine lösbare Aufgabe erzeugt.");
  }

  return task;
}
