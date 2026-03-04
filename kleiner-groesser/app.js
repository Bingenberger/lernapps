const MIN = 1;
const MAX = 20;

const state = {
  secret: 0,
  attempts: 0,
  guessMarks: {},
  feedback: "Rate eine Zahl.",
  feedbackKind: "neutral",
  roundDone: false,
};

const root = document.getElementById("game-root");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startRound() {
  state.secret = randomInt(MIN, MAX);
  state.attempts = 0;
  state.guessMarks = {};
  state.feedback = "Rate eine Zahl.";
  state.feedbackKind = "neutral";
  state.roundDone = false;
  render();
}

function numberStrip() {
  return `
    <section class="number-strip" aria-label="Zahlen von 1 bis 20">
      ${Array.from({ length: 20 }, (_, idx) => {
        const value = idx + 1;
        const mark = state.guessMarks[value] || "";
        return `<div class="number-pill ${mark}">${value}</div>`;
      }).join("")}
    </section>
  `;
}

function guessButtons(disabled) {
  return `
    <div class="guess-grid" aria-label="Rate eine Zahl">
      ${Array.from({ length: 20 }, (_, idx) => {
        const value = idx + 1;
        return `
          <button type="button" data-guess="${value}" ${disabled ? "disabled" : ""}>
            ${value}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function render() {
  root.innerHTML = `
    <section class="panel vergleich-layout" aria-label="Mister X">
      <div class="vergleich-top">
        <h2>Mister X: Finde meine Zahl!</h2>
        <div class="hint">Das Krokodil denkt sich eine Zahl zwischen 1 und 20.</div>
        ${numberStrip()}
      </div>

      <section class="task-panel">
        <div class="characters">
          <article class="character-card" aria-label="Kind">
            <div class="character-emoji" aria-hidden="true">🧒</div>
            <div class="character-text">
              <p>Ich rate eine Zahl.</p>
              <p>Dann sagt das Krokodil: kleiner oder größer.</p>
            </div>
          </article>
          <article class="character-card" aria-label="Krokodil-Hinweis">
            <div class="character-emoji" aria-hidden="true">🐊</div>
            <div class="character-text">
              <p class="speech-box">${state.feedback}</p>
            </div>
          </article>
        </div>

        ${guessButtons(state.roundDone)}

        <div class="inline-actions">
          <div class="pill">Versuche: ${state.attempts}</div>
          ${state.roundDone ? '<button id="new-round-btn" class="primary" type="button">Neue Zahl</button>' : ""}
        </div>
      </section>
    </section>
  `;

  bindEvents();
}

function onGuess(raw) {
  if (state.roundDone) {
    return;
  }

  const guess = Number(raw);
  if (!Number.isFinite(guess)) {
    return;
  }

  state.attempts += 1;

  if (guess < state.secret) {
    state.guessMarks[guess] = "guess-small";
    state.feedback = `Größer als ${guess}.`;
    state.feedbackKind = "neutral";
    render();
    return;
  }

  if (guess > state.secret) {
    state.guessMarks[guess] = "guess-large";
    state.feedback = `Kleiner als ${guess}.`;
    state.feedbackKind = "neutral";
    render();
    return;
  }

  state.feedback = `Richtig! Meine Zahl war ${state.secret}. Du hast ${state.attempts} Versuche gebraucht.`;
  state.feedbackKind = "ok";
  state.roundDone = true;
  render();
}

function bindEvents() {
  root.querySelectorAll("[data-guess]").forEach((button) => {
    button.addEventListener("click", () => onGuess(button.dataset.guess));
  });

  root.querySelector("#new-round-btn")?.addEventListener("click", startRound);
}

startRound();
