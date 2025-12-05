// Chord Library Logic

// --- Data ---
const NOTES_SHARP = [
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
const NOTES_FLAT = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
const NOTES_LATIN = [
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

// Finger mapping: 1=Index (Yellow), 2=Middle (Purple), 3=Ring (Blue), 4=Pinky (Orange)
// Frets: "x" = Muted (x), 0 = Open (o), >0 = Fret number
const MUTE = "x";

// --- Chord Shapes Definition ---
const CHORD_SHAPES = {
  maj: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 1, 0, 0],
      fingers: [1, 3, 4, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 2, 0],
      fingers: [0, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
  ],
  5: [
    {
      rootString: 6,
      offsets: [0, 2, 2, MUTE, MUTE, MUTE],
      fingers: [1, 3, 4, 0, 0, 0],
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, MUTE, MUTE],
      fingers: [0, 1, 3, 4, 0, 0],
    },
  ],
  6: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 1, 2, 0],
      fingers: [1, 3, 4, 2, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 2, 2],
      fingers: [0, 2, 3, 4, 1, 1],
      bar: { finger: 1, strings: [3, 6], offset: 0 },
    },
  ],
  7: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 1, 0, 0],
      fingers: [1, 3, 1, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 0, 2, 0],
      fingers: [0, 1, 3, 1, 4, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  maj7: [
    {
      rootString: 6,
      offsets: [0, 2, 1, 1, 0, 0],
      fingers: [1, 3, 2, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 1, 2, 0],
      fingers: [0, 1, 3, 2, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
  ],
  9: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 1, 2, 0],
      fingers: [1, 3, 1, 2, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
  ],
  maj9: [
    {
      rootString: 6,
      offsets: [0, 2, 1, 1, 0, 2],
      fingers: [1, 3, 2, 4, 1, 4],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, -1, 1, 0, MUTE],
      fingers: [0, 2, 1, 4, 3, 0],
    },
  ],
  11: [
    {
      rootString: 5,
      offsets: [MUTE, 0, 0, 0, 0, 2],
      fingers: [0, 1, 1, 1, 1, 4],
      bar: { finger: 1, strings: [2, 5], offset: 0 },
    },
  ],
  13: [
    {
      rootString: 6,
      offsets: [0, MUTE, 0, 1, 2, 2],
      fingers: [1, 0, 2, 3, 4, 4],
    },
  ],
  maj13: [
    {
      rootString: 6,
      offsets: [0, MUTE, 1, 1, 2, 2],
      fingers: [1, 0, 2, 3, 4, 4],
    },
  ],
  min: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 0, 0, 0],
      fingers: [1, 3, 4, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 1, 0],
      fingers: [0, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  m6: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 0, 2, 0],
      fingers: [1, 3, 4, 1, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 1, 2],
      fingers: [0, 2, 3, 4, 1, 4],
    },
  ],
  m7: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 0, 0, 0],
      fingers: [1, 3, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 0, 1, 0],
      fingers: [0, 1, 3, 1, 2, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  m9: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 0, 0, 2],
      fingers: [2, 4, 1, 1, 1, 3],
      bar: { finger: 1, strings: [3, 5], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, -2, 0, 0, MUTE],
      fingers: [0, 2, 1, 3, 3, 0],
    },
  ],
  m11: [
    {
      rootString: 5,
      offsets: [MUTE, 0, -2, 0, 0, -2],
      fingers: [0, 2, 1, 3, 3, 1],
      bar: { finger: 1, strings: [5, 6], offset: -2 },
    },
  ],
  m13: [
    {
      rootString: 6,
      offsets: [0, MUTE, 0, 0, 2, 2],
      fingers: [1, 0, 2, 2, 4, 4],
    },
  ],
  "m(maj7)": [
    {
      rootString: 6,
      offsets: [0, 2, 0, 1, 1, 0],
      fingers: [1, 3, 1, 2, 2, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 1, 1, 0],
      fingers: [0, 1, 3, 2, 2, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  sus2: [
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 0, 0],
      fingers: [0, 1, 3, 4, 1, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  sus4: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 2, 0, 0],
      fingers: [1, 3, 4, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 2, 3, 0],
      fingers: [0, 1, 2, 3, 4, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  dim: [
    {
      rootString: 6,
      offsets: [0, 1, 2, 0, 2, 0],
      fingers: [1, 2, 4, 1, 3, 1],
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 1, 2, 1, MUTE],
      fingers: [0, 1, 2, 4, 3, 0],
    },
  ],
  dim7: [
    {
      rootString: 6,
      offsets: [0, 1, -1, 1, -1, 0],
      fingers: [2, 3, 1, 4, 1, 2],
      bar: { finger: 1, strings: [3, 5], offset: -1 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 1, -1, 1, -1],
      fingers: [0, 2, 3, 1, 4, 1],
      bar: { finger: 1, strings: [4, 6], offset: -1 },
    },
  ],
  aug: [
    {
      rootString: 6,
      offsets: [0, MUTE, 2, 1, 1, MUTE],
      fingers: [1, 0, 4, 3, 2, 0],
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 3, 2, 2, MUTE],
      fingers: [0, 1, 4, 3, 3, 0],
    },
  ],
  "6/9": [
    {
      rootString: 5,
      offsets: [MUTE, 0, -1, -1, 0, 0],
      fingers: [0, 2, 1, 1, 3, 4],
      bar: { finger: 1, strings: [3, 4], offset: -1 },
    },
  ],
  "7sus4": [
    {
      rootString: 6,
      offsets: [0, 2, 0, 2, 0, 0],
      fingers: [1, 3, 1, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 2, 0, 3, 0],
      fingers: [0, 1, 2, 1, 4, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  "7b5": [
    {
      rootString: 6,
      offsets: [0, MUTE, 0, 1, -1, MUTE],
      fingers: [2, 0, 3, 4, 1, 0],
      bar: { finger: 1, strings: [5, 5], offset: -1 },
    },
  ],
  "7b9": [
    {
      rootString: 5,
      offsets: [MUTE, 0, -1, 0, -1, 0],
      fingers: [0, 2, 1, 3, 1, 4],
      bar: { finger: 1, strings: [5, 5], offset: -1 },
    },
  ],
  "9sus4": [
    {
      rootString: 5,
      offsets: [MUTE, 0, 0, 0, 0, 0],
      fingers: [0, 1, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 5], offset: 0 },
    },
  ],
  add9: [
    {
      rootString: 5,
      offsets: [MUTE, 0, -1, -3, 0, 0],
      fingers: [0, 2, 1, 3, 4, 4],
      bar: { finger: 1, strings: [5, 6], offset: -1 },
    },
  ],
  aug9: [
    {
      rootString: 5,
      offsets: [MUTE, 0, -1, 0, 1, MUTE],
      fingers: [0, 2, 1, 3, 4, 0],
    },
  ],
  m7b5: [
    {
      rootString: 6,
      offsets: [0, 1, 0, 0, 1, MUTE],
      fingers: [1, 2, 1, 1, 3, 0],
      bar: { finger: 1, strings: [1, 4], offset: 0 },
    },
    {
      rootString: 5,
      offsets: [MUTE, 0, 1, 0, 1, MUTE],
      fingers: [0, 1, 2, 1, 3, 0],
      bar: { finger: 1, strings: [2, 4], offset: 0 },
    },
  ],
};

function generateChordData() {
  const data = {};
  NOTES_SHARP.forEach((root, rootIndex) => {
    data[root] = {};

    // Calculate root fret on E string (String 6)
    // E is index 4. Fret = (index - 4 + 12) % 12.
    let rootFretE = (rootIndex - 4 + 12) % 12;

    // Calculate root fret on A string (String 5)
    // A is index 9. Fret = (index - 9 + 12) % 12.
    let rootFretA = (rootIndex - 9 + 12) % 12;

    for (const [type, shapes] of Object.entries(CHORD_SHAPES)) {
      data[root][type] = [];

      shapes.forEach((shape) => {
        let baseFret = 0;
        if (shape.rootString === 6) baseFret = rootFretE;
        if (shape.rootString === 5) baseFret = rootFretA;

        let invalid = false;
        const frets = shape.offsets.map((offset) => {
          if (offset === MUTE) return -1;
          const fret = baseFret + offset;
          if (fret < 0) invalid = true;
          return fret;
        });

        if (invalid) return;

        let bar = null;
        if (shape.bar) {
          const barFret = baseFret + (shape.bar.offset ?? 0);
          if (barFret < 0) return;
          bar = {
            finger: shape.bar.finger,
            strings: shape.bar.strings,
            fret: barFret,
          };
        }

        data[root][type].push({
          frets,
          fingers: shape.fingers,
          bar,
        });
      });
    }
  });
  return data;
}

const CHORD_DATA = generateChordData();

// Specific open-chord overrides to match provided diagrams
const CHORD_OVERRIDES = {
  maj: {
    C: {
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
    },
    G: {
      frets: [3, 2, 0, 0, 0, 3],
      fingers: [2, 1, 0, 0, 0, 3],
    },
    D: {
      frets: [-1, -1, 0, 2, 3, 2],
      fingers: [0, 0, 0, 1, 3, 2],
    },
    A: {
      frets: [-1, 0, 2, 2, 2, 0],
      fingers: [0, 0, 1, 2, 3, 0],
    },
    E: {
      frets: [0, 2, 2, 1, 0, 0],
      fingers: [0, 2, 3, 1, 0, 0],
    },
    F: {
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6], fret: 1 },
    },
    B: {
      frets: [MUTE, 2, 4, 4, 4, 2],
      fingers: [0, 1, 2, 3, 4, 1],
      bar: { finger: 1, strings: [1, 6], fret: 2 },
    },
  },
  min: {
    C: {
      frets: [-1, 3, 5, 5, 4, 3],
      fingers: [0, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 5], fret: 3 },
    },
    G: {
      frets: [3, 5, 5, 3, 3, 3],
      fingers: [1, 3, 4, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6], fret: 3 },
    },
    D: {
      frets: [-1, -1, 0, 2, 3, 1],
      fingers: [0, 0, 0, 2, 3, 1],
    },
    A: {
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: [0, 0, 2, 3, 1, 0],
    },
    E: {
      frets: [0, 2, 2, 0, 0, 0],
      fingers: [0, 2, 3, 0, 0, 0],
    },
    F: {
      frets: [1, 3, 3, 1, 1, 1],
      fingers: [1, 3, 4, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6], fret: 1 },
    },
    B: {
      frets: [-1, 2, 4, 4, 3, 2],
      fingers: [0, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 6], fret: 2 },
    },
  },
  7: {
    C: {
      frets: [-1, 3, 2, 3, 1, 0],
      fingers: [0, 3, 2, 4, 1, 0],
    },
    G: {
      frets: [3, 2, 0, 0, 0, 1],
      fingers: [2, 1, 0, 0, 0, 3],
    },
    D: {
      frets: [-1, -1, 0, 2, 1, 2],
      fingers: [0, 0, 0, 2, 1, 3],
    },
    A: {
      frets: [-1, 0, 2, 0, 2, 0],
      fingers: [0, 0, 2, 0, 1, 0],
    },
    E: {
      frets: [0, 2, 0, 1, 0, 0],
      fingers: [0, 2, 0, 1, 0, 0],
    },
    F: {
      frets: [1, 3, 1, 2, 1, 1],
      fingers: [1, 3, 1, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6], fret: 1 },
    },
    B: {
      frets: [-1, 2, 1, 2, 0, 2],
      fingers: [0, 2, 1, 3, 0, 4],
    },
  },
};

function applyOverrides(data) {
  Object.entries(CHORD_OVERRIDES).forEach(([type, chords]) => {
    Object.entries(chords).forEach(([root, shape]) => {
      if (!data[root]) data[root] = {};
      const overrides = Array.isArray(shape) ? shape : [shape];
      const existing = data[root][type] || [];
      data[root][type] = [...overrides, ...existing];
    });
  });
}

applyOverrides(CHORD_DATA);

// --- State ---
const state = {
  root: "C",
  type: "maj",
  voicingIndex: 0,
  tuning: "standard",
  notation: localStorage.getItem("guitar_notation") || "anglo",
  soundProfile: localStorage.getItem("guitar_sound_profile") || "guitar-clean",
  showOctave: false,
};

// --- DOM Elements ---
const rootPicker = document.getElementById("rootPicker");
const typePicker = document.getElementById("typePicker");
const chordNameDisplay = document.getElementById("chordNameDisplay");
const canvas = document.getElementById("fretboardCanvas");
const ctx = canvas.getContext("2d");
const prevBtn = document.getElementById("prevVoicing");
const nextBtn = document.getElementById("nextVoicing");
const voicingCounter = document.getElementById("voicingCounter");
const langSelect = document.getElementById("langSelect");
const notationSelect = document.getElementById("notationSelect");
const soundSelect = document.getElementById("soundSelect");
const tuningSelect = document.getElementById("tuningSelect");
const showOctaveCb = document.getElementById("showOctaveCb");
const playChordBtn = document.getElementById("playChordBtn");

// --- Audio Context ---
let audioCtx;
const audioBuffers = {}; // Map MIDI note -> AudioBuffer
window.sampleBuffers = {}; // Initialize immediately to avoid undefined checks

const AVAILABLE_SAMPLES = {
  36: "C2.mp3",
  41: "F2.mp3",
  45: "A2.mp3",
  48: "C3.mp3",
  52: "E3.mp3",
  55: "G3.mp3",
  59: "B3.mp3",
  64: "E4.mp3",
  67: "G4.mp3",
  71: "B4.mp3",
  74: "D5.mp3",
  80: "G#5.mp3",
  85: "C#6.mp3",
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  // Preload samples
  loadGuitarSamples();

  // Set translation prefix
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix("chord-library/chord-library");
  }

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || "en";
  let userLang = browserLang.startsWith("es") ? "es" : "en";

  // Load saved preferences
  const savedLang = localStorage.getItem("guitar_lang");
  if (savedLang) {
    userLang = savedLang;
  }
  langSelect.value = userLang;

  const savedNotation = localStorage.getItem("guitar_notation");
  if (savedNotation) {
    state.notation = savedNotation;
    notationSelect.value = savedNotation;
  } else {
    // Default notation based on language
    if (userLang === "es") {
      state.notation = "latin";
      notationSelect.value = "latin";
    }
  }

  // Load Show Octave preference
  const savedShowOctave = localStorage.getItem("guitar_show_octave");
  if (savedShowOctave !== null) {
    state.showOctave = savedShowOctave === "true";
  }
  if (showOctaveCb) {
    showOctaveCb.checked = state.showOctave;
    showOctaveCb.addEventListener("change", (e) => {
      state.showOctave = e.target.checked;
      localStorage.setItem("guitar_show_octave", state.showOctave);
      updateDisplay();
    });
  }

  // Load Translations
  if (window.loadTranslations) {
    await window.loadTranslations(userLang, () => {
      init();
    });
  } else {
    init();
  }

  // Event Listeners for Settings
  langSelect.addEventListener("change", (e) => {
    const newLang = e.target.value;
    localStorage.setItem("guitar_lang", newLang);

    // Auto-switch notation if not manually set?
    // Let's stick to the pattern in other tools: switch notation on lang change
    if (newLang === "en") {
      state.notation = "anglo";
      notationSelect.value = "anglo";
    } else if (newLang === "es") {
      state.notation = "latin";
      notationSelect.value = "latin";
    }
    localStorage.setItem("guitar_notation", state.notation);

    if (window.loadTranslations) {
      window.loadTranslations(newLang, () => {
        renderRootPicker(); // Re-render to update note names
        renderTypePicker(); // Re-render types to update translations
        updateDisplay();
      });
    }
  });

  notationSelect.addEventListener("change", (e) => {
    state.notation = e.target.value;
    localStorage.setItem("guitar_notation", state.notation);
    renderRootPicker();
    updateDisplay();
  });

  if (soundSelect) {
    soundSelect.value = state.soundProfile;
    soundSelect.addEventListener("change", async (e) => {
      state.soundProfile = e.target.value;
      localStorage.setItem("guitar_sound_profile", state.soundProfile);
      await loadGuitarSamples();
    });
  }
});

function init() {
  renderRootPicker();
  renderTypePicker();

  // Event Listeners
  // Type selection is handled in renderTypePicker

  prevBtn.addEventListener("click", () => {
    if (state.voicingIndex > 0) {
      state.voicingIndex--;
      updateDisplay();
    }
  });

  nextBtn.addEventListener("click", () => {
    const variations = getVariations();
    if (state.voicingIndex < variations.length - 1) {
      state.voicingIndex++;
      updateDisplay();
    }
  });

  if (playChordBtn) {
    playChordBtn.addEventListener("click", playCurrentChord);
  }

  // Initial Render
  updateDisplay();
}

async function loadGuitarSamples() {
  console.log(`Starting to load guitar samples (${state.soundProfile})...`);
  // Clear existing buffers if reloading
  window.sampleBuffers = {};
  // Clear decoded buffers
  for (const key in audioBuffers) delete audioBuffers[key];

  const promises = Object.entries(AVAILABLE_SAMPLES).map(
    async ([midi, filename]) => {
      try {
        const response = await fetch(`sounds/${state.soundProfile}/${filename}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          window.sampleBuffers[midi] = arrayBuffer;
          // console.log(`Loaded sample: ${filename}`);
        } else {
          console.warn(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
        }
      } catch (e) {
        console.warn(`Could not load sample ${filename}`, e);
      }
    }
  );
  await Promise.all(promises);
  console.log("All samples loaded (pending decode). Count:", Object.keys(window.sampleBuffers).length);
}

async function playCurrentChord() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // Decode any pending buffers
  if (window.sampleBuffers) {
    for (const [midi, arrayBuffer] of Object.entries(window.sampleBuffers)) {
      if (!audioBuffers[midi]) {
        try {
          // Clone buffer because decodeAudioData detaches it
          const tempBuffer = arrayBuffer.slice(0);
          audioBuffers[midi] = await audioCtx.decodeAudioData(tempBuffer);
        } catch (e) {
          console.error(`Error decoding sample for MIDI ${midi}`, e);
        }
      }
    }
  }

  const variations = getVariations();
  const currentChord = variations[state.voicingIndex];
  if (!currentChord) return;

  // Standard Tuning MIDI numbers: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
  const stringBaseMidi = [40, 45, 50, 55, 59, 64];

  const now = audioCtx.currentTime;
  const duration = 3.5; // seconds

  // Strumming effect: slight delay between strings
  let noteCount = 0;
  currentChord.frets.forEach((fret, stringIndex) => {
    if (fret !== -1) {
      // Not muted
      const midiNote = stringBaseMidi[stringIndex] + fret;
      const delay = stringIndex * 0.05; // Downstroke strum

      playBestSample(midiNote, now, duration, delay);
      noteCount++;
    }
  });
}

function playBestSample(targetMidi, startTime, duration, delay) {
  // Find closest available sample
  let bestBaseMidi = -1;
  let minDistance = Infinity;

  const availableMidis = Object.keys(audioBuffers).map(Number);
  
  if (availableMidis.length === 0) {
    // Fallback to synth if no samples loaded
    console.warn("No samples available in audioBuffers, falling back to synth.");
    const frequency = 440 * Math.pow(2, (targetMidi - 69) / 12);
    playTone(frequency, startTime, duration, delay);
    return;
  }

  availableMidis.forEach((baseMidi) => {
    const dist = Math.abs(targetMidi - baseMidi);
    if (dist < minDistance) {
      minDistance = dist;
      bestBaseMidi = baseMidi;
    }
  });

  const buffer = audioBuffers[bestBaseMidi];
  if (!buffer) return;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  // Calculate playback rate
  const semitones = targetMidi - bestBaseMidi;
  const rate = Math.pow(2, semitones / 12);

  source.playbackRate.value = rate;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.5; // Base volume

  source.connect(gain);
  gain.connect(audioCtx.destination);

  const start = startTime + delay;
  source.start(start);

  // Fade out
  gain.gain.setValueAtTime(0.5, start + duration - 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  source.stop(start + duration + 0.1);
}

function playTone(freq, startTime, duration, delay) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  // Use a mix of triangle and sine for a slightly fuller sound, 
  // but for simplicity here we use triangle which has some harmonics.
  osc.type = 'triangle'; 
  osc.frequency.value = freq;
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const start = startTime + delay;
  
  osc.start(start);
  
  // Envelope to simulate plucked string
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.2, start + 0.02); // Fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration); // Long decay
  
  osc.stop(start + duration);
}

function getNoteName(midiOrPc, withOctave = false) {
  const pc = midiOrPc % 12;
  let name;
  if (state.notation === "latin") {
    name = NOTES_LATIN[pc];
  } else {
    name = NOTES_SHARP[pc];
  }

  if (withOctave && midiOrPc >= 12) {
    const octave = Math.floor(midiOrPc / 12) - 1;
    return name + octave;
  }
  return name;
}

function renderRootPicker() {
  rootPicker.innerHTML = "";
  NOTES_SHARP.forEach((note, index) => {
    const btn = document.createElement("button");
    btn.className = `note-btn ${note === state.root ? "active" : ""}`;
    btn.textContent = getNoteName(index);
    btn.onclick = () => {
      document
        .querySelectorAll(".note-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.root = note;
      state.voicingIndex = 0;
      updateDisplay();
    };
    rootPicker.appendChild(btn);
  });
}

function renderTypePicker() {
  const types = Object.keys(CHORD_SHAPES);
  typePicker.innerHTML = "";

  types.forEach((t) => {
    const label = window.t ? window.t("type_" + t) : t;
    const btn = document.createElement("button");
    btn.className = `type-btn ${t === state.type ? "active" : ""}`;
    btn.textContent = label;
    btn.onclick = () => {
      document
        .querySelectorAll(".type-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.type = t;
      state.voicingIndex = 0;
      updateDisplay();
    };
    typePicker.appendChild(btn);
  });
}

function getVariations() {
  // Fallback for missing chords
  if (!CHORD_DATA[state.root] || !CHORD_DATA[state.root][state.type]) {
    return [];
  }
  return CHORD_DATA[state.root][state.type];
}

function updateDisplay() {
  const variations = getVariations();
  const currentChord = variations[state.voicingIndex];

  // Update Title
  // Find index of root to display correct notation
  const rootIndex = NOTES_SHARP.indexOf(state.root);
  const displayRoot = rootIndex !== -1 ? getNoteName(rootIndex) : state.root;
  const displayType = window.t ? window.t("type_" + state.type) : state.type;

  let title = `${displayRoot} ${displayType}`;

  if (currentChord && state.showOctave) {
    // Calculate notes with octaves (Standard Tuning: E2, A2, D3, G3, B3, E4)
    // Strings 6 to 1: [40, 45, 50, 55, 59, 64]
    const standardTuning = [40, 45, 50, 55, 59, 64];
    const notes = [];

    // currentChord.frets is ordered String 6 to String 1
    currentChord.frets.forEach((fret, index) => {
      if (fret !== -1) {
        const midi = standardTuning[index] + fret;
        notes.push(getNoteName(midi, true));
      }
    });

    if (notes.length > 0) {
      title += `<br><h6 class="subtitle">(${notes.join(" - ")})</h6>`;
    }
  }

  chordNameDisplay.innerHTML = title;

  // Update Controls
  voicingCounter.textContent =
    variations.length > 0
      ? `${state.voicingIndex + 1} / ${variations.length}`
      : "0 / 0";
  prevBtn.disabled = state.voicingIndex === 0;
  nextBtn.disabled = state.voicingIndex >= variations.length - 1;

  // Draw
  if (currentChord) {
    drawChord(currentChord);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Chord not found", 80, 200);
  }
}

// --- Canvas Drawing ---
function drawChord(chord) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Config
  const marginX = 40;
  const marginY = 60;
  const stringSpacing = (w - 2 * marginX) / 5;
  const fretSpacing = 50;
  const numFrets = 5; // Draw 5 frets

  // Determine start fret (offset)
  // If min fret > 4, shift view
  const frets = chord.frets.filter((f) => f > 0);
  const minFret = frets.length ? Math.min(...frets) : 0;
  const maxFret = frets.length ? Math.max(...frets) : 0;

  let startFret = 1;
  if (maxFret > 5) {
    startFret = minFret;
  }

  // Draw Fretboard Background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  // Draw Frets
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  for (let i = 0; i <= numFrets; i++) {
    const y = marginY + i * fretSpacing;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(w - marginX, y);
    ctx.stroke();
  }

  // Draw Nut (if startFret is 1)
  if (startFret === 1) {
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(marginX, marginY);
    ctx.lineTo(w - marginX, marginY);
    ctx.stroke();
  } else {
    // Draw fret number
    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`${startFret}fr`, 5, marginY + fretSpacing / 1.5);
  }

  // Draw Strings
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const x = marginX + i * stringSpacing;
    ctx.beginPath();
    ctx.moveTo(x, marginY);
    ctx.lineTo(x, marginY + numFrets * fretSpacing);
    ctx.stroke();
  }

  // Draw Barre
  if (chord.bar) {
    const barFret = chord.bar.fret - startFret + 1;
    if (barFret > 0 && barFret <= numFrets) {
      const startIdx = chord.bar.strings[0] - 1;
      const endIdx = chord.bar.strings[1] - 1;

      const x1 = marginX + startIdx * stringSpacing;
      const x2 = marginX + endIdx * stringSpacing;
      const y = marginY + (barFret - 0.5) * fretSpacing;

      ctx.lineCap = "round";
      ctx.lineWidth = 14;
      ctx.strokeStyle = getFingerColor(chord.bar.finger);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  }

  // Draw Dots / Markers
  chord.frets.forEach((fret, stringIndex) => {
    const x = marginX + stringIndex * stringSpacing;

    // Muted/Open
    if (fret === -1) {
      ctx.fillStyle = "#444";
      ctx.font = "20px Arial";
      ctx.fillText("X", x - 6, marginY - 10);
    } else if (fret === 0) {
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, marginY - 15, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Fret position
      const displayFret = fret - startFret + 1;
      if (displayFret > 0 && displayFret <= numFrets) {
        const y = marginY + (displayFret - 0.5) * fretSpacing;
        const finger = chord.fingers[stringIndex];

        // Don't draw dot if it's covered by barre (unless it's a different finger)
        let coveredByBar = false;
        if (
          chord.bar &&
          fret === chord.bar.fret &&
          finger === chord.bar.finger
        ) {
          coveredByBar = true;
        }

        if (!coveredByBar) {
          ctx.fillStyle = getFingerColor(finger);
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Finger number
          ctx.fillStyle = "#fff";
          ctx.font = "14px Arial";
          ctx.fillText(finger, x - 4, y + 5);
        }
      }
    }
  });
}

function getFingerColor(finger) {
  switch (finger) {
    case 1:
      return "#f1c40f"; // Yellow
    case 2:
      return "#6B48FA"; // Purple
    case 3:
      return "#4790F7"; // Blue
    case 4:
      return "#EF6177"; // Orange
    default:
      return "#000";
  }
}
