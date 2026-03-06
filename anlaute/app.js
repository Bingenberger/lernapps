const IMAGE_FILES = {
  anlaute: [
    "a1.webp",
    "a2.webp",
    "au.webp",
    "b.webp",
    "c1.webp",
    "c2.webp",
    "d.webp",
    "e1.webp",
    "e2.webp",
    "ei.webp",
    "eu.webp",
    "f.webp",
    "g.webp",
    "h.webp",
    "i.webp",
    "j.webp",
    "k.webp",
    "l.webp",
    "m.webp",
    "n.webp",
    "o.webp",
    "p.webp",
    "pf.webp",
    "qu.webp",
    "r.webp",
    "s.webp",
    "sch.webp",
    "sp.webp",
    "st.webp",
    "t.webp",
    "u1.webp",
    "u2.webp",
    "v1.webp",
    "v2.webp",
    "w.webp",
    "x.webp",
    "y.webp",
    "z.webp",
    "ä1.webp",
    "ö.webp",
    "ü.webp",
  ],
  inlaute: ["ch1.webp", "ch2.webp", "ck.webp", "ie.webp", "ng.webp", "tz.webp", "ß.webp", "ä2.webp", "äu.webp"],
};

const SOUND_FILES = {
  anlaute: [
    "a1.mp3",
    "a2.mp3",
    "au.mp3",
    "b.mp3",
    "c1.mp3",
    "C2.mp3",
    "d.mp3",
    "e1.mp3",
    "e2.mp3",
    "ei.mp3",
    "eu.mp3",
    "f.mp3",
    "g.mp3",
    "h.mp3",
    "i.mp3",
    "j.mp3",
    "k.mp3",
    "l.mp3",
    "m.mp3",
    "n.mp3",
    "o.mp3",
    "o2.mp3",
    "p.mp3",
    "pf.mp3",
    "qu.mp3",
    "r.mp3",
    "s.mp3",
    "sch.mp3",
    "sp.mp3",
    "st.mp3",
    "t.mp3",
    "u1.mp3",
    "u2.mp3",
    "v1.mp3",
    "v2.mp3",
    "w.mp3",
    "x.mp3",
    "y.mp3",
    "z.mp3",
    "ä1.mp3",
    "ö.mp3",
    "ü.mp3",
  ],
  inlaute: ["ch1.mp3", "ch2.mp3", "ck.mp3", "ie.mp3", "ng.mp3", "tz.mp3", "ß.mp3", "ä.mp3", "äu.mp3"],
};

const TARGET_OPTION_COUNT = 7;
const MIN_OPTION_COUNT = 6;
const TASKS_PER_ROUND = 10;
const GAME_MODE = {
  IMAGE_TO_SOUND: "image-to-sound",
  SOUND_TO_IMAGE: "sound-to-image",
  SOUND_TO_LETTER: "sound-to-letter",
  SOUND_TO_IMAGE_TO_LETTER: "sound-to-image-to-letter",
};
const CONTENT_SCOPE = {
  ANLAUTE_ONLY: "anlaute-only",
  ALL: "all",
};
const CONFLICT_GROUPS = [
  ["ä1", "ä2", "e1", "e2"],
  ["c1", "z", "s", "ß"],
  ["c2", "k"],
  ["w", "v1"],
  ["f", "v2"],
  ["äu", "eu"],
  ["ck", "k"],
  ["tz", "z"],
];

const state = {
  phase: "play",
  contentScope: CONTENT_SCOPE.ANLAUTE_ONLY,
  gameMode: GAME_MODE.SOUND_TO_IMAGE,
  tasks: [],
  taskIndex: 0,
  current: null,
  options: [],
  correct: 0,
  attempts: 0,
  wrong: 0,
  feedback: "Tippe auf den Lautsprecher und wähle dann das passende Bild.",
  feedbackKind: "",
  selected: "",
  wrongSelections: new Set(),
  locked: false,
  audio: null,
  tripleStep: "image",
};

const root = document.getElementById("game-root");

function pathForImage(setId, file) {
  return `./img/${setId}/${file}`;
}

function pathForSound(setId, file) {
  return `./snd/${setId}/${file}`;
}

function stem(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function normalizeKey(value) {
  return String(value).toLocaleLowerCase("de-DE");
}

function extractSound(fileName) {
  return stem(fileName).replace(/[0-9]+$/, "");
}

function buildConflictMap() {
  const map = new Map();
  CONFLICT_GROUPS.forEach((group) => {
    const normalizedGroup = group.map((token) => normalizeKey(token));
    normalizedGroup.forEach((token) => {
      if (!map.has(token)) {
        map.set(token, new Set());
      }
      normalizedGroup.forEach((other) => {
        if (other !== token) {
          map.get(token).add(other);
        }
      });
    });
  });
  return map;
}

const CONFLICT_MAP = buildConflictMap();

function hasConflict(candidateToken, selectedTokens) {
  const blocked = CONFLICT_MAP.get(normalizeKey(candidateToken));
  if (!blocked) {
    return false;
  }
  return selectedTokens.some((token) => blocked.has(normalizeKey(token)));
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function currentEntries() {
  const setIds =
    state.contentScope === CONTENT_SCOPE.ALL ? ["anlaute", "inlaute"] : ["anlaute"];

  return setIds.flatMap((setId) =>
    (IMAGE_FILES[setId] || []).map((file) => ({
      id: `${setId}/${file}`,
      setId,
      file,
      token: normalizeKey(stem(file)),
      sound: extractSound(file),
    })),
  );
}

function currentSounds() {
  return [...new Set(currentEntries().map((entry) => entry.sound))];
}

function soundIndexBySet(setId) {
  const index = new Map();
  (SOUND_FILES[setId] || []).forEach((file) => {
    index.set(normalizeKey(stem(file)), file);
  });
  return index;
}

function resolveSoundFile(entry) {
  const index = soundIndexBySet(entry.setId);
  const exact = index.get(normalizeKey(stem(entry.file)));
  if (exact) {
    return exact;
  }
  const fallback = index.get(normalizeKey(entry.sound));
  return fallback || "";
}

function displaySound(sound) {
  if (sound === "ß") {
    return "ß";
  }
  return sound.toLocaleUpperCase("de-DE");
}

function buildRoundTasks() {
  const pool = currentEntries();
  const tasks = [];

  while (tasks.length < TASKS_PER_ROUND) {
    shuffle(pool);
    for (const entry of pool) {
      if (tasks.length >= TASKS_PER_ROUND) {
        break;
      }
      tasks.push(entry);
    }
  }

  return tasks.slice(0, TASKS_PER_ROUND);
}

function pickLetterOptions(correctEntry) {
  const pool = currentEntries().filter((entry) => entry.token !== correctEntry.token);
  shuffle(pool);

  const options = [
    {
      id: correctEntry.token,
      token: correctEntry.token,
      label: displaySound(correctEntry.sound),
      kind: "letter",
    },
  ];

  for (const candidate of pool) {
    if (options.length >= TARGET_OPTION_COUNT) {
      break;
    }
    if (options.some((option) => option.id === candidate.token)) {
      continue;
    }
    const selectedTokens = options.map((option) => option.token);
    if (hasConflict(candidate.token, selectedTokens)) {
      continue;
    }
    options.push({
      id: candidate.token,
      token: candidate.token,
      label: displaySound(candidate.sound),
      kind: "letter",
    });
  }

  return shuffle(options.slice(0, Math.max(MIN_OPTION_COUNT, Math.min(TARGET_OPTION_COUNT, options.length))));
}

function pickImageOptions(correctEntry) {
  const pool = currentEntries().filter((entry) => entry.id !== correctEntry.id);
  shuffle(pool);

  const options = [
    { id: correctEntry.id, token: correctEntry.token, setId: correctEntry.setId, file: correctEntry.file, kind: "image" },
  ];

  for (const candidate of pool) {
    if (options.length >= TARGET_OPTION_COUNT) {
      break;
    }
    if (options.some((option) => option.id === candidate.id)) {
      continue;
    }
    const selectedTokens = options.map((option) => option.token);
    if (hasConflict(candidate.token, selectedTokens)) {
      continue;
    }
    options.push({
      id: candidate.id,
      token: candidate.token,
      setId: candidate.setId,
      file: candidate.file,
      kind: "image",
    });
  }

  return shuffle(options.slice(0, Math.max(MIN_OPTION_COUNT, Math.min(TARGET_OPTION_COUNT, options.length))));
}

function buildOptionsForTask(entry) {
  if (state.gameMode === GAME_MODE.IMAGE_TO_SOUND || state.gameMode === GAME_MODE.SOUND_TO_LETTER) {
    return pickLetterOptions(entry);
  }
  if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER) {
    return state.tripleStep === "image" ? pickImageOptions(entry) : pickLetterOptions(entry);
  }
  return pickImageOptions(entry);
}

function resetFeedbackForMode() {
  if (state.gameMode === GAME_MODE.IMAGE_TO_SOUND) {
    state.feedback = "Wähle den passenden Buchstaben zum Bild.";
  } else if (state.gameMode === GAME_MODE.SOUND_TO_LETTER) {
    state.feedback = "Tippe auf den Lautsprecher und wähle dann den passenden Buchstaben.";
  } else if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER) {
    state.feedback =
      state.tripleStep === "image"
        ? "Drücke auf den Lautsprecher und tippe zuerst das passende Bild."
        : "Sehr gut. Wähle jetzt den passenden Buchstaben.";
  } else {
    state.feedback = "Tippe auf den Lautsprecher und wähle dann das passende Bild.";
  }
  state.feedbackKind = "";
}

function beginRound() {
  state.phase = "play";
  state.tasks = buildRoundTasks();
  state.taskIndex = 0;
  state.correct = 0;
  state.attempts = 0;
  state.wrong = 0;
  loadTask();
}

function loadTask() {
  stopAudio();
  state.tripleStep = "image";
  state.current = state.tasks[state.taskIndex];
  state.options = buildOptionsForTask(state.current);
  resetFeedbackForMode();
  state.selected = "";
  state.wrongSelections = new Set();
  state.locked = false;
  render();
}

function finishRound() {
  stopAudio();
  state.phase = "result";
  render();
}

function goToNextTask() {
  if (state.taskIndex + 1 >= TASKS_PER_ROUND) {
    finishRound();
    return;
  }

  state.taskIndex += 1;
  loadTask();
}

function progressSegments() {
  return Array.from({ length: TASKS_PER_ROUND }, (_, index) => {
    let status = "";
    if (index < state.taskIndex) {
      status = "done";
    } else if (index === state.taskIndex && state.phase === "play") {
      status = "current";
    }
    return `<div class="progress-segment ${status}"></div>`;
  }).join("");
}

function wheelOptions() {
  const radius = 42;
  const center = 50;
  const total = state.options.length;

  return state.options
    .map((option, index) => {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const isWrong = state.wrongSelections.has(option.id);
      const isCorrect = state.selected === option.id;
      const classes = [option.kind === "image" ? "image-option-btn" : "letter-btn"];

      if (isWrong) {
        classes.push("wrong");
      }
      if (isCorrect) {
        classes.push("correct");
      }

      const content =
        option.kind === "image"
          ? `<img src="${pathForImage(option.setId, option.file)}" alt="Antwortbild" loading="lazy" decoding="async" />`
          : option.label;

      return `
        <button
          type="button"
          class="${classes.join(" ")}"
          style="left:${x}%; top:${y}%;"
          data-answer-id="${option.id}"
          aria-label="Antwort ${option.kind === "image" ? "Bild" : option.label}"
          ${state.locked ? "disabled" : ""}
        >
          ${content}
        </button>
      `;
    })
    .join("");
}

function centerContent() {
  if (state.gameMode === GAME_MODE.IMAGE_TO_SOUND) {
    return `
      <div class="image-center">
        <img src="${pathForImage(state.current.setId, state.current.file)}" alt="Bild für den Laut ${state.current.sound}" />
      </div>
    `;
  }

  return `
    <button type="button" class="speaker-center-btn" id="play-sound-btn" aria-label="Laut abspielen">
      <span aria-hidden="true">🔊</span>
    </button>
  `;
}

function modeButtons() {
  return `
    <div class="mode-row" aria-label="Modusauswahl">
      <button type="button" class="${state.gameMode === GAME_MODE.IMAGE_TO_SOUND ? "active" : ""}" data-set-mode="${GAME_MODE.IMAGE_TO_SOUND}">Bild → Buchstabe</button>
      <button type="button" class="${state.gameMode === GAME_MODE.SOUND_TO_IMAGE ? "active" : ""}" data-set-mode="${GAME_MODE.SOUND_TO_IMAGE}">Laut → Bild</button>
      <button type="button" class="${state.gameMode === GAME_MODE.SOUND_TO_LETTER ? "active" : ""}" data-set-mode="${GAME_MODE.SOUND_TO_LETTER}">Laut → Buchstabe</button>
      <button type="button" class="${state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER ? "active" : ""}" data-set-mode="${GAME_MODE.SOUND_TO_IMAGE_TO_LETTER}">Laut → Bild → Buchstabe</button>
    </div>
    <div class="mode-row" aria-label="Inhaltsauswahl">
      <button type="button" class="${state.contentScope === CONTENT_SCOPE.ANLAUTE_ONLY ? "active" : ""}" data-content-scope="${CONTENT_SCOPE.ANLAUTE_ONLY}">nur Anlaute</button>
      <button type="button" class="${state.contentScope === CONTENT_SCOPE.ALL ? "active" : ""}" data-content-scope="${CONTENT_SCOPE.ALL}">Anlaute und Inlaute</button>
    </div>
  `;
}

function playView() {
  let title = "Welches Bild passt zum Laut?";
  let hint = "Drücke auf den Lautsprecher und tippe das richtige Bild.";
  if (state.gameMode === GAME_MODE.IMAGE_TO_SOUND) {
    title = "Welcher Buchstabe passt zum Bild?";
    hint = "Wähle den richtigen Buchstaben.";
  } else if (state.gameMode === GAME_MODE.SOUND_TO_LETTER) {
    title = "Welcher Buchstabe passt zum Laut?";
    hint = "Drücke auf den Lautsprecher und tippe den richtigen Buchstaben.";
  } else if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER) {
    title =
      state.tripleStep === "image"
        ? "Laut → Bild → Buchstabe"
        : "Laut → Bild → Buchstabe (2/2)";
    hint =
      state.tripleStep === "image"
        ? "Schritt 1: Drücke auf den Lautsprecher und wähle das passende Bild."
        : "Schritt 2: Wähle jetzt den passenden Buchstaben.";
  }

  return `
    <section class="panel anlaute-layout" aria-label="Anlaute">
      <div class="anlaute-top">
        <h2>${title}</h2>
        <p class="hint">${hint}</p>
      </div>

      ${modeButtons()}

      <div class="progress-wrap" aria-label="Fortschritt">
        <div class="progress-label">Aufgabe ${state.taskIndex + 1}/${TASKS_PER_ROUND}</div>
        <div class="progress-track">${progressSegments()}</div>
      </div>

      <div class="stage">
        <section class="letter-wheel" aria-label="Antwortmöglichkeiten rund um die Mitte">
          ${centerContent()}
          ${wheelOptions()}
        </section>

        <aside class="panel side-panel" aria-label="Rückmeldung">
          <div class="stats-row">
            <div class="pill">Richtig: ${state.correct}</div>
            <div class="pill">Fehler: ${state.wrong}</div>
            <div class="pill">Versuche: ${state.attempts}</div>
          </div>
          <div class="feedback-text ${state.feedbackKind}">${state.feedback}</div>
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
        <button id="again-btn" class="primary" type="button">Neue Runde</button>
      </div>
    </section>
  `;
}

function render() {
  root.innerHTML = state.phase === "result" ? resultView() : playView();
  bindEvents();
}

function stopAudio() {
  if (!state.audio) {
    return;
  }
  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio = null;
}

function playCurrentSound() {
  if (!state.current || state.phase !== "play") {
    return;
  }

  const soundFile = resolveSoundFile(state.current);
  if (!soundFile) {
    state.feedback = "Für dieses Bild wurde keine Tondatei gefunden.";
    state.feedbackKind = "feedback-bad";
    render();
    return;
  }

  stopAudio();
  state.audio = new Audio(pathForSound(state.current.setId, soundFile));
  state.audio.play().catch(() => {
    state.feedback = "Der Ton konnte nicht abgespielt werden.";
    state.feedbackKind = "feedback-bad";
    render();
  });
}

function expectedAnswerId() {
  if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE) {
    return state.current.id;
  }
  if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER) {
    return state.tripleStep === "image" ? state.current.id : state.current.token;
  }
  return state.current.token;
}

function onGuess(answerId) {
  if (state.locked || !state.current || state.phase !== "play") {
    return;
  }

  state.attempts += 1;

  if (state.gameMode === GAME_MODE.SOUND_TO_IMAGE_TO_LETTER && state.tripleStep === "image") {
    if (answerId === state.current.id) {
      state.selected = answerId;
      state.feedback = "Richtiges Bild. Jetzt den Buchstaben wählen.";
      state.feedbackKind = "feedback-ok";
      state.tripleStep = "letter";
      state.wrongSelections = new Set();
      state.options = buildOptionsForTask(state.current);
      render();
      return;
    }

    state.wrong += 1;
    state.wrongSelections.add(answerId);
    state.feedback = "Noch nicht. Höre den Laut erneut und suche das passende Bild.";
    state.feedbackKind = "feedback-bad";
    render();
    return;
  }

  if (answerId === expectedAnswerId()) {
    state.selected = answerId;
    state.correct += 1;
    state.locked = true;
    state.feedback = "Richtig!";
    state.feedbackKind = "feedback-ok";
    render();
    window.setTimeout(goToNextTask, 800);
    return;
  }

  state.wrong += 1;
  state.wrongSelections.add(answerId);
  state.feedback = "Noch nicht. Versuche es nochmal.";
  state.feedbackKind = "feedback-bad";
  render();
}

function onSetMode(mode) {
  if (!mode || mode === state.gameMode) {
    return;
  }
  stopAudio();
  state.gameMode = mode;
  beginRound();
}

function onSetContentScope(contentScope) {
  if (!contentScope || contentScope === state.contentScope) {
    return;
  }
  stopAudio();
  state.contentScope = contentScope;
  beginRound();
}

function bindEvents() {
  if (state.phase === "result") {
    root.querySelector("#again-btn")?.addEventListener("click", beginRound);
    return;
  }

  root.querySelector("#play-sound-btn")?.addEventListener("click", playCurrentSound);

  root.querySelectorAll("[data-answer-id]").forEach((button) => {
    button.addEventListener("click", () => onGuess(button.dataset.answerId));
  });

  root.querySelectorAll("[data-set-mode]").forEach((button) => {
    button.addEventListener("click", () => onSetMode(button.dataset.setMode));
  });

  root.querySelectorAll("[data-content-scope]").forEach((button) => {
    button.addEventListener("click", () => onSetContentScope(button.dataset.contentScope));
  });
}

beginRound();
