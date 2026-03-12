const FIGURES_PER_LEVEL = 50;

const LEVEL_SPECS = {
  3: {
    label: "3x3-Raster",
    size: 3,
    seed: 303,
    figures: [
      { id: "3-a", points: [[0, 0], [0, 2], [1, 1], [2, 2]] },
      { id: "3-b", points: [[0, 1], [1, 0], [2, 1], [1, 2]] },
      { id: "3-c", points: [[0, 0], [0, 2], [2, 2], [2, 0]], closed: true },
      { id: "3-d", points: [[0, 0], [1, 0], [1, 2], [2, 2]] },
      { id: "3-e", points: [[0, 2], [1, 0], [2, 2]], closed: true },
      { id: "3-f", points: [[0, 0], [1, 1], [2, 0], [2, 2]] },
      { id: "3-g", points: [[0, 0], [2, 0], [1, 1], [2, 2]] },
      { id: "3-h", points: [[0, 1], [0, 2], [2, 2], [2, 1]], closed: true },
      { id: "3-i", points: [[0, 2], [1, 2], [2, 1], [2, 0]] },
      { id: "3-j", points: [[0, 0], [1, 1], [0, 2], [2, 2]], closed: true },
      { id: "3-k", points: [[0, 0], [1, 0], [2, 1], [2, 2]] },
      { id: "3-l", points: [[0, 1], [1, 1], [2, 0], [2, 2]] },
      { id: "3-m", points: [[0, 2], [0, 0], [1, 0], [2, 1]] },
      { id: "3-n", points: [[0, 0], [2, 0], [2, 2], [1, 1]], closed: true },
      { id: "3-o", points: [[0, 2], [1, 1], [2, 2], [2, 0]] },
    ],
  },
  4: {
    label: "4x4-Raster",
    size: 4,
    seed: 404,
    figures: [
      { id: "4-a", points: [[0, 0], [1, 1], [1, 3], [3, 2]] },
      { id: "4-b", points: [[0, 3], [1, 2], [2, 2], [3, 0]] },
      { id: "4-c", points: [[0, 3], [0, 1], [1, 0], [2, 1], [2, 3]], closed: true },
      { id: "4-d", points: [[0, 3], [0, 1], [2, 1], [2, 3]], closed: true },
      { id: "4-e", points: [[0, 2], [1, 1], [2, 3], [3, 2]] },
      { id: "4-f", points: [[0, 3], [1, 1], [2, 0], [3, 1], [3, 3]], closed: true },
      { id: "4-g", points: [[0, 0], [1, 0], [2, 2], [3, 2]] },
      { id: "4-h", points: [[0, 1], [1, 0], [2, 1], [2, 3], [0, 3]], closed: true },
      { id: "4-i", points: [[0, 0], [0, 2], [1, 3], [3, 3]] },
      { id: "4-j", points: [[0, 3], [1, 2], [1, 1], [3, 1], [3, 3]], closed: true },
      { id: "4-k", points: [[0, 0], [1, 1], [2, 1], [3, 3]] },
      { id: "4-l", points: [[0, 2], [1, 0], [2, 0], [3, 2], [3, 3]] },
      { id: "4-m", points: [[0, 3], [0, 0], [2, 0], [3, 1], [3, 3]], closed: true },
      { id: "4-n", points: [[0, 1], [1, 2], [2, 1], [3, 2]] },
      { id: "4-o", points: [[0, 0], [1, 0], [1, 2], [3, 2], [3, 3]] },
    ],
  },
  5: {
    label: "5x5-Raster",
    size: 5,
    seed: 505,
    figures: [
      { id: "5-a", points: [[0, 0], [1, 1], [1, 3], [3, 4], [4, 2]] },
      { id: "5-b", points: [[0, 4], [1, 2], [2, 2], [3, 0], [4, 1]] },
      { id: "5-c", points: [[0, 4], [0, 2], [2, 0], [4, 2], [4, 4]], closed: true },
      { id: "5-d", points: [[0, 4], [0, 2], [2, 2], [2, 0], [4, 2], [4, 4]], closed: true },
      { id: "5-e", points: [[0, 4], [0, 1], [2, 1], [2, 3], [4, 3], [4, 4]], closed: true },
      { id: "5-f", points: [[0, 3], [1, 2], [2, 4], [3, 3], [4, 1]] },
      { id: "5-g", points: [[0, 1], [1, 0], [3, 0], [4, 1], [4, 4], [0, 4]], closed: true },
      { id: "5-h", points: [[0, 0], [1, 2], [2, 1], [3, 3], [4, 2]] },
      { id: "5-i", points: [[0, 4], [1, 3], [2, 4], [3, 2], [4, 3]] },
      { id: "5-j", points: [[0, 4], [0, 1], [2, 1], [3, 0], [4, 1], [4, 4]], closed: true },
      { id: "5-k", points: [[0, 0], [1, 0], [2, 2], [3, 2], [4, 4]] },
      { id: "5-l", points: [[0, 4], [1, 4], [2, 2], [3, 1], [4, 1]] },
      { id: "5-m", points: [[0, 2], [1, 0], [3, 0], [4, 2], [4, 4], [0, 4]], closed: true },
      { id: "5-n", points: [[0, 1], [1, 2], [2, 1], [3, 2], [4, 1]] },
      { id: "5-o", points: [[0, 4], [1, 3], [1, 1], [3, 1], [3, 4], [4, 3]], closed: true },
    ],
  },
};

const LEVELS = Object.fromEntries(
  Object.entries(LEVEL_SPECS).map(([key, config]) => [
    key,
    {
      ...config,
      figures: generateFigurePool(config.size, config.figures, FIGURES_PER_LEVEL, config.seed),
    },
  ]),
);

const TASKS_PER_GAME = 10;

const state = {
  level: 3,
  roundFigures: [],
  lastRoundFigureIds: [],
  roundIndex: 0,
  outcomes: [],
  currentFigure: null,
  userSegments: [],
  activePoint: null,
  locked: false,
  autoNextTimer: 0,
  finished: false,
  feedback: "Verbinde im rechten Raster die gespiegelte Figur.",
  feedbackKind: "",
  stats: {
    correct: 0,
    wrong: 0,
    attempts: 0,
  },
};

const root = document.getElementById("game-root");

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let step = value;
    step = Math.imul(step ^ (step >>> 15), step | 1);
    step ^= step + Math.imul(step ^ (step >>> 7), step | 61);
    return ((step ^ (step >>> 14)) >>> 0) / 4294967296;
  };
}

function pointsBySize(size) {
  const points = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      points.push([x, y]);
    }
  }
  return points;
}

function neighborPoints(size, [x, y]) {
  const points = [];
  for (let nextY = 0; nextY < size; nextY += 1) {
    for (let nextX = 0; nextX < size; nextX += 1) {
      if (nextX === x && nextY === y) {
        continue;
      }
      if (Math.max(Math.abs(nextX - x), Math.abs(nextY - y)) === 1) {
        points.push([nextX, nextY]);
      }
    }
  }
  return points;
}

function figureSignature(figure) {
  const segments = [];
  for (let index = 1; index < figure.points.length; index += 1) {
    segments.push([figure.points[index - 1], figure.points[index]]);
  }
  if (figure.closed && figure.points.length >= 3) {
    segments.push([figure.points[figure.points.length - 1], figure.points[0]]);
  }
  const ids = segments.map(segmentId).sort();
  return `${figure.closed ? "c" : "o"}:${ids.join(",")}`;
}

function isUsableFigure(figure) {
  if (figure.points.length < 3) {
    return false;
  }

  const xValues = new Set(figure.points.map(([x]) => x));
  const yValues = new Set(figure.points.map(([, y]) => y));
  if (xValues.size < 2 || yValues.size < 2) {
    return false;
  }

  const segments = [];
  for (let index = 1; index < figure.points.length; index += 1) {
    segments.push([figure.points[index - 1], figure.points[index]]);
  }

  if (figure.closed) {
    if (figure.points.length < 3) {
      return false;
    }
    const start = figure.points[0];
    const end = figure.points[figure.points.length - 1];
    const closes = neighborPoints(
      Math.max(
        ...figure.points.map(([x]) => x),
        ...figure.points.map(([, y]) => y),
      ) + 1,
      end,
    ).some((point) => pointId(point) === pointId(start));
    if (!closes) {
      return false;
    }
    segments.push([end, start]);
  }

  const segmentIds = segments.map(segmentId);
  return new Set(segmentIds).size === segmentIds.length;
}

function buildRandomFigure(size, random) {
  const allPoints = pointsBySize(size);
  const closed = random() < 0.35;
  const targetLength = closed
    ? Math.min(size + 1, 3 + Math.floor(random() * 3))
    : Math.min(size + 2, 4 + Math.floor(random() * 3));
  const startPoint = allPoints[Math.floor(random() * allPoints.length)];
  const points = [startPoint];
  const used = new Set([pointId(startPoint)]);
  let guard = 0;

  while (points.length < targetLength && guard < 100) {
    guard += 1;
    const current = points[points.length - 1];
    let options = neighborPoints(size, current).filter((point) => !used.has(pointId(point)));

    if (closed && points.length >= targetLength - 1) {
      const start = points[0];
      options = options.filter((point) =>
        neighborPoints(size, point).some((entry) => pointId(entry) === pointId(start)),
      );
    }

    if (options.length === 0) {
      break;
    }

    const nextPoint = options[Math.floor(random() * options.length)];
    points.push(nextPoint);
    used.add(pointId(nextPoint));
  }

  return {
    points,
    closed,
  };
}

function generateFigurePool(size, presets, targetCount, seed) {
  const figures = presets.map((figure) => ({ ...figure, points: figure.points.map((point) => [...point]) }));
  const seen = new Set(figures.map(figureSignature));
  const random = createSeededRandom(seed);
  let nextId = 1;
  let guard = 0;

  while (figures.length < targetCount && guard < 200000) {
    guard += 1;
    const candidate = buildRandomFigure(size, random);
    if (!isUsableFigure(candidate)) {
      continue;
    }

    const signature = figureSignature(candidate);
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    figures.push({
      id: `${size}-auto-${String(nextId).padStart(2, "0")}`,
      points: candidate.points,
      ...(candidate.closed ? { closed: true } : {}),
    });
    nextId += 1;
  }

  return figures.slice(0, targetCount);
}

function sameIdOrder(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function pickRoundFigures(level) {
  const pool = LEVELS[level].figures;
  let candidate = shuffle(pool).slice(0, TASKS_PER_GAME);
  const previousIds = state.lastRoundFigureIds;

  if (pool.length > 1 && previousIds.length === candidate.length) {
    let guard = 0;
    while (sameIdOrder(candidate.map((figure) => figure.id), previousIds) && guard < 8) {
      candidate = shuffle(pool).slice(0, TASKS_PER_GAME);
      guard += 1;
    }
  }

  state.lastRoundFigureIds = candidate.map((figure) => figure.id);
  return candidate;
}

function pointId([x, y]) {
  return `${x}:${y}`;
}

function segmentId([start, end]) {
  const a = pointId(start);
  const b = pointId(end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function segmentsEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const leftIds = [...left.map(segmentId)].sort();
  const rightIds = [...right.map(segmentId)].sort();
  return leftIds.every((value, index) => value === rightIds[index]);
}

function mirrorPoint(size, [x, y]) {
  return [size - 1 - x, y];
}

function mirroredTarget() {
  const points = state.currentFigure.points.map((point) => mirrorPoint(state.level, point));
  const segments = [];

  for (let index = 1; index < points.length; index += 1) {
    segments.push([points[index - 1], points[index]]);
  }

  if (state.currentFigure.closed && points.length >= 3) {
    segments.push([points[points.length - 1], points[0]]);
  }

  return {
    points,
    segments,
    closed: Boolean(state.currentFigure.closed),
  };
}

function clearAutoNextTimer() {
  if (!state.autoNextTimer) {
    return;
  }
  window.clearTimeout(state.autoNextTimer);
  state.autoNextTimer = 0;
}

function loadRoundFigure() {
  state.currentFigure = state.roundFigures[state.roundIndex];
  state.userSegments = [];
  state.activePoint = null;
  state.locked = false;
  state.finished = false;
  state.feedback = "Verbinde im rechten Raster die gespiegelte Figur.";
  state.feedbackKind = "";
  render();
}

function startGame() {
  clearAutoNextTimer();
  state.roundFigures = pickRoundFigures(state.level);
  state.roundIndex = 0;
  state.outcomes = Array(TASKS_PER_GAME).fill("");
  state.stats.correct = 0;
  state.stats.wrong = 0;
  state.stats.attempts = 0;
  loadRoundFigure();
}

function setLevel(level) {
  clearAutoNextTimer();
  state.level = level;
  startGame();
}

function finishGame() {
  clearAutoNextTimer();
  state.finished = true;
  state.locked = true;
  state.feedback = "Die 10 Runden sind geschafft. Starte jetzt eine neue Runde.";
  state.feedbackKind = "feedback-ok";
  render();
}

function advanceFigure() {
  clearAutoNextTimer();
  if (state.roundIndex + 1 >= state.roundFigures.length) {
    finishGame();
    return;
  }
  state.roundIndex += 1;
  loadRoundFigure();
}

function pointPosition(size, [x, y]) {
  const padding = 16;
  const usable = 100 - padding * 2;
  const step = size === 1 ? 0 : usable / (size - 1);
  return {
    left: padding + x * step,
    top: padding + y * step,
  };
}

function linesMarkupFromPoints(points, size, className, closed = false) {
  if (points.length < 2) {
    return "";
  }

  const segments = points
    .slice(1)
    .map((point, index) => {
      const start = pointPosition(size, points[index]);
      const end = pointPosition(size, point);
      return `<line class="grid-line ${className}" x1="${start.left}%" y1="${start.top}%" x2="${end.left}%" y2="${end.top}%"></line>`;
    });

  if (closed && points.length >= 3) {
    const start = pointPosition(size, points[points.length - 1]);
    const end = pointPosition(size, points[0]);
    segments.push(
      `<line class="grid-line ${className}" x1="${start.left}%" y1="${start.top}%" x2="${end.left}%" y2="${end.top}%"></line>`,
    );
  }

  return segments.join("");
}

function linesMarkupFromSegments(segments, size, className) {
  return segments
    .map(([startPoint, endPoint]) => {
      const start = pointPosition(size, startPoint);
      const end = pointPosition(size, endPoint);
      return `<line class="grid-line ${className}" x1="${start.left}%" y1="${start.top}%" x2="${end.left}%" y2="${end.top}%"></line>`;
    })
    .join("");
}

function dotsMarkup(size, interactive) {
  const activePointId = interactive && state.activePoint ? pointId(state.activePoint) : "";
  const points = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const point = [x, y];
      const position = pointPosition(size, point);
      const selected = interactive && activePointId === pointId(point);
      points.push(`
        <button
          type="button"
          class="grid-dot ${interactive ? "interactive" : ""} ${selected ? "selected" : ""}"
          style="left:${position.left}%; top:${position.top}%;"
          ${interactive ? `data-point="${x},${y}" ${state.locked ? "disabled" : ""}` : "disabled"}
          aria-label="${interactive ? `Punkt ${x + 1}, ${y + 1}` : ""}"
        ></button>
      `);
    }
  }
  return points.join("");
}

function gridMarkup(title, points, interactive = false) {
  const closed = !interactive && Boolean(state.currentFigure?.closed);
  return `
    <section class="panel grid-card">
      <div class="grid-card-head">
        <h3>${title}</h3>
        ${
          interactive
            ? `
              <button
                type="button"
                class="grid-trash-btn secondary"
                id="clear-btn"
                aria-label="Rechte Spiegelung löschen"
                title="Löschen"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" class="trash-icon">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z"></path>
                  <path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                </svg>
              </button>
            `
            : '<span class="grid-head-spacer" aria-hidden="true"></span>'
        }
      </div>
      <div class="grid-stage">
        <svg class="grid-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${
            interactive
              ? linesMarkupFromSegments(state.userSegments, state.level, "user")
              : linesMarkupFromPoints(points, state.level, "target", closed)
          }
        </svg>
        ${dotsMarkup(state.level, interactive)}
      </div>
    </section>
  `;
}

function evaluateFigure() {
  const expected = mirroredTarget();
  const correct = segmentsEqual(state.userSegments, expected.segments);

  state.stats.attempts += 1;

  if (correct) {
    state.stats.correct += 1;
    state.outcomes[state.roundIndex] = "correct";
    state.locked = true;
    state.feedback = "Richtig gespiegelt. Die nächste Figur kommt gleich.";
    state.feedbackKind = "feedback-ok";
    clearAutoNextTimer();
    state.autoNextTimer = window.setTimeout(() => {
      state.autoNextTimer = 0;
      advanceFigure();
    }, 1200);
  } else {
    state.stats.wrong += 1;
    state.outcomes[state.roundIndex] = "wrong";
    state.locked = true;
    state.feedback = "Das passt noch nicht. Lösche rechts und versuche es noch einmal.";
    state.feedbackKind = "feedback-bad";
  }

  render();
}

function onPointClick(raw) {
  if (state.locked || state.finished) {
    return;
  }

  const [x, y] = raw.split(",").map(Number);
  const point = [x, y];
  const currentPoint = state.activePoint;

  if (currentPoint && pointId(currentPoint) === pointId(point)) {
    state.activePoint = null;
    state.feedback =
      state.userSegments.length > 0
        ? "Die Markierung ist aufgehoben. Du kannst an einem anderen Punkt weiterzeichnen."
        : "Die Markierung ist aufgehoben. Wähle einen Startpunkt.";
    state.feedbackKind = "";
    render();
    return;
  }

  if (!currentPoint) {
    state.activePoint = point;
    state.feedback = "Punkt markiert. Wähle jetzt den nächsten Punkt.";
    state.feedbackKind = "";
    render();
    return;
  }

  const segment = [currentPoint, point];
  const alreadyExists = state.userSegments.some((entry) => segmentId(entry) === segmentId(segment));
  if (!alreadyExists) {
    state.userSegments = [...state.userSegments, segment];
  }

  state.activePoint = point;
  state.feedback = "Teilstück gezeichnet. Du kannst direkt weiterzeichnen.";
  state.feedbackKind = "";
  render();

  const expectedLength = mirroredTarget().segments.length;
  if (state.userSegments.length >= expectedLength) {
    evaluateFigure();
  }
}

function clearUserFigure() {
  clearAutoNextTimer();
  if (state.finished) {
    return;
  }
  state.userSegments = [];
  state.activePoint = null;
  state.locked = false;
  state.feedback = "Rechts ist wieder frei. Versuche die Spiegelung noch einmal.";
  state.feedbackKind = "";
  render();
}

function progressSegments() {
  return Array.from({ length: TASKS_PER_GAME }, (_, index) => {
    let status = state.outcomes[index] || "";
    if (!status && index === state.roundIndex && !state.finished) {
      status = "current";
    }
    return `<div class="progress-segment ${status}"></div>`;
  }).join("");
}

function resultView() {
  const piePercent = TASKS_PER_GAME > 0 ? Math.round((state.stats.correct / TASKS_PER_GAME) * 100) : 0;
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
        <div class="result-pie" style="--pie:${piePercent};" aria-label="Richtig ${state.stats.correct} von ${TASKS_PER_GAME}">
          <div class="result-pie-center">${state.stats.correct}/${TASKS_PER_GAME}</div>
        </div>
      </div>
      <p>Richtig: <strong>${state.stats.correct}</strong> von ${TASKS_PER_GAME}</p>
      <p>Fehler: <strong>${state.stats.wrong}</strong></p>
      <p>Versuche: <strong>${state.stats.attempts}</strong></p>
      <div class="inline-actions" style="margin-top:10px">
        <button type="button" class="primary" id="next-btn">Neue Runde</button>
      </div>
    </section>
  `;
}

function render() {
  if (state.finished) {
    root.innerHTML = resultView();
    bindEvents();
    return;
  }

  root.innerHTML = `
    <section class="panel spiegel-layout" aria-label="Spiegeln">
      <div>
        <h2>Spiegele die Figur an der blauen Achse</h2>
      </div>

      <div class="difficulty-row" aria-label="Schwierigkeitsgrad">
        ${Object.values(LEVELS)
          .map(
            (level) => `
              <button
                type="button"
                class="${state.level === level.size ? "active" : ""}"
                data-level="${level.size}"
              >
                ${level.label}
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="progress-wrap" aria-label="Fortschritt">
        <div class="progress-label">Aufgabe ${state.roundIndex + 1}/${TASKS_PER_GAME}</div>
        <div class="progress-track">${progressSegments()}</div>
      </div>

      <div class="mirror-board">
        ${gridMarkup("Vorlage", state.currentFigure.points, false)}
        <div class="mirror-axis" aria-label="Spiegelachse"></div>
        ${gridMarkup("Deine Spiegelung", state.currentFigure.points, true)}
      </div>

      <section class="panel info-panel">
        <div class="status-row">
          <div class="pill">Aufgabe: ${Math.min(state.roundIndex + 1, TASKS_PER_GAME)}/${TASKS_PER_GAME}</div>
          <div class="pill">Richtig: ${state.stats.correct}</div>
          <div class="pill">Fehler: ${state.stats.wrong}</div>
          <div class="pill">Versuche: ${state.stats.attempts}</div>
        </div>
        <div class="feedback-text ${state.feedbackKind}">${state.feedback}</div>
        <div class="inline-actions">
          <button type="button" class="primary" id="next-btn">${state.finished ? "Neue Runde" : "Überspringen"}</button>
        </div>
      </section>
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  if (state.finished) {
    root.querySelector("#next-btn")?.addEventListener("click", startGame);
    root.querySelectorAll("[data-level]").forEach((button) => {
      button.addEventListener("click", () => setLevel(Number(button.dataset.level)));
    });
    return;
  }

  root.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => setLevel(Number(button.dataset.level)));
  });

  root.querySelectorAll("[data-point]").forEach((button) => {
    button.addEventListener("click", () => onPointClick(button.dataset.point));
  });

  root.querySelector("#clear-btn")?.addEventListener("click", clearUserFigure);
  root.querySelector("#next-btn")?.addEventListener("click", () => {
    if (state.finished) {
      startGame();
      return;
    }
    state.stats.wrong += 1;
    state.stats.attempts += 1;
    state.outcomes[state.roundIndex] = "wrong";
    advanceFigure();
  });
}

startGame();
