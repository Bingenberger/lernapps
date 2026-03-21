const STORAGE_KEYS = {
  selectedLevel: "hoerbuch-karaoke:selected-level",
  selectedStoryId: "hoerbuch-karaoke:selected-story-id",
  syllableMode: "hoerbuch-karaoke:syllable-mode",
  readingSupportMode: "hoerbuch-karaoke:reading-support-mode",
  playbackRate: "hoerbuch-karaoke:playback-rate",
  muted: "hoerbuch-karaoke:muted",
  volume: "hoerbuch-karaoke:volume"
};

const PLAYBACK_STEPS = [0.5, 0.65, 0.85, 1.0, 1.15, 1.35, 1.5];
const HIGHLIGHT_OFFSET_SECONDS = 0.1;
const READING_SUPPORT_MODES = ["frame", "underline", "dot", "none"];
const READING_SUPPORT_LABELS = {
  frame: "Gelber Rahmen",
  underline: "Gelber Strich",
  dot: "Gelber Punkt",
  none: "Keine Unterstützung"
};

const dom = {
  homeView: document.querySelector("#home-view"),
  readerView: document.querySelector("#reader-view"),
  levelTabs: document.querySelector("#level-tabs"),
  storyGrid: document.querySelector("#story-grid"),
  storyText: document.querySelector("#story-text"),
  storyIllustration: document.querySelector("#story-illustration"),
  storyImage: document.querySelector("#story-image"),
  audioPlayer: document.querySelector("#audio-player"),
  homeButton: document.querySelector("#home-button"),
  restartButton: document.querySelector("#restart-button"),
  playToggle: document.querySelector("#play-toggle"),
  speedSlider: document.querySelector("#speed-slider"),
  volumeToggle: document.querySelector("#volume-toggle"),
  volumePanel: document.querySelector("#volume-panel"),
  volumeSlider: document.querySelector("#volume-slider"),
  readingSupportToggle: document.querySelector("#reading-support-toggle"),
  syllableToggle: document.querySelector("#syllable-toggle"),
  statusMessage: document.querySelector("#status-message")
};

const state = {
  library: [],
  levels: [],
  selectedLevel: Number(localStorage.getItem(STORAGE_KEYS.selectedLevel)) || 1,
  currentStoryMeta: null,
  currentStory: null,
  wordNodes: [],
  currentWordIndex: -1,
  syllableMode: readBool(STORAGE_KEYS.syllableMode, false),
  readingSupportMode: readReadingSupportMode(),
  playbackRate: readPlaybackRate(),
  muted: readBool(STORAGE_KEYS.muted, false),
  volume: readNumber(STORAGE_KEYS.volume, 1, 0, 1)
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  applyReadingSupportMode();
  updateSyllableToggle();
  updateReadingSupportToggle();
  updatePlayToggle();
  updateVolumeToggle();
  setPlaybackRate(state.playbackRate);
  setVolume(state.volume);
  setMuted(state.muted);
  bindEvents();
  await loadLibrary();
}

function bindEvents() {
  dom.homeButton.addEventListener("click", showHomeView);
  dom.restartButton.addEventListener("click", restartPlayback);
  dom.playToggle.addEventListener("click", togglePlayback);

  dom.syllableToggle.addEventListener("click", () => {
    state.syllableMode = !state.syllableMode;
    localStorage.setItem(STORAGE_KEYS.syllableMode, String(state.syllableMode));
    updateSyllableToggle();
    renderStoryText();
    syncHighlight(dom.audioPlayer.currentTime, true);
  });

  dom.readingSupportToggle.addEventListener("click", () => {
    cycleReadingSupportMode();
  });

  dom.speedSlider.addEventListener("input", (event) => {
    setPlaybackRateByStep(Number(event.target.value));
  });

  dom.volumeToggle.addEventListener("click", () => {
    toggleVolumePanel();
  });

  dom.volumeSlider.addEventListener("input", (event) => {
    setVolume(Number(event.target.value) / 100);
  });

  dom.audioPlayer.addEventListener("timeupdate", () => {
    syncHighlight(dom.audioPlayer.currentTime, false);
  });

  dom.audioPlayer.addEventListener("seeked", () => {
    syncHighlight(dom.audioPlayer.currentTime, true);
  });

  dom.audioPlayer.addEventListener("ended", () => {
    setActiveWord(-1);
    updatePlayToggle();
  });

  dom.audioPlayer.addEventListener("play", () => {
    updatePlayToggle();
  });

  dom.audioPlayer.addEventListener("pause", () => {
    updatePlayToggle();
  });

  dom.audioPlayer.addEventListener("volumechange", () => {
    state.muted = dom.audioPlayer.muted;
    localStorage.setItem(STORAGE_KEYS.muted, String(state.muted));
    updateVolumeToggle();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".volume-control")) {
      closeVolumePanel();
    }
  });
}

async function loadLibrary() {
  try {
    const response = await fetch("data/library.json");
    if (!response.ok) {
      throw new Error(`Bibliothek konnte nicht geladen werden (${response.status})`);
    }

    state.library = await response.json();
    state.levels = [...new Set(state.library.map((entry) => entry.level))].sort((a, b) => a - b);

    if (!state.levels.includes(state.selectedLevel)) {
      state.selectedLevel = state.levels[0] || 1;
    }

    renderLevelTabs();
    renderStoryGrid();
    showHomeView(false);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderLevelTabs() {
  const fragment = document.createDocumentFragment();

  state.levels.forEach((level) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(level === state.selectedLevel));
    button.textContent = `Niveau ${level}`;
    button.addEventListener("click", () => {
      state.selectedLevel = level;
      localStorage.setItem(STORAGE_KEYS.selectedLevel, String(level));
      renderLevelTabs();
      renderStoryGrid();
    });
    fragment.appendChild(button);
  });

  dom.levelTabs.replaceChildren(fragment);
}

function renderStoryGrid() {
  const fragment = document.createDocumentFragment();
  const stories = state.library.filter((entry) => entry.level === state.selectedLevel);

  stories.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "story-tile";
    button.setAttribute("aria-label", `${entry.title} öffnen`);

    if (entry.id === localStorage.getItem(STORAGE_KEYS.selectedStoryId)) {
      button.classList.add("is-selected");
    }

    const inner = document.createElement("span");
    inner.className = "story-tile-inner";

    const title = document.createElement("strong");
    title.className = "story-title-text";
    title.textContent = entry.title;

    const image = document.createElement("img");
    image.className = "story-tile-image";
    image.src = getStoryImagePath(entry);
    image.alt = `Bild zu ${entry.title}`;
    image.loading = "lazy";
    image.decoding = "async";

    const footer = document.createElement("span");
    footer.className = "story-tile-footer";

    const openLabel = document.createElement("span");
    openLabel.className = "story-open-label";
    openLabel.textContent = "Öffnen";

    const dot = document.createElement("span");
    dot.className = "story-dot";
    dot.setAttribute("aria-hidden", "true");

    footer.append(openLabel, dot);
    inner.append(image, title, footer);
    button.appendChild(inner);

    button.addEventListener("click", async () => {
      localStorage.setItem(STORAGE_KEYS.selectedStoryId, entry.id);
      await loadStory(entry);
    });

    fragment.appendChild(button);
  });

  dom.storyGrid.replaceChildren(fragment);
}

async function loadStory(storyMeta) {
  try {
    setStatus("Geschichte wird geladen...");
    setActiveWord(-1);

    const response = await fetch(storyMeta.storyJson);
    if (!response.ok) {
      throw new Error(`Geschichte konnte nicht geladen werden (${response.status})`);
    }

    state.currentStoryMeta = storyMeta;
    state.currentStory = await response.json();
    state.currentWordIndex = -1;
    dom.storyText.dataset.level = String(storyMeta.level || state.selectedLevel || 1);
    applyReadingSupportMode();

    dom.audioPlayer.src = state.currentStory.audioSrc;
    dom.audioPlayer.load();

    updateStoryIllustration();
    renderStoryText();
    showReaderView();
    setStatus(`Bereit: ${state.currentStory.title}`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderStoryText() {
  if (!state.currentStory) {
    dom.storyText.textContent = "";
    return;
  }

  const fragment = document.createDocumentFragment();
  state.wordNodes = [];

  state.currentStory.words.forEach((word, index) => {
    const wrapper = document.createElement("span");
    wrapper.className = "word";
    wrapper.dataset.index = String(index);
    if (word.isTitle) {
      wrapper.classList.add("title-word");
    }

    if (state.syllableMode && Array.isArray(word.syllables) && word.syllables.length > 0) {
      word.syllables.forEach((syllable, syllableIndex) => {
        const syllableNode = document.createElement("span");
        syllableNode.className = `syllable ${syllableIndex % 2 === 0 ? "blue" : "red"}`;
        syllableNode.textContent = syllable;
        wrapper.appendChild(syllableNode);
      });
    } else {
      wrapper.textContent = word.w;
    }

    state.wordNodes.push(wrapper);
    fragment.appendChild(wrapper);

    const lineBreaksAfter = Number(word.lineBreaksAfter) || 0;
    if (lineBreaksAfter > 0) {
      for (let count = 0; count < lineBreaksAfter; count += 1) {
        fragment.appendChild(document.createElement("br"));
      }
    } else {
      fragment.appendChild(document.createTextNode(" "));
    }
  });

  dom.storyText.replaceChildren(fragment);
}

function updateStoryIllustration() {
  const imagePath = getStoryImagePath(state.currentStoryMeta);
  if (!state.currentStoryMeta || !imagePath) {
    dom.storyIllustration.hidden = true;
    dom.storyImage.removeAttribute("src");
    dom.storyImage.alt = "";
    return;
  }

  dom.storyImage.src = imagePath;
  dom.storyImage.alt = `Illustration zu ${state.currentStoryMeta.title}`;
  dom.storyIllustration.hidden = false;
}

function showHomeView(shouldPause = true) {
  if (shouldPause) {
    dom.audioPlayer.pause();
  }

  closeVolumePanel();
  dom.readerView.classList.add("is-hidden");
  dom.homeView.classList.remove("is-hidden");
}

function showReaderView() {
  dom.homeView.classList.add("is-hidden");
  dom.readerView.classList.remove("is-hidden");
}

function syncHighlight(currentTime, forceFullSearch) {
  const story = state.currentStory;
  if (!story || !Array.isArray(story.words) || story.words.length === 0) {
    return;
  }

  const adjustedTime = Math.max(0, currentTime - HIGHLIGHT_OFFSET_SECONDS);

  let nextIndex = state.currentWordIndex;

  if (
    !forceFullSearch &&
    nextIndex >= 0 &&
    story.words[nextIndex] &&
    adjustedTime >= story.words[nextIndex].s &&
    adjustedTime <= story.words[nextIndex].e
  ) {
    return;
  }

  if (
    !forceFullSearch &&
    nextIndex >= 0 &&
    story.words[nextIndex + 1] &&
    adjustedTime >= story.words[nextIndex + 1].s
  ) {
    setActiveWord(nextIndex + 1);
    return;
  }

  nextIndex = findWordIndexByTime(story.words, adjustedTime);
  setActiveWord(nextIndex);
}

function findWordIndexByTime(words, time) {
  if (!Array.isArray(words) || words.length === 0) {
    return -1;
  }

  if (time < words[0].s) {
    return -1;
  }

  let left = 0;
  let right = words.length - 1;
  let bestIndex = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const word = words[middle];

    if (time < word.s) {
      right = middle - 1;
    } else {
      bestIndex = middle;
      left = middle + 1;
    }
  }

  return bestIndex;
}

function setActiveWord(nextIndex) {
  if (state.currentWordIndex === nextIndex) {
    return;
  }

  const previousNode = state.wordNodes[state.currentWordIndex];
  if (previousNode) {
    previousNode.classList.remove("is-active");
  }

  state.currentWordIndex = nextIndex;

  const nextNode = state.wordNodes[nextIndex];
  if (nextNode) {
    nextNode.classList.add("is-active");
    nextNode.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth"
    });
  }
}

function setPlaybackRate(value) {
  const nextRate = getClosestPlaybackRate(value);
  state.playbackRate = nextRate;
  dom.audioPlayer.playbackRate = nextRate;
  dom.speedSlider.value = String(PLAYBACK_STEPS.indexOf(nextRate));
  localStorage.setItem(STORAGE_KEYS.playbackRate, String(nextRate));
}

function setPlaybackRateByStep(stepIndex) {
  const safeIndex = clamp(Math.round(stepIndex), 0, PLAYBACK_STEPS.length - 1);
  setPlaybackRate(PLAYBACK_STEPS[safeIndex]);
}

function togglePlayback() {
  if (dom.audioPlayer.paused) {
    void dom.audioPlayer.play();
  } else {
    dom.audioPlayer.pause();
  }
}

function restartPlayback() {
  dom.audioPlayer.currentTime = 0;
  syncHighlight(0, true);

  if (dom.audioPlayer.paused) {
    setActiveWord(findWordIndexByTime(state.currentStory?.words || [], 0));
    return;
  }

  void dom.audioPlayer.play();
}

function updatePlayToggle() {
  const isPaused = dom.audioPlayer.paused;
  setButtonIcon(dom.playToggle, isPaused ? "#icon-play" : "#icon-pause");
  dom.playToggle.setAttribute(
    "aria-label",
    isPaused ? "Wiedergabe starten" : "Wiedergabe pausieren"
  );
  dom.playToggle.title = isPaused ? "Wiedergabe starten" : "Wiedergabe pausieren";
}

function setMuted(nextMuted) {
  state.muted = Boolean(nextMuted);
  dom.audioPlayer.muted = state.muted;
  localStorage.setItem(STORAGE_KEYS.muted, String(state.muted));
  updateVolumeToggle();
}

function setVolume(nextVolume) {
  state.volume = clamp(nextVolume, 0, 1);
  dom.audioPlayer.volume = state.volume;
  dom.volumeSlider.value = String(Math.round(state.volume * 100));
  localStorage.setItem(STORAGE_KEYS.volume, String(state.volume));

  if (state.volume > 0 && dom.audioPlayer.muted) {
    dom.audioPlayer.muted = false;
  }

  updateVolumeToggle();
}

function toggleVolumePanel() {
  const isOpen = !dom.volumePanel.hidden;
  if (isOpen) {
    closeVolumePanel();
    return;
  }

  dom.volumePanel.hidden = false;
  dom.volumeToggle.setAttribute("aria-expanded", "true");
}

function closeVolumePanel() {
  dom.volumePanel.hidden = true;
  dom.volumeToggle.setAttribute("aria-expanded", "false");
}

function updateVolumeToggle() {
  const isMuted = dom.audioPlayer.muted || dom.audioPlayer.volume === 0;
  const isQuiet = dom.audioPlayer.volume > 0 && dom.audioPlayer.volume < 0.5;
  const iconId = isMuted
    ? "#icon-speaker-slash"
    : isQuiet
      ? "#icon-speaker-low"
      : "#icon-speaker-high";
  setButtonIcon(dom.volumeToggle, iconId);
  dom.volumeToggle.setAttribute("aria-label", "Lautstaerke einstellen");
  dom.volumeToggle.title = "Lautstaerke einstellen";
}

function cycleReadingSupportMode() {
  const currentIndex = READING_SUPPORT_MODES.indexOf(state.readingSupportMode);
  const nextIndex = (currentIndex + 1) % READING_SUPPORT_MODES.length;
  state.readingSupportMode = READING_SUPPORT_MODES[nextIndex];
  localStorage.setItem(STORAGE_KEYS.readingSupportMode, state.readingSupportMode);
  applyReadingSupportMode();
  updateReadingSupportToggle();
}

function applyReadingSupportMode() {
  dom.storyText.dataset.supportMode = state.readingSupportMode;
}

function updateReadingSupportToggle() {
  const currentLabel = READING_SUPPORT_LABELS[state.readingSupportMode];
  const nextIndex = (READING_SUPPORT_MODES.indexOf(state.readingSupportMode) + 1) % READING_SUPPORT_MODES.length;
  const nextLabel = READING_SUPPORT_LABELS[READING_SUPPORT_MODES[nextIndex]];
  dom.readingSupportToggle.setAttribute(
    "aria-label",
    `Leseführung: ${currentLabel}. Nächste Hilfe: ${nextLabel}`
  );
  dom.readingSupportToggle.title = `Leseführung: ${currentLabel}`;
  setButtonIcon(dom.readingSupportToggle, "#icon-reading-guide");
}

function updateSyllableToggle() {
  dom.syllableToggle.setAttribute("aria-checked", String(state.syllableMode));
  dom.syllableToggle.setAttribute(
    "aria-label",
    state.syllableMode ? "Silben-Modus ausschalten" : "Silben-Modus einschalten"
  );
  dom.syllableToggle.title = state.syllableMode ? "Silben-Modus aus" : "Silben-Modus an";
  setButtonIcon(dom.syllableToggle, "#icon-life-buoy");
}

function setStatus(message, isError = false) {
  dom.statusMessage.textContent = message;
  dom.statusMessage.style.color = isError ? "#b42318" : "";
}

function getStoryImagePath(storyMeta) {
  if (!storyMeta?.id) {
    return "";
  }

  return `img/${storyMeta.id}.webp`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setButtonIcon(button, iconId) {
  button.innerHTML = `<svg class="toolbar-icon" aria-hidden="true"><use href="${iconId}"></use></svg>`;
}

function getClosestPlaybackRate(value) {
  return PLAYBACK_STEPS.reduce((closest, candidate) => (
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest
  ));
}

function readBool(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) {
    return fallback;
  }

  return value === "true";
}

function readNumber(key, fallback, min, max) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function readPlaybackRate() {
  const value = Number(localStorage.getItem(STORAGE_KEYS.playbackRate));
  return Number.isFinite(value) ? getClosestPlaybackRate(value) : 1.0;
}

function readReadingSupportMode() {
  const value = localStorage.getItem(STORAGE_KEYS.readingSupportMode);
  return READING_SUPPORT_MODES.includes(value) ? value : "frame";
}
