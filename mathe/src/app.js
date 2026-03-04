import { GAME_PHASE } from "./config.js";
import {
  advanceTask,
  clearStatus,
  createInitialState,
  restartRound,
  returnToMenu,
  setFrameVisible,
  startRound,
  submitAnswer,
  updateSettings,
} from "./state.js";
import { playSound } from "./sound.js";
import { bindMenuEvents, bindPlayingEvents, bindResultEvents, renderApp } from "./ui.js";

const root = document.getElementById("app");
const state = createInitialState();
let frameHideTimeoutId = null;
let frameVisibilityKey = "";
let statusResetTimeoutId = null;
let autoNextTimeoutId = null;

function clearStatusResetTimer() {
  if (statusResetTimeoutId) {
    clearTimeout(statusResetTimeoutId);
    statusResetTimeoutId = null;
  }
}

function clearFrameHideTimer() {
  if (frameHideTimeoutId) {
    clearTimeout(frameHideTimeoutId);
    frameHideTimeoutId = null;
  }
}

function clearAutoNextTimer() {
  if (autoNextTimeoutId) {
    clearTimeout(autoNextTimeoutId);
    autoNextTimeoutId = null;
  }
}

function syncFrameVisibility() {
  if (state.phase !== GAME_PHASE.PLAYING || !state.currentTask) {
    clearFrameHideTimer();
    clearAutoNextTimer();
    frameVisibilityKey = "";
    return false;
  }

  const difficulty = state.settings.difficulty;
  const nextKey = `${state.taskIndex}:${state.currentTask.id}:${difficulty}`;
  if (nextKey === frameVisibilityKey) {
    return false;
  }

  frameVisibilityKey = nextKey;
  clearFrameHideTimer();

  if (difficulty === "hard") {
    if (state.isFrameVisible) {
      setFrameVisible(state, false);
      return true;
    }
    return false;
  }

  let changed = false;
  if (!state.isFrameVisible) {
    setFrameVisible(state, true);
    changed = true;
    if (difficulty !== "medium" && difficulty !== "smart") {
      return true;
    }
  }

  if (difficulty === "medium" || difficulty === "smart") {
    const delay = difficulty === "medium" ? 4000 : Math.max(0, state.smartTimerMs);
    frameHideTimeoutId = setTimeout(() => {
      if (state.phase !== GAME_PHASE.PLAYING) {
        return;
      }
      if (!state.currentTask) {
        return;
      }
      const currentKey = `${state.taskIndex}:${state.currentTask.id}:${state.settings.difficulty}`;
      if (currentKey !== nextKey) {
        return;
      }
      if (!state.isFrameVisible) {
        return;
      }
      setFrameVisible(state, false);
      rerender();
    }, delay);
  }

  return changed;
}

function rerender() {
  renderApp(root, state);

  if (syncFrameVisibility()) {
    rerender();
    return;
  }

  if (state.phase === GAME_PHASE.MENU) {
    bindMenuEvents(root, {
      onSettingChange(partial) {
        playSound(state.settings.soundsEnabled, "tap");
        updateSettings(state, partial);
        rerender();
      },
      onStart() {
        playSound(state.settings.soundsEnabled, "tap");
        clearAutoNextTimer();
        startRound(state);
        rerender();
      },
    });
    return;
  }

  if (state.phase === GAME_PHASE.RESULT) {
    bindResultEvents(root, {
      onAgain() {
        playSound(state.settings.soundsEnabled, "tap");
        clearStatusResetTimer();
        clearFrameHideTimer();
        clearAutoNextTimer();
        restartRound(state);
        rerender();
      },
      onBackSettings() {
        playSound(state.settings.soundsEnabled, "tap");
        clearStatusResetTimer();
        clearFrameHideTimer();
        clearAutoNextTimer();
        returnToMenu(state);
        rerender();
      },
    });
    return;
  }

  bindPlayingEvents(root, {
    onBack() {
      playSound(state.settings.soundsEnabled, "tap");
      returnToMenu(state);
      clearFrameHideTimer();
      clearStatusResetTimer();
      clearAutoNextTimer();
      rerender();
    },
    onInput(value) {
      playSound(state.settings.soundsEnabled, "tap");
      const prevStatus = state.status;
      submitAnswer(state, value);

      clearStatusResetTimer();
      if (state.status === "success" && prevStatus !== "success") {
        playSound(state.settings.soundsEnabled, state.progress >= 10 ? "roundDone" : "success");
        clearAutoNextTimer();
        autoNextTimeoutId = setTimeout(() => {
          autoNextTimeoutId = null;
          advanceTask(state);
          rerender();
        }, 850);
        statusResetTimeoutId = setTimeout(() => {
          if (state.status !== "success") {
            return;
          }
          clearStatus(state);
          rerender();
        }, 900);
      } else if (state.status === "error" && prevStatus !== "error") {
        playSound(state.settings.soundsEnabled, "error");
        statusResetTimeoutId = setTimeout(() => {
          if (state.status !== "error" || state.awaitingNext) {
            return;
          }
          clearStatus(state);
          rerender();
        }, 900);
      }

      rerender();
    },
  });
}

rerender();
