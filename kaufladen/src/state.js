import {
  APP_PHASE,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  TASKS_PER_SESSION,
  TASK_MODE,
  getDefaultPriceFormat,
  isPriceFormatAllowed,
} from "./config.js";
import { makeTask } from "./generator.js";

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

export function loadSettings() {
  const saved = loadJSON(STORAGE_KEYS.settings);
  const merged = { ...DEFAULT_SETTINGS, ...(saved || {}) };

  if (!isPriceFormatAllowed(merged.numberSpace, merged.priceFormat)) {
    merged.priceFormat = getDefaultPriceFormat(merged.numberSpace);
  }

  return merged;
}

export function createInitialState() {
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

export function updateSettings(state, partialSettings) {
  state.settings = { ...state.settings, ...partialSettings };
  if (!isPriceFormatAllowed(state.settings.numberSpace, state.settings.priceFormat)) {
    state.settings.priceFormat = getDefaultPriceFormat(state.settings.numberSpace);
  }
  saveJSON(STORAGE_KEYS.settings, state.settings);
}

export function startSession(state) {
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

export function setPhase(state, phase) {
  state.phase = phase;
}

export function saveStats(state) {
  saveJSON(STORAGE_KEYS.stats, state.stats);
}

export function clearCurrentSelections(state) {
  state.paymentSelections = [];
  state.changeSelections = [];
  state.feedback = "";
  state.awaitingNext = false;
}

export function addSelection(state, zone, value) {
  if (zone === "payment") {
    state.paymentSelections.push(value);
    return;
  }
  state.changeSelections.push(value);
}

export function removeSelection(state, zone, index) {
  if (zone === "payment") {
    state.paymentSelections.splice(index, 1);
    return;
  }
  state.changeSelections.splice(index, 1);
}

export function nextTask(state) {
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

export function getInstruction(state, formatEUR) {
  const task = state.currentTask;
  if (!task) {
    return "";
  }

  if (task.mode === TASK_MODE.PAY_EXACT && state.phase === APP_PHASE.TASK_PAY) {
    return "Bezahle den Preis passend.";
  }

  if (task.mode === TASK_MODE.CHANGE && state.phase === APP_PHASE.TASK_PAY) {
    return `Bezahle mit ${formatEUR(task.suggestedPaymentCents, state.settings.priceFormat)}.`;
  }

  if (task.mode === TASK_MODE.CHANGE && state.phase === APP_PHASE.TASK_CHANGE) {
    return `Du hast mit ${formatEUR(
      task.suggestedPaymentCents,
      state.settings.priceFormat,
    )} bezahlt. Rückgeld: ${formatEUR(task.correctChangeCents, state.settings.priceFormat)}. Lege das Rückgeld.`;
  }

  return "";
}
