(() => {
  const APP_NAME = "Kaufladen: Geld lernen";

  const STORAGE_KEYS = {
    settings: "kaufladen.settings.v1",
    stats: "kaufladen.sessionStats.v1",
  };

  const NUMBER_SPACE = {
    UP_TO_10: "UP_TO_10",
    UP_TO_20: "UP_TO_20",
    UP_TO_100: "UP_TO_100",
  };

  const PRICE_FORMAT = {
    EURO_ONLY: "EURO_ONLY",
    EURO_CENT: "EURO_CENT",
  };

  const CENT_DIFFICULTY = {
    VERY_EASY: "VERY_EASY",
    EASY: "EASY",
    FREE: "FREE",
  };

  const TASK_MODE = {
    PAY_EXACT: "PAY_EXACT",
    CHANGE: "CHANGE",
    SHOPPING_LIST: "SHOPPING_LIST",
  };

  const PURCHASE_MODE = {
    SINGLE: "SINGLE",
    MULTI: "MULTI",
  };

  const HELP_MODE = {
    WITH_HELP: "WITH_HELP",
    WITHOUT_HELP: "WITHOUT_HELP",
  };

  const APP_PHASE = {
    SETUP: "SETUP",
    TASK_PAY: "TASK_PAY",
    TASK_CHANGE: "TASK_CHANGE",
    RESULT: "RESULT",
  };

  const TASKS_PER_SESSION = 10;

  const DEFAULT_SETTINGS = {
    numberSpace: NUMBER_SPACE.UP_TO_20,
    priceFormat: PRICE_FORMAT.EURO_ONLY,
    centDifficulty: CENT_DIFFICULTY.VERY_EASY,
    mode: TASK_MODE.PAY_EXACT,
    purchaseMode: PURCHASE_MODE.SINGLE,
    helpMode: HELP_MODE.WITH_HELP,
    soundsEnabled: false,
  };

  const NUMBER_SPACE_DEFAULT_FORMAT = {
    [NUMBER_SPACE.UP_TO_10]: PRICE_FORMAT.EURO_ONLY,
    [NUMBER_SPACE.UP_TO_20]: PRICE_FORMAT.EURO_ONLY,
    [NUMBER_SPACE.UP_TO_100]: PRICE_FORMAT.EURO_CENT,
  };

  const CENT_ENDINGS = {
    [CENT_DIFFICULTY.VERY_EASY]: [0, 50],
    [CENT_DIFFICULTY.EASY]: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  };

  const PRODUCT_CATALOG = [
    { name: "Äpfel", image: "assets/products/apfel.webp" },
    { name: "Bananen", image: "assets/products/banane.webp" },
    { name: "Brot", image: "assets/products/brot.webp" },
    { name: "Milch", image: "assets/products/milch.webp" },
    { name: "Käse", image: "assets/products/kaese.webp" },
    { name: "Joghurt", image: "assets/products/joghurt.webp" },
    { name: "Müsli", image: "assets/products/muesli.webp" },
    { name: "Kakao", image: "assets/products/kakao.webp" },
    { name: "Orangensaft", image: "assets/products/orangensaft.webp" },
    { name: "Mineralwasser", image: "assets/products/mineralwasser.webp" },
    { name: "Eier", image: "assets/products/ei.webp" },
    { name: "Butter", image: "assets/products/butter.webp" },
    { name: "Reis", image: "assets/products/reis.webp" },
    { name: "Nudeln", image: "assets/products/nudel.webp" },
    { name: "Salz", image: "assets/products/salz.webp" },
    { name: "Zucker", image: "assets/products/zucker.webp" },
    { name: "Tomaten", image: "assets/products/tomate.webp" },
    { name: "Gurken", image: "assets/products/gurke.webp" },
    { name: "Kartoffeln", image: "assets/products/kartoffel.webp" },
    { name: "Schokolade", image: "assets/products/schokolade.webp" },
  ];
  const CHANGE_CHARACTER_IMAGE = "assets/characters/kind.webp";
  const SELLER_CHARACTER_IMAGE = "assets/characters/verkaeufer.webp";
  const SETUP_SIDE_IMAGE = "assets/ui/supermarkt.webp";

  const MONEY_ASSET_BY_VALUE = {
    1: "assets/money/1_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    2: "assets/money/2_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    5: "assets/money/5_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    10: "assets/money/10_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    20: "assets/money/20_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    50: "assets/money/50_Cent_Euro_Coin_-_Simple_Worksheet_Design.svg",
    100: "assets/money/1_Euro_Coin_-_Simple_Worksheet_Design.svg",
    200: "assets/money/2_Euro_Coin_-_Simple_Worksheet_Design.svg",
    500: "assets/money/5_Euro_Banknote_-_Simple_Worksheet_Design.svg",
    1000: "assets/money/10_Euro_Banknote_-_Simple_Worksheet_Design.svg",
    2000: "assets/money/20_Euro_Banknote_-_Simple_Worksheet_Design.svg",
    5000: "assets/money/50_Euro_Banknote_-_Simple_Worksheet_Design.svg",
  };

  const EURO_CENT_DENOMS = [1, 2, 5, 10, 20, 50];

  function getDefaultPriceFormat(numberSpace) {
    return NUMBER_SPACE_DEFAULT_FORMAT[numberSpace] || PRICE_FORMAT.EURO_ONLY;
  }

  function isPriceFormatAllowed(numberSpace, priceFormat) {
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

  function formatEUR(cents, priceFormat = PRICE_FORMAT.EURO_CENT) {
    const safeCents = Math.max(0, Math.trunc(cents));
    if (priceFormat === PRICE_FORMAT.EURO_ONLY) {
      return `${Math.trunc(safeCents / 100)} €`;
    }
    const euros = Math.trunc(safeCents / 100);
    const rem = String(safeCents % 100).padStart(2, "0");
    return `${euros},${rem} €`;
  }

  function sumCents(values) {
    return values.reduce((acc, value) => acc + value, 0);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
  }

  function shuffleArray(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getCentPart(centDifficulty) {
    if (centDifficulty === CENT_DIFFICULTY.FREE) {
      return randomInt(0, 99);
    }
    return randomChoice(CENT_ENDINGS[centDifficulty] || CENT_ENDINGS[CENT_DIFFICULTY.VERY_EASY]);
  }

  function getAvailableDenominations(settings) {
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
      denoms.push({ value: 500, label: "5 €", kind: "note" });
      denoms.push({ value: 1000, label: "10 €", kind: "note" });
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

  function isSolvable(targetCents, availableDenoms) {
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

  function makePriceCents(settings) {
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

  function makeTask(settings, id) {
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

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors on restricted environments
    }
  }

  function loadSettings() {
    const saved = loadJSON(STORAGE_KEYS.settings);
    const merged = { ...DEFAULT_SETTINGS, ...(saved || {}) };

    if (!isPriceFormatAllowed(merged.numberSpace, merged.priceFormat)) {
      merged.priceFormat = getDefaultPriceFormat(merged.numberSpace);
    }

    return merged;
  }

  function createInitialState() {
    return {
      phase: APP_PHASE.SETUP,
      settings: loadSettings(),
      taskIndex: 0,
      tasks: [],
      currentTask: null,
      paymentSelections: [],
      changeSelections: [],
      feedback: "",
      awaitingNext: false,
      currentWrongAttempts: 0,
      taskOutcomes: new Array(TASKS_PER_SESSION).fill(null),
      stats: {
        correct: 0,
        wrong: 0,
        attempts: 0,
        startedAt: null,
        endedAt: null,
        ...(loadJSON(STORAGE_KEYS.stats) || {}),
      },
    };
  }

  function updateSettings(state, partialSettings) {
    state.settings = { ...state.settings, ...partialSettings };
    if (!isPriceFormatAllowed(state.settings.numberSpace, state.settings.priceFormat)) {
      state.settings.priceFormat = getDefaultPriceFormat(state.settings.numberSpace);
    }
    saveJSON(STORAGE_KEYS.settings, state.settings);
  }

  function startSession(state) {
    state.phase = state.settings.mode === TASK_MODE.CHANGE ? APP_PHASE.TASK_CHANGE : APP_PHASE.TASK_PAY;
    state.taskIndex = 0;
    state.tasks = [];
    state.currentTask = null;
    state.paymentSelections = [];
    state.changeSelections = [];
    state.feedback = "";
    state.awaitingNext = false;
    state.currentWrongAttempts = 0;
    state.taskOutcomes = new Array(TASKS_PER_SESSION).fill(null);
    state.stats = {
      correct: 0,
      wrong: 0,
      attempts: 0,
      startedAt: Date.now(),
      endedAt: null,
    };

    for (let i = 0; i < TASKS_PER_SESSION; i += 1) {
      state.tasks.push(makeTask(state.settings, i + 1));
    }
    state.currentTask = state.tasks[0];
  }

  function setPhase(state, phase) {
    state.phase = phase;
  }

  function saveStats(state) {
    saveJSON(STORAGE_KEYS.stats, state.stats);
  }

  function clearCurrentSelections(state) {
    state.paymentSelections = [];
    state.changeSelections = [];
    state.feedback = "";
    state.awaitingNext = false;
  }

  function addSelection(state, zone, value) {
    if (zone === "payment") {
      state.paymentSelections.push(value);
      return;
    }
    state.changeSelections.push(value);
  }

  function removeSelection(state, zone, index) {
    if (zone === "payment") {
      state.paymentSelections.splice(index, 1);
      return;
    }
    state.changeSelections.splice(index, 1);
  }

  function nextTask(state) {
    state.taskIndex += 1;
    state.paymentSelections = [];
    state.changeSelections = [];
    state.feedback = "";
    state.awaitingNext = false;
    state.currentWrongAttempts = 0;

    if (state.taskIndex >= state.tasks.length) {
      state.phase = APP_PHASE.RESULT;
      state.stats.endedAt = Date.now();
      saveStats(state);
      return;
    }

    state.currentTask = state.tasks[state.taskIndex];
    state.phase = state.settings.mode === TASK_MODE.CHANGE ? APP_PHASE.TASK_CHANGE : APP_PHASE.TASK_PAY;
  }

  function progressSegmentsMarkup(state) {
    return Array.from({ length: TASKS_PER_SESSION }, (_, index) => {
      let status = "pending";
      if (state.taskOutcomes[index] === "correct") {
        status = "correct";
      } else if (state.taskOutcomes[index] === "wrong") {
        status = "wrong";
      } else if (index === state.taskIndex && state.phase !== APP_PHASE.RESULT) {
        status = "current";
      }
      return `<span class="progress-segment ${status}" aria-hidden="true"></span>`;
    }).join("");
  }

  function option(selected, value, label) {
    return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
  }

  function zoneTitle(zone) {
    return zone === "payment" ? "Zahlung" : "Rückgeld";
  }

  function formatSettingsSummary(settings) {
    const numberSpaceMap = {
      [NUMBER_SPACE.UP_TO_10]: "bis 10",
      [NUMBER_SPACE.UP_TO_20]: "bis 20",
      [NUMBER_SPACE.UP_TO_100]: "bis 100",
    };

    const formatMap = {
      [PRICE_FORMAT.EURO_ONLY]: "nur Euro",
      [PRICE_FORMAT.EURO_CENT]: "Euro+Cent",
    };

    const modeMap = {
      [TASK_MODE.PAY_EXACT]: "Passend zahlen",
      [TASK_MODE.CHANGE]: "Rückgeld",
      [TASK_MODE.SHOPPING_LIST]: "Einkaufsliste",
    };
    const purchaseMap = {
      [PURCHASE_MODE.SINGLE]: "ein Produkt",
      [PURCHASE_MODE.MULTI]: "mehrere Sachen",
    };
    const helpMap = {
      [HELP_MODE.WITH_HELP]: "mit Hilfe",
      [HELP_MODE.WITHOUT_HELP]: "ohne Hilfe",
    };

    return `${numberSpaceMap[settings.numberSpace]} · ${formatMap[settings.priceFormat]} · ${modeMap[settings.mode]} · ${purchaseMap[settings.purchaseMode]} · ${helpMap[settings.helpMode]}`;
  }

  function itemListText(items) {
    if (items.length === 1) {
      return items[0].name;
    }
    if (items.length === 2) {
      return `${items[0].name} und ${items[1].name}`;
    }
    const first = items.slice(0, -1).map((item) => item.name).join(", ");
    return `${first} und ${items[items.length - 1].name}`;
  }

  function getProductImageMarkup(imagePath, name) {
    if (imagePath) {
      return `<img src="${imagePath}" alt="${name}" class="product-image" loading="lazy" decoding="async" />`;
    }
    return `<span class="icon-fallback" aria-label="${name}">${name.slice(0, 3).toUpperCase()}</span>`;
  }

  function getMoneyAsset(value) {
    const filename = MONEY_ASSET_BY_VALUE[value];
    if (!filename) {
      return null;
    }
    return encodeURI(filename);
  }

  function fixedPaymentMarkup(amountCents, settings) {
    const asset = getMoneyAsset(amountCents);
    if (asset) {
      return `
        <div class="fixed-payment-visual">
          <img src="${asset}" alt="${formatEUR(amountCents, settings.priceFormat)}" class="fixed-payment-img" loading="lazy" decoding="async" />
        </div>
      `;
    }
    return `<p><strong>${formatEUR(amountCents, settings.priceFormat)}</strong></p>`;
  }

  function changeRoleplayMarkup(task, settings) {
    return `
      <section class="roleplay-card" aria-label="Sprechblase">
        <img src="${CHANGE_CHARACTER_IMAGE}" alt="Kind im Kaufladen" class="roleplay-person" loading="lazy" decoding="async" />
        <div class="speech-bubble">
          <p>Ich kaufe ${itemListText(task.items)}.</p>
          <p>Ich bezahle mit ${formatEUR(task.suggestedPaymentCents, settings.priceFormat)}.</p>
        </div>
      </section>
    `;
  }

  function payRoleplayMarkup(task) {
    return `
      <section class="roleplay-card" aria-label="Sprechblase">
        <img src="${SELLER_CHARACTER_IMAGE}" alt="Verkäufer im Kaufladen" class="roleplay-person" loading="lazy" decoding="async" />
        <div class="speech-bubble">
          <p>Du kaufst ${itemListText(task.items)}.</p>
          <p>Bitte bezahle jetzt!</p>
        </div>
      </section>
    `;
  }

  function setupView(state) {
    const settings = state.settings;
    const centDisabled = settings.priceFormat === PRICE_FORMAT.EURO_ONLY;
    const choiceBtn = (setting, value, label, active, disabled = false) => `
      <button
        type="button"
        class="choice-btn ${active ? "active" : ""}"
        data-setting="${setting}"
        data-value="${value}"
        ${disabled ? "disabled" : ""}
      >${label}</button>
    `;

    return `
      <section class="setup-layout" aria-label="Einstellungsbereich">
        <div class="panel setup-panel" aria-label="Einstellungen">
          <h2>Einstellungen</h2>
          <form id="setup-form">
          <fieldset class="setting-fieldset">
            <legend>Aufgabenmodus</legend>
            <div class="choice-row">
              ${choiceBtn("mode", TASK_MODE.PAY_EXACT, "Passend zahlen", settings.mode === TASK_MODE.PAY_EXACT)}
              ${choiceBtn("mode", TASK_MODE.CHANGE, "Rückgeld", settings.mode === TASK_MODE.CHANGE)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset">
            <legend>Zahlenraum</legend>
            <div class="choice-row">
              ${choiceBtn("numberSpace", NUMBER_SPACE.UP_TO_10, "bis 10", settings.numberSpace === NUMBER_SPACE.UP_TO_10)}
              ${choiceBtn("numberSpace", NUMBER_SPACE.UP_TO_20, "bis 20", settings.numberSpace === NUMBER_SPACE.UP_TO_20)}
              ${choiceBtn("numberSpace", NUMBER_SPACE.UP_TO_100, "bis 100", settings.numberSpace === NUMBER_SPACE.UP_TO_100)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset">
            <legend>Preisformat</legend>
            <div class="choice-row">
              ${choiceBtn("priceFormat", PRICE_FORMAT.EURO_ONLY, "nur Euro", settings.priceFormat === PRICE_FORMAT.EURO_ONLY)}
              ${choiceBtn("priceFormat", PRICE_FORMAT.EURO_CENT, "Euro + Cent", settings.priceFormat === PRICE_FORMAT.EURO_CENT)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset ${centDisabled ? "is-disabled" : ""}">
            <legend>Cent-Schwierigkeit</legend>
            <div class="choice-row">
              ${choiceBtn("centDifficulty", CENT_DIFFICULTY.VERY_EASY, "sehr leicht (00/50)", settings.centDifficulty === CENT_DIFFICULTY.VERY_EASY, centDisabled)}
              ${choiceBtn("centDifficulty", CENT_DIFFICULTY.EASY, "leicht (0er Schritte)", settings.centDifficulty === CENT_DIFFICULTY.EASY, centDisabled)}
              ${choiceBtn("centDifficulty", CENT_DIFFICULTY.FREE, "frei (00-99)", settings.centDifficulty === CENT_DIFFICULTY.FREE, centDisabled)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset">
            <legend>Einkauf</legend>
            <div class="choice-row">
              ${choiceBtn("purchaseMode", PURCHASE_MODE.SINGLE, "ein Produkt", settings.purchaseMode === PURCHASE_MODE.SINGLE)}
              ${choiceBtn("purchaseMode", PURCHASE_MODE.MULTI, "mehrere Sachen (bis 3)", settings.purchaseMode === PURCHASE_MODE.MULTI)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset">
            <legend>Unterstützung</legend>
            <div class="choice-row">
              ${choiceBtn("helpMode", HELP_MODE.WITH_HELP, "mit Hilfe", settings.helpMode === HELP_MODE.WITH_HELP)}
              ${choiceBtn("helpMode", HELP_MODE.WITHOUT_HELP, "ohne Hilfe", settings.helpMode === HELP_MODE.WITHOUT_HELP)}
            </div>
          </fieldset>

          <fieldset class="setting-fieldset">
            <legend>Sound</legend>
            <div class="choice-row">
              ${choiceBtn("soundsEnabled", "true", "an", settings.soundsEnabled)}
              ${choiceBtn("soundsEnabled", "false", "aus", !settings.soundsEnabled)}
            </div>
          </fieldset>

          <button type="submit" class="primary" aria-label="Session starten">Los geht's</button>
          </form>
        </div>
        <aside class="panel setup-side-visual" aria-label="Supermarktbild">
          <img src="${SETUP_SIDE_IMAGE}" alt="Supermarkt" class="setup-side-image" loading="lazy" decoding="async" />
        </aside>
      </section>
    `;
  }

  function chips(values, zone, settings) {
    if (values.length === 0) {
      return `<p class="empty">Noch leer</p>`;
    }
    return values
      .map(
        (value, index) => `
          <button class="chip" data-zone="${zone}" data-remove-index="${index}" aria-label="${formatEUR(
            value,
            settings.priceFormat,
          )} aus ${zoneTitle(zone)} entfernen">
            ${
              getMoneyAsset(value)
                ? `<img src="${getMoneyAsset(value)}" alt="" class="chip-money-img" loading="lazy" decoding="async" />`
                : `<span class="chip-value">${formatEUR(value, settings.priceFormat)}</span>`
            }
            <span class="chip-x" aria-hidden="true">×</span>
          </button>
        `,
      )
      .join("");
  }

  function taskView(state) {
    const task = state.currentTask;
    const settings = state.settings;
    const denoms = getAvailableDenominations(settings);
    const paymentSum = sumCents(state.paymentSelections);
    const changeSum = sumCents(state.changeSelections);
    const isChangeMode = task.mode === TASK_MODE.CHANGE;

    return `
      <section class="panel task-panel" aria-label="Aufgabe">
        <div class="progress-row">
          <div class="progress">Aufgabe ${state.taskIndex + 1}/${TASKS_PER_SESSION}</div>
          <div class="progress-track" aria-label="Fortschritt">
            ${progressSegmentsMarkup(state)}
          </div>
        </div>
        ${isChangeMode ? changeRoleplayMarkup(task, settings) : payRoleplayMarkup(task)}

        <section class="item-list ${task.items.length > 1 ? "multi" : "single"}" aria-label="Produkte">
          ${task.items
            .map(
              (item) => `<article class="product-card" aria-label="Produkt ${item.name}">
                           <div class="icon">${getProductImageMarkup(item.image, item.name)}</div>
                           <div class="product-meta">
                             <span class="sr-only">${item.name}</span>
                             <div class="price-tag" aria-label="Preisschild">
                               <span>${formatEUR(item.priceCents, settings.priceFormat)}</span>
                             </div>
                           </div>
                         </article>`,
            )
            .join("")}
        </section>
        ${
          settings.helpMode === HELP_MODE.WITH_HELP
            ? `<article class="total-card" aria-label="Gesamtpreis">
                 <h4>Gesamtpreis</h4>
                 <div class="price-tag total-tag">
                   <span>${formatEUR(task.targetTotalCents, settings.priceFormat)}</span>
                 </div>
               </article>`
            : ""
        }
        
        <div class="zones">
          ${
            isChangeMode
              ? `<section class="zone active payment-fixed">
                  <h4>Bezahlt mit</h4>
                  ${fixedPaymentMarkup(task.suggestedPaymentCents, settings)}
                 </section>
                 <section class="zone active" data-drop-zone="change">
                    <h4>Rückgeld</h4>
                    <div class="drop-list">${chips(state.changeSelections, "change", settings)}</div>
                    ${
                      settings.helpMode === HELP_MODE.WITH_HELP
                        ? `<p>Du legst: <strong>${formatEUR(changeSum, settings.priceFormat)}</strong></p>`
                        : ""
                    }
                 </section>`
              : `<section class="zone active" data-drop-zone="payment">
                   <h4>Zahlung</h4>
                   <div class="drop-list">${chips(state.paymentSelections, "payment", settings)}</div>
                   ${
                     settings.helpMode === HELP_MODE.WITH_HELP
                       ? `<p>Du legst: <strong>${formatEUR(paymentSum, settings.priceFormat)}</strong></p>`
                       : ""
                   }
                 </section>`
          }
        </div>

        <div class="actions">
          <button id="check-btn" class="primary" aria-label="Eingabe prüfen" ${
            state.awaitingNext ? "disabled" : ""
          } title="Prüfen"><span class="btn-icon" aria-hidden="true">✓</span></button>
          <button id="clear-btn" class="secondary" aria-label="Alles zurücklegen" ${
            state.awaitingNext ? "disabled" : ""
          } title="Alles zurücklegen"><span class="btn-icon" aria-hidden="true">↺</span></button>
        </div>

        <p class="feedback" aria-live="polite">${state.feedback || ""}</p>

        <section class="money-tray" aria-label="Geldtablett">
          ${denoms
            .map(
              (denom, index) => `
            <button
              class="money ${denom.kind}"
              draggable="true"
              data-denom-index="${index}"
              data-denom-value="${denom.value}"
              aria-label="${denom.label} hinzufügen"
              ${state.awaitingNext ? "disabled" : ""}
            >
              ${
                getMoneyAsset(denom.value)
                  ? `<img src="${getMoneyAsset(denom.value)}" alt="${denom.label}" class="money-img" loading="lazy" decoding="async" />`
                  : `<span class="money-text">${denom.label}</span>`
              }
            </button>`,
            )
            .join("")}
        </section>
      </section>
    `;
  }

  function resultView(state) {
    const durationSec =
      state.stats.startedAt && state.stats.endedAt
        ? Math.round((state.stats.endedAt - state.stats.startedAt) / 1000)
        : 0;
    const correct = state.stats.correct;
    const total = TASKS_PER_SESSION;
    const piePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    return `
      <section class="panel result-panel" aria-label="Ergebnis">
        <h2>Fertig!</h2>
        <div class="result-chart-wrap">
          <div class="result-pie" style="--pie:${piePercent};" aria-label="Richtig ${correct} von ${total}">
            <div class="result-pie-center">${correct}/${total}</div>
          </div>
        </div>
        <p>Richtig: <strong>${correct}</strong> von ${total}</p>
        <p>Fehlversuche: <strong>${state.stats.wrong}</strong></p>
        <p>Versuche gesamt: <strong>${state.stats.attempts}</strong></p>
        <p>Zeit: <strong>${durationSec} s</strong></p>
        <div class="actions">
          <button id="again-btn" class="primary" aria-label="Nochmal" title="Nochmal"><span class="btn-icon" aria-hidden="true">↻</span></button>
          <button id="back-settings-btn" class="secondary" aria-label="Einstellungen" title="Einstellungen"><span class="btn-icon" aria-hidden="true">⌂</span></button>
        </div>
      </section>
    `;
  }

  function renderApp(root, state) {
    const body =
      state.phase === APP_PHASE.SETUP
        ? setupView(state)
        : state.phase === APP_PHASE.RESULT
        ? resultView(state)
        : taskView(state);

    root.innerHTML = `
      <header class="app-header">
        <div class="header-left">
          <button id="home-btn" class="secondary home-btn" aria-label="Zum Hauptmenü">⌂</button>
          <h1>${APP_NAME}</h1>
        </div>
        <p>${formatSettingsSummary(state.settings)}</p>
      </header>
      <main>${body}</main>
    `;
  }

  function bindSetupEvents(root, handlers) {
    const form = root.querySelector("#setup-form");
    if (!form) {
      return;
    }

    form.querySelectorAll("[data-setting][data-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const setting = btn.dataset.setting;
        const value = btn.dataset.value;

        if (setting === "numberSpace") {
          const defaultFormat = getDefaultPriceFormat(value);
          handlers.onSettingsChange({ numberSpace: value, priceFormat: defaultFormat });
          return;
        }

        if (setting === "soundsEnabled") {
          handlers.onSettingsChange({ soundsEnabled: value === "true" });
          return;
        }

        handlers.onSettingsChange({ [setting]: value });
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handlers.onStart();
    });
  }

  function bindTaskEvents(root, handlers) {
    const checkBtn = root.querySelector("#check-btn");
    const clearBtn = root.querySelector("#clear-btn");

    if (checkBtn) {
      checkBtn.addEventListener("click", handlers.onCheck);
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", handlers.onClear);
    }

    root.querySelectorAll("[data-remove-index]").forEach((chip) => {
      chip.addEventListener("click", () => {
        handlers.onRemove(chip.dataset.zone, Number(chip.dataset.removeIndex));
      });
    });

    root.querySelectorAll("[data-denom-value]").forEach((button) => {
      button.addEventListener("click", () => {
        handlers.onAddDenom(Number(button.dataset.denomValue));
      });

      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", button.dataset.denomValue);
      });
    });

    root.querySelectorAll("[data-drop-zone]").forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("text/plain");
        handlers.onDrop(zone.dataset.dropZone, Number(raw));
      });
    });
  }

  function bindResultEvents(root, handlers) {
    const again = root.querySelector("#again-btn");
    const back = root.querySelector("#back-settings-btn");

    if (again) {
      again.addEventListener("click", handlers.onAgain);
    }
    if (back) {
      back.addEventListener("click", handlers.onBackSettings);
    }
  }

  const root = document.getElementById("app");
  const state = createInitialState();
  let autoNextTimer = null;

  function clearAutoNextTimer() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function playTone(ok) {
    if (!state.settings.soundsEnabled) {
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    function note(freq, start, duration, type = "sine", volume = 0.06) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    }

    if (ok) {
      note(523.25, 0.0, 0.12, "triangle", 0.05);   // C5
      note(659.25, 0.1, 0.14, "triangle", 0.055);  // E5
      note(783.99, 0.22, 0.18, "triangle", 0.06);  // G5
    } else {
      note(310.0, 0.0, 0.14, "sawtooth", 0.045);
      note(233.08, 0.11, 0.18, "sawtooth", 0.05);
    }
  }

  function markWrong(msg) {
    state.stats.attempts += 1;
    state.stats.wrong += 1;
    state.feedback = `❌ ${msg}`;
    playTone(false);
  }

  function scheduleAutoNext() {
    clearAutoNextTimer();
    autoNextTimer = setTimeout(() => {
      autoNextTimer = null;
      nextTask(state);
      rerender();
    }, 2000);
  }

  function markTaskSolved(msg) {
    state.stats.attempts += 1;
    state.stats.correct += 1;
    state.taskOutcomes[state.taskIndex] = "correct";
    state.feedback = `✅ ${msg}`;
    state.awaitingNext = true;
    playTone(true);
    scheduleAutoNext();
  }

  function markTaskFailed(msg) {
    state.taskOutcomes[state.taskIndex] = "wrong";
    state.feedback = `❌ ${msg}`;
    state.awaitingNext = true;
    scheduleAutoNext();
  }

  function registerWrongAttempt(msg) {
    markWrong(msg);
    state.currentWrongAttempts += 1;
    if (state.currentWrongAttempts >= 2) {
      markTaskFailed("Diese Aufgabe ist falsch gewertet.");
    }
  }

  function handleCheck() {
    const task = state.currentTask;
    const paymentSum = sumCents(state.paymentSelections);

    if (task.mode === TASK_MODE.PAY_EXACT) {
      if (paymentSum === task.targetTotalCents) {
        markTaskSolved("Super! Das passt genau.");
        return;
      }

      if (paymentSum < task.targetTotalCents) {
        const diff = task.targetTotalCents - paymentSum;
        registerWrongAttempt(
          `Es fehlen noch ${formatEUR(diff, state.settings.priceFormat)}. Tipp: Ergänze bis zum Preis.`,
        );
        return;
      }

      const diff = paymentSum - task.targetTotalCents;
      registerWrongAttempt(`Du hast ${formatEUR(diff, state.settings.priceFormat)} zu viel. Nimm etwas weg.`);
      return;
    }

    const changeSum = sumCents(state.changeSelections);
    const changeCalcHint = `Rechne: ${formatEUR(
      task.suggestedPaymentCents,
      state.settings.priceFormat,
    )} - ${formatEUR(task.targetTotalCents, state.settings.priceFormat)} = ?`;
    if (changeSum === task.correctChangeCents) {
      markTaskSolved("Super! Das Rückgeld stimmt.");
      return;
    }

    registerWrongAttempt(changeCalcHint);
  }

  function rerender() {
    renderApp(root, state);
    const homeBtn = root.querySelector("#home-btn");
    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        clearAutoNextTimer();
        setPhase(state, APP_PHASE.SETUP);
        clearCurrentSelections(state);
        rerender();
      });
    }

    if (state.phase === APP_PHASE.SETUP) {
      bindSetupEvents(root, {
        onSettingsChange(partial) {
          updateSettings(state, partial);
          rerender();
        },
        onStart() {
          clearAutoNextTimer();
          startSession(state);
          rerender();
        },
      });
      return;
    }

    if (state.phase === APP_PHASE.RESULT) {
      bindResultEvents(root, {
        onAgain() {
          clearAutoNextTimer();
          startSession(state);
          rerender();
        },
        onBackSettings() {
          clearAutoNextTimer();
          setPhase(state, APP_PHASE.SETUP);
          rerender();
        },
      });
      return;
    }

    bindTaskEvents(root, {
      onCheck() {
        if (state.awaitingNext) {
          return;
        }
        handleCheck();
        rerender();
      },
      onClear() {
        if (state.awaitingNext) {
          return;
        }
        clearCurrentSelections(state);
        rerender();
      },
      onAddDenom(value) {
        if (state.awaitingNext) {
          return;
        }
        const zone = state.currentTask.mode === TASK_MODE.CHANGE ? "change" : "payment";
        addSelection(state, zone, value);
        rerender();
      },
      onDrop(zone, value) {
        if (state.awaitingNext) {
          return;
        }
        if (Number.isNaN(value)) {
          return;
        }
        if (state.currentTask.mode === TASK_MODE.PAY_EXACT && zone !== "payment") {
          return;
        }
        if (state.currentTask.mode === TASK_MODE.CHANGE && zone !== "change") {
          return;
        }
        addSelection(state, zone, value);
        rerender();
      },
      onRemove(zone, index) {
        if (state.awaitingNext) {
          return;
        }
        removeSelection(state, zone, index);
        rerender();
      },
    });
  }

  rerender();
})();
