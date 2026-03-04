import {
  APP_NAME,
  APP_PHASE,
  NUMBER_SPACE,
  PRICE_FORMAT,
  CENT_DIFFICULTY,
  TASK_MODE,
  PURCHASE_MODE,
  HELP_MODE,
  TASKS_PER_SESSION,
  getDefaultPriceFormat,
} from "./config.js";
import { formatEUR, getAvailableDenominations, sumCents } from "./money.js";
import { getInstruction } from "./state.js";

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

function getProductImageMarkup(item) {
  if (item.image) {
    return `<img src="${item.image}" alt="${item.name}" class="product-image" loading="lazy" decoding="async" />`;
  }
  return `<span class="icon-fallback" aria-label="${item.name}">${(item.icon || item.name.slice(0, 3)).toUpperCase()}</span>`;
}

function getMoneyAsset(value) {
  const filename = MONEY_ASSET_BY_VALUE[value];
  return filename ? encodeURI(filename) : null;
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

function progressSegmentsMarkup(state) {
  return Array.from({ length: TASKS_PER_SESSION }, (_, index) => {
    let status = "";
    if (state.taskOutcomes?.[index] === "correct") {
      status = "correct";
    } else if (state.taskOutcomes?.[index] === "wrong") {
      status = "wrong";
    } else if (index === state.taskIndex && state.phase !== APP_PHASE.RESULT) {
      status = "current";
    }
    return `<div class="progress-segment ${status}"></div>`;
  }).join("");
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
    .map((value, index) => {
      const asset = getMoneyAsset(value);
      return `
        <button class="chip" data-zone="${zone}" data-remove-index="${index}" aria-label="${formatEUR(
          value,
          settings.priceFormat,
        )} aus ${zoneTitle(zone)} entfernen">
          ${
            asset
              ? `<img src="${asset}" alt="" class="chip-money-img" loading="lazy" decoding="async" />`
              : `<span class="chip-value">${formatEUR(value, settings.priceFormat)}</span>`
          }
          <span class="chip-x" aria-hidden="true">×</span>
        </button>
      `;
    })
    .join("");
}

function taskView(state) {
  const task = state.currentTask;
  const settings = state.settings;
  const denoms = getAvailableDenominations(settings);
  const paymentSum = sumCents(state.paymentSelections);
  const changeSum = sumCents(state.changeSelections);
  const instruction = getInstruction(state, formatEUR);
  const isChangePhase = state.phase === APP_PHASE.TASK_CHANGE;
  const isChangeMode = task.mode === TASK_MODE.CHANGE;
  const showInstruction = !(isChangeMode && isChangePhase);

  return `
    <section class="panel task-panel" aria-label="Aufgabe">
      <div class="progress-row">
        <div class="progress">Aufgabe ${state.taskIndex + 1}/${TASKS_PER_SESSION}</div>
        <div class="progress-track" aria-label="Fortschritt">
          ${progressSegmentsMarkup(state)}
        </div>
      </div>
      ${showInstruction ? `<div class="instruction">${instruction}</div>` : ""}

      ${isChangeMode ? changeRoleplayMarkup(task, settings) : payRoleplayMarkup(task)}

      <section class="item-list ${task.items.length > 1 ? "multi" : "single"}" aria-label="Produkte">
        ${task.items
          .map(
            (item) => `
              <article class="product-card" aria-label="Produkt ${item.name}">
                <div class="icon">${getProductImageMarkup(item)}</div>
                <div class="product-meta">
                  <span class="sr-only">${item.name}</span>
                  <div class="price-tag" aria-label="Preisschild">
                    <span>${formatEUR(item.priceCents, settings.priceFormat)}</span>
                  </div>
                </div>
              </article>
            `,
          )
          .join("")}
      </section>

      ${
        settings.helpMode === HELP_MODE.WITH_HELP
          ? `
            <article class="total-card" aria-label="Gesamtpreis">
              <h4>Gesamtpreis</h4>
              <div class="price-tag total-tag">
                <span>${formatEUR(task.targetTotalCents, settings.priceFormat)}</span>
              </div>
            </article>
          `
          : ""
      }

      <div class="zones">
        ${
          isChangePhase
            ? `
              <section class="zone active payment-fixed">
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
              </section>
            `
            : `
              <section class="zone active" data-drop-zone="payment">
                <h4>${isChangeMode ? "Zahlung (zum Prüfen)" : "Zahlung"}</h4>
                <div class="drop-list">${chips(state.paymentSelections, "payment", settings)}</div>
                ${
                  settings.helpMode === HELP_MODE.WITH_HELP
                    ? `<p>Du legst: <strong>${formatEUR(paymentSum, settings.priceFormat)}</strong></p>`
                    : ""
                }
              </section>
            `
        }
      </div>

      <div class="actions">
        <button id="check-btn" class="primary" aria-label="Eingabe prüfen" ${
          state.awaitingNext ? "disabled" : ""
        } title="Prüfen"><span class="btn-icon" aria-hidden="true">✓</span></button>
        <button id="clear-btn" class="secondary" aria-label="Alles zurücklegen" ${
          state.awaitingNext ? "disabled" : ""
        } title="Alles zurücklegen"><span class="btn-icon" aria-hidden="true">↺</span></button>
        ${
          state.awaitingNext
            ? '<button id="next-btn" class="primary" aria-label="Nächste Aufgabe">Nächste Aufgabe</button>'
            : ""
        }
      </div>

      <p class="feedback" aria-live="polite">${state.feedback || ""}</p>

      <section class="money-tray" aria-label="Geldtablett">
        ${denoms
          .map((denom, index) => {
            const asset = getMoneyAsset(denom.value);
            return `
              <button
                class="money ${denom.kind}"
                draggable="true"
                data-denom-index="${index}"
                data-denom-value="${denom.value}"
                aria-label="${denom.label} hinzufügen"
                ${state.awaitingNext ? "disabled" : ""}
              >
                ${
                  asset
                    ? `<img src="${asset}" alt="${denom.label}" class="money-img" loading="lazy" decoding="async" />`
                    : `<span class="money-text">${denom.label}</span>`
                }
              </button>
            `;
          })
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

export function renderApp(root, state) {
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
      <div class="header-actions">
        <p>${formatSettingsSummary(state.settings)}</p>
        <a class="secondary link-btn" href="../index.html">Zum Portal</a>
      </div>
    </header>
    <main>${body}</main>
  `;
}

export function bindSetupEvents(root, _state, handlers) {
  const form = root.querySelector("#setup-form");
  if (!form) {
    return;
  }

  root.querySelector("#home-btn")?.addEventListener("click", handlers.onHome);

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

export function bindTaskEvents(root, handlers) {
  root.querySelector("#home-btn")?.addEventListener("click", handlers.onHome);
  root.querySelector("#check-btn")?.addEventListener("click", handlers.onCheck);
  root.querySelector("#clear-btn")?.addEventListener("click", handlers.onClear);
  root.querySelector("#next-btn")?.addEventListener("click", handlers.onNext);

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

export function bindResultEvents(root, handlers) {
  root.querySelector("#home-btn")?.addEventListener("click", handlers.onHome);
  root.querySelector("#again-btn")?.addEventListener("click", handlers.onAgain);
  root.querySelector("#back-settings-btn")?.addEventListener("click", handlers.onBackSettings);
}
