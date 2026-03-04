import { NUMBER_SPACE, PRICE_FORMAT, CENT_DIFFICULTY, TASK_MODE, PURCHASE_MODE, HELP_MODE } from "../src/config.js";
import { formatEUR, makePriceCents, getAvailableDenominations, isSolvable } from "../src/money.js";
import { makeTask } from "../src/generator.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(formatEUR(230, PRICE_FORMAT.EURO_CENT) === "2,30 €", "formatEUR mit Cent fehlgeschlagen");
  assert(formatEUR(700, PRICE_FORMAT.EURO_ONLY) === "7 €", "formatEUR nur Euro fehlgeschlagen");

  const settingsEuro = {
    numberSpace: NUMBER_SPACE.UP_TO_20,
    priceFormat: PRICE_FORMAT.EURO_ONLY,
    centDifficulty: CENT_DIFFICULTY.VERY_EASY,
    mode: TASK_MODE.PAY_EXACT,
  };
  for (let i = 0; i < 50; i += 1) {
    const price = makePriceCents(settingsEuro);
    assert(price % 100 === 0, "Nur-Euro Preis hat Cent-Anteil");
    assert(price >= 100 && price <= 1900, "Preisbereich bis 20 verletzt");
  }

  const settingsCent = {
    numberSpace: NUMBER_SPACE.UP_TO_100,
    priceFormat: PRICE_FORMAT.EURO_CENT,
    centDifficulty: CENT_DIFFICULTY.VERY_EASY,
    mode: TASK_MODE.CHANGE,
    purchaseMode: PURCHASE_MODE.SINGLE,
    helpMode: HELP_MODE.WITH_HELP,
  };
  for (let i = 0; i < 50; i += 1) {
    const price = makePriceCents(settingsCent);
    const cent = price % 100;
    assert(cent === 0 || cent === 50, "Cent-Difficulty sehr leicht verletzt");
  }

  const denoms = getAvailableDenominations(settingsCent);
  assert(isSolvable(230, denoms), "2,30 € sollte loesbar sein");

  const task = makeTask(settingsCent, 1);
  assert(task.mode === TASK_MODE.CHANGE, "Task Mode ist nicht CHANGE");
  assert(task.suggestedPaymentCents > task.targetTotalCents, "Zahlung muss groesser als Preis sein");
  assert(task.correctChangeCents === task.suggestedPaymentCents - task.targetTotalCents, "Rueckgeld falsch");

  const settingsMulti = {
    numberSpace: NUMBER_SPACE.UP_TO_20,
    priceFormat: PRICE_FORMAT.EURO_ONLY,
    centDifficulty: CENT_DIFFICULTY.VERY_EASY,
    mode: TASK_MODE.PAY_EXACT,
    purchaseMode: PURCHASE_MODE.MULTI,
    helpMode: HELP_MODE.WITH_HELP,
  };
  const multiTask = makeTask(settingsMulti, 2);
  assert(multiTask.items.length >= 1 && multiTask.items.length <= 3, "Ungueltige Artikelanzahl");
  assert(
    multiTask.items.reduce((sum, item) => sum + item.priceCents, 0) === multiTask.targetTotalCents,
    "Artikelpreise summieren sich nicht zum Gesamtpreis",
  );

  console.log("Alle Tests erfolgreich.");
}

run();
