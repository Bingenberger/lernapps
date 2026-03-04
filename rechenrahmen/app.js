const ROD_WIDTH = 640;
const BEAD_SIZE = 40;
const TOTAL_BEADS = 10;

let currentMode = "normal";
let targetValue = 0;
let blitzValue = 0;
let blitzRevealMs = 1500;
let blitzRevealTimer = null;
let state = { upper: 0, lower: 0 };
let beadPositions = {
  upper: Array(10).fill(0),
  lower: Array(10).fill(0),
};

const counter = document.getElementById("counter");
const feedback = document.getElementById("feedback");
const targetDisplay = document.getElementById("target-display");
const targetNum = document.getElementById("target-num");
const blitzDisplay = document.getElementById("blitz-display");
const blitzPrompt = document.getElementById("blitz-prompt");
const blitzAnswerGrid = document.getElementById("blitz-answer-grid");
const blitzSpeed = document.getElementById("blitz-speed");
const frameElement = document.querySelector(".frame");

function init() {
  createBlitzAnswerButtons();
  bindBlitzSpeedButtons();
  bindModeButtons();
  createBeads("upper");
  createBeads("lower");
  setMode("normal");
}

function bindModeButtons() {
  document.querySelectorAll(".menu button[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode);
    });
  });
}

function createBeads(rodKey) {
  const container = document.getElementById(`rod-${rodKey}`);
  for (let i = 0; i < TOTAL_BEADS; i += 1) {
    const bead = document.createElement("div");
    bead.className = `bead ${i < 5 ? "blue" : "red"}`;
    bead.dataset.index = i;
    bead.dataset.rod = rodKey;

    const pos = ROD_WIDTH - (TOTAL_BEADS - i) * BEAD_SIZE;
    beadPositions[rodKey][i] = pos;
    bead.style.left = `${pos}px`;

    bead.addEventListener("pointerdown", startDrag);
    container.appendChild(bead);
  }
}

let dragTarget = null;
let startMouseX = 0;
let startBeadX = 0;

function startDrag(event) {
  dragTarget = event.target;
  if (currentMode === "blitz") {
    dragTarget = null;
    return;
  }
  const rod = dragTarget.dataset.rod;
  if (rod === "lower" && state.upper < 10) {
    dragTarget = null;
    return;
  }

  dragTarget.classList.remove("snapping");
  startMouseX = event.clientX;
  startBeadX = beadPositions[rod][Number.parseInt(dragTarget.dataset.index, 10)];

  dragTarget.setPointerCapture(event.pointerId);
  dragTarget.addEventListener("pointermove", doDrag);
  dragTarget.addEventListener("pointerup", stopDrag);
}

function doDrag(event) {
  if (!dragTarget) {
    return;
  }

  const rod = dragTarget.dataset.rod;
  const idx = Number.parseInt(dragTarget.dataset.index, 10);
  const dx = event.clientX - startMouseX;
  let newX = startBeadX + dx;

  const minAllowed = idx * BEAD_SIZE;
  const maxAllowed = ROD_WIDTH - (10 - idx) * BEAD_SIZE;
  newX = Math.max(minAllowed, Math.min(maxAllowed, newX));

  beadPositions[rod][idx] = newX;
  pushNeighbors(rod, idx);
  renderPositions(rod);
}

function pushNeighbors(rod, idx) {
  for (let i = idx - 1; i >= 0; i -= 1) {
    if (beadPositions[rod][i] > beadPositions[rod][i + 1] - BEAD_SIZE) {
      beadPositions[rod][i] = beadPositions[rod][i + 1] - BEAD_SIZE;
    }
  }
  for (let i = idx + 1; i < 10; i += 1) {
    if (beadPositions[rod][i] < beadPositions[rod][i - 1] + BEAD_SIZE) {
      beadPositions[rod][i] = beadPositions[rod][i - 1] + BEAD_SIZE;
    }
  }
}

function stopDrag(event) {
  if (!dragTarget) {
    return;
  }

  const rod = dragTarget.dataset.rod;
  const idx = Number.parseInt(dragTarget.dataset.index, 10);

  const leftEndPos = idx * BEAD_SIZE;
  const rightEndPos = ROD_WIDTH - (10 - idx) * BEAD_SIZE;
  const currentX = beadPositions[rod][idx];

  const leftCount =
    Math.abs(currentX - leftEndPos) < Math.abs(currentX - rightEndPos) ? idx + 1 : idx;

  state[rod] = leftCount;
  snapToState(rod);

  dragTarget.releasePointerCapture(event.pointerId);
  dragTarget.removeEventListener("pointermove", doDrag);
  dragTarget.removeEventListener("pointerup", stopDrag);
  dragTarget = null;

  updateUI();
}

function snapToState(rod) {
  const count = state[rod];
  for (let i = 0; i < 10; i += 1) {
    const bead = document.querySelector(`[data-rod="${rod}"][data-index="${i}"]`);
    bead.classList.add("snapping");
    beadPositions[rod][i] = i < count ? i * BEAD_SIZE : ROD_WIDTH - (10 - i) * BEAD_SIZE;
    bead.style.left = `${beadPositions[rod][i]}px`;
  }
}

function renderPositions(rod) {
  for (let i = 0; i < 10; i += 1) {
    const bead = document.querySelector(`[data-rod="${rod}"][data-index="${i}"]`);
    bead.style.left = `${beadPositions[rod][i]}px`;
  }
}

function updateUI() {
  const total = state.upper + state.lower;
  counter.querySelector("span").innerText = total;

  const lowerRod = document.getElementById("rod-lower");
  if (state.upper < 10) {
    lowerRod.classList.add("locked");
    if (state.lower > 0) {
      state.lower = 0;
      snapToState("lower");
    }
  } else {
    lowerRod.classList.remove("locked");
  }

  if (currentMode === "target") {
    if (total === targetValue) {
      feedback.innerText = "Klasse! Das stimmt! 🎉";
      setTimeout(newTarget, 1500);
    } else {
      feedback.innerText = "";
    }
  } else if (currentMode === "blitz") {
    feedback.innerText = "";
  }
}

function setMode(mode) {
  clearBlitzTimer();
  currentMode = mode;
  document.querySelectorAll(".menu button").forEach((button) => button.classList.remove("active"));
  document.getElementById(`btn-${mode}`).classList.add("active");

  counter.classList.remove("hidden-val");
  frameElement.classList.remove("blitz-obscured");
  targetDisplay.hidden = true;
  setBlitzUiVisible(false);
  setBlitzAnswerButtonsDisabled(true);
  feedback.innerText = "";
  counter.onclick = null;

  if (mode === "hide") {
    counter.classList.add("hidden-val");
    counter.onclick = () => counter.classList.toggle("hidden-val");
  } else if (mode === "target") {
    targetDisplay.hidden = false;
    newTarget();
  } else if (mode === "blitz") {
    counter.classList.add("hidden-val");
    setBlitzUiVisible(true);
  }

  state.upper = 0;
  state.lower = 0;
  snapToState("upper");
  snapToState("lower");
  updateUI();

  if (mode === "blitz") {
    startBlitzRound();
  }
}

function setBlitzUiVisible(visible) {
  blitzDisplay.hidden = !visible;
  blitzSpeed.hidden = !visible;
  blitzAnswerGrid.hidden = !visible;
  blitzDisplay.style.display = visible ? "block" : "none";
  blitzSpeed.style.display = visible ? "flex" : "none";
  blitzAnswerGrid.style.display = visible ? "grid" : "none";
}

function setTotalOnFrame(total) {
  state.upper = Math.min(10, total);
  state.lower = Math.max(0, total - 10);
  snapToState("upper");
  snapToState("lower");
}

function newTarget() {
  if (currentMode !== "target") {
    return;
  }
  let next;
  do {
    next = Math.floor(Math.random() * 21);
  } while (next === targetValue);
  targetValue = next;
  targetNum.innerText = targetValue;
  feedback.innerText = "";
}

function clearBlitzTimer() {
  if (blitzRevealTimer) {
    clearTimeout(blitzRevealTimer);
    blitzRevealTimer = null;
  }
}

function setBlitzAnswerButtonsDisabled(disabled) {
  blitzAnswerGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function createBlitzAnswerButtons() {
  blitzAnswerGrid.innerHTML = "";
  for (let value = 0; value <= 20; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.innerText = value;
    button.disabled = true;
    button.addEventListener("click", () => handleBlitzAnswer(value));
    blitzAnswerGrid.appendChild(button);
  }
}

function bindBlitzSpeedButtons() {
  blitzSpeed.querySelectorAll("button[data-blitz-ms]").forEach((button) => {
    button.addEventListener("click", () => {
      blitzRevealMs = Number.parseInt(button.dataset.blitzMs, 10);
      blitzSpeed.querySelectorAll("button[data-blitz-ms]").forEach((other) => {
        other.classList.toggle("active", other === button);
      });
    });
  });
}

function startBlitzRound() {
  if (currentMode !== "blitz") {
    return;
  }

  clearBlitzTimer();
  frameElement.classList.remove("blitz-obscured");
  let next;
  do {
    next = Math.floor(Math.random() * 21);
  } while (next === blitzValue);

  blitzValue = next;
  setTotalOnFrame(blitzValue);
  counter.classList.add("hidden-val");
  blitzPrompt.innerText = `Merke dir die Zahl! (${Math.round(blitzRevealMs / 100) / 10} s)`;
  feedback.innerText = "";
  setBlitzAnswerButtonsDisabled(true);

  blitzRevealTimer = setTimeout(() => {
    blitzRevealTimer = null;
    if (currentMode !== "blitz") {
      return;
    }
    frameElement.classList.add("blitz-obscured");
    blitzPrompt.innerText = "Welche Zahl war zu sehen?";
    setBlitzAnswerButtonsDisabled(false);
  }, blitzRevealMs);
}

function handleBlitzAnswer(value) {
  if (currentMode !== "blitz") {
    return;
  }

  setBlitzAnswerButtonsDisabled(true);
  if (value === blitzValue) {
    feedback.innerText = "Richtig! Sehr gut 👏";
  } else {
    feedback.innerText = `Fast! Richtig war ${blitzValue}.`;
  }

  setTimeout(() => {
    if (currentMode === "blitz") {
      startBlitzRound();
    }
  }, 1200);
}

init();
