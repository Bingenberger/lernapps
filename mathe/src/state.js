import {
  DEFAULT_SETTINGS,
  GAME_PHASE,
  STORAGE_KEYS,
  TASKS_PER_ROUND,
} from "./config.js";
import { generateTask } from "./game-logic.js";

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
    // ignore storage errors
  }
}

export function createInitialState() {
  return {
    phase: GAME_PHASE.MENU,
    settings: { ...DEFAULT_SETTINGS, ...(loadJSON(STORAGE_KEYS.settings) || {}) },
    taskIndex: 0,
    score: 0,
    progress: 0,
    attempts: 0,
    wrong: 0,
    status: "idle",
    inputValue: null,
    showHint: false,
    feedback: "",
    awaitingNext: false,
    smartTimerMs: 4000,
    isFrameVisible: true,
    currentTask: null,
  };
}

export function updateSettings(state, partial) {
  state.settings = { ...state.settings, ...partial };
  saveJSON(STORAGE_KEYS.settings, state.settings);
}

export function startRound(state) {
  state.phase = GAME_PHASE.PLAYING;
  state.taskIndex = 0;
  state.score = 0;
  state.progress = 0;
  state.attempts = 0;
  state.wrong = 0;
  state.status = "idle";
  state.inputValue = null;
  state.showHint = false;
  state.feedback = "";
  state.awaitingNext = false;
  state.smartTimerMs = 4000;
  state.isFrameVisible = true;
  state.currentTask = generateTask(null, state.settings.levelMode);
}

export function returnToMenu(state) {
  state.phase = GAME_PHASE.MENU;
  state.status = "idle";
  state.inputValue = null;
  state.showHint = false;
  state.feedback = "";
  state.awaitingNext = false;
  state.isFrameVisible = true;
}

export function setInputValue(state, value) {
  state.inputValue = value;
}

export function submitAnswer(state, value) {
  if (state.phase !== GAME_PHASE.PLAYING || !state.currentTask || state.awaitingNext) {
    return;
  }

  state.inputValue = value;
  state.attempts += 1;

  if (value === state.currentTask.solution) {
    state.status = "success";
    state.showHint = false;
    state.awaitingNext = true;
    state.score += 1;
    state.progress = Math.min(TASKS_PER_ROUND, state.progress + 1);
    state.feedback = state.progress >= TASKS_PER_ROUND
      ? "Super! Runde geschafft. Ergebnis ansehen."
      : "Richtig! Nächste Aufgabe kommt automatisch.";

    if (state.settings.difficulty === "smart") {
      state.smartTimerMs = Math.max(0, state.smartTimerMs - 500);
    }
    return;
  }

  state.status = "error";
  state.showHint = true;
  state.awaitingNext = false;
  state.wrong += 1;
  state.feedback = "Noch nicht richtig. Tipp: Schau auf die Aufgabe und das Zehnerfeld.";

  if (state.settings.difficulty === "smart") {
    state.smartTimerMs = Math.min(5000, state.smartTimerMs + 1000);
  }
}

export function clearCurrentInput(state) {
  const wasError = state.status === "error";
  state.status = "idle";
  state.inputValue = null;
  state.feedback = "";
  if (!wasError) {
    state.showHint = false;
  }
}

export function resetAfterError(state) {
  if (state.awaitingNext) {
    return;
  }
  state.status = "idle";
  state.inputValue = null;
  state.showHint = false;
  state.feedback = "";
}

export function clearStatus(state) {
  state.status = "idle";
}

export function advanceTask(state) {
  if (!state.awaitingNext) {
    return;
  }

  if (state.progress >= TASKS_PER_ROUND) {
    state.phase = GAME_PHASE.RESULT;
    state.awaitingNext = false;
    return;
  }

  const previousTask = state.currentTask;
  state.taskIndex += 1;
  state.currentTask = generateTask(previousTask, state.settings.levelMode);
  state.status = "idle";
  state.inputValue = null;
  state.showHint = false;
  state.feedback = "";
  state.awaitingNext = false;
  state.isFrameVisible = true;
}

export function restartRound(state) {
  startRound(state);
}

export function setFrameVisible(state, visible) {
  state.isFrameVisible = Boolean(visible);
}
