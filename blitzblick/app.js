const FILE_MANIFEST = "./bilder/manifest.json";

const state = {
  items: [],
  forms: [],
  selectedForms: new Set(),
  selectedNumbers: new Set(Array.from({ length: 11 }, (_, i) => i)),
  durationMs: 1500,
  rounds: 10,
  phase: "setup", // setup | playing | result
  currentRound: 0,
  score: 0,
  waitingAnswer: false,
  lastItem: null,
  feedback: "",
  feedbackKind: "",
};

const root = document.getElementById("game-root");
let hideTimer = null;
let nextTimer = null;

function extractMeta(filename) {
  const match = filename.match(/^(.+?)_(10|[0-9])\.(webp|png)$/i);
  if (!match) {
    return null;
  }
  return { form: match[1], value: Number(match[2]) };
}

async function loadManifest() {
  const response = await fetch(FILE_MANIFEST, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Manifest konnte nicht geladen werden.");
  }
  const list = await response.json();
  state.items = list
    .map((entry) => (typeof entry === "string" ? entry : entry?.name))
    .filter(Boolean)
    .map((name) => {
      const meta = extractMeta(name);
      if (!meta) {
        return null;
      }
      return { name, url: `./bilder/${name}`, form: meta.form, value: meta.value };
    })
    .filter(Boolean);

  state.forms = [...new Set(state.items.map((it) => it.form))].sort((a, b) => a.localeCompare(b, "de"));
  state.selectedForms = new Set(state.forms);
}

function filteredPool() {
  return state.items.filter((it) => state.selectedForms.has(it.form) && state.selectedNumbers.has(it.value));
}

function clearTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (nextTimer) {
    clearTimeout(nextTimer);
    nextTimer = null;
  }
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function renderCheckList(values, selectedSet, type) {
  return values
    .map(
      (value) => `
        <label class="check">
          <input
            type="checkbox"
            data-check-type="${type}"
            data-check-value="${value}"
            ${selectedSet.has(value) ? "checked" : ""}
          />
          <span>${type === "form" ? String(value).replaceAll("_", " ") : value}</span>
        </label>
      `,
    )
    .join("");
}

function setupView() {
  const usable = filteredPool().length;

  return `
    <section class="blitz-layout">
      <section class="panel">
        <h2>Blitzblick starten</h2>
        <p class="hint">
          Ein Bild wird kurz gezeigt. Danach wählst du die passende Zahl.
        </p>
        <div class="chips">
          <span class="pill">Bilder gesamt: ${state.items.length}</span>
          <span class="pill">Verwendbar: ${usable}</span>
        </div>
      </section>

      <section class="settings-grid">
        <section class="panel">
          <h3>Darstellungsformen</h3>
          <div class="checks">${renderCheckList(state.forms, state.selectedForms, "form")}</div>
          <div class="chips" style="margin-top:8px">
            <button type="button" id="forms-all" class="secondary">Alle</button>
            <button type="button" id="forms-none" class="secondary">Keine</button>
          </div>
        </section>

        <section class="panel">
          <h3>Zahlen</h3>
          <div class="checks">${renderCheckList(Array.from({ length: 11 }, (_, i) => i), state.selectedNumbers, "num")}</div>
          <div class="chips" style="margin-top:8px">
            <button type="button" id="nums-all" class="secondary">Alle</button>
            <button type="button" id="nums-none" class="secondary">Keine</button>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="settings-grid">
          <div class="field">
            <label for="dur">Anzeigedauer</label>
            <div class="field-row">
              <input id="dur" type="range" min="0.5" max="5" step="0.5" value="${state.durationMs / 1000}" />
              <output id="dur-val">${String(state.durationMs / 1000).replace(".", ",")} s</output>
            </div>
          </div>
          <div class="field">
            <label for="rounds">Runden</label>
            <input id="rounds" type="number" min="1" max="50" step="1" value="${state.rounds}" />
          </div>
        </div>
        <div class="chips" style="margin-top:10px">
          <button type="button" id="start-btn" class="primary" ${usable === 0 ? "disabled" : ""}>Spiel starten</button>
        </div>
      </section>
    </section>
  `;
}

function playingView() {
  const showImage = !state.waitingAnswer && state.lastItem;

  return `
    <section class="blitz-layout">
      <section class="panel stage-panel">
        <div class="stage-top">
          <div class="chips">
            <span class="pill">Runde ${state.currentRound}/${state.rounds}</span>
            <span class="pill">Punkte: ${state.score}</span>
          </div>
          <button type="button" id="cancel-btn" class="secondary">Abbrechen</button>
        </div>
        <div class="stage">
          ${
            showImage
              ? `<img class="stage-img" src="${state.lastItem.url}" alt="Zahldarstellung" />`
              : `<div class="stage-placeholder">${state.waitingAnswer ? "Welche Zahl war das?" : "Bereit…"}</div>`
          }
        </div>
        <p class="feedback ${state.feedbackKind}">${state.feedback || ""}</p>
        <div class="answers">
          ${Array.from({ length: 11 }, (_, i) => `<button class="ans" type="button" data-answer="${i}" ${state.waitingAnswer ? "" : "disabled"}>${i}</button>`).join("")}
        </div>
      </section>
    </section>
  `;
}

function resultView() {
  return `
    <section class="panel result-wrap">
      <h2>Fertig!</h2>
      <div class="result-score">${state.score} / ${state.rounds}</div>
      <div class="chips">
        <button type="button" id="again-btn" class="primary">Nochmal</button>
        <button type="button" id="setup-btn" class="secondary">Zur Einstellungen</button>
      </div>
    </section>
  `;
}

function render() {
  root.innerHTML = state.phase === "setup" ? setupView() : state.phase === "playing" ? playingView() : resultView();
  bindEvents();
}

function nextRound() {
  const pool = filteredPool();
  if (pool.length === 0) {
    state.phase = "setup";
    state.feedback = "";
    state.feedbackKind = "";
    render();
    return;
  }

  if (state.currentRound >= state.rounds) {
    state.phase = "result";
    render();
    return;
  }

  state.currentRound += 1;
  state.lastItem = randomChoice(pool);
  state.waitingAnswer = false;
  state.feedback = "";
  state.feedbackKind = "";
  render();

  hideTimer = setTimeout(() => {
    state.waitingAnswer = true;
    render();
  }, state.durationMs);
}

function startGame() {
  clearTimers();
  state.phase = "playing";
  state.currentRound = 0;
  state.score = 0;
  state.waitingAnswer = false;
  state.lastItem = null;
  state.feedback = "";
  state.feedbackKind = "";
  nextRound();
}

function answer(value) {
  if (!state.waitingAnswer || !state.lastItem) {
    return;
  }
  state.waitingAnswer = false;

  if (Number(value) === state.lastItem.value) {
    state.score += 1;
    state.feedback = `Richtig! (${value})`;
    state.feedbackKind = "ok";
  } else {
    state.feedback = `Leider falsch. Richtig war ${state.lastItem.value}.`;
    state.feedbackKind = "err";
  }
  render();

  nextTimer = setTimeout(nextRound, 900);
}

function bindEvents() {
  if (state.phase === "setup") {
    root.querySelectorAll("[data-check-type]").forEach((el) => {
      el.addEventListener("change", () => {
        const type = el.dataset.checkType;
        const value = type === "num" ? Number(el.dataset.checkValue) : el.dataset.checkValue;
        const set = type === "num" ? state.selectedNumbers : state.selectedForms;
        if (el.checked) {
          set.add(value);
        } else {
          set.delete(value);
        }
        render();
      });
    });

    root.querySelector("#forms-all")?.addEventListener("click", () => {
      state.selectedForms = new Set(state.forms);
      render();
    });
    root.querySelector("#forms-none")?.addEventListener("click", () => {
      state.selectedForms.clear();
      render();
    });
    root.querySelector("#nums-all")?.addEventListener("click", () => {
      state.selectedNumbers = new Set(Array.from({ length: 11 }, (_, i) => i));
      render();
    });
    root.querySelector("#nums-none")?.addEventListener("click", () => {
      state.selectedNumbers.clear();
      render();
    });

    root.querySelector("#dur")?.addEventListener("input", (event) => {
      state.durationMs = Math.round(Number(event.target.value) * 1000);
      const out = root.querySelector("#dur-val");
      if (out) {
        out.textContent = `${String(event.target.value).replace(".", ",")} s`;
      }
    });
    root.querySelector("#rounds")?.addEventListener("change", (event) => {
      state.rounds = Math.max(1, Math.min(50, Number(event.target.value) || 10));
      event.target.value = state.rounds;
    });

    root.querySelector("#start-btn")?.addEventListener("click", startGame);
    return;
  }

  if (state.phase === "playing") {
    root.querySelector("#cancel-btn")?.addEventListener("click", () => {
      clearTimers();
      state.phase = "setup";
      render();
    });

    root.querySelectorAll("[data-answer]").forEach((btn) => {
      btn.addEventListener("click", () => answer(btn.dataset.answer));
    });
    return;
  }

  root.querySelector("#again-btn")?.addEventListener("click", startGame);
  root.querySelector("#setup-btn")?.addEventListener("click", () => {
    state.phase = "setup";
    render();
  });
}

async function init() {
  try {
    await loadManifest();
  } catch {
    state.items = [];
    state.forms = [];
    state.selectedForms = new Set();
  }
  render();
}

init();
