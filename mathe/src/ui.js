import {
  APP_NAME,
  DIFFICULTY_OPTIONS,
  GAME_PHASE,
  LEVEL_OPTIONS,
  TASKS_PER_ROUND,
} from "./config.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function choiceButtons(name, options, selected) {
  return `
    <div class="choice-row" role="group" aria-label="${escapeHtml(name)}">
      ${options
        .map(
          (option) => `
            <button
              type="button"
              class="choice-btn ${selected === option.id ? "active" : ""}"
              data-choice-group="${escapeHtml(name)}"
              data-choice-value="${escapeHtml(option.id)}"
            >
              ${escapeHtml(option.label)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function progressSegments(progress) {
  return Array.from({ length: TASKS_PER_ROUND }, (_, index) => {
    const state = index < progress ? "done" : index === progress ? "active" : "";
    return `<div class="progress-segment ${state}"></div>`;
  }).join("");
}

function computeTenFrameVisual(task, showHint) {
  let redDots = 0;
  let blueDots = 0;
  let ghostDots = 0;
  let crossedDots = 0;
  let redIsGhost = false;
  let ghostIsCrossed = false;
  let ghostColor = "blue";

  if (!task) {
    return { redDots, blueDots, ghostDots, crossedDots, redIsGhost, ghostIsCrossed, ghostColor };
  }

  if (task.type === "addition") {
    if (task.gapIndex === 0) {
      redDots = task.num1;
      blueDots = task.num2;
      redIsGhost = true;
    } else {
      redDots = task.num1;
      if (task.gapIndex === 1) {
        ghostDots = task.solution;
      } else {
        blueDots = task.num2;
      }
    }
  } else if (task.type === "subtraction") {
    if (task.gapIndex === 0) {
      redDots = task.num1 - task.num2;
      ghostDots = task.num2;
      ghostIsCrossed = true;
      ghostColor = "red";
    } else if (task.gapIndex === 1) {
      redDots = task.solution;
      ghostDots = task.num1 - task.solution;
      ghostColor = "red";
      ghostIsCrossed = showHint;
    } else {
      redDots = task.num1;
      crossedDots = task.num2;
    }
  } else {
    redDots = task.num1;
    ghostDots = showHint ? task.solution : 0;
  }

  return { redDots, blueDots, ghostDots, crossedDots, redIsGhost, ghostIsCrossed, ghostColor };
}

function frameVisibilityState(state) {
  return {
    className: `frame-viewport ${state.isFrameVisible ? "" : "is-hidden"}`.trim(),
    style: "",
  };
}

function tenFrameDemo(task, showHint, state) {
  if (!task) {
    return `<div class="tenframe" aria-label="Zehnerfeld">${Array.from({ length: 10 }, () => '<div class="dot-empty"></div>').join("")}</div>`;
  }

  const dots = [];
  const visual = computeTenFrameVisual(task, showHint);
  const visibility = frameVisibilityState(state);

  for (let i = 0; i < 10; i += 1) {
    let currentIdx = i;

    if (currentIdx < visual.redDots) {
      let isGhost = visual.redIsGhost;
      let isCrossed = false;

      if (visual.crossedDots > 0 && currentIdx >= visual.redDots - visual.crossedDots) {
        isCrossed = true;
        isGhost = true;
      }

      dots.push(`<div class="dot red ${isGhost ? "ghost" : ""} ${isCrossed ? "crossed" : ""}"></div>`);
      continue;
    }

    currentIdx -= visual.redDots;
    if (currentIdx < visual.blueDots) {
      dots.push('<div class="dot blue"></div>');
      continue;
    }

    currentIdx -= visual.blueDots;
    if (currentIdx < visual.ghostDots) {
      dots.push(
        `<div class="dot ${visual.ghostColor} ghost ${visual.ghostIsCrossed ? "crossed" : ""}"></div>`,
      );
      continue;
    }

    dots.push('<div class="dot-empty"></div>');
  }

  return `
    <div class="${visibility.className}" style="${visibility.style}">
      <div class="tenframe" aria-label="Zehnerfeld">${dots.join("")}</div>
    </div>
  `;
}

function equationDemo(task, inputValue) {
  if (!task) {
    return "";
  }

  const left = task.gapIndex === 0 ? `<div class="slot input">${inputValue ?? "?"}</div>` : `<div class="slot">${task.num1}</div>`;
  const midValue = task.type === "missing" ? "?" : task.num2;
  const mid = task.gapIndex === 1 ? `<div class="slot input">${inputValue ?? "?"}</div>` : `<div class="slot">${midValue}</div>`;
  const right =
    task.gapIndex === 2
      ? `<div class="slot input">${inputValue ?? "?"}</div>`
      : `<div class="slot">${task.type === "missing" ? 10 : task.type === "subtraction" ? task.num1 - task.num2 : task.num1 + task.num2}</div>`;
  const symbol = task.type === "subtraction" ? "-" : "+";

  return `
    <div class="equation" aria-label="Rechenaufgabe">
      ${left}
      <div class="sym">${symbol}</div>
      ${mid}
      <div class="sym">=</div>
      ${right}
    </div>
  `;
}

function menuView(state) {
  const currentDifficulty = DIFFICULTY_OPTIONS.find((item) => item.id === state.settings.difficulty);

  return `
    <section class="panel setup-panel" aria-label="Einstellungen">
      <div class="setup-grid">
        <div class="hero-card">
          <div class="hero-row">
            <div class="hero-fox" aria-hidden="true">🦊</div>
            <div>
              <h2>Schlaufuchs Mathe</h2>
              <p class="hint">Mathe üben mit klaren Aufgaben im Zahlenraum bis 10</p>
            </div>
          </div>
          <div class="hero-badge">Für Klasse 1</div>
          <div class="status-box">
            <div><strong>So funktioniert es:</strong> Modus und Schwierigkeit wählen, dann Runde starten.</div>
            <div class="hint">Kinder erhalten direkt Rückmeldung und können eigenständig üben.</div>
          </div>
        </div>

        <div class="panel">
          <h3>Einstellungen</h3>
          <form id="setup-form">
            <div class="choice-group">
              <label>Modus</label>
              ${choiceButtons("levelMode", LEVEL_OPTIONS, state.settings.levelMode)}
            </div>

            <div class="choice-group">
              <label>Schwierigkeit</label>
              ${choiceButtons("difficulty", DIFFICULTY_OPTIONS, state.settings.difficulty)}
            </div>

            <label class="inline-actions">
              <input type="checkbox" name="soundsEnabled" ${state.settings.soundsEnabled ? "checked" : ""} />
              <span>Sound an</span>
            </label>

            <div class="hint">Info: ${escapeHtml(currentDifficulty?.desc || "")}</div>

            <button class="primary" type="submit">Runde starten</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function playingView(state) {
  const task = state.currentTask;

  return `
    <section class="panel task-shell" aria-label="Mathe-Aufgabe">
      <div class="top-row">
        <div class="inline-actions">
          <button id="back-btn" class="secondary" type="button">Zurück</button>
          <div class="pill">Modus: ${escapeHtml(state.settings.levelMode)}</div>
          <div class="pill">Schwierigkeit: ${escapeHtml(state.settings.difficulty)}</div>
        </div>
        <div class="pill">Punkte: ${state.score}</div>
      </div>

      <div>
        <div class="hint">Fortschritt</div>
        <div class="progress-track">${progressSegments(state.progress)}</div>
      </div>

      <div class="play-layout">
        <div class="stage-card">
          <h3>Visualisierung (Zehnerfeld)</h3>
          ${tenFrameDemo(task, state.showHint, state)}
        </div>

        <div class="stage-card">
          <h3>Aufgabe</h3>
          ${equationDemo(task, state.inputValue)}
          <p class="hint">${escapeHtml(state.feedback || "Wähle eine Zahl auf dem Zahlenfeld.")}</p>
          <div class="numpad" aria-label="Zahlenfeld">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10]
              .map(
                (value) => `
                  <button type="button" data-input-value="${value}" data-value="${value}" ${
                    state.awaitingNext ? "disabled" : ""
                  }>${value}</button>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function resultView(state) {
  const total = TASKS_PER_ROUND;
  const correct = state.score;
  const piePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return `
    <section class="panel" aria-label="Ergebnis">
      <div class="confetti-layer" aria-hidden="true">
        ${Array.from({ length: 24 }, (_, index) => {
          const left = ((index * 41) % 100) + 0.5;
          const delay = (index % 8) * 0.08;
          const duration = 1.8 + (index % 6) * 0.14;
          const hue = (index * 37) % 360;
          const rotate = (index * 29) % 180;
          return `<span class="confetti-piece" style="--left:${left}%;--delay:${delay}s;--dur:${duration}s;--hue:${hue};--rot:${rotate}deg;"></span>`;
        }).join("")}
      </div>
      <h2>Runde geschafft</h2>
      <div class="result-chart-wrap">
        <div class="result-pie" style="--pie:${piePercent};" aria-label="Richtig ${correct} von ${total}">
          <div class="result-pie-center">${correct}/${total}</div>
        </div>
      </div>
      <div class="status-box">
        <div><strong>${correct}</strong> von ${total} richtig</div>
        <div class="hint">Versuche: ${state.attempts} · Fehlversuche: ${state.wrong}</div>
      </div>
      <div class="inline-actions" style="margin-top:10px">
        <button id="again-btn" class="primary" type="button">Nochmal spielen</button>
        <button id="back-settings-btn" class="secondary" type="button">Zum Menü</button>
      </div>
      <p class="hint" style="margin-top:10px">
        Tipp für Lehrkräfte: Startet mit „Leicht“ und wechselt danach zu „Mittel“ oder „Schwer“.
      </p>
    </section>
  `;
}

function feedbackOverlay(state) {
  if (state.status !== "success" && state.status !== "error") {
    return '<div class="feedback-overlay hidden" aria-hidden="true"></div>';
  }

  const isSuccess = state.status === "success";
  return `
    <div class="feedback-overlay" aria-hidden="true">
      <div class="feedback-badge ${isSuccess ? "success" : "error"}">
        ${isSuccess ? "OK" : "X"}
      </div>
    </div>
  `;
}

export function renderApp(root, state) {
  let body = menuView(state);
  if (state.phase === GAME_PHASE.PLAYING) {
    body = playingView(state);
  } else if (state.phase === GAME_PHASE.RESULT) {
    body = resultView(state);
  }

  root.innerHTML = `
    <header class="app-header">
      <div>
        <h1>${APP_NAME}</h1>
        <p>Mathetraining für Kinder in Klasse 1</p>
      </div>
      <div class="header-actions">
        <a class="secondary link-btn" href="../index.html">Zum Portal</a>
      </div>
    </header>
    <main>${body}</main>
    ${feedbackOverlay(state)}
  `;
}

export function bindMenuEvents(root, handlers) {
  const form = root.querySelector("#setup-form");
  if (!form) {
    return;
  }

  root.querySelectorAll("[data-choice-group]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onSettingChange({
        [button.dataset.choiceGroup]: button.dataset.choiceValue,
      });
    });
  });

  const soundsField = form.elements.soundsEnabled;
  soundsField?.addEventListener("change", (event) => {
    handlers.onSettingChange({ soundsEnabled: event.target.checked });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onStart();
  });
}

export function bindPlayingEvents(root, handlers) {
  root.querySelector("#back-btn")?.addEventListener("click", handlers.onBack);

  root.querySelectorAll("[data-input-value]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onInput(Number(button.dataset.inputValue));
    });
  });
}

export function bindResultEvents(root, handlers) {
  root.querySelector("#again-btn")?.addEventListener("click", handlers.onAgain);
  root.querySelector("#back-settings-btn")?.addEventListener("click", handlers.onBackSettings);
}
