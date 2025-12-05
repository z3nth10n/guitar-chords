// ===================== Basic Configuration =====================
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

let currentNotation = "latin";

function getNoteName(midiOrPc, withOctave = false) {
  const pc = midiOrPc % 12;
  const name = currentNotation === "latin" ? NOTE_NAMES_LATIN[pc] : NOTE_NAMES[pc];
  if (withOctave) {
    const octave = Math.floor(midiOrPc / 12) - 1;
    return name + octave;
  }
  return name;
}

// Standard MIDI tuning: E2, A2, D3, G3, B3, E4
const STRING_TUNINGS = [
  { name: "6th (E)", midi: 40 },
  { name: "5th (A)", midi: 45 },
  { name: "4th (D)", midi: 50 },
  { name: "3rd (G)", midi: 55 },
  { name: "2nd (B)", midi: 59 },
  { name: "1st (E)", midi: 64 },
];

const MAX_FRET = 20;

// ===================== Advanced Detection Settings =====================
const DEFAULT_DETECTION_SETTINGS = {
  historyWindowMs: 900,   // 0.9s window of recent notes
  minNotesForChord: 3,    // min. distinct notes to consider a chord
  maxDeviationCents: 35,  // filter out very out-of-tune notes
  noteHoldTimeMs: 100,    // note retention time on screen
  chordMinQuality: 0.52,  // quality threshold to accept a chord
  minVolumeRms: 0.003,    // minimum volume threshold (RMS)
};

let NOTE_HISTORY_WINDOW_MS = DEFAULT_DETECTION_SETTINGS.historyWindowMs;
let MIN_NOTES_FOR_CHORD = DEFAULT_DETECTION_SETTINGS.minNotesForChord;
let MAX_DEVIATION_CENTS = DEFAULT_DETECTION_SETTINGS.maxDeviationCents;
let NOTE_HOLD_TIME_MS = DEFAULT_DETECTION_SETTINGS.noteHoldTimeMs;
let CHORD_MIN_QUALITY = DEFAULT_DETECTION_SETTINGS.chordMinQuality;
let MIN_VOLUME_RMS = DEFAULT_DETECTION_SETTINGS.minVolumeRms;

// Store recently detected notes: { pc, time }
let recentNotes = [];

// ===================== Note History Helpers =====================
function registerNoteEvent(noteInfo, timestampMs) {
  if (
    !noteInfo ||
    typeof noteInfo.midi !== "number" ||
    typeof noteInfo.cents !== "number"
  ) {
    return;
  }

  // Discard very out-of-tune notes (usually noise / bad detection)
  if (Math.abs(noteInfo.cents) > MAX_DEVIATION_CENTS) {
    return;
  }

  const pc = ((noteInfo.midi % 12) + 12) % 12;
  const midi = noteInfo.midi;

  const last = recentNotes[recentNotes.length - 1];
  if (
    last &&
    last.pc === pc &&
    Math.abs(last.midi - midi) <= 1 &&
    timestampMs - last.time < 80
  ) {
    // Practically the same note, refresh time and keep the lowest one
    last.time = timestampMs;
    if (midi < last.midi) last.midi = midi;
  } else {
    recentNotes.push({ pc, midi, time: timestampMs });
  }

  const cutoff = timestampMs - NOTE_HISTORY_WINDOW_MS;
  recentNotes = recentNotes.filter((n) => n.time >= cutoff);
}

function resetNoteHistoryIfIdle(timestampMs) {
  const last = recentNotes[recentNotes.length - 1];
  if (!last) return;
  if (timestampMs - last.time > NOTE_HISTORY_WINDOW_MS) {
    recentNotes = [];
  }
}

function getNoteStatsFromHistory() {
  const statsMap = new Map(); // pc -> { pc, count, minMidi, maxMidi }

  for (const n of recentNotes) {
    let s = statsMap.get(n.pc);
    if (!s) {
      s = { pc: n.pc, count: 0, minMidi: n.midi, maxMidi: n.midi };
      statsMap.set(n.pc, s);
    }
    s.count++;
    if (n.midi < s.minMidi) s.minMidi = n.midi;
    if (n.midi > s.maxMidi) s.maxMidi = n.midi;
  }

  return Array.from(statsMap.values());
}

const CHORD_TYPES = [
  { key: "chord_major", short: "", intervals: [0, 4, 7] },
  { key: "chord_minor", short: "m", intervals: [0, 3, 7] },
  { key: "chord_5", short: "5", intervals: [0, 7] },
  { key: "chord_dom7", short: "7", intervals: [0, 4, 7, 10] },
  { key: "chord_maj7", short: "maj7", intervals: [0, 4, 7, 11] },
  { key: "chord_m7", short: "m7", intervals: [0, 3, 7, 10] },
  { key: "chord_dim", short: "dim", intervals: [0, 3, 6] },
  { key: "chord_aug", short: "aug", intervals: [0, 4, 8] },
  { key: "chord_sus2", short: "sus2", intervals: [0, 2, 7] },
  { key: "chord_sus4", short: "sus4", intervals: [0, 5, 7] },
  { key: "chord_maj6", short: "6", intervals: [0, 4, 7, 9] },
  { key: "chord_m6", short: "m6", intervals: [0, 3, 7, 9] },
  { key: "chord_9", short: "9", intervals: [0, 4, 7, 10, 2] },
  { key: "chord_maj9", short: "maj9", intervals: [0, 4, 7, 11, 2] },
  { key: "chord_m9", short: "m9", intervals: [0, 3, 7, 10, 2] },
  { key: "chord_11", short: "11", intervals: [0, 4, 7, 10, 2, 5] },
  { key: "chord_m11", short: "m11", intervals: [0, 3, 7, 10, 2, 5] },
  { key: "chord_13", short: "13", intervals: [0, 4, 7, 10, 2, 5, 9] },
  { key: "chord_maj13", short: "maj13", intervals: [0, 4, 7, 11, 2, 9] },
  { key: "chord_m13", short: "m13", intervals: [0, 3, 7, 10, 2, 5, 9] },
  { key: "chord_mmaj7", short: "m(maj7)", intervals: [0, 3, 7, 11] },
  { key: "chord_6_9", short: "6/9", intervals: [0, 4, 7, 9, 2] },
  { key: "chord_7sus4", short: "7sus4", intervals: [0, 5, 7, 10] },
  { key: "chord_7b5", short: "7b5", intervals: [0, 4, 6, 10] },
  { key: "chord_7b9", short: "7b9", intervals: [0, 4, 7, 10, 1] },
  { key: "chord_9sus4", short: "9sus4", intervals: [0, 5, 7, 10, 2] },
  { key: "chord_add9", short: "add9", intervals: [0, 4, 7, 2] },
  { key: "chord_aug9", short: "aug9", intervals: [0, 4, 8, 10, 2] },
];

// ===================== Audio State =====================
let audioContext = null;
let analyser = null;
let mediaStream = null;
let running = false;

const timeDomainBufferSize = 2048;
let timeDomainBuffer = null;

let lastAnalysisTime = 0;
let analysisInterval = 50; // ms

let lastNoteTimestamp = 0;

// ===================== UI Elements =====================
const toggleButton = document.getElementById("toggleButton");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const chordDisplay = document.getElementById("chordDisplay");
const chordFreqDisplay = document.getElementById("chordFreqDisplay");
const chordNotes = document.getElementById("chordNotes");
const noteDisplay = document.getElementById("noteDisplay");
const noteDetail = document.getElementById("noteDetail");
const stringFretDisplay = document.getElementById("stringFretDisplay");
const stringFretDetail = document.getElementById("stringFretDetail");
const errorsEl = document.getElementById("errors");
const langSelect = document.getElementById("langSelect");
const intervalInput = document.getElementById("intervalInput");
const saveIntervalBtn = document.getElementById("saveIntervalBtn");

const historyWindowInput = document.getElementById("historyWindowInput");
const minNotesForChordInput = document.getElementById("minNotesForChordInput");
const maxDeviationCentsInput = document.getElementById("maxDeviationCentsInput");
const noteHoldTimeInput = document.getElementById("noteHoldTimeInput");
const chordMinQualityInput = document.getElementById("chordMinQualityInput");
const minVolumeRmsInput = document.getElementById("minVolumeRmsInput");
const saveDetectionSettingsBtn = document.getElementById("saveDetectionSettingsBtn");
const resetDetectionSettingsBtn = document.getElementById("resetDetectionSettingsBtn");

const enableLogsCheckbox = document.getElementById("enableLogsCheckbox");
const clearLogsBtn = document.getElementById("clearLogsBtn");
const logOutputEl = document.getElementById("logOutput");
const showOctaveCb = document.getElementById("showOctaveCb");

const waveCanvas = document.getElementById("waveCanvas");
const waveCtx = waveCanvas.getContext("2d");

// ===================== Utilities =====================
function log2(x) {
  return Math.log(x) / Math.LN2;
}

// ===================== Logging / Debug =====================
const LOG_ENABLED_KEY = "chordDetectorLogsEnabled";
const DETECTION_SETTINGS_KEY = "chordDetectorDetectionSettings";
const SHOW_OCTAVE_KEY = "guitar_show_octave";
const LOG_MAX_LINES = 200;

let loggingEnabled = true;
let showOctave = false;
let lastLoggedNoteMidi = null;
let lastLoggedChordLabel = "";

function logMessage(message) {
  if (!loggingEnabled || !logOutputEl) return;

  const now = new Date();
  const stamp = now.toLocaleTimeString();
  const line = `[${stamp}] ${message}`;

  if (logOutputEl.textContent && logOutputEl.textContent.length > 0) {
    logOutputEl.textContent = line + "\n" + logOutputEl.textContent;
  } else {
    logOutputEl.textContent = line;
  }

  const lines = logOutputEl.textContent.split("\n");
  if (lines.length > LOG_MAX_LINES) {
    logOutputEl.textContent = lines.slice(0, LOG_MAX_LINES).join("\n");
  }
}

function initLogUI() {
  if (showOctaveCb) {
    const stored = localStorage.getItem(SHOW_OCTAVE_KEY);
    showOctave = stored === "true";
    showOctaveCb.checked = showOctave;
    showOctaveCb.addEventListener("change", (e) => {
      showOctave = e.target.checked;
      localStorage.setItem(SHOW_OCTAVE_KEY, showOctave);
    });
  }

  if (enableLogsCheckbox) {
    const stored = localStorage.getItem(LOG_ENABLED_KEY);
    if (stored !== null) {
      loggingEnabled = stored === "true";
      enableLogsCheckbox.checked = loggingEnabled;
    } else {
      loggingEnabled = true;
      enableLogsCheckbox.checked = true;
    }

    enableLogsCheckbox.addEventListener("change", () => {
      loggingEnabled = !!enableLogsCheckbox.checked;
      localStorage.setItem(LOG_ENABLED_KEY, loggingEnabled ? "true" : "false");
      if (loggingEnabled) logMessage(window.t ? window.t("msg_logs_enabled") : "Logs enabled.");
    });
  }

  if (clearLogsBtn && logOutputEl) {
    clearLogsBtn.addEventListener("click", () => {
      logOutputEl.textContent = "";
    });
  }
}

// ===================== Detection Settings (localStorage) =====================
function applyDetectionSettings(settings) {
  NOTE_HISTORY_WINDOW_MS = settings.historyWindowMs;
  MIN_NOTES_FOR_CHORD = settings.minNotesForChord;
  MAX_DEVIATION_CENTS = settings.maxDeviationCents;
  NOTE_HOLD_TIME_MS = settings.noteHoldTimeMs;
  CHORD_MIN_QUALITY = settings.chordMinQuality;
  MIN_VOLUME_RMS = settings.minVolumeRms;
}

function reflectDetectionSettingsInInputs(settings) {
  if (historyWindowInput) {
    historyWindowInput.value = settings.historyWindowMs;
  }
  if (minNotesForChordInput) {
    minNotesForChordInput.value = settings.minNotesForChord;
  }
  if (maxDeviationCentsInput) {
    maxDeviationCentsInput.value = settings.maxDeviationCents;
  }
  if (noteHoldTimeInput) {
    noteHoldTimeInput.value = settings.noteHoldTimeMs;
  }
  if (chordMinQualityInput) {
    chordMinQualityInput.value = settings.chordMinQuality;
  }
  if (minVolumeRmsInput) {
    minVolumeRmsInput.value = settings.minVolumeRms;
  }
}

function loadDetectionSettingsFromStorage() {
  let settings = { ...DEFAULT_DETECTION_SETTINGS };
  const stored = localStorage.getItem(DETECTION_SETTINGS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.historyWindowMs === "number" && parsed.historyWindowMs > 0) {
        settings.historyWindowMs = parsed.historyWindowMs;
      }
      if (typeof parsed.minNotesForChord === "number" && parsed.minNotesForChord >= 1) {
        settings.minNotesForChord = parsed.minNotesForChord;
      }
      if (typeof parsed.maxDeviationCents === "number" && parsed.maxDeviationCents > 0) {
        settings.maxDeviationCents = parsed.maxDeviationCents;
      }
      if (typeof parsed.noteHoldTimeMs === "number" && parsed.noteHoldTimeMs >= 0) {
        settings.noteHoldTimeMs = parsed.noteHoldTimeMs;
      }
      if (typeof parsed.chordMinQuality === "number" && parsed.chordMinQuality >= 0) {
        settings.chordMinQuality = parsed.chordMinQuality;
      }
      if (typeof parsed.minVolumeRms === "number" && parsed.minVolumeRms >= 0) {
        settings.minVolumeRms = parsed.minVolumeRms;
      }
    } catch (e) {
      console.warn("Could not parse detection settings from storage:", e);
    }
  }
  applyDetectionSettings(settings);
  reflectDetectionSettingsInInputs(settings);
  
  const msg = window.t 
    ? window.t("msg_settings_loaded", settings.historyWindowMs, settings.minNotesForChord, settings.maxDeviationCents, settings.noteHoldTimeMs, settings.chordMinQuality, settings.minVolumeRms)
    : `Advanced settings loaded (window=${settings.historyWindowMs}ms, min notes=${settings.minNotesForChord}, max dev=${settings.maxDeviationCents}cents, hold=${settings.noteHoldTimeMs}ms, quality=${settings.chordMinQuality}, vol=${settings.minVolumeRms})`;
  logMessage(msg);
}

function readDetectionSettingsFromInputs() {
  const settings = { ...DEFAULT_DETECTION_SETTINGS };

  if (historyWindowInput) {
    const v = parseInt(historyWindowInput.value, 10);
    if (!isNaN(v) && v > 0) settings.historyWindowMs = v;
  }
  if (minNotesForChordInput) {
    const v = parseInt(minNotesForChordInput.value, 10);
    if (!isNaN(v) && v >= 1) settings.minNotesForChord = v;
  }
  if (maxDeviationCentsInput) {
    const v = parseInt(maxDeviationCentsInput.value, 10);
    if (!isNaN(v) && v > 0) settings.maxDeviationCents = v;
  }
  if (noteHoldTimeInput) {
    const v = parseInt(noteHoldTimeInput.value, 10);
    if (!isNaN(v) && v >= 0) settings.noteHoldTimeMs = v;
  }
  if (chordMinQualityInput) {
    const v = parseFloat(chordMinQualityInput.value);
    if (!isNaN(v) && v >= 0 && v <= 1) settings.chordMinQuality = v;
  }
  if (minVolumeRmsInput) {
    const v = parseFloat(minVolumeRmsInput.value);
    if (!isNaN(v) && v >= 0) settings.minVolumeRms = v;
  }

  return settings;
}

function saveDetectionSettingsFromInputs() {
  const settings = readDetectionSettingsFromInputs();
  localStorage.setItem(DETECTION_SETTINGS_KEY, JSON.stringify(settings));
  applyDetectionSettings(settings);
  
  const msg = window.t 
    ? window.t("msg_settings_saved", settings.historyWindowMs, settings.minNotesForChord, settings.maxDeviationCents, settings.noteHoldTimeMs, settings.chordMinQuality, settings.minVolumeRms)
    : `Advanced settings saved (window=${settings.historyWindowMs}ms, min notes=${settings.minNotesForChord}, max dev=${settings.maxDeviationCents}cents, hold=${settings.noteHoldTimeMs}ms, quality=${settings.chordMinQuality}, vol=${settings.minVolumeRms})`;
  logMessage(msg);
}

function resetDetectionSettingsToDefaults() {
  const settings = { ...DEFAULT_DETECTION_SETTINGS };
  applyDetectionSettings(settings);
  reflectDetectionSettingsInInputs(settings);
  localStorage.setItem(DETECTION_SETTINGS_KEY, JSON.stringify(settings));
  recentNotes = [];
  logMessage(window.t ? window.t("msg_settings_reset") : "Advanced settings reset to default.");
}

function initAdvancedSettingsAndLogsUI() {
  initLogUI();
  loadDetectionSettingsFromStorage();

  if (saveDetectionSettingsBtn) {
    saveDetectionSettingsBtn.addEventListener("click", () => {
      saveDetectionSettingsFromInputs();
    });
  }
  if (resetDetectionSettingsBtn) {
    resetDetectionSettingsBtn.addEventListener("click", () => {
      resetDetectionSettingsToDefaults();
    });
  }
}

function frequencyToNote(freq) {
  // Convert frequency to approximate MIDI note
  const midi = Math.round(69 + 12 * log2(freq / 440));
  const pc = ((midi % 12) + 12) % 12;
  const name = getNoteName(midi, showOctave);
  const exactFreq = 440 * Math.pow(2, (midi - 69) / 12);
  const cents = 1200 * log2(freq / exactFreq);
  return { midi, name, exactFreq, cents, freq };
}

function guessStringAndFret(midi) {
  let best = null;
  for (const s of STRING_TUNINGS) {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const noteMidi = s.midi + fret;
      const diff = Math.abs(noteMidi - midi);
      if (best === null || diff < best.diff) {
        best = { string: s, fret, diff };
      }
    }
  }
  return best;
}

// ===================== Autocorrelation for Pitch Detection =====================
function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;

  // Calculate RMS to filter silence/very low noise
  let sumSquares = 0;
  for (let i = 0; i < size; i++) {
    const v = buffer[i];
    sumSquares += v * v;
  }
  const rms = Math.sqrt(sumSquares / size);
  if (rms < MIN_VOLUME_RMS) return null; // too silent

  let bestOffset = -1;
  let bestCorrelation = 0;

  // Try different offsets (periods)
  const minOffset = 20; // ~2 kHz
  const maxOffset = size / 2; // lower frequency limit

  for (let offset = minOffset; offset < maxOffset; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxOffset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / maxOffset;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset === -1) return null;

  const frequency = sampleRate / bestOffset;
  // Filter frequencies outside typical guitar range (approx)
  if (frequency < 70 || frequency > 1500) return null;

  return frequency;
}

// ===================== Chord Detection (from note history) =====================
function detectChordFromSpectrum() {
  // Now we ignore the spectrum and use only the notes detected by autocorrelation
  const stats = getNoteStatsFromHistory();
  if (stats.length < MIN_NOTES_FOR_CHORD) return null;

  // Sort by frequency of appearance
  stats.sort((a, b) => b.count - a.count);

  const noteClasses = stats.map((s) => s.pc);
  const lowestMidi = stats.reduce(
    (min, s) => (s.minMidi < min ? s.minMidi : min),
    stats[0].minMidi
  );

  // Common guitar chord types (to avoid getting too crazy with 9/11/13 all the time)
  const SIMPLE_CHORD_KEYS = new Set([
    "chord_major",
    "chord_minor",
    "chord_5",
    "chord_dom7",
    "chord_maj7",
    "chord_m7",
    "chord_maj6",
    "chord_m6",
    "chord_sus2",
    "chord_sus4",
    "chord_dim",
    "chord_aug",
  ]);

  const candidateTypes = CHORD_TYPES.filter((t) => SIMPLE_CHORD_KEYS.has(t.key));

  let best = null;

  for (const rootStats of stats) {
    const rootClass = rootStats.pc;

    for (const type of candidateTypes) {
      const expected = type.intervals.map((iv) => (rootClass + iv) % 12);

      // If the chord requires more note classes than we have +1, discard it
      if (expected.length > noteClasses.length + 1) continue;

      const presentNotes = expected.filter((n) => noteClasses.includes(n));
      const presentCount = presentNotes.length;
      if (presentCount < 2) continue; // minimum root + another note

      const missingCount = expected.length - presentCount;
      const extraNotes = noteClasses.filter((n) => !expected.includes(n));
      const extraCount = extraNotes.length;

      // Bonus if the root matches the lowest note (very typical in guitar chords)
      let rootBonus = 0;
      if (rootStats.minMidi === lowestMidi) {
        rootBonus += 0.18;
      } else if (rootStats.minMidi <= lowestMidi + 4) {
        rootBonus += 0.1;
      }

      // Penalty for very "loaded" chords
      const complexityPenalty = Math.max(0, expected.length - 3) * 0.04;

      const coverage = presentCount / expected.length;

      const quality =
        coverage -
        missingCount * 0.03 -
        extraCount * 0.06 -
        complexityPenalty +
        rootBonus;

      if (!best || quality > best.quality) {
        best = {
          rootClass,
          type,
          quality,
          expected,
          noteClasses,
        };
      }
    }
  }

  if (!best || best.quality < CHORD_MIN_QUALITY) {
    return null;
  }

  const rootName = getNoteName(best.rootClass);
  let label = rootName + best.type.short;
  
  // Add octave to chord name if enabled
  if (showOctave) {
    // Find the lowest MIDI note that matches the root class
    const rootMidi = best.noteClasses.sort((a, b) => a - b).find(m => ((m % 12) + 12) % 12 === best.rootClass);
    if (rootMidi !== undefined) {
      const octave = Math.floor(rootMidi / 12) - 1;
      label += ` (${octave})`;
    }
  }

  const typeName = window.t ? window.t(best.type.key) : best.type.key;

  const presentNotes = best.expected
    .filter((n) => best.noteClasses.includes(n))
    .map((n) => getNoteName(n));

  return {
    label,
    description: `${rootName} ${typeName.toLowerCase()}`,
    presentNotes,
    allNotes: best.noteClasses.map((n) => getNoteName(n, showOctave)),
  };
}

// ===================== Waveform Drawing =====================
function drawWaveform(buffer) {
  if (!waveCtx || !buffer) return;

  const width = waveCanvas.width;
  const height = waveCanvas.height;

  waveCtx.clearRect(0, 0, width, height);

  waveCtx.beginPath();
  waveCtx.moveTo(0, height / 2);

  const step = buffer.length / width;
  for (let x = 0; x < width; x++) {
    const idx = Math.floor(x * step);
    const v = buffer[idx] || 0;
    const y = height / 2 + v * (height / 2) * 0.9;
    waveCtx.lineTo(x, y);
  }

  waveCtx.lineWidth = 1.2;
  waveCtx.strokeStyle = "#9ca3af";
  waveCtx.stroke();
}

// ===================== Analysis Loop =====================
function updateUIForSilence() {
  noteDisplay.textContent = "—";
  noteDetail.textContent = window.t
    ? window.t("msg_no_clear_note")
    : "No clear note";
  stringFretDisplay.textContent = "—";
  stringFretDetail.textContent = "";
  // We don't clear the chord: so you can see the last one detected.
}

function analysisLoop() {
  if (!running || !analyser || !audioContext) return;

  if (!timeDomainBuffer || timeDomainBuffer.length !== analyser.fftSize) {
    timeDomainBuffer = new Float32Array(analyser.fftSize);
  }

  analyser.getFloatTimeDomainData(timeDomainBuffer);

  // Always draw waveform for smoothness
  drawWaveform(timeDomainBuffer);

  const now = Date.now();
  if (now - lastAnalysisTime >= analysisInterval) {
    lastAnalysisTime = now;

    const freq = autoCorrelate(timeDomainBuffer, audioContext.sampleRate);
    if (freq) {
      const noteInfo = frequencyToNote(freq);

      // --- UI nota ---
      noteDisplay.textContent = `${noteInfo.name}`;
      const centsStr = noteInfo.cents.toFixed(1);
      const msgDeviation = window.t
        ? window.t("msg_deviation")
        : "Hz · deviation";
      const msgCents = window.t ? window.t("msg_cents") : "cents";
      noteDetail.textContent = `${freq.toFixed(
        1
      )} ${msgDeviation} ${centsStr} ${msgCents}`;

      if (chordFreqDisplay) {
        chordFreqDisplay.textContent = `(${freq.toFixed(1)} Hz)`;
      }

      const sf = guessStringAndFret(noteInfo.midi);
      if (sf) {
        const msgApprox = window.t ? window.t("msg_approx") : "(approx)";
        const approx = sf.diff > 0.4 ? ` ${msgApprox}` : "";
        stringFretDisplay.textContent = `${sf.string.name}, fret ${sf.fret}${approx}`;
        const noteName = getNoteName(sf.string.midi + sf.fret, showOctave); // Always show octave for suggested position as it is specific
        const msgSuggested = window.t
          ? window.t("msg_suggested_note")
          : "Note at suggested position:";
        stringFretDetail.textContent = `${msgSuggested} ${noteName}`;
      } else {
        stringFretDisplay.textContent = "—";
        stringFretDetail.textContent = "";
      }

      // --- NEW: feed note history for chords ---
      registerNoteEvent(noteInfo, now);

      // --- NEW: for note "hold" on screen ---
      lastNoteTimestamp = now;

      // LOG: If the note is different from the last logged one, show it
      if (lastLoggedNoteMidi !== noteInfo.midi) {
        logMessage(`${window.t ? window.t("msg_note_detected") : "Note detected"}: ${noteInfo.name} (${freq.toFixed(1)} Hz)`);
        lastLoggedNoteMidi = noteInfo.midi;
      }

    } else {
      // No clear note in this frame:
      // only clear if enough time has passed since the last note
      if (!lastNoteTimestamp || now - lastNoteTimestamp > NOTE_HOLD_TIME_MS) {
        updateUIForSilence();
        if (chordFreqDisplay) chordFreqDisplay.textContent = "";
      }

      // And if we've been without a note for a long time, clear chord history
      resetNoteHistoryIfIdle(now);
      lastLoggedNoteMidi = null; // Reset so it logs again if the same note sounds
    }

    // Chord detection using the new history-based engine
    const chord = detectChordFromSpectrum();
    if (chord) {
      chordDisplay.textContent = chord.label;
      const msgDetected = window.t
        ? window.t("msg_detected_notes")
        : "detected notes:";
      chordNotes.textContent = `${
        chord.description
      } · ${msgDetected} ${chord.allNotes.join(", ")}`;

      // LOG: If the chord is different from the last logged one
      if (lastLoggedChordLabel !== chord.label) {
        logMessage(`${window.t ? window.t("msg_chord_detected") : "Chord detected"}: ${chord.label} [${chord.allNotes.join("-")}]`);
        lastLoggedChordLabel = chord.label;
      }
    } else {
      // If there is no chord, reset the last logged one so if it sounds again, it is logged
      lastLoggedChordLabel = "";
    }
  }

  requestAnimationFrame(analysisLoop);
}

// ===================== Audio Control (start/stop) =====================
async function startListening() {
  if (running) return;
  errorsEl.textContent = "";

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    errorsEl.textContent = window.t
      ? window.t("err_no_audiocontext")
      : "AudioContext not supported";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    mediaStream = stream;
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = timeDomainBufferSize * 2; // 4096
    analyser.smoothingTimeConstant = 0.85;

    source.connect(analyser);

    running = true;
    toggleButton.textContent = window.t
      ? window.t("btn_stop")
      : "Stop Listening";
    statusDot.classList.remove("idle");
    statusDot.classList.add("listening");
    statusText.textContent = window.t
      ? window.t("status_listening")
      : "Listening";

    requestAnimationFrame(analysisLoop);
  } catch (err) {
    console.error(err);
    const msgErr = window.t ? window.t("err_mic_access") : "Mic access error:";
    errorsEl.textContent = `${msgErr} ${err.message}`;
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    analyser = null;
    mediaStream = null;
    running = false;
  }
}

function stopListening() {
  if (!running) return;
  running = false;

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyser = null;
  toggleButton.textContent = window.t
    ? window.t("btn_start")
    : "Start Listening";
  statusDot.classList.remove("listening");
  statusDot.classList.add("idle");
  statusText.textContent = window.t ? window.t("status_stopped") : "Stopped";
}

toggleButton.addEventListener("click", () => {
  if (running) {
    stopListening();
  } else {
    startListening();
  }
});

// ===================== Initialization =====================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Advanced Settings & Logs
  initAdvancedSettingsAndLogsUI();

  // Load saved interval
  const savedInterval = localStorage.getItem("chordDetectorInterval");
  if (savedInterval) {
    const val = parseInt(savedInterval, 10);
    if (!isNaN(val) && val > 0) {
      analysisInterval = val;
      if (intervalInput) intervalInput.value = val;
    }
  }

  if (saveIntervalBtn && intervalInput) {
    saveIntervalBtn.addEventListener("click", () => {
      const val = parseInt(intervalInput.value, 10);
      if (!isNaN(val) && val > 0) {
        analysisInterval = val;
        localStorage.setItem("chordDetectorInterval", val);
        const msg = window.t
          ? window.t("msg_interval_saved")
          : "Interval saved.";
        alert(msg);
      } else {
        alert("Invalid interval");
      }
    });
  }

  // Set translation prefix for this page
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix("chord-analysis/chord-analysis");
  }

  const notationSelect = document.getElementById("notationSelect");

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || "en";
  let userLang = browserLang.startsWith("es") ? "es" : "en";

  // Load saved language preference
  const savedLang = localStorage.getItem("chordAnalysis_selectedLang");
  if (savedLang) {
    userLang = savedLang;
  }

  // Load saved notation preference
  const savedNotation = localStorage.getItem("chordAnalysis_selectedNotation");
  if (savedNotation) {
    currentNotation = savedNotation;
  } else {
    // Default notation based on language
    if (userLang === "en") {
      currentNotation = "anglo";
    } else {
      currentNotation = "latin";
    }
  }

  if (notationSelect) {
    notationSelect.value = currentNotation;
    notationSelect.addEventListener("change", (e) => {
      currentNotation = e.target.value;
      localStorage.setItem("chordAnalysis_selectedNotation", currentNotation);
      // Refresh UI if needed (e.g. if we are displaying a note)
      // We don't have a specific function to refresh all text, but the loop will pick it up.
      // However, if we are paused, we might want to update the static text.
      if (!running) {
        // Force update of last detected note if possible, or just wait for next loop
      }
    });
  }

  if (langSelect) {
    langSelect.value = userLang;
    langSelect.addEventListener("change", (e) => {
      const newLang = e.target.value;
      localStorage.setItem("chordAnalysis_selectedLang", newLang);

      // Auto-switch notation only if user hasn't explicitly saved a preference?
      // Or just follow the pattern: language change -> update notation default.
      // Let's update it to match the language default, but update the selector too.
      if (newLang === "en") {
        currentNotation = "anglo";
      } else if (newLang === "es") {
        currentNotation = "latin";
      }
      if (notationSelect) notationSelect.value = currentNotation;
      localStorage.setItem("chordAnalysis_selectedNotation", currentNotation);

      if (window.loadTranslations) {
        window.loadTranslations(newLang, () => {
          // Update UI text that isn't handled by data-i18n automatically
          if (running) {
            toggleButton.textContent = window.t("btn_stop");
            statusText.textContent = window.t("status_listening");
          } else {
            toggleButton.textContent = window.t("btn_start");
            statusText.textContent = window.t("status_stopped");
          }
          updateUIForSilence();
        });
      }
    });
  }

  // Load translations
  if (window.loadTranslations) {
    window.loadTranslations(userLang, () => {
      updateUIForSilence();
    });
  }
});
