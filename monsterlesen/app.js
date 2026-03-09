const GAME_PHASE = {
  LOADING: "loading",
  SETUP: "setup",
  PLAY: "play",
  RESULT: "result",
};

const DIFFICULTIES = {
  paare: {
    id: "paare",
    label: "2 Silben",
    folder: "audio_paare",
  },
  dreier: {
    id: "dreier",
    label: "3 Silben",
    folder: "audio_dreier",
  },
  vierer: {
    id: "vierer",
    label: "4 Silben",
    folder: "audio_vierer",
  },
};

const TASKS_PER_ROUND = 10;

const state = {
  phase: GAME_PHASE.LOADING,
  difficulty: "paare",
  assets: null,
  tasks: [],
  taskIndex: 0,
  currentTask: null,
  options: [],
  selectedSyllables: [],
  taskOutcomes: [],
  correct: 0,
  attempts: 0,
  wrong: 0,
  feedback: "Höre genau hin und klicke die Silben in der richtigen Reihenfolge an.",
  feedbackKind: "",
  lastWrong: "",
  taskWrongAttempts: 0,
  audio: null,
  loadError: "",
  locked: false,
  advanceTimer: 0,
};

const root = document.getElementById("game-root");

function stem(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function unique(values) {
  return [...new Set(values)];
}

function displaySyllable(syllable) {
  return String(syllable).toLocaleUpperCase("de-DE");
}

function syllableAudioPath(syllable) {
  return `./audio_silben/${syllable}.mp3`;
}

function nameAudioPath(task) {
  return `./${DIFFICULTIES[task.difficulty].folder}/${task.audioFile}`;
}

function introAudioPath() {
  const intros = state.assets?.audio || [];
  if (intros.length === 0) {
    return "";
  }
  const intro = intros[Math.floor(Math.random() * intros.length)];
  return `./audio/${intro}`;
}

function monsterImagePath(task) {
  return `./monster/${task.imageFile}`;
}

function parseTask(audioFile, difficulty, imageFile) {
  const syllables = stem(audioFile).split("_");
  return {
    id: `${difficulty}:${audioFile}`,
    audioFile,
    difficulty,
    syllables,
    imageFile,
    nameText: syllables.join(""),
  };
}

function buildTaskPool(difficulty) {
  const folderName = DIFFICULTIES[difficulty].folder;
  const audioFiles = state.assets?.[folderName] || [];
  const monsterImages = (state.assets?.monster || []).filter((file) => file.endsWith(".webp"));

  return audioFiles.map((audioFile, index) =>
    parseTask(audioFile, difficulty, monsterImages[index % monsterImages.length]),
  );
}

function buildRound(difficulty) {
  return shuffle(buildTaskPool(difficulty)).slice(0, TASKS_PER_ROUND);
}

function availableSyllables() {
  return unique((state.assets?.audio_silben || []).map((file) => stem(file)));
}

function vowelPattern(syllable) {
  const match = syllable.match(/[aeiouäöüy]+/gi);
  return match ? match.join("") : "";
}

function syllableSimilarityScore(target, candidate) {
  let score = 0;

  if (candidate[0] === target[0]) {
    score += 5;
  }
  if (candidate.at(-1) === target.at(-1)) {
    score += 4;
  }
  if (vowelPattern(candidate) === vowelPattern(target)) {
    score += 6;
  }
  if (candidate.length === target.length) {
    score += 2;
  }
  if (candidate.slice(0, 2) === target.slice(0, 2)) {
    score += 3;
  }
  if (candidate.slice(-2) === target.slice(-2)) {
    score += 3;
  }
  for (const char of candidate) {
    if (target.includes(char)) {
      score += 0.5;
    }
  }

  return score;
}

function buildOptions(task) {
  const targets = [...task.syllables];
  const pool = availableSyllables()
    .filter((syllable) => !targets.includes(syllable))
    .map((syllable) => ({
      syllable,
      score: Math.max(...targets.map((target) => syllableSimilarityScore(target, syllable))),
    }))
    .sort((left, right) => right.score - left.score || left.syllable.localeCompare(right.syllable, "de"));

  const options = [...targets];
  const topPool = shuffle(pool.slice(0, 24).map((entry) => entry.syllable));

  for (const syllable of topPool) {
    if (options.length >= 10) {
      break;
    }
    if (!options.includes(syllable)) {
      options.push(syllable);
    }
  }

  if (options.length < 10) {
    for (const syllable of availableSyllables()) {
      if (options.length >= 10) {
        break;
      }
      if (!options.includes(syllable)) {
        options.push(syllable);
      }
    }
  }

  return shuffle(options.slice(0, 10));
}

function stopAudio() {
  if (!state.audio) {
    return;
  }
  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio = null;
}

function clearAdvanceTimer() {
  if (!state.advanceTimer) {
    return;
  }
  window.clearTimeout(state.advanceTimer);
  state.advanceTimer = 0;
}

function nextTask() {
  clearAdvanceTimer();
  if (state.taskIndex + 1 >= TASKS_PER_ROUND) {
    finishRound();
    return;
  }
  state.taskIndex += 1;
  loadTask();
}

function playAudio(src, onDone = null, fallbackMs = 0) {
  stopAudio();
  clearAdvanceTimer();

  const audio = new Audio(src);
  let finished = false;

  function finish() {
    if (finished) {
      return;
    }
    finished = true;
    clearAdvanceTimer();
    state.audio = null;
    onDone?.();
  }

  audio.addEventListener("ended", finish, { once: true });

  if (fallbackMs > 0) {
    state.advanceTimer = window.setTimeout(finish, fallbackMs);
  }

  audio.play().catch(() => {
    state.feedback = "Der Ton konnte nicht abgespielt werden.";
    state.feedbackKind = "feedback-bad";
    render();
    finish();
  });

  state.audio = audio;
}

function playMonsterName(andAdvance = false) {
  if (!state.currentTask) {
    return;
  }
  if (andAdvance) {
    const fallbackMs = 900 + state.currentTask.syllables.length * 650;
    playAudio(nameAudioPath(state.currentTask), () => window.setTimeout(nextTask, 350), fallbackMs);
    return;
  }
  playAudio(nameAudioPath(state.currentTask));
}

function playIntroAndMonsterName() {
  if (!state.currentTask) {
    return;
  }
  const introPath = introAudioPath();
  if (!introPath) {
    playMonsterName(false);
    return;
  }
  playAudio(
    introPath,
    () => {
      playMonsterName(false);
    },
    2200,
  );
}

function playSyllable(syllable) {
  playAudio(syllableAudioPath(syllable));
}

function playErrorTone(onDone) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    window.setTimeout(() => onDone?.(), 320);
    return;
  }

  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  function note(freq, start, duration, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  }

  note(329.63, 0.0, 0.11, 0.14);
  note(220.0, 0.1, 0.18, 0.16);

  window.setTimeout(() => {
    ctx.close().catch(() => {});
    onDone?.();
  }, 320);
}

function playSuccessTone(onDone) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    window.setTimeout(() => onDone?.(), 380);
    return;
  }

  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  function note(freq, start, duration, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  }

  note(659.25, 0.0, 0.1, 0.14);
  note(880.0, 0.08, 0.12, 0.16);
  note(1174.66, 0.18, 0.18, 0.18);

  window.setTimeout(() => {
    ctx.close().catch(() => {});
    onDone?.();
  }, 390);
}

function playSolvedSequence(lastSyllable) {
  const fallbackMs = 850;
  playAudio(
    syllableAudioPath(lastSyllable),
    () => {
      playSuccessTone(() => {
        playMonsterName(true);
      });
    },
    fallbackMs,
  );
}

function playWrongSequence(syllable, onDone = null) {
  const fallbackMs = 850;
  playAudio(
    syllableAudioPath(syllable),
    () => {
      playErrorTone(onDone);
    },
    fallbackMs,
  );
}

function startRound() {
  stopAudio();
  clearAdvanceTimer();
  state.phase = GAME_PHASE.PLAY;
  state.tasks = buildRound(state.difficulty);
  state.taskOutcomes = Array(TASKS_PER_ROUND).fill("");
  state.taskIndex = 0;
  state.correct = 0;
  state.attempts = 0;
  state.wrong = 0;
  state.lastWrong = "";
  loadTask();
}

function loadTask() {
  stopAudio();
  state.currentTask = state.tasks[state.taskIndex];
  state.selectedSyllables = [];
  state.feedback = "Höre genau hin und klicke die Silben in der richtigen Reihenfolge an.";
  state.feedbackKind = "";
  state.lastWrong = "";
  state.taskWrongAttempts = 0;
  state.locked = false;
  state.options = buildOptions(state.currentTask);
  render();
  playIntroAndMonsterName();
}

function finishRound() {
  stopAudio();
  clearAdvanceTimer();
  state.phase = GAME_PHASE.RESULT;
  render();
}

function progressSegments() {
  return Array.from({ length: TASKS_PER_ROUND }, (_, index) => {
    let status = state.taskOutcomes[index] || "";
    if (!status && index === state.taskIndex && state.phase === GAME_PHASE.PLAY) {
      status = "current";
    }
    return `<div class="progress-segment ${status}"></div>`;
  }).join("");
}

function loadingView() {
  return `
    <section class="panel setup-layout" aria-label="Lädt">
      <h2>Monsterlesen lädt</h2>
      <p class="hint">${state.loadError || "Bilder, Monsterstimmen und Silben werden vorbereitet."}</p>
    </section>
  `;
}

function setupView() {
  return `
    <section class="panel setup-layout" aria-label="Monsterlesen Start">
      <div>
        <h2>Monsterlesen</h2>
        <p class="hint">Die Monster sprechen ihre Namen. Danach setzt du den Namen aus Silben zusammen.</p>
      </div>
      <div class="setup-grid">
        <section class="panel">
          <h3>Schwierigkeit</h3>
          <div class="mode-row" aria-label="Schwierigkeit wählen">
            ${Object.values(DIFFICULTIES)
              .map(
                (difficulty) => `
                  <button
                    type="button"
                    class="${state.difficulty === difficulty.id ? "active" : ""}"
                    data-difficulty="${difficulty.id}"
                  >
                    ${difficulty.label}
                  </button>
                `,
              )
              .join("")}
          </div>
          <p class="hint">Eine Runde umfasst 10 Monster.</p>
          <button id="start-btn" type="button" class="primary">Runde starten</button>
        </section>
        <aside class="panel status-panel">
          <div class="pill">Hören</div>
          <div class="pill">Silben ordnen</div>
          <div class="pill">10 Runden</div>
          <p class="hint">Passende Silben werden nacheinander angeklickt. Nach dem vollständigen Namen spricht das Monster noch einmal.</p>
        </aside>
      </div>
    </section>
  `;
}

function answerSlotsMarkup() {
  const slots = state.currentTask.syllables.map((_, index) => {
    const value = state.selectedSyllables[index] ? displaySyllable(state.selectedSyllables[index]) : "–";
    const filled = Boolean(state.selectedSyllables[index]);
    return `<div class="answer-slot ${filled ? "filled" : ""}">${value}</div>`;
  });

  return `<div class="answer-strip" style="--slots:${state.currentTask.syllables.length}">${slots.join("")}</div>`;
}

function syllableButtonsMarkup() {
  return `
    <div class="syllable-grid" aria-label="Silbenauswahl">
      ${state.options
        .map((syllable) => {
          const chosen = state.selectedSyllables.includes(syllable);
          const isWrong = state.feedbackKind === "feedback-bad" && state.lastWrong === syllable;
          const classNames = ["syllable-btn"];
          if (chosen) {
            classNames.push("correct");
          } else if (isWrong) {
            classNames.push("wrong");
          }

          return `
            <button
              type="button"
              class="${classNames.join(" ")}"
              data-syllable="${syllable}"
              ${chosen || state.locked ? "disabled" : ""}
            >
              ${displaySyllable(syllable)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function feedbackMarkup() {
  const isSolved =
    state.phase === GAME_PHASE.PLAY &&
    state.currentTask &&
    state.taskOutcomes[state.taskIndex] === "correct";

  if (isSolved) {
    return `
      <div class="feedback-text feedback-success">
        <div>Richtig!</div>
        <div class="feedback-monster-name">${displaySyllable(state.currentTask.nameText)}</div>
      </div>
    `;
  }

  return `<div class="feedback-text ${state.feedbackKind}">${state.feedback}</div>`;
}

function playView() {
  return `
    <section class="panel monsterlesen-layout" aria-label="Monsterlesen Spiel">
      <div>
        <h2>Welchen Namen hat das Monster?</h2>
      </div>
      <div class="progress-wrap" aria-label="Fortschritt">
        <div class="progress-label">Aufgabe ${state.taskIndex + 1}/${TASKS_PER_ROUND}</div>
        <div class="progress-track">${progressSegments()}</div>
      </div>
      <div class="play-grid">
        <section class="monster-stage">
          <article class="panel monster-card">
            <img class="monster-figure" src="${monsterImagePath(state.currentTask)}" alt="Monster ${state.taskIndex + 1}" />
            <div class="monster-actions">
              <button id="play-name-btn" type="button" class="primary speaker-btn">
                <span aria-hidden="true">🔊</span>
                <span>Namen anhören</span>
              </button>
            </div>
          </article>
          ${answerSlotsMarkup()}
          ${syllableButtonsMarkup()}
        </section>
        <aside class="panel status-panel">
          <div class="stats-row">
            <div class="pill">Richtig: ${state.correct}</div>
            <div class="pill">Fehler: ${state.wrong}</div>
            <div class="pill">Versuche: ${state.attempts}</div>
          </div>
          ${feedbackMarkup()}
        </aside>
      </div>
    </section>
  `;
}

function resultView() {
  const piePercent = Math.round((state.correct / TASKS_PER_ROUND) * 100);
  return `
    <section class="panel result-panel" aria-label="Ergebnis">
      <div class="confetti-layer" aria-hidden="true">
        ${Array.from({ length: 28 }, (_, index) => {
          const left = ((index * 41) % 100) + 0.5;
          const delay = (index % 8) * 0.08;
          const duration = 1.8 + (index % 6) * 0.14;
          const hue = (index * 37) % 360;
          const rotate = (index * 29) % 180;
          return `<span class="confetti-piece" style="--left:${left}%;--delay:${delay}s;--dur:${duration}s;--hue:${hue};--rot:${rotate}deg;"></span>`;
        }).join("")}
      </div>
      <h2>Runde geschafft!</h2>
      <div class="result-chart-wrap">
        <div class="result-pie" style="--pie:${piePercent};" aria-label="Richtig ${state.correct} von ${TASKS_PER_ROUND}">
          <div class="result-pie-center">${state.correct}/${TASKS_PER_ROUND}</div>
        </div>
      </div>
      <p>Richtig: <strong>${state.correct}</strong> von ${TASKS_PER_ROUND}</p>
      <p>Fehlversuche: <strong>${state.wrong}</strong></p>
      <p>Versuche gesamt: <strong>${state.attempts}</strong></p>
      <div class="inline-actions" style="margin-top:10px">
        <button id="again-btn" type="button" class="primary">Neue Runde</button>
        <button id="back-btn" type="button" class="secondary">Zur Auswahl</button>
      </div>
    </section>
  `;
}

function render() {
  if (state.phase === GAME_PHASE.LOADING) {
    root.innerHTML = loadingView();
  } else if (state.phase === GAME_PHASE.SETUP) {
    root.innerHTML = setupView();
  } else if (state.phase === GAME_PHASE.RESULT) {
    root.innerHTML = resultView();
  } else {
    root.innerHTML = playView();
  }

  bindEvents();
}

function onSyllableClick(syllable) {
  if (!state.currentTask) {
    return;
  }
  if (state.locked) {
    return;
  }
  state.attempts += 1;

  const nextIndex = state.selectedSyllables.length;
  const expected = state.currentTask.syllables[nextIndex];

  if (syllable !== expected) {
    state.wrong += 1;
    state.taskWrongAttempts += 1;
    state.lastWrong = syllable;
    if (state.taskWrongAttempts >= 2) {
      state.taskOutcomes[state.taskIndex] = "wrong";
      state.locked = true;
      state.feedback = "Dieses Monster zählt jetzt als falsch. Höre den Namen noch einmal.";
      state.feedbackKind = "feedback-bad";
      render();
      playWrongSequence(syllable, () => {
        playMonsterName(true);
      });
      return;
    }

    state.feedback = "Diese Silbe passt hier noch nicht. Versuche es noch einmal.";
    state.feedbackKind = "feedback-bad";
    render();
    playWrongSequence(syllable);
    return;
  }

  state.selectedSyllables.push(syllable);
  state.lastWrong = "";
  state.feedbackKind = "feedback-ok";

  if (state.selectedSyllables.length >= state.currentTask.syllables.length) {
    state.correct += 1;
    state.taskOutcomes[state.taskIndex] = "correct";
    state.locked = true;
    state.feedback = `Richtig! ${state.currentTask.nameText}`;
    render();
    playSolvedSequence(syllable);
    return;
  }

  const remaining = state.currentTask.syllables.length - state.selectedSyllables.length;
  state.feedback = remaining === 1 ? "Gut. Noch eine Silbe fehlt." : `Gut. Noch ${remaining} Silben fehlen.`;
  render();
  playSyllable(syllable);
}

function bindEvents() {
  if (state.phase === GAME_PHASE.SETUP) {
    root.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        state.difficulty = button.dataset.difficulty;
        render();
      });
    });
    root.querySelector("#start-btn")?.addEventListener("click", startRound);
    return;
  }

  if (state.phase === GAME_PHASE.RESULT) {
    root.querySelector("#again-btn")?.addEventListener("click", startRound);
    root.querySelector("#back-btn")?.addEventListener("click", () => {
      stopAudio();
      clearAdvanceTimer();
      state.phase = GAME_PHASE.SETUP;
      render();
    });
    return;
  }

  if (state.phase !== GAME_PHASE.PLAY) {
    return;
  }

  root.querySelector("#play-name-btn")?.addEventListener("click", () => playMonsterName(false));
  root.querySelectorAll("[data-syllable]").forEach((button) => {
    button.addEventListener("click", () => onSyllableClick(button.dataset.syllable));
  });
}

async function init() {
  clearAdvanceTimer();
  render();
  try {
    const response = await fetch("./asset-manifest.json");
    if (!response.ok) {
      throw new Error(`Manifest konnte nicht geladen werden (${response.status})`);
    }
    state.assets = await response.json();
    state.phase = GAME_PHASE.SETUP;
  } catch (error) {
    state.loadError = "Die Dateien für Monsterlesen konnten nicht geladen werden.";
    console.error(error);
  }
  render();
}

init();
