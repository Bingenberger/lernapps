import { APP_PHASE, TASK_MODE } from "./config.js";
import { formatEUR, sumCents } from "./money.js";
import {
  createInitialState,
  updateSettings,
  startSession,
  clearCurrentSelections,
  addSelection,
  removeSelection,
  nextTask,
  setPhase,
} from "./state.js";
import { renderApp, bindSetupEvents, bindTaskEvents, bindResultEvents } from "./ui.js";

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
    note(523.25, 0.0, 0.12, "triangle", 0.05);
    note(659.25, 0.1, 0.14, "triangle", 0.055);
    note(783.99, 0.22, 0.18, "triangle", 0.06);
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

function rerender() {
  renderApp(root, state);

  if (state.phase === APP_PHASE.SETUP) {
    bindSetupEvents(root, state, {
      onHome() {
        clearAutoNextTimer();
        setPhase(state, APP_PHASE.SETUP);
        clearCurrentSelections(state);
        rerender();
      },
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
      onHome() {
        clearAutoNextTimer();
        setPhase(state, APP_PHASE.SETUP);
        clearCurrentSelections(state);
        rerender();
      },
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
    onHome() {
      clearAutoNextTimer();
      setPhase(state, APP_PHASE.SETUP);
      clearCurrentSelections(state);
      rerender();
    },
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
      const zone = state.phase === APP_PHASE.TASK_CHANGE ? "change" : "payment";
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
    onNext() {
      clearAutoNextTimer();
      nextTask(state);
      rerender();
    },
  });

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
      registerWrongAttempt(`Es fehlen noch ${formatEUR(diff, state.settings.priceFormat)}. Tipp: Ergänze bis zum Preis.`);
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

rerender();
