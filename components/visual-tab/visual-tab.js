(function () {
if (window.__VISUAL_TAB_LOADED) return;
window.__VISUAL_TAB_LOADED = true;

window.onerror = function (message, source, lineno, colno, error) {
  console.error(
    "Global error:",
    message,
    "at",
    source + ":" + lineno + ":" + colno,
    error
  );
};

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

function drawErrorOnCanvas(msg) {
  // Base canvas plus wrapper for multi-chunk rendering
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  const baseCanvas = document.getElementById("tab-canvas");

  if (!canvasWrapper || !baseCanvas) return;

  canvasWrapper.innerHTML = "";
  const errorCanvas = baseCanvas;
  errorCanvas.width = 800;
  errorCanvas.height = 200;
  canvasWrapper.appendChild(errorCanvas);

  // Reassign globals so other pieces continue working if needed
  // although we only draw the error here
  const ctx = errorCanvas.getContext("2d");

  ctx.fillStyle = "#200";
  ctx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
  ctx.fillStyle = "#f88";
  ctx.font = "16px monospace";
  ctx.fillText(msg, 10, 50);
}

const CONSTS = window.GUITAR_CONSTS || {};

async function renderVisualTab() {
  let currentNotation = "english";

  let tabAudioEngine = null;
  let appliedSoundProfile = null;
  let currentSoundProfile =
    localStorage.getItem("guitar_sound_profile") || "guitar-clean";

  function ensureAudioEngine() {
    if (!window.PlayTab) return null;
    if (!tabAudioEngine) {
      tabAudioEngine = window.PlayTab.createEngine({
        soundProfile: currentSoundProfile,
      });
      appliedSoundProfile = currentSoundProfile;
      tabAudioEngine
        .preloadSamples()
        .catch((err) => console.warn("Unable to preload tab samples", err));
    } else if (
      currentSoundProfile &&
      currentSoundProfile !== appliedSoundProfile &&
      typeof tabAudioEngine.setSoundProfile === "function"
    ) {
      tabAudioEngine
        .setSoundProfile(currentSoundProfile)
        .then(() => {
          appliedSoundProfile = currentSoundProfile;
        })
        .catch((err) =>
          console.warn("Unable to update tab sound profile", err)
        );
    }
    return tabAudioEngine;
  }

  ensureAudioEngine();

  let currentBlocks = null;
  let isPlaying = false;
  let playbackController = null;
  let playbackTimeout = null;

  const SONGSTERR_BASE_URL = "https://www.songsterr.com";
  const TABS_API_BASE = getApiLocation();
  const REMOTE_TABS_KEY = "visualTab_remoteTabs";
  const ABSOLUTE_PATH = getAbsolutePath();

  if (window.setTranslationPrefix) {
    window.setTranslationPrefix(
      "visual-tab",
      `${ABSOLUTE_PATH}components/visual-tab/langs`
    );
  }

  // Language & Notation Selector Logic
  const langSelect =
    document.getElementById("globalLangSelect") ||
    document.getElementById("langSelect");
  const notationSelect = document.getElementById("notationSelect");
  const showChordsCheckbox = document.getElementById("showChordsCheckbox");
  const soundSelect = document.getElementById("soundSelect");
  const tabVariantSelect = document.getElementById("tabVariantSelect");
  const tabVariantContainer = document.getElementById("tabVariantContainer");

  // Show Chords Logic
  let showChords = true;
  const savedShowChords = localStorage.getItem("portal_showChords");
  if (savedShowChords !== null) {
    showChords = savedShowChords === "true";
  }

  if (showChordsCheckbox) {
    showChordsCheckbox.checked = showChords;
    showChordsCheckbox.addEventListener("change", (e) => {
      showChords = e.target.checked;
      localStorage.setItem("portal_showChords", showChords);
      // Re-render if a tab is active
      if (currentBlocks && currentBlocks.length) {
        renderVisualTab(currentBlocks);
      }
    });
  }

  // Detect browser language or saved language
  const browserLang = navigator.language || navigator.userLanguage || "en";
  let userLang = browserLang.startsWith("es") ? "es" : "en";

  const savedLang = localStorage.getItem("portal_selectedLang");
  if (savedLang) {
    userLang = savedLang;
  }

  // Notation Logic
  const savedNotation = localStorage.getItem("portal_notation");
  if (savedNotation) {
    currentNotation = savedNotation;
  } else {
    // Default based on language
    currentNotation = userLang === "es" ? "latin" : "english";
  }

  if (notationSelect) {
    notationSelect.value = currentNotation;
    notationSelect.addEventListener("change", (e) => {
      currentNotation = e.target.value;
      localStorage.setItem("portal_notation", currentNotation);
      // Re-render if a tab is active
      if (currentTab) {
        playTab(currentTab);
      }
    });
  }

  if (langSelect) {
    langSelect.value = userLang;
    langSelect.addEventListener("change", (e) => {
      const newLang = e.target.value;
      localStorage.setItem("portal_selectedLang", newLang);
      if (window.loadTranslations) {
        window.loadTranslations(newLang).then(() => updatePlayButton());
      }

      if (newLang === "es") {
        currentNotation = "latin";
      } else {
        currentNotation = "english";
      }
      if (notationSelect) {
        notationSelect.value = currentNotation;
      }
      localStorage.setItem("portal_notation", currentNotation);

      if (currentTab) {
        playTab(currentTab);
      }
    });
  }

  if (soundSelect) {
    soundSelect.value = currentSoundProfile;
    soundSelect.addEventListener("change", async (e) => {
      currentSoundProfile = e.target.value;
      localStorage.setItem("guitar_sound_profile", currentSoundProfile);
      const engine = ensureAudioEngine();
      if (engine && typeof engine.setSoundProfile === "function") {
        try {
          await engine.setSoundProfile(currentSoundProfile);
          appliedSoundProfile = currentSoundProfile;
        } catch (err) {
          console.warn("Unable to apply selected sound profile", err);
        }
      }
    });
  }

  if (tabVariantSelect) {
    tabVariantSelect.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx)) {
        setActiveTabSection(idx);
      }
    });
  }

  // Initial load
  if (window.loadTranslations) {
    window.loadTranslations(userLang).then(() => updatePlayButton());
  } else {
    updatePlayButton();
  }

  const selectionContainer = document.getElementById("selection-container");
  const playerContainer = document.getElementById("player-container");
  const backButton = document.getElementById("back-to-selection");
  const playButton = document.getElementById("play-tab-btn");
  const songTitleEl = document.getElementById("current-song-title");
  const songMetaEl = document.getElementById("current-artist-name");
  const stopButton = document.getElementById("stop-tab-btn");
  const jumpStartBtn = document.getElementById("jump-start-btn");
  const jumpEndBtn = document.getElementById("jump-end-btn");
  const nextMeasureBtn = document.getElementById("next-measure-btn");
  const prevMeasureBtn = document.getElementById("prev-measure-btn");
  const remoteLoadingOverlay = document.getElementById(
    "remote-loading-overlay"
  );
  const remoteLoadingMessageEl =
    document.getElementById("remoteLoadingMessage");
  const apiErrorModal = document.getElementById("api-error-modal");
  const apiErrorMessageEl = document.getElementById("apiErrorMessage");
  const apiErrorCloseBtn = document.getElementById("apiErrorCloseBtn");

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      stopPlayback();
    });
  }

  if (jumpStartBtn) {
    jumpStartBtn.addEventListener("click", () => {
      seekToTime(0, { resume: isPlaying });
    });
  }

  if (jumpEndBtn) {
    jumpEndBtn.addEventListener("click", () => {
      if (currentTimeline) {
        seekToTime(currentTimeline.duration, { resume: false });
      }
    });
  }

  if (nextMeasureBtn) {
    nextMeasureBtn.addEventListener("click", () => {
      seekByMeasure(1);
    });
  }

  if (prevMeasureBtn) {
    prevMeasureBtn.addEventListener("click", () => {
      seekByMeasure(-1);
    });
  }

  // Base canvas plus wrapper for multi-chunk rendering
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  const baseCanvas = document.getElementById("tab-canvas");

  // These two references are reassigned to whichever chunk canvas is active
  let canvas = baseCanvas;
  let ctx = canvas.getContext("2d");

  // Track which chunks are currently available
  let currentChunks = []; // array of { canvas, blocks }
  let chunkObserver = null;
  let playbackBlocks = [];
  let totalCanvasWidth = 0;
  let playheadPositions = [];
  let playheadPositionIndex = 0;
  let playheadAnchorTime = 0;
  let playheadAnimationId = null;
  let playheadTimelineDuration = 0;
  let activePlayheadChunk = -1;
  let currentTimeline = null;
  let currentMeasureTimes = [];
  let currentMeasureIndex = 0;
  let playbackStartTime = 0;
  let currentTabSections = [];
  let currentSectionIndex = 0;
  let currentVariantLabel = "";
  const PLAYBACK_OFFSET = 0.05;
  let isPreRenderingChunks = false;

  // Tooltip element
  let tooltipEl = document.createElement("div");
  tooltipEl.className = "chord-tooltip";
  document.body.appendChild(tooltipEl);

  if (canvasWrapper) {
    canvasWrapper.addEventListener("click", handleCanvasClick);
  }

  const accordionContainer = document.getElementById("accordion-container");
  const searchInput = document.getElementById("songsterr-search");
  const searchResults = document.getElementById("search-results");

  if (playButton) {
    playButton.disabled = true;
    playButton.addEventListener("click", () => {
      if (isPlaying) {
        pausePlayback();
      } else {
        startPlayback();
      }
    });
  }

  function updatePlayButton() {
    if (!playButton) return;
    const icon = playButton.querySelector(".material-icons");
    const label = playButton.querySelector(".play-label");
    if (icon) {
      icon.textContent = isPlaying ? "pause" : "play_arrow";
    }
    if (label) {
      const key = isPlaying ? "pause_tab" : "play_tab";
      const fallback = isPlaying ? "Pause" : "Play";
      label.textContent = window.t ? window.t(key) : fallback;
    }
  }

  function hideApiError() {
    if (!apiErrorModal) return;
    apiErrorModal.classList.remove("is-visible");
  }

  if (apiErrorCloseBtn) {
    apiErrorCloseBtn.addEventListener("click", hideApiError);
  }

  if (apiErrorModal) {
    apiErrorModal.addEventListener("click", (e) => {
      if (e.target === apiErrorModal) {
        hideApiError();
      }
    });
  }

  function setRemoteLoading(isVisible, overrideMessage) {
    if (!remoteLoadingOverlay) return;
    if (isVisible && remoteLoadingMessageEl) {
      remoteLoadingMessageEl.textContent =
        overrideMessage ||
        (window.t
          ? window.t("loading_remote_tab")
          : "Loading tab...");
    }
    remoteLoadingOverlay.classList.toggle("is-visible", Boolean(isVisible));
  }

  function showApiError(message) {
    if (!apiErrorModal || !apiErrorMessageEl) {
      alert(message);
      return;
    }
    apiErrorMessageEl.textContent =
      message ||
      (window.t
        ? window.t("api_error_generic")
        : "Unable to download the tab. Please try again.");
    apiErrorModal.classList.add("is-visible");
  }

  function resetPlaybackState() {
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
      playbackTimeout = null;
    }
    if (playbackController && playbackController.stop) {
      try {
        playbackController.stop();
      } catch (err) {
        console.warn("Error stopping playback", err);
      }
    }
    playbackController = null;
    if (tabAudioEngine) {
      tabAudioEngine.stopAll();
    }
    stopPlayheadAnimation();
  }

  function pausePlayback(targetPosition = null) {
    const newTime =
      targetPosition !== null && !isNaN(targetPosition)
        ? clampTime(targetPosition)
        : getCurrentTimelineTime();
    resetPlaybackState();
    playbackStartTime = newTime;
    updateMeasureIndexForTime(playbackStartTime);
    isPlaying = false;
    updatePlayButton();
    positionPlayheadAtCurrentTime();
  }

  function stopPlayback() {
    pausePlayback(0);
  }

  function ensureAllChunksRendered() {
    if (!currentChunks.length) return;
    isPreRenderingChunks = true;
    currentChunks.forEach((info, idx) => {
      if (!info.rendered) {
        canvas = info.canvas;
        ctx = info.canvas.getContext("2d");
        info.interactiveRegions = [];
        renderChunk(info.blocks, info.interactiveRegions, idx);
      }
    });
    isPreRenderingChunks = false;
    recomputeChunkOffsets();
  }

  function recomputeChunkOffsets() {
    let offset = 0;
    currentChunks.forEach((info) => {
      info.absOffset = offset;
      const chunkWidth = getChunkWidth(info);
      offset += chunkWidth;
    });
    totalCanvasWidth = offset;
  }

  function getChunkWidth(info) {
    if (!info) return 0;
    if (typeof info.width === "number" && info.width > 0) return info.width;
    if (info.canvas && info.canvas.width) return info.canvas.width;
    return 0;
  }

  function stopPlayheadAnimation() {
    if (playheadAnimationId) {
      cancelAnimationFrame(playheadAnimationId);
      playheadAnimationId = null;
    }
    hideAllChunkPlayheads();
  }

  function hideAllChunkPlayheads() {
    activePlayheadChunk = -1;
    currentChunks.forEach((info) => {
      if (info.playheadLine) {
        info.playheadLine.style.display = "none";
      }
    });
  }

  function rebuildCurrentTimeline() {
    if (!playbackBlocks || !playbackBlocks.length) {
      currentTimeline = null;
      playheadPositions = [];
      currentMeasureTimes = [];
      playheadTimelineDuration = 0;
       playbackStartTime = 0;
       currentMeasureIndex = 0;
      return;
    }
    const bpmValue =
      currentTab && currentTab.bpm ? parseFloat(currentTab.bpm) : null;
    currentTimeline = buildPlaybackTimeline(
      playbackBlocks,
      bpmValue,
      currentTab ? currentTab.timeSig : null
    );
    playheadPositions = currentTimeline.positions || [];
    currentMeasureTimes = currentTimeline.measures || [];
    playheadTimelineDuration = currentTimeline.duration || 0;
    playheadPositionIndex = 0;
    playbackStartTime = clampTime(playbackStartTime);
    updateMeasureIndexForTime(playbackStartTime);
    positionPlayheadAtCurrentTime();
  }

  function startPlayheadAnimationLoop() {
    if (!canvasWrapper || !playheadPositions.length) return;
    hideAllChunkPlayheads();
    const engine = ensureAudioEngine();

    const step = () => {
      if (!isPlaying || !engine) {
        playheadAnimationId = null;
        return;
      }
      const elapsed = engine.getCurrentTime()
        ? engine.getCurrentTime() - playheadAnchorTime
        : (performance.now() / 1000) - playheadAnchorTime;
      const visualX = getVisualXForTime(Math.max(0, elapsed));
      if (visualX !== null) {
        positionPlayhead(visualX);
      }
      if (elapsed >= playheadTimelineDuration + 1 || !isPlaying) {
        playheadAnimationId = null;
        return;
      }
      playheadAnimationId = requestAnimationFrame(step);
    };

    if (playheadAnimationId) cancelAnimationFrame(playheadAnimationId);
    playheadAnimationId = requestAnimationFrame(step);
  }

  function positionPlayhead(absoluteX) {
    if (!canvasWrapper || !currentChunks.length) return;
    const resolved = resolveChunkForAbsoluteX(absoluteX);
    if (!resolved) return;
    const { chunkIndex, localX } = resolved;
    const info = currentChunks[chunkIndex];
    if (!info || !info.playheadLine) return;

    if (activePlayheadChunk !== chunkIndex) {
      if (activePlayheadChunk >= 0) {
        const prevInfo = currentChunks[activePlayheadChunk];
        if (prevInfo && prevInfo.playheadLine) {
          prevInfo.playheadLine.style.display = "none";
        }
      }
      activePlayheadChunk = chunkIndex;
    }

    info.playheadLine.style.display = "block";
    info.playheadLine.style.left = `${localX}px`;

    const targetScroll = Math.max(
      0,
      Math.min(
        absoluteX - canvasWrapper.clientWidth * 0.3,
        totalCanvasWidth - canvasWrapper.clientWidth
      )
    );
    canvasWrapper.scrollLeft += (targetScroll - canvasWrapper.scrollLeft) * 0.2;
  }

  function resolveChunkForAbsoluteX(x) {
    if (!currentChunks.length) return null;
    const clamped = Math.max(0, Math.min(totalCanvasWidth, x));
    const tested = new Set();

    const checkChunk = (idx) => {
      if (idx < 0 || idx >= currentChunks.length || tested.has(idx)) {
        return null;
      }
      tested.add(idx);
      const info = currentChunks[idx];
      if (!info) return null;
      const width = getChunkWidth(info);
      if (!width) return null;
      const start = info.absOffset || 0;
      const end = start + width;
      if (clamped >= start && clamped <= end + 0.5) {
        return {
          chunkIndex: idx,
          localX: clamped - start,
        };
      }
      return null;
    };

    if (activePlayheadChunk >= 0) {
      const immediate = checkChunk(activePlayheadChunk);
      if (immediate) return immediate;
      const ahead = checkChunk(activePlayheadChunk + 1);
      if (ahead) return ahead;
      const behind = checkChunk(activePlayheadChunk - 1);
      if (behind) return behind;
    }

    for (let i = 0; i < currentChunks.length; i++) {
      const result = checkChunk(i);
      if (result) return result;
    }
    return null;
  }

  function getVisualXForTime(time) {
    if (!playheadPositions.length) return null;
    if (time <= playheadPositions[0].time) {
      playheadPositionIndex = 0;
      return playheadPositions[0].absoluteX ?? 0;
    }
    const lastIdx = playheadPositions.length - 1;
    if (time >= playheadPositions[lastIdx].time) {
      playheadPositionIndex = lastIdx;
      return playheadPositions[lastIdx].absoluteX ?? totalCanvasWidth;
    }
    while (
      playheadPositionIndex < lastIdx - 1 &&
      playheadPositions[playheadPositionIndex + 1].time <= time
    ) {
      playheadPositionIndex++;
    }
    const current = playheadPositions[playheadPositionIndex];
    const next = playheadPositions[Math.min(playheadPositionIndex + 1, lastIdx)];
    if (!current || !next) {
      return current ? current.absoluteX ?? null : null;
    }
    const span = next.time - current.time || 0.0001;
    const ratio = Math.max(
      0,
      Math.min(1, (time - current.time) / span)
    );
    const currX = current.absoluteX ?? 0;
    const nextX = next.absoluteX ?? currX;
    return currX + (nextX - currX) * ratio;
  }

  function getTimeForVisualX(x) {
    if (!playheadPositions.length) return null;
    const clamped = Math.max(0, Math.min(x, totalCanvasWidth));
    for (let i = 0; i < playheadPositions.length - 1; i++) {
      const current = playheadPositions[i];
      const next = playheadPositions[i + 1];
      if (!current || !next) continue;
      const startX = current.absoluteX ?? 0;
      const endX = next.absoluteX ?? startX;
      if (clamped >= startX && clamped <= endX) {
        const span = endX - startX || 1;
        const ratio = (clamped - startX) / span;
        const startT = current.time;
        const endT = next.time;
        return startT + (endT - startT) * ratio;
      }
    }
    const last = playheadPositions[playheadPositions.length - 1];
    return last ? last.time : 0;
  }

  function clampTime(time) {
    if (!currentTimeline) return 0;
    const duration = currentTimeline.duration || 0;
    if (typeof time !== "number" || !isFinite(time)) return 0;
    return Math.max(0, Math.min(time, duration));
  }

  function getCurrentTimelineTime() {
    if (!currentTimeline) return 0;
    if (isPlaying && tabAudioEngine) {
      const engineTime =
        (tabAudioEngine.getCurrentTime
          ? tabAudioEngine.getCurrentTime()
          : performance.now() / 1000) || 0;
      return clampTime(engineTime - playheadAnchorTime);
    }
    return clampTime(playbackStartTime);
  }

  function positionPlayheadAtCurrentTime() {
    if (!currentTimeline || !playheadPositions.length) {
      hideAllChunkPlayheads();
      return;
    }
    const x = getVisualXForTime(playbackStartTime);
    if (x !== null) {
      positionPlayhead(x);
    }
  }

  function updateMeasureIndexForTime(time) {
    if (!currentMeasureTimes || !currentMeasureTimes.length) {
      currentMeasureIndex = 0;
      return;
    }
    let idx = 0;
    for (let i = 0; i < currentMeasureTimes.length; i++) {
      if (time >= currentMeasureTimes[i]) {
        idx = i;
      } else {
        break;
      }
    }
    currentMeasureIndex = idx;
  }

  function seekToTime(targetTime, options = {}) {
    if (!currentTimeline) return;
    const clamped = clampTime(targetTime);
    const wasPlaying = isPlaying;
    const resume =
      options.resume !== undefined ? options.resume : wasPlaying;
    if (wasPlaying) {
      pausePlayback(clamped);
    } else {
      playbackStartTime = clamped;
      updateMeasureIndexForTime(playbackStartTime);
      positionPlayheadAtCurrentTime();
    }
    if (resume) {
      startPlayback();
    }
  }

  function seekByMeasure(delta) {
    if (!currentTimeline || !currentMeasureTimes.length) return;
    const targetIdx = Math.max(
      0,
      Math.min(currentMeasureIndex + delta, currentMeasureTimes.length - 1)
    );
    const targetTime = currentMeasureTimes[targetIdx];
    seekToTime(targetTime, { resume: isPlaying });
  }

  function handleCanvasClick(e) {
    if (isPlaying || !currentTimeline || !canvasWrapper) return;
    const rect = canvasWrapper.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX < 0 || relativeX > rect.width) return;
    const absoluteX = canvasWrapper.scrollLeft + relativeX;
    const targetTime = getTimeForVisualX(absoluteX);
    if (targetTime !== null) {
      seekToTime(targetTime, { resume: false });
    }
  }

  function trimEventsForStart(events, startTime) {
    if (!Array.isArray(events)) return [];
    const trimmed = [];
    const epsilon = 0.0005;
    events.forEach((event) => {
      if (!event) return;
      const eventEnd = event.start + (event.duration || 0);
      if (eventEnd <= startTime + epsilon) return;
      const overlapOffset =
        event.start < startTime ? startTime - event.start : 0;
      trimmed.push({
        start: Math.max(0, event.start - startTime),
        duration: Math.max(0.05, (event.duration || 0) - overlapOffset),
        midis: event.midis ? [...event.midis] : [],
      });
    });
    return trimmed;
  }

  async function startPlayback() {
    const engine = ensureAudioEngine();
    if (!engine) return;
    if (!currentTimeline || !currentTimeline.events.length) {
      rebuildCurrentTimeline();
    }
    if (!currentTimeline || !currentTimeline.events.length) {
      console.warn("No playable events detected in this tab");
      return;
    }
    ensureAllChunksRendered();
    const trimmedEvents = trimEventsForStart(
      currentTimeline.events,
      playbackStartTime
    );
    if (!trimmedEvents.length) {
      console.warn("No events remaining after trim");
      pausePlayback(0);
      return;
    }

    resetPlaybackState();

    try {
      const controller = await engine.playSequence(trimmedEvents, {
        offset: PLAYBACK_OFFSET,
      });
      if (!controller) {
        console.warn("Playback engine did not return a controller");
        return;
      }
      playbackController = controller;
      isPlaying = true;
      updatePlayButton();
      const baseTime = engine.getCurrentTime
        ? engine.getCurrentTime()
        : performance.now() / 1000;
      playheadAnchorTime = baseTime + PLAYBACK_OFFSET - playbackStartTime;
      startPlayheadAnimationLoop();
      const remaining = Math.max(
        0,
        (currentTimeline.duration - playbackStartTime) * 1000
      );
      playbackTimeout = setTimeout(() => {
        playbackTimeout = null;
        pausePlayback(currentTimeline ? currentTimeline.duration : 0);
      }, remaining + 250);
    } catch (err) {
      console.error("Unable to play tab", err);
    }
  }

  function updateVariantSelectorOptions() {
    if (!tabVariantSelect || !tabVariantContainer) return;
    if (!currentTabSections || currentTabSections.length <= 1) {
      tabVariantContainer.style.display = "none";
      tabVariantSelect.innerHTML = "";
      return;
    }
    tabVariantContainer.style.display = "flex";
    tabVariantSelect.innerHTML = currentTabSections
      .map((section, idx) => {
        const label = section.label || `Part ${idx + 1}`;
        return `<option value="${idx}">${label}</option>`;
      })
      .join("");
    tabVariantSelect.value = String(currentSectionIndex);
  }

  function setActiveTabSection(index) {
    if (!currentTabSections || !currentTabSections.length) return;
    stopPlayback();
    const targetIndex = Math.max(
      0,
      Math.min(index, currentTabSections.length - 1)
    );
    const section = currentTabSections[targetIndex];
    if (!section) return;
    currentSectionIndex = targetIndex;
    const label = section.label || `Part ${targetIndex + 1}`;
    currentVariantLabel =
      currentTabSections.length > 1 ? label : "";
    currentBlocks = section.blocks;
    currentTab.stringTunings = section.stringTunings || null;
    playbackStartTime = 0;
    currentMeasureIndex = 0;
    renderVisualTab(section.blocks);
    rebuildCurrentTimeline();
    positionPlayheadAtCurrentTime();
    updateVariantSelectorOptions();
    updateSongMeta();
  }

  function updateSongMeta() {
    if (!songMetaEl || !currentTab) return;
    const parts = [];
    if (currentTab.artist) parts.push(currentTab.artist);
    if (currentTab.bpm) parts.push(`BPM: ${currentTab.bpm}`);
    if (currentTab.timeSig) parts.push(`Time: ${currentTab.timeSig}`);
    if (currentVariantLabel) parts.push(currentVariantLabel);
    songMetaEl.textContent = parts.length ? parts.join(" | ") : "";
  }

  updatePlayButton();

  let currentTab = null;
  let tabsData = [];

  // Initialize
  // await loadTabs(); // Moved to end to ensure constants are loaded

  backButton.addEventListener("click", () => {
    stopPlayback();
    currentBlocks = null;
    currentTabSections = [];
    currentSectionIndex = 0;
    currentVariantLabel = "";
    updateVariantSelectorOptions();
    if (playButton) playButton.disabled = true;
    playerContainer.style.display = "none";
    selectionContainer.style.display = "block";

    // Clear URL param
    const url = new URL(window.location);
    url.searchParams.delete("tab");
    window.history.pushState({}, "", url);
  });

  function kebabCase(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[^a-zA-Z0-9\s]/g, " ") // no alfanum -> espacio
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  function buildTabUrlFromMetadata(meta) {
    const urlPrefix = `${SONGSTERR_BASE_URL}/a/wsa/`;
    const urlSuffixParts = [meta.artist, meta.title, "tab"];
    const urlSuffix = kebabCase(urlSuffixParts.join(" "));
    return `${urlPrefix}${urlSuffix}-s${meta.songId}`;
  }

  function loadRemoteTabsCache() {
    try {
      const raw = localStorage.getItem(REMOTE_TABS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error reading remote tabs cache", e);
      return [];
    }
  }

  function saveRemoteTabsCache(list) {
    try {
      localStorage.setItem(REMOTE_TABS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error saving remote tabs cache", e);
    }
  }

  function ensureRemoteTabEntry(songMeta) {
    // songMeta: { songId, artist, title }
    const cache = loadRemoteTabsCache();
    const id = `s${songMeta.songId}`;
    let entry = cache.find((e) => e.id === id);
    const url = buildTabUrlFromMetadata(songMeta);

    if (!entry) {
      entry = {
        id,
        songId: songMeta.songId,
        artist: songMeta.artist,
        title: songMeta.title,
        url,
      };
      cache.push(entry);
    } else {
      // Update in case the slug or title changed
      entry.url = url;
      entry.artist = songMeta.artist;
      entry.title = songMeta.title;
    }
    saveRemoteTabsCache(cache);
    return entry;
  }

  function hydrateRemoteTabsIntoTabsData() {
    const cache = loadRemoteTabsCache();
    const remoteTabs = cache.map((entry) => ({
      id: `remote:${entry.id}`, // used in ?tab=
      file: null,
      song: entry.title,
      artist: entry.artist,
      bpm: null,
      timeSig: null,
      isRemote: true,
      remoteId: entry.id,
      remoteUrl: entry.url,
      content: null,
    }));
    tabsData = tabsData.concat(remoteTabs);
  }

  let searchTimeout = null;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const value = searchInput.value.trim();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (value.length < 3) {
        searchResults.innerHTML = "";
        return;
      }
      searchTimeout = setTimeout(() => {
        performSongsterrSearch(value);
      }, 300);
    });
  }

  async function performSongsterrSearch(query) {
    // NOTE: we now call our own API instead of hitting Songsterr directly
    const url = `${TABS_API_BASE}/songsterr-search?size=10&pattern=${encodeURIComponent(
      query
    )}`;
    try {
      searchResults.innerHTML = '<div class="search-item">Searching...</div>';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Songsterr proxy API error: ${res.status}`);
      }
      const data = await res.json();
      renderSearchResults(data);
    } catch (e) {
      console.error("Songsterr search failed", e);
      searchResults.innerHTML =
        '<div class="search-item error">Error searching in Songsterr</div>';
    }
  }

  function renderSearchResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
      searchResults.innerHTML =
        '<div class="search-item empty">No results</div>';
      return;
    }
    searchResults.innerHTML = "";
    results.forEach((song) => {
      const div = document.createElement("div");
      div.className = "search-item";
      const guitars = (song.tracks || []).filter(
        (t) => t.instrument && t.instrument.toLowerCase().includes("guitar")
      );
      const guitarNames = guitars.map((t) => t.name || t.instrument).join(", ");
      div.innerHTML = `
                <div class="search-main">
                    <span class="material-icons">music_note</span>
                    <span class="search-title">${song.title}</span>
                </div>
                <div class="search-sub">
                    <span>${song.artist}</span>
                    ${
                      guitarNames
                        ? `<span class="search-instrument">${guitarNames}</span>`
                        : ""
                    }
                </div>
            `;
      div.addEventListener("click", () => {
        handleSongsterrSelection(song);
        searchResults.innerHTML = "";
        searchInput.value = `${song.artist} - ${song.title}`;
      });
      searchResults.appendChild(div);
    });
  }

  async function handleSongsterrSelection(songMeta) {
    // Save or update the entry in the local cache
    const entry = ensureRemoteTabEntry({
      songId: songMeta.songId,
      artist: songMeta.artist,
      title: songMeta.title,
    });

    try {
      localStorage.setItem("portal_lastRemoteArtist", entry.artist || "");
      localStorage.setItem("portal_lastRemoteTitle", entry.title || "");
    } catch (e) {
      console.warn("Could not persist remote metadata", e);
    }

    // Buscar si ya existe en tabsData
    let tab = tabsData.find((t) => t.id === `remote:${entry.id}`);
    if (!tab) {
      tab = {
        id: `remote:${entry.id}`,
        file: null,
        song: entry.title,
        artist: entry.artist,
        bpm: null,
        timeSig: null,
        isRemote: true,
        remoteId: entry.id,
        remoteUrl: entry.url,
        content: null,
      };
      tabsData.push(tab);
      renderAccordion(tabsData); // ensure it appears in the accordion
    }

    await playTab(tab); // cargarla y reproducirla
  }

  async function loadTabs() {
    try {
      const response = await fetch(`${ABSOLUTE_PATH}/tabs/manifest.json`);
      if (!response.ok) throw new Error("Manifest not found");
      const files = await response.json();

      // Cargar tabs locales desde manifest
      const loadedTabs = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await fetch(`${ABSOLUTE_PATH}/tabs/${file}`);
            const text = await res.text();
            const metadata = parseMetadata(text);
            return {
              id: file,
              file,
              ...metadata,
              content: text,
              isRemote: false,
            };
          } catch (e) {
            console.error(`Error loading ${file}`, e);
            return null;
          }
        })
      );

      tabsData = loadedTabs.filter((t) => t !== null);

      // Add remote tabs stored in localStorage into tabsData
      hydrateRemoteTabsIntoTabsData();

      renderAccordion(tabsData);

      // Check ?tab= query param
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) {
        const found = tabsData.find(
          (t) => t.id === tabParam || t.file === tabParam
        );
        if (found) {
          await playTab(found);
        } else {
          console.warn("Tab from URL not found:", tabParam);
        }
      }
    } catch (e) {
      console.error(e);
      accordionContainer.innerHTML = `<div class="error">Error loading tabs. Please ensure tabs/manifest.json exists.</div>`;
    }
  }

  function parseMetadata(text) {
    const lines = text.split("\n");
    let song = "Unknown Song";
    let artist = "Unknown Artist";
    let bpm = null;
    let timeSig = null;

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.startsWith("song:")) {
        song = line.split(":")[1].trim();
      }
      if (lower.startsWith("artista:") || lower.startsWith("artist:")) {
        artist = line.split(":")[1].trim();
      }
      if (lower.startsWith("bpm:")) {
        bpm = line.split(":")[1].trim();
      }
      if (lower.startsWith("time:") || lower.startsWith("tiempo:")) {
        timeSig = line.split(":")[1].trim();
      }
    });

    // If there are recent metadata entries in localStorage (Songsterr selection), prioritize them
    try {
      const storedArtist = localStorage.getItem("portal_lastRemoteArtist");
      const storedTitle = localStorage.getItem("portal_lastRemoteTitle");
      if (storedArtist) artist = storedArtist;
      if (storedTitle) song = storedTitle;
      if (storedArtist || storedTitle) {
        localStorage.removeItem("portal_lastRemoteArtist");
        localStorage.removeItem("portal_lastRemoteTitle");
      }
    } catch (e) {
      console.warn("Could not read remote metadata from storage", e);
    }
    return { song, artist, bpm, timeSig };
  }

  function renderAccordion(tabs) {
    // Group by artist
    const byArtist = {};
    tabs.forEach((tab) => {
      const artistName = tab.artist || "Unknown Artist";
      if (!byArtist[artistName]) byArtist[artistName] = [];
      byArtist[artistName].push(tab);
    });

    accordionContainer.innerHTML = "";

    if (Object.keys(byArtist).length === 0) {
      accordionContainer.innerHTML = '<div class="error">No tabs found.</div>';
      return;
    }

    Object.keys(byArtist).forEach((artist, index) => {
      const artistGroup = document.createElement("div");
      artistGroup.className = "accordion-item";

      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `<span>${artist}</span> <span class="material-icons">expand_more</span>`;

      const content = document.createElement("div");
      content.className = "accordion-content";

      byArtist[artist].forEach((tab) => {
        const songItem = document.createElement("div");
        songItem.className = "song-item";
        songItem.innerHTML = `<span class="material-icons">music_note</span> ${tab.song}`;
        songItem.onclick = () => {
          playTab(tab);
        };
        content.appendChild(songItem);
      });

      header.onclick = () => {
        const isActive = content.classList.contains("active");
        document
          .querySelectorAll(".accordion-content")
          .forEach((c) => c.classList.remove("active"));
        if (!isActive) content.classList.add("active");
      };

      artistGroup.appendChild(header);
      artistGroup.appendChild(content);
      accordionContainer.appendChild(artistGroup);
    });
  }

  async function playTab(tab) {
    stopPlayback();
    currentTab = tab;
    selectionContainer.style.display = "none";
    playerContainer.style.display = "flex";

    // If the tab is remote and we do not have the content yet, fetch it from the API
    if (tab.isRemote && !tab.content) {
      setRemoteLoading(true);
      try {
        const apiUrl = `${TABS_API_BASE}/tab?url=${encodeURIComponent(
          tab.remoteUrl
        )}`;
        const res = await fetch(apiUrl);
        const rawBody = await res.text();
        if (!res.ok) {
          let serverMessage = null;
          try {
            const errorPayload = JSON.parse(rawBody);
            serverMessage = errorPayload.message || errorPayload.error || null;
          } catch (_) {
            serverMessage = rawBody;
          }
          throw new Error(
            serverMessage || `tabs API error: ${res.status}`
          );
        }
        let data = null;
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch (parseErr) {
          throw new Error(
            window.t
              ? window.t("api_error_parse")
              : "The server response could not be parsed."
          );
        }
        if (!data || !data.tab) {
          throw new Error(
            window.t
              ? window.t("api_error_empty_tab")
              : "Server returned an empty tab."
          );
        }
        tab.content = data.tab;

        // Read only bpm/time signature; do not overwrite title/artist with tab data
        const meta = parseMetadata(tab.content);
        tab.bpm = meta.bpm;
        tab.timeSig = meta.timeSig;
      } catch (e) {
        console.error("Error fetching remote tab", e);
        showApiError(
          e && e.message
            ? e.message
            : window.t
            ? window.t("api_error_generic")
            : "Unable to download the tab. Please try again."
        );
        return;
      } finally {
        setRemoteLoading(false);
      }
    } else {
      setRemoteLoading(false);
    }

    // Actualizar URL (?tab=<id>)
    const url = new URL(window.location);
    const idForUrl = tab.id || tab.file;
    if (idForUrl) {
      url.searchParams.set("tab", idForUrl);
    }
    window.history.pushState({}, "", url);

    if (songTitleEl) {
      songTitleEl.textContent = tab.song || "Untitled";
    }
    currentVariantLabel = "";
    updateSongMeta();

    if (!tab.content) {
      console.warn("Tab has no content to render");
      return;
    }

    const parsedData = parseTabContent(tab.content);
    currentTabSections =
      parsedData.sections && parsedData.sections.length
        ? parsedData.sections
        : [
            {
              label: "Main",
              blocks: parsedData.blocks,
              stringTunings: parsedData.stringTunings || null,
            },
          ];
    currentSectionIndex = 0;
    updateVariantSelectorOptions();
    setActiveTabSection(0);
    if (playButton) {
      playButton.disabled = false;
      updatePlayButton();
    }
  }

  const TAB_STRING_REGEX = /^(?:[eBGDAE]|s\d+)\|/i;

  function parseTabSectionText(text) {
    const lines = text.split("\n");
    const blocks = [];
    // Block structure: { strings: [], chords: null, pm: null, measureNums: null, rhythmStems: null, rhythmBeams: null }

    let tempStrings = [];
    let tempChord = null;
    let tempPM = null;
    let tempMeasureNums = null;
    let tempRhythmStems = null;
    let tempRhythmBeams = null;
    let foundStringSection = false;
    const midiByStringIndex = [];
    const headerMidiCandidates = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd(); // Keep leading spaces
      const trimmed = line.trim();
      if (!foundStringSection) {
        const headerMatches = trimmed.match(/s(\d{2,3})/gi);
        if (headerMatches) {
          headerMatches.forEach((match) => {
            if (headerMidiCandidates.length < 6) {
              const value = parseInt(match.slice(1), 10);
              if (!isNaN(value)) {
                headerMidiCandidates.push(value);
              }
            }
          });
        }
      }
      if (TAB_STRING_REGEX.test(trimmed)) {
        foundStringSection = true;
        // If we already have 6 strings and find a new one, it's a new block
        if (tempStrings.length === 6) {
          if (!tempChord) {
            tempChord = generateChordLine({ strings: tempStrings });
          }
          blocks.push({
            strings: tempStrings,
            chords: tempChord,
            pm: tempPM,
            measureNums: tempMeasureNums,
            rhythmStems: tempRhythmStems,
            rhythmBeams: tempRhythmBeams,
          });
          tempStrings = [];
          tempChord = null;
          tempPM = null;
          tempMeasureNums = null;
          tempRhythmStems = null;
          tempRhythmBeams = null;
        }
        tempStrings.push(line);
        const midiVal = extractMidiFromStringLine(trimmed);
        const currentIndex = tempStrings.length - 1;
        if (
          midiVal !== null &&
          currentIndex >= 0 &&
          midiByStringIndex[currentIndex] === undefined
        ) {
          midiByStringIndex[currentIndex] = midiVal;
        }
      } else if (line.trim().startsWith("x|")) {
        tempChord = line;
      } else if (
        line.trim().startsWith("PM|") ||
        line.trim().startsWith("P.M.|") ||
        line.includes("PM----|")
      ) {
        tempPM = line;
      } else if (line.trim().startsWith("|") && /\d/.test(line)) {
        // Measure numbers line: | 1 | 2
        tempMeasureNums = line;
      } else if (
        line.includes("|") &&
        !TAB_STRING_REGEX.test(line.trim()) &&
        !line.includes("PM") &&
        !/\d/.test(line)
      ) {
        // Rhythm stems line: | | |
        tempRhythmStems = line;
      } else if (line.includes("_")) {
        // Rhythm beams line: ____
        tempRhythmBeams = line;
      }
    }
    // Push last block
    if (tempStrings.length > 0) {
      if (!tempChord) {
        tempChord = generateChordLine({ strings: tempStrings });
      }
      blocks.push({
        strings: tempStrings,
        chords: tempChord,
        pm: tempPM,
        measureNums: tempMeasureNums,
        rhythmStems: tempRhythmStems,
        rhythmBeams: tempRhythmBeams,
      });
    }

    let stringTunings = null;
    if (midiByStringIndex.some((val) => typeof val === "number")) {
      stringTunings = midiByStringIndex;
    } else if (headerMidiCandidates.length >= 6) {
      stringTunings = headerMidiCandidates.slice(0, 6);
    }

    return { blocks, stringTunings };
  }

  function parseTabContent(text) {
    const lines = text.split("\n");
    const sections = [];
    let buffer = [];
    let currentLabel = null;

    const hasStringData = (linesArr) =>
      linesArr.some((ln) => TAB_STRING_REGEX.test(ln.trim()));

    const pushSection = () => {
      if (!buffer.length || !hasStringData(buffer)) {
        buffer = [];
        currentLabel = null;
        return;
      }
      const parsed = parseTabSectionText(buffer.join("\n"));
      const label =
        currentLabel ||
        (sections.length ? `Part ${sections.length + 1}` : "Main Section");
      sections.push({
        label,
        blocks: parsed.blocks,
        stringTunings: parsed.stringTunings,
      });
      buffer = [];
      currentLabel = null;
    };

    lines.forEach((line) => {
      if (/^\s*Instrument\s*:/i.test(line)) {
        pushSection();
        currentLabel =
          line.split(":").slice(1).join(":").trim() ||
          `Instrument ${sections.length + 1}`;
      } else {
        buffer.push(line);
      }
    });

    pushSection();

    if (!sections.length) {
      const fallback = parseTabSectionText(text);
      sections.push({
        label: "Main",
        blocks: fallback.blocks,
        stringTunings: fallback.stringTunings,
      });
    }

    return {
      sections,
      blocks: sections[0].blocks,
      stringTunings: sections[0].stringTunings,
    };
  }

  function extractMidiFromStringLine(line) {
    if (!line) return null;
    const match = line.match(/^s(\d{2,3})\|/i);
    if (match) {
      const value = parseInt(match[1], 10);
      return isNaN(value) ? null : value;
    }
    return null;
  }

  // Number of measures per canvas
  const BARS_PER_CHUNK = 4; // tweak to 2, 4, 8... to taste
  const CHORD_TOKEN_REGEX = /\*|([A-Za-z][^\s]*?)(?=\s*(?:[A-Z]|\*|$))/g;

  function createChunks(blocks) {
    const chunks = [];
    if (!blocks || !blocks.length) return chunks;

    blocks.forEach((block) => {
      if (!block.strings || !block.strings.length) return;

      const refLine = block.measureNums || block.strings[0];
      const totalLen = refLine.length;

      // 1) Find every '|' position
      const barPositions = [];
      for (let i = 0; i < refLine.length; i++) {
        if (refLine[i] === "|") {
          barPositions.push(i);
        }
      }

      // If there are no barlines we create a single chunk for the whole block
      if (barPositions.length === 0) {
        chunks.push([block]);
        return;
      }

      // 2) Build measure ranges [start, end)
      //    Each measure runs from one '|' to the next or to end-of-line
      const bars = [];
      for (let i = 0; i < barPositions.length; i++) {
        const start = barPositions[i];
        const end =
          i + 1 < barPositions.length ? barPositions[i + 1] : totalLen;
        bars.push({ start, end });
      }

      // 3) Group measures into chunks of BARS_PER_CHUNK
      for (let i = 0; i < bars.length; i += BARS_PER_CHUNK) {
        const group = bars.slice(i, i + BARS_PER_CHUNK);
        const start = group[0].start;
        const end = group[group.length - 1].end;

        const sliceLine = (line) => (line ? line.slice(start, end) : null);

        let chordsSlice = sliceLine(block.chords);
        if (chordsSlice && block.chords) {
          // Fix: If the slice starts with '*', it means it's a continuation of a chord
          // from the previous chunk. We must resolve it to the actual chord name.
          const tokenRegex = new RegExp(CHORD_TOKEN_REGEX);
          const firstTokenMatch = tokenRegex.exec(chordsSlice);
          if (firstTokenMatch && firstTokenMatch[0] === "*") {
            // Find the last chord in the original string before 'start'
            const regex = new RegExp(CHORD_TOKEN_REGEX);
            let match;
            let lastFound = "";
            while ((match = regex.exec(block.chords)) !== null) {
              if (match.index >= start) break;
              if (match[0] !== "*") {
                lastFound = match[0];
              }
            }

            if (lastFound) {
              // Overwrite '*' with the actual chord name
              const indexInSlice = firstTokenMatch.index;
              const name = lastFound;
              let newSliceArr = chordsSlice.split("");
              for (let k = 0; k < name.length; k++) {
                if (indexInSlice + k < newSliceArr.length) {
                  newSliceArr[indexInSlice + k] = name[k];
                }
              }
              chordsSlice = newSliceArr.join("");
            }
          }
        }

        const chunkBlock = {
          strings: block.strings.map(sliceLine),
          chords: chordsSlice,
          pm: sliceLine(block.pm),
          measureNums: sliceLine(block.measureNums),
          rhythmStems: sliceLine(block.rhythmStems),
          rhythmBeams: sliceLine(block.rhythmBeams),
        };

        // Each chunk is an array of blocks so we can reuse renderChunk()
        chunks.push([chunkBlock]);
      }
    });

    return chunks;
  }

  function getFretAt(line, index) {
    if (!line || index >= line.length) return null;

    const char = line[index];
    if (!/[0-9]/.test(char)) return null;

    if (index > 0 && /[0-9]/.test(line[index - 1])) {
      return null;
    }

    let end = index + 1;
    while (end < line.length && /[0-9]/.test(line[end])) {
      end++;
    }

    return {
      value: line.slice(index, end),
      length: end - index,
    };
  }

  // Map of rhythmic figures keyed by rhythmStems codes
  // Adjust here if json2tab ever emits different characters.
  const RHYTHM_GLYPHS = {
    // w: whole note (if it ever appears)
    w: { type: "note", filled: false, stem: false, flags: 0 },

    // h/b: half note (accept both 'h' and 'b')
    h: { type: "note", filled: false, stem: true, flags: 0 },
    b: { type: "note", filled: false, stem: true, flags: 0 },

    // n: negra
    n: { type: "note", filled: true, stem: true, flags: 0 },

    // c: corchea
    c: { type: "note", filled: true, stem: true, flags: 1 },

    // s: semicorchea
    s: { type: "note", filled: true, stem: true, flags: 2 },

    // t: thirty-second note (just in case)
    t: { type: "note", filled: true, stem: true, flags: 3 },

    // r: rest (we draw a generic quarter rest)
    r: { type: "rest" },
  };

  function getRhythmWidthMultiplier(ch) {
    if (!ch) return 1;
    const code = ch.toLowerCase();
    switch (code) {
      case "t": // fusa
        return 0.5;
      case "f": // sixty-fourth note (rare, but covered)
        return 0.25;
      case "c": // corchea
        return 2;
      case "n": // negra
        return 4;
      case "h": // blanca
      case "b":
        return 8;
      case "w": // redonda
        return 16;
      case "s": // semicorchea (base)
      case "r": // generic rest
      default:
        return 1;
    }
  }

  function parseTimeSignature(text) {
    if (typeof text !== "string") {
      return { beats: 4, unit: 4 };
    }
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return {
        beats: parseInt(match[1], 10) || 4,
        unit: parseInt(match[2], 10) || 4,
      };
    }
    return { beats: 4, unit: 4 };
  }

  const NOTE_DURATION_QUARTERS = {
    w: 4,
    h: 2,
    b: 2,
    n: 1,
    c: 0.5,
    s: 0.25,
    t: 0.125,
    f: 0.0625,
    r: 1,
  };

  function buildPlaybackTimeline(sequence, bpmValue, timeSigText) {
    if (!Array.isArray(sequence) || !sequence.length) {
      return { events: [], duration: 0, positions: [], measures: [] };
    }

    const parsedBpm =
      typeof bpmValue === "number" && !isNaN(bpmValue)
        ? bpmValue
        : parseFloat(bpmValue);
    const bpm = parsedBpm && parsedBpm > 20 ? parsedBpm : 110;

    const { beats, unit } = parseTimeSignature(timeSigText);
    const secondsPerQuarter = 60 / bpm;
    const secondsPerMeasure = beats * (4 / unit) * secondsPerQuarter;

    const events = [];
    const positions = [];
    const measureStartTimes = [];
    let cursor = 0;

    sequence.forEach((entry) => {
      const block = entry.block;
      const chunkIndex = entry.chunkIndex;
      if (!block.strings || !block.strings.length) return;
      const measures = getMeasureRanges(block);

      measures.forEach((range) => {
        measureStartTimes.push(cursor);
        const columnIndices = [];
        for (let i = range.start; i < range.end; i++) {
          if (block.strings[0][i] === "|") continue;
          columnIndices.push(i);
        }

        if (!columnIndices.length) {
          cursor += secondsPerMeasure;
          return;
        }

        if (
          block.rhythmStems &&
          measureHasRhythmSymbols(block.rhythmStems, range.start, range.end)
        ) {
          cursor = processMeasureWithRhythm({
            block,
            chunkIndex,
            start: range.start,
            end: range.end,
            cursor,
            secondsPerQuarter,
            secondsPerMeasure,
            events,
            positions,
          });
          return;
        }

        const defaultDuration = secondsPerMeasure / columnIndices.length;

        columnIndices.forEach((colIndex) => {
          const duration =
            getColumnDurationSeconds(block, colIndex, secondsPerQuarter) ||
            defaultDuration;
          const sustain = Math.max(duration * 0.95, 0.35);
          const midis = collectColumnMidis(block, colIndex);
          const columnPos = getColumnPosition(chunkIndex, block, colIndex);
          if (columnPos) {
            positions.push({
              time: cursor,
              absoluteX: columnPos.absoluteX,
            });
          }
          if (midis.length) {
            events.push({
              start: cursor,
              duration: sustain,
              midis,
            });
          }
          cursor += duration;
        });
      });
    });

    return { events, duration: cursor, positions, measures: measureStartTimes };
  }

  function getMeasureRanges(block) {
    const ref = block.measureNums || block.strings[0] || "";
    const bars = [];
    for (let i = 0; i < ref.length; i++) {
      if (ref[i] === "|") {
        bars.push(i);
      }
    }
    if (!bars.length) {
      return [{ start: 0, end: ref.length }];
    }
    const ranges = [];
    for (let i = 0; i < bars.length; i++) {
      const start = bars[i];
      const end = i + 1 < bars.length ? bars[i + 1] : ref.length;
      ranges.push({ start, end });
    }
    return ranges;
  }

  function getColumnDurationSeconds(block, index, secondsPerQuarter) {
    if (!block || !block.rhythmStems) return null;
    if (index >= block.rhythmStems.length) return null;
    const symbol = block.rhythmStems[index];
    if (!symbol || symbol === "|" || symbol.trim() === "") return null;
    const code = symbol.toLowerCase();
    if (!NOTE_DURATION_QUARTERS[code]) return null;
    return NOTE_DURATION_QUARTERS[code] * secondsPerQuarter;
  }

  function measureHasRhythmSymbols(line, start, end) {
    if (!line) return false;
    for (let i = start; i < end && i < line.length; i++) {
      const char = line[i];
      if (!char || char === "|" || char.trim() === "") continue;
      if (NOTE_DURATION_QUARTERS[char.toLowerCase()]) return true;
    }
    return false;
  }

  function processMeasureWithRhythm({
    block,
    chunkIndex,
    start,
    end,
    cursor,
    secondsPerQuarter,
    secondsPerMeasure,
    events,
    positions,
  }) {
    const measureStart = cursor;
    const fallbackStep = secondsPerQuarter / 4;

    for (let i = start; i < end; i++) {
      if (block.strings[0][i] === "|") continue;
      const symbol = block.rhythmStems[i];
      if (!symbol || symbol === "|" || symbol.trim() === "") continue;

      const lower = symbol.toLowerCase();
      const units = NOTE_DURATION_QUARTERS[lower];
      let duration = units ? units * secondsPerQuarter : fallbackStep;
      if (!duration || !isFinite(duration)) {
        duration = fallbackStep;
      }
      const sustain = Math.max(duration * 0.92, 0.25);

      const columnPos = getColumnPosition(chunkIndex, block, i);
      if (columnPos) {
        positions.push({
          time: cursor,
          absoluteX: columnPos.absoluteX,
        });
      }

      if (lower !== "r") {
        const midis = collectColumnMidis(block, i);
        if (midis.length) {
          events.push({
            start: cursor,
            duration: sustain,
            midis,
          });
        }
      }

      cursor += duration;
    }

    const consumed = cursor - measureStart;
    if (secondsPerMeasure - consumed > 0.01) {
      cursor = measureStart + secondsPerMeasure;
    }
    return cursor;
  }

  function getColumnPosition(chunkIndex, block, columnIndex) {
    return (
      getPreciseColumnPosition(chunkIndex, block, columnIndex) ||
      getApproxColumnPosition(chunkIndex, block, columnIndex)
    );
  }

  function getPreciseColumnPosition(chunkIndex, block, columnIndex) {
    const info = currentChunks[chunkIndex];
    if (!info || !info.blockLayouts) return null;
    const layout = info.blockLayouts.get(block);
    if (!layout) return null;
    const columnX = layout.columnX[columnIndex];
    if (columnX === undefined) return null;
    const columnWidth = layout.columnWidths[columnIndex] || 0;
    const leftMargin = info.leftMargin || 0;
    const scale = info.scale || 1;
    const local =
      leftMargin + columnX * scale + (columnWidth * scale) / 2;
    return {
      absoluteX: (info.absOffset || 0) + local,
      localX: local,
    };
  }

  function getApproxColumnPosition(chunkIndex, block, columnIndex) {
    const info = currentChunks[chunkIndex];
    if (!info) return null;
    const width = getChunkWidth(info);
    if (!width) return null;
    const line = block && block.strings && block.strings[0];
    const len = line ? line.length : 0;
    const ratio = len ? Math.max(0, Math.min(1, columnIndex / len)) : 0;
    const local = ratio * width;
    return {
      absoluteX: (info.absOffset || 0) + local,
      localX: local,
    };
  }

  function collectColumnMidis(block, index) {
    const notes = [];
    if (!block || !block.strings) return notes;
    const maxStrings = block.strings.length;
    for (let s = 0; s < maxStrings; s++) {
      const fretInfo = getFretAt(block.strings[s], index);
      if (fretInfo) {
        const fretValue = parseInt(fretInfo.value, 10);
        if (isNaN(fretValue)) continue;
        const openMidi = getOpenStringMidi(s);
        if (openMidi === null) continue;
        notes.push(openMidi + fretValue);
      }
    }
    return notes;
  }

  function getOpenStringMidi(stringIndex) {
    const tabTunings =
      currentTab && Array.isArray(currentTab.stringTunings)
        ? currentTab.stringTunings
        : null;
    if (
      tabTunings &&
      tabTunings[stringIndex] !== undefined &&
      tabTunings[stringIndex] !== null
    ) {
      const value = parseInt(tabTunings[stringIndex], 10);
      if (!isNaN(value)) {
        return value;
      }
    }
    if (STANDARD_TUNING_MIDI[stringIndex] !== undefined) {
      return STANDARD_TUNING_MIDI[stringIndex];
    }
    return STANDARD_TUNING_MIDI[STANDARD_TUNING_MIDI.length - 1] || null;
  }

  function getStringLabel(index) {
    if (
      currentTab &&
      Array.isArray(currentTab.stringTunings) &&
      currentTab.stringTunings[index] !== undefined &&
      currentTab.stringTunings[index] !== null
    ) {
      const midiValue = Number(currentTab.stringTunings[index]);
      const label = midiToNoteLabel(midiValue);
      if (label) return label;
    }
    return DEFAULT_STRING_NAMES[index] || `S${index + 1}`;
  }

  function lightenColor(hex, factor = 0.25) {
    if (!hex || typeof hex !== "string") return hex;
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return hex;
    const num = parseInt(normalized, 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    const lerp = (v) => Math.round(v + (255 - v) * factor);
    return `rgb(${lerp(r)}, ${lerp(g)}, ${lerp(b)})`;
  }

  function drawRhythmSymbol(ctx, ch, x, baselineY, fretWidth, isRest = false) {
    const code = ch.toLowerCase();
    const shape = RHYTHM_GLYPHS[code];
    if (!shape) return;

    ctx.save();
    ctx.strokeStyle = "#ddd";
    ctx.fillStyle = "#ddd";
    ctx.lineWidth = 2;

    // Rests: either explicit 'r' or when isRest=true
    if (shape.type === "rest" || isRest) {
      const x0 = x;
      const restBase = baselineY;
      // Vertical offset based on rest type
      
      if (code === 'w') {
          // Whole rest: rectangle below the line
          ctx.fillRect(x0 - 6, restBase - 10, 12, 6);
      } else if (code === 'h' || code === 'b') {
          // Half rest: rectangle above the line
          ctx.fillRect(x0 - 6, restBase - 4, 12, 6);
      } else if (code === 'c') {
          // Corchea (tipo 7)
          const y0 = restBase;
          ctx.beginPath();
          ctx.arc(x0 - 3, y0 - 5, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x0 - 1, y0 - 5); 
          ctx.quadraticCurveTo(x0 + 6, y0, x0 + 3, y0 + 10); 
          ctx.lineTo(x0 - 2, y0 + 18); 
          ctx.stroke();
      } else if (code === 's') {
          // Semicorchea (doble 7)
          const y0 = restBase;
          ctx.beginPath();
          ctx.arc(x0 - 3, y0 - 8, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x0 - 1, y0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(x0 - 1, y0 - 8);
          ctx.quadraticCurveTo(x0 + 5, y0 - 3, x0 + 2, y0 + 7);
          ctx.moveTo(x0 + 1, y0);
          ctx.quadraticCurveTo(x0 + 7, y0 + 5, x0 + 4, y0 + 15);
          ctx.lineTo(x0 - 1, y0 + 20);
          ctx.stroke();
      } else {
          // Quarter note (default for 'r'/'n')
          const y0 = restBase - 9;
          ctx.beginPath();
          ctx.moveTo(x0 - 4, y0);
          ctx.lineTo(x0 + 3, y0 + 6);
          ctx.lineTo(x0 - 3, y0 + 12);
          ctx.lineTo(x0 + 4, y0 + 18);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x0 + 4, y0 + 21, 2, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();
      return;
    }

    // Notes
    const headWidth = Math.min(fretWidth * 0.5, 12);
    const headHeight = headWidth * 0.7;
    const headY = baselineY - 5;

    // Note head (oval)
    ctx.save();
    ctx.translate(x, headY);
    ctx.rotate(-Math.PI / 6);
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      headWidth / 2,
      headHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    if (shape.filled) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
    ctx.restore();

    // Plica
    if (shape.stem) {
      const stemX = x + headWidth / 2 - 1;
      const stemTopY = headY - 22;

      ctx.beginPath();
      ctx.moveTo(stemX, headY);
      ctx.lineTo(stemX, stemTopY);
      ctx.stroke();

      // Banderines (una corchea = 1, semicorchea = 2, etc.)
      const flags = shape.flags || 0;
      for (let i = 0; i < flags; i++) {
        const fy = stemTopY + i * 6;
        ctx.beginPath();
        ctx.moveTo(stemX, fy);
        ctx.quadraticCurveTo(
          stemX + 8,
          fy + 2,
          stemX,
          fy + 8
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function renderChunk(blocks, interactiveRegions = null, chunkIndex = 0) {
    // console.log("renderChunk blocks:", blocks);

    const isFirstChunk = chunkIndex === 0;

    const BASE_FRET_WIDTH = 40;
    const COMPACT_FRET_WIDTH = 0; // Reduced width reserved for empty measures
    const STRING_SPACING = 40;
    const TOP_MARGIN = 100; // Increased for measure numbers
    const LEFT_MARGIN = isFirstChunk ? 60 : 20;
    const MAX_CANVAS_WIDTH = 10000;

    if (!blocks || !blocks.length) {
      console.warn("renderVisualTab: no blocks to render");
      return;
    }

    // 1. Pre-calcular layout (anchos variables)
    const blockLayouts = new Map();
    let totalWidthAllBlocks = 0;

    blocks.forEach((block) => {
      if (!block.strings || !block.strings.length) return;
      const len = block.strings[0].length;
      const columnX = new Float32Array(len);
      const columnWidths = new Float32Array(len);
      const isColumnCompact = new Uint8Array(len);

      // Detect empty measures
      let currentBarStart = 0;

      const checkRangeEmpty = (start, end) => {
        for (let c = start; c < end; c++) {
          for (let s = 0; s < block.strings.length; s++) {
            const char = block.strings[s][c];
            // If there is a digit or 'x' (dead note) then it is not empty
            if (/\d/.test(char) || char.toLowerCase() === "x") return false;
          }
        }
        return true;
      };

      for (let i = 0; i <= len; i++) {
        const isBar = (i < len && block.strings[0][i] === "|") || i === len;
        if (isBar) {
          // Review the previous range [currentBarStart, i)
          let start = currentBarStart;
          // If it starts with '|' skip it when checking for content
          if (start < len && block.strings[0][start] === "|") start++;

          if (start < i) {
            if (checkRangeEmpty(start, i)) {
              // Marcar columnas como compactas
              for (let k = start; k < i; k++) isColumnCompact[k] = 1;
            }
          }
          currentBarStart = i;
        }
      }

      let x = 0;
      for (let i = 0; i < len; i++) {
        columnX[i] = x;
        let w;

        const rhythmChar =
          block.rhythmStems && i < block.rhythmStems.length
            ? block.rhythmStems[i]
            : null;
        const isBar = block.strings[0][i] === "|";
        let isRestCol = false;

        if (rhythmChar && rhythmChar.toLowerCase() === "r") {
          isRestCol = true;
        } else if (block.strings) {
          let hasNote = false;
          let hasZ = false;
          for (let s = 0; s < block.strings.length; s++) {
            const ch = block.strings[s][i];
            if (/\d/.test(ch) || ch.toLowerCase() === "x") hasNote = true;
            if (ch && ch.toLowerCase() === "z") hasZ = true;
          }
          if (hasZ && !hasNote) isRestCol = true;
        }

        if (isBar) {
          w = 0; // no advance along the bar ruler
        } else if (isRestCol) {
          w = BASE_FRET_WIDTH; // rests use the fixed base width
        } else if (rhythmChar && rhythmChar !== "|") {
          if (rhythmChar.trim() === "") {
            w = COMPACT_FRET_WIDTH; // no figure: minimum spacing (0)
          } else {
            w = BASE_FRET_WIDTH * getRhythmWidthMultiplier(rhythmChar);
          }
        } else {
          // Use the compact width when flagged, otherwise fall back to the base width
          // (The '|' barlines keep the base width to create separators)
          w = isColumnCompact[i] ? COMPACT_FRET_WIDTH : BASE_FRET_WIDTH;
        }

        columnWidths[i] = w;
        x += w;
      }

      blockLayouts.set(block, { columnX, columnWidths, totalWidth: x });
      totalWidthAllBlocks += x;
    });

    // Adjust scale when exceeding the maximum width
    let scale = 1;
    let naturalWidth = LEFT_MARGIN + totalWidthAllBlocks + 100;

    if (naturalWidth > MAX_CANVAS_WIDTH) {
      scale = (MAX_CANVAS_WIDTH - LEFT_MARGIN - 100) / totalWidthAllBlocks;
      naturalWidth = MAX_CANVAS_WIDTH;
    }

    const width = naturalWidth;
    const height = TOP_MARGIN + 6 * STRING_SPACING + 100;

    canvas.width = width;
    canvas.height = height;

    const chunkInfo = currentChunks[chunkIndex];
    if (chunkInfo) {
      const prevWidth = chunkInfo.width || 0;
      const hadLayouts = !!chunkInfo.blockLayouts;
      chunkInfo.blockLayouts = blockLayouts;
      chunkInfo.scale = scale;
      chunkInfo.leftMargin = LEFT_MARGIN;
      chunkInfo.width = width;
      if (Math.abs(prevWidth - width) > 1) {
        recomputeChunkOffsets();
      }
      if (!hadLayouts || Math.abs(prevWidth - width) > 1) {
        rebuildCurrentTimeline();
      }
    }

    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    const stringColors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#a855f7",
    ];

    // Helper to iterate blocks with variable X
    function iterateBlocks(callback) {
      let currentX = LEFT_MARGIN;
      blocks.forEach((block) => {
        if (!block.strings.length) return;
        const layout = blockLayouts.get(block);
        if (!layout) return;

        const getX = (i) => currentX + layout.columnX[i] * scale;
        const getWidth = (i) => layout.columnWidths[i] * scale;

        callback(block, getX, getWidth);
        currentX += layout.totalWidth * scale;
      });
    }

    // 0. Draw Measure Numbers (Layer 0)
    iterateBlocks((block, getX, getWidth) => {
      if (block.measureNums) {
        const line = block.measureNums;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (/\d/.test(char)) {
            let num = char;
            let k = i + 1;
            while (k < line.length && /\d/.test(line[k])) {
              num += line[k];
              k++;
            }
            const x = getX(i);
            ctx.fillStyle = "#aaa";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(num, x, TOP_MARGIN - 50);
            i = k - 1;
          } else if (char === "|") {
            const x = getX(i);
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, TOP_MARGIN - 60);
            ctx.lineTo(x, height - 80);
            ctx.stroke();
          }
        }
      }
    });

    // 1. Draw Grid (Strings & Vertical Lines) (Layer 1)
    iterateBlocks((block, getX, getWidth) => {
      const blockLength = block.strings[0].length;
      for (let i = 0; i < blockLength; i++) {
        let isMeasureBar = false;
        if (block.strings[0][i] === "|") 
          isMeasureBar = true;

        // if (!isMeasureBar && i % 4 === 0) {
        //   const x = getX(i);
        //   ctx.strokeStyle = "#222";
        //   ctx.lineWidth = 1;
        //   ctx.beginPath();
        //   ctx.moveTo(x, TOP_MARGIN);
        //   ctx.lineTo(x, TOP_MARGIN + 5 * STRING_SPACING);
        //   ctx.stroke();
        // }
      }
    });

    // Draw PM Lines (Layer 1.5)
    iterateBlocks((block, getX, getWidth) => {
      if (block.pm) {
        const pmLine = block.pm;
        let inPM = false;
        let startIdx = -1;

        for (let i = 0; i < pmLine.length; i++) {
          const char = pmLine[i];
          if ((char === "P" || char === "M" || char === "-") && !inPM) {
            inPM = true;
            startIdx = i;
          } else if (char === "|" && inPM) {
            inPM = false;
            const startX = getX(startIdx);
            const endX = getX(i);

            ctx.strokeStyle = "#888";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, TOP_MARGIN - 20);
            ctx.lineTo(endX, TOP_MARGIN - 20);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(endX, TOP_MARGIN - 20);
            ctx.lineTo(endX, TOP_MARGIN - 10);
            ctx.stroke();

            ctx.fillStyle = "#888";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "left";
            ctx.fillText("P.M.", startX, TOP_MARGIN - 25);
          } else if (char === " " && inPM) {
            inPM = false;
            const startX = getX(startIdx);
            const endX = getX(i);

            ctx.strokeStyle = "#888";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, TOP_MARGIN - 20);
            ctx.lineTo(endX, TOP_MARGIN - 20);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#888";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "left";
            ctx.fillText("P.M.", startX, TOP_MARGIN - 25);
          }
        }
      }
    });

    // Horizontal Strings
    ctx.lineWidth = 3;
    for (let s = 0; s < 6; s++) {
      const y = TOP_MARGIN + s * STRING_SPACING;

      ctx.strokeStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      if (isFirstChunk) {
        ctx.fillStyle = stringColors[s];
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText(getStringLabel(s), 10, y + 7);
      }
    }

    // Draw Rhythm / Time Figures (Layer 4 - Bottom)
    iterateBlocks((block, getX, getWidth) => {
      const rhythmYOffset = showChords && block.chords ? 30 : 0;
      const bottomY = TOP_MARGIN + 5 * STRING_SPACING + 40 + rhythmYOffset;
      const middleY = TOP_MARGIN + 2.5 * STRING_SPACING + rhythmYOffset;

      if (block.rhythmStems) {
        const line = block.rhythmStems;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          const startX = getX(i);
          const w = getWidth(i);
          const x = startX + w / 2;

          // Detect rests via 'z' on the strings
          // A measure counts as a rest if it has no notes and contains at least one 'z' (or explicit 'r')
          let hasNote = false;
          let hasZ = false;
          if (block.strings) {
             for(let s=0; s<block.strings.length; s++) {
                 const char = block.strings[s][i];
                 if (/\d/.test(char) || char.toLowerCase() === 'x') {
                     hasNote = true;
                 }
                 if (char && char.toLowerCase() === 'z') {
                     hasZ = true;
                 }
             }
          }
          
          let isRest = false;
          if (ch.toLowerCase() === 'r') {
              isRest = true;
          } else if (hasZ && !hasNote) {
              isRest = true;
          }

          if (ch === "|") {
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, bottomY - 10);
            ctx.lineTo(x, bottomY + 20);
            ctx.stroke();
          } else if (ch !== " ") {
            if (isRest) {
                drawRhythmSymbol(ctx, ch, x, middleY - rhythmYOffset, w, true);
            } else {
                drawRhythmSymbol(ctx, ch, x, bottomY, w, false);
            }
          }
        }
      }
    });

    // 2. Draw Chord Blocks (Layer 2)
    if (showChords) {
      iterateBlocks((block, getX, getWidth) => {
        if (block.chords) {
          const chordLine = block.chords;
          const chordRegex = new RegExp(CHORD_TOKEN_REGEX);
          let match;
          let lastChordName = "";
          const chordOffset = chordLine.startsWith("x|") ? 2 : 0;

          while ((match = chordRegex.exec(chordLine)) !== null) {
            if (match.index < chordOffset) continue;

            const charIndex = match.index;
            let chordName = match[0];

            if (chordName === "*") {
              if (lastChordName) {
                chordName = lastChordName;
              } else {
                continue;
              }
            } else {
              lastChordName = chordName;
            }

            const x = getX(charIndex);

            let minString = 5;
            let maxString = 0;
            let hasNotes = false;

            for (let s = 0; s < 6; s++) {
              if (s < block.strings.length) {
                const fretInfo = getFretAt(block.strings[s], charIndex);
                if (fretInfo) {
                  if (s < minString) minString = s;
                  if (s > maxString) maxString = s;
                  hasNotes = true;
                }
              }
            }

            if (!hasNotes) {
              minString = 0;
              maxString = 5;
            }

            const blockTop = TOP_MARGIN + minString * STRING_SPACING - 20;
            const blockBottom = TOP_MARGIN + maxString * STRING_SPACING + 20;
            const blockHeight = blockBottom - blockTop;

            const gradient = ctx.createLinearGradient(x, blockTop, x, blockBottom);
            gradient.addColorStop(0, "#3b82f6");
            gradient.addColorStop(1, "#1d4ed8");
            ctx.fillStyle = gradient;

            const startX = getX(charIndex);
            const colW = Math.max(8, getWidth(charIndex));
            let fontSize = 22;
            const padding = 0;
            let availableW = Math.max(12, colW - 4);

            ctx.font = `bold ${fontSize}px Arial`;
            let textW = ctx.measureText(chordName).width;
            while (textW + padding > availableW && fontSize > 10) {
              fontSize -= 1;
              ctx.font = `bold ${fontSize}px Arial`;
              textW = ctx.measureText(chordName).width;
            }

            const w = availableW;

            ctx.beginPath();
            ctx.roundRect(startX, blockTop, w, blockHeight, 10);
            ctx.fill();

            ctx.strokeStyle = "#60a5fa";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0,0,0,0.65)";
            ctx.shadowBlur = 6;
            ctx.fillText(
              chordName,
              startX + w / 2,
              blockTop + blockHeight / 2 + 8
            );
            ctx.shadowBlur = 0;

            if (interactiveRegions) {
              let frets = [];
              for (let s = 0; s < 6; s++) {
                if (s < block.strings.length) {
                  const fretInfo = getFretAt(block.strings[s], charIndex);
                  if (fretInfo) {
                    frets.push(fretInfo.value);
                  } else if (/[xX]/.test(block.strings[s][charIndex])) {
                    frets.push("x");
                  } else {
                    frets.push("x");
                  }
                } else {
                  frets.push("x");
                }
              }
              interactiveRegions.push({
                x: startX,
                y: blockTop,
                w,
                h: blockHeight,
                tooltip: frets.join("-"),
              });
            }
          }
        }
      });
    }

    // 3. Draw Notes (Layer 3)
    iterateBlocks((block, getX, getWidth) => {
      const chordPositions = new Set();
      if (showChords && block.chords) {
        const chordRegex = new RegExp(CHORD_TOKEN_REGEX);
        const chordOffset = block.chords.startsWith("x|") ? 2 : 0;
        let match;
        while ((match = chordRegex.exec(block.chords)) !== null) {
          if (match.index >= chordOffset) chordPositions.add(match.index);
        }
      }

      for (let s = 0; s < 6; s++) {
        if (s >= block.strings.length) continue;

        const line = block.strings[s];
        const y = TOP_MARGIN + s * STRING_SPACING;

        for (let i = 0; i < line.length; i++) {
          const startX = getX(i);
          const w = getWidth(i);
          const centerX = startX + w / 2;
          const fretInfo = getFretAt(line, i);

          if (fretInfo) {
            if (chordPositions.has(i)) {
              continue;
            }

            const baseColor = stringColors[s];
            const lightColor = lightenColor(baseColor, 0.3);
            const availableW = Math.max(6, w);
            const noteWidth = Math.max(14, availableW - 2);
            const noteHeight = 32; // fixed height; only width tracks the rhythm value
            const radius = noteHeight / 2;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
            ctx.shadowBlur = 6;

            const grad = ctx.createLinearGradient(
              centerX,
              y - noteHeight / 2,
              centerX,
              y + noteHeight / 2
            );
            grad.addColorStop(0, lightColor);
            grad.addColorStop(1, baseColor);
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.roundRect(
              startX + (w - noteWidth) / 2,
              y - noteHeight / 2,
              noteWidth,
              noteHeight,
              radius
            );
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 4;
            ctx.fillText(fretInfo.value, centerX, y + 5);
            ctx.restore();
            continue;
          }

          const char = line[i];
          if (char.toLowerCase() === "h" || char.toLowerCase() === "p") {
            let prevIndex = -1;
            for (let k = i - 1; k >= 0; k--) {
              if (!isNaN(parseInt(line[k]))) {
                prevIndex = k;
                break;
              }
            }

            let nextIndex = -1;
            for (let k = i + 1; k < line.length; k++) {
              if (!isNaN(parseInt(line[k]))) {
                nextIndex = k;
                break;
              }
            }

            if (prevIndex !== -1 && nextIndex !== -1) {
              ctx.save();
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();

              const startX = getX(prevIndex);
              const endX = getX(nextIndex);
              const midX = (startX + endX) / 2;
              const noteRadius = 16;

              ctx.moveTo(startX, y - noteRadius);
              const dist = Math.abs(nextIndex - prevIndex); // This is index dist, maybe use pixel dist?
              // Pixel dist:
              const pixelDist = Math.abs(endX - startX);
              const curveHeight = 30 + pixelDist * 0.1; // Adjusted for pixel dist

              ctx.quadraticCurveTo(midX, y - curveHeight, endX, y - noteRadius);
              ctx.stroke();
              ctx.restore();

              ctx.fillStyle = "#fff";
              ctx.font = "bold 14px Arial";
              ctx.textAlign = "center";
              ctx.fillText(char.toUpperCase(), midX, y - curveHeight / 2 - 20);
            }
          } else if (char === "/") {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - w / 2, y + 10);
            ctx.lineTo(x + w / 2, y - 10);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    });
  }

  const CHUNK_APPROX_BASE_WIDTH = 40;
  const CHUNK_APPROX_EXTRA_PADDING = 100;
  const CHUNK_MIN_WIDTH = 400;
  const CHUNK_MAX_WIDTH = 10000;

  function getBlockMaxColumns(block) {
    if (!block) return 0;
    let maxLen = 0;
    if (Array.isArray(block.strings)) {
      block.strings.forEach((line) => {
        if (typeof line === "string" && line.length > maxLen) {
          maxLen = line.length;
        }
      });
    }
    ["measureNums", "rhythmStems", "rhythmBeams", "chords", "pm"].forEach(
      (key) => {
        const line = block[key];
        if (typeof line === "string" && line.length > maxLen) {
          maxLen = line.length;
        }
      }
    );
    return maxLen;
  }

  function estimateChunkWidth(blocks, chunkIndex) {
    if (!Array.isArray(blocks) || !blocks.length) {
      return CHUNK_MIN_WIDTH;
    }
    let maxColumns = 0;
    blocks.forEach((block) => {
      maxColumns = Math.max(maxColumns, getBlockMaxColumns(block));
    });
    if (!maxColumns) {
      maxColumns = 32;
    }
    const leftMargin = chunkIndex === 0 ? 60 : 20;
    let approxWidth =
      leftMargin +
      maxColumns * CHUNK_APPROX_BASE_WIDTH +
      CHUNK_APPROX_EXTRA_PADDING;
    approxWidth = Math.max(CHUNK_MIN_WIDTH, Math.min(CHUNK_MAX_WIDTH, approxWidth));
    return approxWidth;
  }

  // Render the entire tab by creating one canvas per chunk
  function renderVisualTab(blocks) {
    // console.log("renderVisualTab (multi-chunk) blocks:", blocks);

    if (!canvasWrapper || !baseCanvas) {
      console.error("No canvas wrapper or base canvas found");
      return;
    }

    // Limpiar canvases anteriores del wrapper
    canvasWrapper.innerHTML = "";

    // Build the chunks
    const chunks = createChunks(blocks);
    if (!chunks.length) {
      console.warn("No chunks generated, nothing to render");
      return;
    }

    currentChunks = [];
    playbackBlocks = [];
    activePlayheadChunk = -1;

    chunks.forEach((chunkBlocks, index) => {
      let chunkCanvas;

      if (index === 0) {
        // Reuse the base canvas
        chunkCanvas = baseCanvas;
      } else {
        // Clone the base without children or content
        chunkCanvas = baseCanvas.cloneNode(false);
        // Evitamos IDs duplicados
        chunkCanvas.removeAttribute("id");
      }

      chunkCanvas.classList.add("tab-canvas-chunk");
      const chunkContainer = document.createElement("div");
      chunkContainer.className = "tab-chunk-container";
      chunkContainer.appendChild(chunkCanvas);

      const chunkPlayheadLine = document.createElement("div");
      chunkPlayheadLine.className = "playhead-line";
      chunkPlayheadLine.style.display = "none";
      chunkContainer.appendChild(chunkPlayheadLine);

      canvasWrapper.appendChild(chunkContainer);

      const approxWidth = estimateChunkWidth(chunkBlocks, index);
      currentChunks.push({
        canvas: chunkCanvas,
        container: chunkContainer,
        playheadLine: chunkPlayheadLine,
        blocks: chunkBlocks,
        rendered: false,
        blockLayouts: null,
        scale: 1,
        leftMargin: index === 0 ? 60 : 20,
        width: approxWidth,
        absOffset: 0,
      });

      chunkBlocks.forEach((block) => {
        playbackBlocks.push({ chunkIndex: index, block });
      });
    });

    recomputeChunkOffsets();

    // Disconnect any previously registered observer
    if (chunkObserver) {
      chunkObserver.disconnect();
    }

    // Observer that renders canvases lazily as they enter the viewport
    chunkObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.chunkIndex);
          const info = currentChunks[idx];
          if (!info) return;

          if (entry.isIntersecting && !info.rendered) {
            // Chunk enters the viewport -> LOAD IT
            canvas = info.canvas;
            ctx = info.canvas.getContext("2d");
            // console.log("Rendering chunk", idx, "into canvas", info.canvas);
            info.interactiveRegions = [];
            renderChunk(info.blocks, info.interactiveRegions, idx);
            info.rendered = true;
          } else if (
            !entry.isIntersecting &&
            info.rendered &&
            !isPlaying &&
            !isPreRenderingChunks
          ) {
            // Chunk leaves the viewport -> UNLOAD IT
            const cctx = info.canvas.getContext("2d");
            // console.log("Clearing chunk", idx);
            cctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
            info.rendered = false;
            if (info.playheadLine) {
              info.playheadLine.style.display = "none";
            }
            if (activePlayheadChunk === idx) {
              activePlayheadChunk = -1;
            }
          }
        });
      },
      {
        root: canvasWrapper, // horizontal scroll belongs to the wrapper
        // threshold: 0.1, // 10% visibility is enough
        rootMargin: "0px 200px" // preload slightly before entering view
      }
    );

    // Register each canvas in the observer
    currentChunks.forEach((info, idx) => {
      info.canvas.dataset.chunkIndex = idx;
      chunkObserver.observe(info.canvas);
    });

    // Event listeners for tooltips
    canvasWrapper.addEventListener("mousemove", (e) => {
      if (
        e.target.tagName === "CANVAS" &&
        e.target.classList.contains("tab-canvas-chunk")
      ) {
        const chunkIdx = e.target.dataset.chunkIndex;
        const chunkInfo = currentChunks[chunkIdx];
        if (chunkInfo && chunkInfo.interactiveRegions) {
          const canvasRect = e.target.getBoundingClientRect();
          const mouseX = e.clientX - canvasRect.left;
          const mouseY = e.clientY - canvasRect.top;

          const region = chunkInfo.interactiveRegions.find(
            (r) =>
              mouseX >= r.x &&
              mouseX <= r.x + r.w &&
              mouseY >= r.y &&
              mouseY <= r.y + r.h
          );

          if (region) {
            tooltipEl.textContent = region.tooltip;
            tooltipEl.style.display = "block";
            tooltipEl.style.left = e.clientX + 10 + "px";
            tooltipEl.style.top = e.clientY + 10 + "px";
          } else {
            tooltipEl.style.display = "none";
          }
        }
      } else {
        tooltipEl.style.display = "none";
      }
    });

    canvasWrapper.addEventListener("mouseleave", () => {
      tooltipEl.style.display = "none";
    });

    rebuildCurrentTimeline();
  }

  // Polyfill for roundRect if needed (Chrome supports it, but just in case)
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // --- Chord Detection Logic ---
  const NOTE_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  function midiToNoteLabel(midi) {
    if (typeof midi !== "number" || !isFinite(midi)) return null;
    const note = NOTE_NAMES[midi % 12] || "";
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  }
  const NOTE_NAMES_LATIN = [
    "Do",
    "Do#",
    "Re",
    "Re#",
    "Mi",
    "Fa",
    "Fa#",
    "Sol",
    "Sol#",
    "La",
    "La#",
    "Si",
  ];

  const STANDARD_TUNING_MIDI = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2
  const DEFAULT_STRING_NAMES = ["e", "B", "G", "D", "A", "E"];

  const CHORD_PATTERNS = [
    { name: "Major", suffix: "", intervals: [0, 4, 7] },
    { name: "Minor", suffix: "m", intervals: [0, 3, 7] },
    { name: "5", suffix: "5", intervals: [0, 7] },
    { name: "Dim", suffix: "dim", intervals: [0, 3, 6] },
    { name: "Aug", suffix: "aug", intervals: [0, 4, 8] },
    { name: "Sus2", suffix: "sus2", intervals: [0, 2, 7] },
    { name: "Sus4", suffix: "sus4", intervals: [0, 5, 7] },
    { name: "Maj7", suffix: "maj7", intervals: [0, 4, 7, 11] },
    { name: "m7", suffix: "m7", intervals: [0, 3, 7, 10] },
    { name: "7", suffix: "7", intervals: [0, 4, 7, 10] },
  ];

  function getNoteName(midi) {
    const pc = midi % 12;
    return currentNotation === "latin" ? NOTE_NAMES_LATIN[pc] : NOTE_NAMES[pc];
  }

  function detectChord(notePcs) {
    const pcs = Array.from(new Set(notePcs));
    if (pcs.length === 0) return null;
    pcs.sort((a, b) => a - b);

    if (pcs.length === 2) {
      const [a, b] = pcs;
      const intervalAB = (b - a + 12) % 12;
      const intervalBA = (a - b + 12) % 12;
      if (intervalAB === 7 || intervalBA === 7) {
        const rootPc = intervalAB === 7 ? a : b;
        return { name: getNoteName(rootPc) + "5" };
      }
    }

    let bestMatch = null;
    pcs.forEach((rootPc) => {
      const intervals = pcs
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);
      const intervalSet = new Set(intervals);

      CHORD_PATTERNS.forEach((pattern) => {
        if (pattern.intervals.every((i) => intervalSet.has(i))) {
          const score = pattern.intervals.length;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { rootPc, pattern, score };
          }
        }
      });
    });

    if (bestMatch) {
      return { name: getNoteName(bestMatch.rootPc) + bestMatch.pattern.suffix };
    }
    return null;
  }

  function generateChordLine(block) {
    // Create a line of spaces matching the length of the strings
    const length = block.strings[0].length;
    let chordLine = Array(length).fill(" ");

    // We need to prefix with 'x|' to match the format expected by renderVisualTab
    // But renderVisualTab expects 'x|' at the beginning of the string.
    // The length of the string includes the prefix 'e|' etc.
    // So we should start filling from index 2 (after 'x|')

    // Wait, the strings in block.strings include the prefix 'e|'.
    // So we should iterate from index 0 to length.
    // But usually tabs have 'e|--...'
    // We should only detect chords where there are notes.

    let lastWrittenChord = "";
    let lastChordEnd = -1;
    let lastFullChordIndex = -1;

    for (let i = 0; i < length; i++) {
      // Check if this column has notes
      let notesMidi = [];

      for (let s = 0; s < 6; s++) {
        if (s < block.strings.length) {
          const fretInfo = getFretAt(block.strings[s], i);
            if (fretInfo) {
            const openMidi = getOpenStringMidi(s);
            if (openMidi !== null) {
              notesMidi.push(openMidi + parseInt(fretInfo.value, 10));
            }
            }
        }
      }

      if (notesMidi.length >= 2) {
        const notesPc = notesMidi.map((m) => m % 12);
        const chord = detectChord(notesPc);

        if (chord) {
          const name = chord.name;
          
          // Check if we overlap with previous text
          const overlaps = i < lastChordEnd;

          const isSameChord = name === lastWrittenChord;
          const farFromLastFull =
            lastFullChordIndex === -1 || i - lastFullChordIndex > 16;

          if (overlaps) {
            if (i < length) {
              chordLine[i] = "*";
              lastChordEnd = Math.max(lastChordEnd, i + 1);
              lastWrittenChord = name;
            }
          } else if (!isSameChord || farFromLastFull) {
            for (let k = 0; k < name.length; k++) {
              if (i + k < length) {
                chordLine[i + k] = name[k];
              }
            }
            lastChordEnd = i + name.length;
            lastWrittenChord = name;
            lastFullChordIndex = i;
          } else {
            if (i < length) {
              chordLine[i] = "*";
              lastChordEnd = Math.max(lastChordEnd, i + 1);
              lastWrittenChord = name;
            }
          }
        }
      }
      // Note: we do NOT reset lastWrittenChord on gaps/single notes.
      // This allows: Chord -> Gap -> Chord (same) to be marked as '*' or handled correctly.
      // Actually, if there is a gap, we might want to write the full name again?
      // User said "F#5 three times". If spaced, "F#5 ... F#5 ... F#5".
      // If we use '*', it becomes "F#5 ... * ... *".
      // This is cleaner and avoids the "EE" merge issue if they are close.
    }

    // Construct the line
    // The prefix should be 'x|'
    // But the array corresponds to the whole line including prefix.
    // The strings usually start with 'e|'.
    // So we should make sure the first 2 chars are 'x|'.

    chordLine[0] = "x";
    chordLine[1] = "|";

    return chordLine.join("");
  }

  await loadTabs();
}

function initVisualTab() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderVisualTab, {
      once: true,
    });
  } else {
    renderVisualTab();
  }
}

if (!window.__COMPONENT_ROUTER_ACTIVE) {
  initVisualTab();
}

window.renderVisualTab = renderVisualTab;

})();
