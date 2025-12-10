(function () {
if (window.__CHORD_LIBRARY_LOADED) return;
window.__CHORD_LIBRARY_LOADED = true;

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
    {
      rootString: 5,
      offsets: [0, 0, 2, 2, 2, 0],
      fingers: [1, 1, 3, 4, 2, 1],
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
    {
      rootString: 5,
      offsets: [0, 0, 2, 0, 2, 0],
      fingers: [1, 1, 3, 1, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
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
    {
      rootString: 5,
      offsets: [0, 0, 2, 2, 1, 0],
      fingers: [1, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
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
    {
      rootString: 5,
      offsets: [0, 0, 2, 0, 1, 0],
      fingers: [1, 1, 3, 1, 2, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
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
    {
      rootString: 5,
      offsets: [0, 0, 2, 2, 3, 0],
      fingers: [1, 1, 2, 3, 4, 1],
      bar: { finger: 1, strings: [1, 6], offset: 0 },
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

function generateChordData(tuning) {
  const data = {};
  // Default to E Standard if no tuning provided
  const currentTuning = tuning || [64, 59, 55, 50, 45, 40];
  // String 6 is index 5 (40 in E Std), String 5 is index 4 (45 in E Std)

  NOTES_SHARP.forEach((root, rootIndex) => {
    data[root] = {};

    // Calculate root fret on E string (String 6)
    // We need to find the fret that produces the root note on String 6.
    // String 6 MIDI is currentTuning[5].
    // rootIndex 0 = C.
    // We need (stringMidi + fret) % 12 === rootIndex.
    // fret = (rootIndex - stringMidi % 12 + 12) % 12.
    const string6Midi = currentTuning[5];
    let rootFretE = (rootIndex - (string6Midi % 12) + 12) % 12;

    // Calculate root fret on A string (String 5)
    const string5Midi = currentTuning[4];
    let rootFretA = (rootIndex - (string5Midi % 12) + 12) % 12;

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

let CHORD_DATA = generateChordData();

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

      // Normalize overrides (convert "x" or MUTE to -1)
      const normalizedOverrides = overrides.map((o) => ({
        ...o,
        frets: o.frets.map((f) => (f === "x" || f === MUTE ? -1 : f)),
      }));

      const existing = data[root][type] || [];
      data[root][type] = [...normalizedOverrides, ...existing];
    });
  });
}

applyOverrides(CHORD_DATA);

// --- Tunings ---
const builtInTunings = {
  tuning_e_std: [64, 59, 55, 50, 45, 40], // E4, B3, G3, D3, A2, E2
  tuning_drop_d: [64, 59, 55, 50, 45, 38], // E4, B3, G3, D3, A2, D2
  tuning_d_std: [62, 57, 53, 48, 43, 38], // D4, A3, F3, C3, G2, D2
  tuning_drop_c: [62, 57, 53, 48, 43, 36], // D4, A3, F3, C3, G2, C2
  tuning_drop_b: [61, 56, 52, 47, 42, 35], // C#4, G#3, E3, B2, F#2, B1
  tuning_drop_a: [59, 54, 50, 45, 40, 33], // B3, F#3, D3, A2, E2, A1
  tuning_drop_e: [64, 59, 55, 50, 45, 28], // E4, B3, G3, D3, A2, E1 (Octave down?) - Usually Drop E is for 8 string, or Bass. Assuming user means E Standard but low? Or Drop E on 6 string?
  // "drop_e" usually means tuning the low string to E1? That's very low.
  // Maybe they mean "E Standard" is already there.
  // Let's assume they mean "Drop E" as in E B E G# B E? No, that's Open E.
  // Drop tunings usually drop the lowest string 1 whole step from standard.
  // Drop D: D A D G B E (Standard D A D G B E)
  // Drop C: C G C F A D (D Standard with low C)
  // Drop B: B F# B E G# C# (C# Standard with low B)
  // Drop A: A E A D F# B (B Standard with low A)
  // Drop E? Maybe they mean tuning everything down to E? That's E Standard.
  // Maybe they mean "Open E"?
  // I will stick to the ones I know: E Std, Drop D, D Std, Drop C, Drop B, Drop A.
  // I'll add C Standard, B Standard, A Standard as requested "E/D/C/B/A estandar".
  tuning_c_std: [60, 55, 51, 46, 41, 36], // C4, G3, Eb3, Bb2, F2, C2
  tuning_b_std: [59, 54, 50, 45, 40, 35], // B3, F#3, D3, A2, E2, B1
  tuning_a_std: [57, 52, 48, 43, 38, 33], // A3, E3, C3, G2, D2, A1
};

let customTunings = {};
const CUSTOM_TUNINGS_KEY = "guitar_custom_tunings";

function loadCustomTunings() {
  const raw = localStorage.getItem(CUSTOM_TUNINGS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not parse custom tunings", e);
    return {};
  }
}

function saveCustomTunings() {
  localStorage.setItem(CUSTOM_TUNINGS_KEY, JSON.stringify(customTunings));
}

// --- State ---
const defaultAdvanced = {
  shiftFull: 0,
  shiftOctaves: 0,
  shiftSemitones: 0,
  shiftCents: 0,
  formantFull: 0,
  formantSemitones: 0,
  formantCents: 0,
};

const savedAdvanced =
  JSON.parse(localStorage.getItem("guitar_advanced_settings")) ||
  defaultAdvanced;

const state = {
  root: "C",
  type: "maj",
  voicingIndex: 0,
  tuning: "standard",
  currentTuning: [...builtInTunings.tuning_e_std], // Default E Std
  notation: localStorage.getItem("guitar_notation") || "anglo",
  soundProfile: localStorage.getItem("guitar_sound_profile") || "guitar-clean",
  showOctave: false,
  advanced: savedAdvanced,
  // Custom Chord State
  customChords: JSON.parse(localStorage.getItem("guitar_custom_chords")) || {},
  isCustomMode: false,
  customChord: null, // The chord being edited
  interaction: {
    dragging: null, // { stringIndex, originalFret }
    barreCreating: null, // { startString, fret }
    dragPos: null, // { x, y }
  },
};

// --- DOM Elements ---
const rootPicker = document.getElementById("rootPicker");
const typePicker = document.getElementById("typePicker");
const chordNameDisplay = document.getElementById("chordNameDisplay");
const rootFreqDisplay = document.getElementById("rootFreqDisplay");
const canvas = document.getElementById("fretboardCanvas");
const ctx = canvas.getContext("2d");
const prevBtn = document.getElementById("prevVoicing");
const nextBtn = document.getElementById("nextVoicing");
const voicingCounter = document.getElementById("voicingCounter");
const langSelect =
  document.getElementById("globalLangSelect") ||
  document.getElementById("langSelect");
const notationSelect = document.getElementById("notationSelect");
const soundSelect = document.getElementById("soundSelect");
const tuningSelect = document.getElementById("tuningSelect");
const saveTuningBtn = document.getElementById("saveTuningBtn");
const deleteTuningBtn = document.getElementById("deleteTuningBtn");
const stringTuningsContainer = document.getElementById("stringTunings");
const showOctaveCb = document.getElementById("showOctaveCb");
const playChordBtn = document.getElementById("playChordBtn");
const saveChordBtn = document.getElementById("saveChordBtn");
const deleteChordBtn = document.getElementById("deleteChordBtn");

// Advanced Settings DOM
// Elements are fetched in initAdvancedSettings to ensure availability

// --- Audio Context ---
let audioCtx;
const audioBuffers = {}; // Map MIDI note -> AudioBuffer
window.sampleBuffers = {}; // Initialize immediately to avoid undefined checks
let currentLoadSession = 0; // To prevent race conditions when switching sounds

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
  // 80: "G#5.mp3", // Missing on server
  // 85: "C#6.mp3", // Missing on server
};

// --- Initialization ---
async function renderChordLibrary() {
  // Preload samples
  loadGuitarSamples();

  // Set translation prefix
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix(
      "chord-library",
      `${ABSOLUTE_PATH}components/chord-library/langs`
    );
  }

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || "en";
  let userLang = browserLang.startsWith("es") ? "es" : "en";

  // Load saved preferences
  const savedLang = localStorage.getItem("guitar_lang");
  if (savedLang) {
    userLang = savedLang;
  }
  if (langSelect) {
    langSelect.value = userLang;
  }

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
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      const newLang = e.target.value;
      localStorage.setItem("guitar_lang", newLang);

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
          renderRootPicker();
          renderTypePicker();
          renderStringTunings();
          updateDisplay();
        });
      }
    });
  }

  notationSelect.addEventListener("change", (e) => {
    state.notation = e.target.value;
    localStorage.setItem("guitar_notation", state.notation);
    renderRootPicker();
    renderStringTunings();
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
}

function initChordLibrary() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderChordLibrary, {
      once: true,
    });
  } else {
    renderChordLibrary();
  }
}

if (!window.__COMPONENT_ROUTER_ACTIVE) {
  initChordLibrary();
}

function init() {
  renderRootPicker();
  renderTypePicker();
  initAdvancedSettings();
  initCustomChords();
  initCanvasInteractions();

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

  // Tuning Initialization
  const savedTuning = localStorage.getItem("guitar_selected_tuning");
  customTunings = loadCustomTunings();
  populateTuningSelect(savedTuning || "builtin::tuning_e_std");

  if (savedTuning) {
    updateTuning(savedTuning);
  } else {
    updateTuning("builtin::tuning_e_std");
  }

  tuningSelect.addEventListener("change", (e) => {
    updateTuning(e.target.value);
  });

  // Save Tuning Button
  if (saveTuningBtn) {
    saveTuningBtn.addEventListener("click", () => {
      const currentVal = tuningSelect.value;

      if (currentVal.startsWith("custom::")) {
        // Overwrite existing custom tuning
        const name = currentVal.split("::")[1];
        customTunings[name] = [...state.currentTuning];
        saveCustomTunings();

        // Refresh select and update UI (hides save button)
        populateTuningSelect(currentVal);
        updateTuning(currentVal);
      } else {
        // Create new custom tuning
        const name = prompt(
          window.t ? window.t("prompt_tuning_name") : "Enter tuning name:"
        );
        if (name) {
          // Save to custom tunings
          customTunings[name] = [...state.currentTuning];
          saveCustomTunings();

          // Refresh select and select the new tuning
          const newValue = "custom::" + name;
          populateTuningSelect(newValue);
          updateTuning(newValue);
        }
      }
    });
  }

  // Delete Tuning Button
  if (deleteTuningBtn) {
    deleteTuningBtn.addEventListener("click", () => {
      const value = tuningSelect.value;
      if (value.startsWith("custom::")) {
        const name = value.split("::")[1];
        if (
          confirm(
            (window.t ? window.t("confirm_delete_tuning") : "Delete tuning?") +
              " " +
              name
          )
        ) {
          delete customTunings[name];
          saveCustomTunings();

          // Switch to standard
          populateTuningSelect("builtin::tuning_e_std");
          updateTuning("builtin::tuning_e_std");
        }
      }
    });
  }

  // Initial Render
  updateDisplay();
  initAdvancedSettings();
}

async function loadGuitarSamples() {
  currentLoadSession++;
  const mySessionId = currentLoadSession;
  console.log(
    `Starting to load guitar samples (${state.soundProfile}) [Session ${mySessionId}]...`
  );

  // Clear existing buffers if reloading
  window.sampleBuffers = {};
  // Clear decoded buffers
  for (const key in audioBuffers) delete audioBuffers[key];

  const promises = Object.entries(AVAILABLE_SAMPLES).map(
    async ([midi, filename]) => {
      if (mySessionId !== currentLoadSession) return; // Abort if new session started

      try {
        const url = `sounds/${state.soundProfile}/${encodeURIComponent(
          filename
        )}`;
        const response = await fetch(url);

        if (mySessionId !== currentLoadSession) return; // Check again

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (mySessionId !== currentLoadSession) return; // Check again
          window.sampleBuffers[midi] = arrayBuffer;
        } else {
          console.warn(
            `Failed to fetch ${url}: ${response.status} ${response.statusText}`
          );
        }
      } catch (e) {
        console.warn(`Could not load sample ${filename}`, e);
      }
    }
  );
  await Promise.all(promises);

  if (mySessionId === currentLoadSession) {
    console.log(
      `All samples loaded for session ${mySessionId}. Count:`,
      Object.keys(window.sampleBuffers).length
    );
  }
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

  let currentChord;
  if (state.isCustomMode && state.customChord) {
    currentChord = { frets: getEffectiveFrets(state.customChord) };
  } else {
    const variations = getVariations();
    currentChord = variations[state.voicingIndex];
  }

  if (!currentChord) return;

  // Use current tuning for playback
  // state.currentTuning is [High E, B, G, D, A, E] (Strings 1 to 6)
  // We need Strings 6 to 1 for the loop below?
  // currentChord.frets is ordered String 6 to String 1.
  // So we need [E, A, D, G, B, E].
  const stringBaseMidi = [...state.currentTuning].reverse();

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
    console.warn(
      "No samples available in audioBuffers, falling back to synth."
    );
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

  // --- Advanced Pitch Shift ---
  const totalDetune =
    state.advanced.shiftOctaves * 1200 +
    state.advanced.shiftSemitones * 100 +
    state.advanced.shiftFull * 100 +
    state.advanced.shiftCents;

  source.detune.value = totalDetune;

  // --- Advanced Formant Shift (Simulated) ---
  const totalFormantShift =
    state.advanced.formantFull * 100 +
    state.advanced.formantSemitones * 100 +
    state.advanced.formantCents;

  let outputNode = source;

  if (totalFormantShift !== 0) {
    const filter = audioCtx.createBiquadFilter();
    filter.type = "peaking";
    filter.Q.value = 1;
    filter.gain.value = 6;

    const baseFreq = 1000;
    const ratio = Math.pow(2, totalFormantShift / 1200);
    filter.frequency.value = baseFreq * ratio;

    source.connect(filter);
    outputNode = filter;
  }

  const gain = audioCtx.createGain();
  gain.gain.value = 0.5; // Base volume

  outputNode.connect(gain);
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
  osc.type = "triangle";
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
  // Reset Custom Mode
  state.isCustomMode = false;
  state.customChord = null;
  if (saveChordBtn) saveChordBtn.style.display = "none";
  if (deleteChordBtn) deleteChordBtn.style.display = "none";

  // Restore tuning buttons visibility based on current state/selection is tricky if we hid them.
  // But we will stop hiding them in initCanvasInteractions, so we don't need to restore them here.

  const chordInfo = document.querySelector(".chord-info");
  if (chordInfo) chordInfo.style.display = "block";

  const instructions = document.querySelector(".custom-chord-instructions");
  if (instructions) instructions.style.display = "none";

  // Hide Fret Nav
  const fretNav = document.getElementById("fretNavControls");
  if (fretNav) fretNav.style.display = "none";

  // Show voicing controls
  if (prevBtn) prevBtn.style.display = "flex";
  if (nextBtn) nextBtn.style.display = "flex";
  if (voicingCounter) voicingCounter.style.display = "inline";

  const handsIcon = document.querySelector(".hands-icon");
  if (handsIcon) handsIcon.style.display = "block";

  const variations = getVariations();
  const currentChord = variations[state.voicingIndex];

  // Update Title
  // Find index of root to display correct notation
  const rootIndex = NOTES_SHARP.indexOf(state.root);
  const displayRoot = rootIndex !== -1 ? getNoteName(rootIndex) : state.root;
  const displayType = window.t ? window.t("type_" + state.type) : state.type;

  let title = `${displayRoot} ${displayType}`;

  if (currentChord && state.showOctave) {
    // Calculate notes with octaves
    // state.currentTuning is [High E, ..., Low E]
    // We need [Low E, ..., High E] for the loop below
    const currentTuningLowToHigh = [...state.currentTuning].reverse();
    const notes = [];

    // currentChord.frets is ordered String 6 to String 1
    currentChord.frets.forEach((fret, index) => {
      if (fret !== -1) {
        const midi = currentTuningLowToHigh[index] + fret;
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
  const frets = chord.frets.filter((f) => f > 0);
  const minFret = frets.length ? Math.min(...frets) : 0;
  const maxFret = frets.length ? Math.max(...frets) : 0;

  let startFret = 1;
  if (state.isCustomMode && state.baseFret !== undefined) {
    startFret = state.baseFret;
  } else if (maxFret > 5) {
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
  const drawBarre = (bar, isGhost = false) => {
    const barFret = bar.fret - startFret + 1;
    if (barFret > 0 && barFret <= numFrets) {
      const s1 = Math.min(bar.strings[0], bar.strings[1]);
      const s2 = Math.max(bar.strings[0], bar.strings[1]);

      const startIdx = s1 - 1;
      const endIdx = s2 - 1;

      const x1 = marginX + startIdx * stringSpacing;
      const x2 = marginX + endIdx * stringSpacing;
      const y = marginY + (barFret - 0.5) * fretSpacing;

      ctx.lineCap = "round";
      ctx.lineWidth = 14;
      ctx.strokeStyle = isGhost
        ? "rgba(51, 51, 51, 0.5)"
        : getFingerColor(bar.finger);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  };

  if (chord.bar) {
    drawBarre(chord.bar);
  }

  if (state.interaction.barreCreating) {
    const b = state.interaction.barreCreating;
    drawBarre(
      {
        fret: b.fret,
        strings: [b.startString + 1, b.endString + 1],
        finger: 0,
      },
      true
    );
  }

  // Draw Dots / Markers
  chord.frets.forEach((fret, stringIndex) => {
    // Skip if this is the dot being dragged
    if (
      state.interaction.dragging &&
      state.interaction.dragging.stringIndex === stringIndex
    ) {
      return;
    }

    const x = marginX + stringIndex * stringSpacing;

    // Muted/Open
    if (fret === -1) {
      ctx.fillStyle = "#444";
      ctx.font = "20px Arial";
      ctx.fillText("X", x - 6, marginY - 10);
    } else if (fret === 0 || fret === -2) {
      // Check if covered by barre (only if 0, not -2)
      let drawnAsBarre = false;
      if (fret === 0 && chord.bar) {
        const bMin = Math.min(chord.bar.strings[0], chord.bar.strings[1]);
        const bMax = Math.max(chord.bar.strings[0], chord.bar.strings[1]);
        const stringNum = stringIndex + 1;
        if (stringNum >= bMin && stringNum <= bMax) {
          // It is covered by barre, so it's effectively the barre fret.
          // We should draw a dot on the barre fret?
          // Usually the barre line is enough.
          // But if we want to be explicit, we can leave it.
          // The barre line is drawn separately.
          drawnAsBarre = true;
        }
      }

      if (!drawnAsBarre || fret === -2) {
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, marginY - 15, 6, 0, Math.PI * 2);
        ctx.stroke();

        // If explicit open (-2), maybe add a small indicator?
        if (fret === -2) {
          ctx.fillStyle = "#444";
          ctx.font = "10px Arial";
          ctx.fillText("O", x - 4, marginY - 12);
        }
      }
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
          // Check if this note is being shadowed by a dragged note
          let isShadowed = false;

          // 1. Shadowed by Drag
          if (
            state.interaction.dragging &&
            state.interaction.snapString === stringIndex
          ) {
            const snapFret = state.interaction.snapFret;
            // If dragging ONTO this string
            if (state.interaction.dragging.stringIndex !== stringIndex) {
              if (snapFret > fret) {
                isShadowed = true; // Dragged note is higher, so this one is shadowed
              }
            }
          }

          // 2. Shadowed by Barre
          if (chord.bar) {
            const bMin = Math.min(chord.bar.strings[0], chord.bar.strings[1]);
            const bMax = Math.max(chord.bar.strings[0], chord.bar.strings[1]);
            const stringNum = stringIndex + 1; // 1-based index

            if (stringNum >= bMin && stringNum <= bMax) {
              if (fret < chord.bar.fret) {
                isShadowed = true;
              }
            }
          }

          ctx.fillStyle = isShadowed ? "#ff0000" : getFingerColor(finger);
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Finger number (only if not custom/0)
          if (finger !== 0) {
            ctx.fillStyle = "#fff";
            ctx.font = "14px Arial";
            ctx.fillText(finger, x - 4, y + 5);
          }
        }
      }
    }
  });

  // Draw Dragging Dot
  if (state.interaction.dragging && state.interaction.dragPos) {
    const { x, y } = state.interaction.dragPos;

    // Draw ghost at snap target if available
    if (
      state.interaction.snapFret !== undefined &&
      state.interaction.snapFret !== null
    ) {
      const snapFret = state.interaction.snapFret;
      const snapString =
        state.interaction.snapString !== undefined
          ? state.interaction.snapString
          : state.interaction.dragging.stringIndex;
      const sx = marginX + snapString * stringSpacing;

      // Check for conflict/shadowing
      let isShadowed = false;
      let isShadowing = false;

      // If we are on a different string than source, check existing note
      if (snapString !== state.interaction.dragging.stringIndex) {
        const existingFret = chord.frets[snapString];
        if (existingFret > 0) {
          // Conflict exists
          if (snapFret < existingFret) {
            isShadowed = true; // New note is behind existing
          } else if (snapFret > existingFret) {
            isShadowing = true; // New note shadows existing
          } else {
            // Same fret - overlap (maybe red too?)
            isShadowed = true;
          }
        }
      }

      if (snapFret === -1) {
        // Mute ghost
        ctx.fillStyle = "rgba(68, 68, 68, 0.5)";
        ctx.font = "20px Arial";
        ctx.fillText("X", sx - 6, marginY - 10);
      } else if (snapFret === 0) {
        // Open ghost
        ctx.strokeStyle = "rgba(68, 68, 68, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, marginY - 15, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fret ghost
        const displayFret = snapFret - startFret + 1;
        if (displayFret > 0 && displayFret <= numFrets) {
          const sy = marginY + (displayFret - 0.5) * fretSpacing;

          // Color logic
          if (isShadowed) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Red if shadowed
          } else {
            ctx.fillStyle = "rgba(51, 51, 51, 0.3)"; // Normal ghost
          }

          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw the dragged dot (semi-transparent)
    ctx.fillStyle = "rgba(51, 51, 51, 0.8)";
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function getFingerColor(finger) {
  if (finger === 0) return "#333"; // Custom/Neutral
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

function populateTuningSelect(selectedTuning) {
  tuningSelect.innerHTML = "";

  // Built-in
  const groupBuiltIn = document.createElement("optgroup");
  groupBuiltIn.label = "Standard / Drop";
  Object.keys(builtInTunings).forEach((key) => {
    const opt = document.createElement("option");
    opt.value = "builtin::" + key;
    opt.textContent = window.t ? window.t(key) : key;
    if ("builtin::" + key === selectedTuning) opt.selected = true;
    groupBuiltIn.appendChild(opt);
  });
  tuningSelect.appendChild(groupBuiltIn);

  // Custom
  const groupCustom = document.createElement("optgroup");
  groupCustom.label = window.t ? window.t("label_custom_tunings") : "Custom";
  Object.keys(customTunings).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = "custom::" + name;
    opt.textContent = name;
    if ("custom::" + name === selectedTuning) opt.selected = true;
    groupCustom.appendChild(opt);
  });
  tuningSelect.appendChild(groupCustom);
}

function renderStringTunings() {
  stringTuningsContainer.innerHTML = "";
  // state.currentTuning is [String 1, String 2, ..., String 6] (High E to Low E)
  // We want to display them left to right as they appear on canvas (Low E to High E)
  // Canvas draws strings 0 to 5 (Low E to High E).
  // Wait, `state.currentTuning` in `builtInTunings` is defined as [E4, B3, G3, D3, A2, E2].
  // This is High E (String 1) to Low E (String 6).
  // Canvas loop: `for (let i = 0; i < 6; i++`)`.
  // `i=0` is usually Low E (leftmost string).
  // Let's check `drawChord`:
  // `const x = marginX + i * stringSpacing;`
  // `chord.frets` is ordered String 6 to String 1?
  // `CHORD_SHAPES`: `offsets: [0, 2, 2, 1, 0, 0]` (E Major).
  // Index 0 is String 6 (Low E).
  // So `chord.frets` is [Low E, A, D, G, B, High E].
  // `state.currentTuning` is [High E, B, G, D, A, Low E].
  // So we need to reverse `state.currentTuning` to match the canvas order (Low E to High E).

  const tuningLowToHigh = [...state.currentTuning].reverse();

  tuningLowToHigh.forEach((midi, index) => {
    // index 0 is Low E (String 6)
    const box = document.createElement("div");
    box.className = "string-tuning-box";
    box.textContent = getNoteName(midi);
    box.dataset.stringIndex = index; // 0 = Low E

    box.onclick = (e) => {
      showStringTuningSelect(e.target, index, midi);
    };

    stringTuningsContainer.appendChild(box);
  });
}

function showStringTuningSelect(target, stringIndex, currentMidi) {
  // Remove existing selects
  document
    .querySelectorAll(".string-tuning-select")
    .forEach((el) => el.remove());

  const select = document.createElement("div");
  select.className = "string-tuning-select visible";

  // Generate options +/- 12 semitones
  for (let i = 5; i >= -5; i--) {
    // High to low
    const midi = currentMidi + i;
    const div = document.createElement("div");
    div.className = "tuning-option";
    if (i === 0) div.classList.add("current");

    div.textContent = getNoteName(midi, state.showOctave);

    div.onclick = () => {
      updateSingleString(stringIndex, midi);
      select.remove();
    };
    select.appendChild(div);
  }

  document.body.appendChild(select);
  const rect = target.getBoundingClientRect();

  // Center the dropdown relative to the box
  const dropdownWidth = 80; // Approximate min-width
  const leftPos = rect.left + rect.width / 2 - dropdownWidth / 2;

  select.style.top = rect.bottom + 8 + "px";
  select.style.left = leftPos + "px";

  // Scroll to current if needed (though with few items it might not be necessary)
  // But if we add more range later, it's good practice.
  const currentOption = select.querySelector(".current");
  if (currentOption) {
    // Center the current option in the scroll view
    // select.scrollTop = currentOption.offsetTop - select.clientHeight / 2 + currentOption.clientHeight / 2;
  }

  // Close on click outside
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!select.contains(e.target) && e.target !== target) {
        select.remove();
        document.removeEventListener("click", closeHandler);
      }
    };
    document.addEventListener("click", closeHandler);
  }, 0);
}

function updateSingleString(stringIndex, newMidi) {
  // stringIndex 0 is Low E.
  // state.currentTuning is [High E, ..., Low E].
  // So Low E is index 5 in state.currentTuning.
  const arrayIndex = 5 - stringIndex;
  state.currentTuning[arrayIndex] = newMidi;

  // When modifying a string, we are in "unsaved" mode unless we match an existing one
  // But for simplicity, we just set the select to empty or a placeholder if possible
  // Or we can keep the current value but show the "Save" button

  // Show Save button
  if (saveTuningBtn) saveTuningBtn.style.display = "inline-flex";

  renderStringTunings();

  // Re-generate chord data with new tuning
  CHORD_DATA = generateChordData(state.currentTuning);
  applyOverrides(CHORD_DATA);
  updateDisplay();
}

function updateTuning(value) {
  if (value.startsWith("builtin::")) {
    const key = value.split("::")[1];
    state.currentTuning = [...builtInTunings[key]];
    if (deleteTuningBtn) deleteTuningBtn.style.display = "none";
    if (saveTuningBtn) saveTuningBtn.style.display = "none";
  } else if (value.startsWith("custom::")) {
    const key = value.split("::")[1];
    if (customTunings[key]) {
      state.currentTuning = [...customTunings[key]];
      if (deleteTuningBtn) deleteTuningBtn.style.display = "inline-flex";
      if (saveTuningBtn) saveTuningBtn.style.display = "none"; // Already saved
    }
  }

  localStorage.setItem("guitar_selected_tuning", value);
  renderStringTunings();

  // Re-generate chord data
  CHORD_DATA = generateChordData(state.currentTuning);
  applyOverrides(CHORD_DATA);
  updateDisplay();
}

// Advanced Settings
function initAdvancedSettings() {
  // Re-fetch elements to ensure they exist
  const advancedSettingsBtn = document.getElementById("advancedSettingsBtn");
  const advancedSettingsContent = document.getElementById(
    "advancedSettingsContent"
  );
  const resetAdvancedBtn = document.getElementById("resetAdvancedBtn");

  const advControls = {
    shiftFull: document.getElementById("shiftFull"),
    shiftOctaves: document.getElementById("shiftOctaves"),
    shiftSemitones: document.getElementById("shiftSemitones"),
    shiftCents: document.getElementById("shiftCents"),
    formantFull: document.getElementById("formantFull"),
    formantSemitones: document.getElementById("formantSemitones"),
    formantCents: document.getElementById("formantCents"),
  };

  const advDisplays = {
    shiftFull: document.getElementById("shiftFullVal"),
    shiftOctaves: document.getElementById("shiftOctavesVal"),
    shiftSemitones: document.getElementById("shiftSemitonesVal"),
    shiftCents: document.getElementById("shiftCentsVal"),
    formantFull: document.getElementById("formantFullVal"),
    formantSemitones: document.getElementById("formantSemitonesVal"),
    formantCents: document.getElementById("formantCentsVal"),
  };

  if (!advancedSettingsBtn || !advancedSettingsContent) {
    console.warn("Advanced settings elements not found");
    return;
  }

  // Accordion Toggle
  // Remove existing listeners to avoid duplicates if init is called multiple times
  const newBtn = advancedSettingsBtn.cloneNode(true);
  advancedSettingsBtn.parentNode.replaceChild(newBtn, advancedSettingsBtn);

  newBtn.addEventListener("click", (e) => {
    e.preventDefault();
    newBtn.classList.toggle("active");
    advancedSettingsContent.classList.toggle("open");
  });

  // Initialize Sliders
  Object.keys(advControls).forEach((key) => {
    const input = advControls[key];
    const display = advDisplays[key];
    if (!input || !display) return;

    // Set initial value
    input.value = state.advanced[key];
    updateAdvancedDisplay(key, state.advanced[key], advDisplays);

    // Event Listener
    input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      state.advanced[key] = val;
      updateAdvancedDisplay(key, val, advDisplays);
      saveAdvancedSettings();
    });
  });

  // Reset Button
  if (resetAdvancedBtn) {
    const newResetBtn = resetAdvancedBtn.cloneNode(true);
    resetAdvancedBtn.parentNode.replaceChild(newResetBtn, resetAdvancedBtn);

    newResetBtn.addEventListener("click", () => {
      // Reset state
      state.advanced = { ...defaultAdvanced };

      // Update UI
      Object.keys(advControls).forEach((key) => {
        const input = advControls[key];
        if (input) {
          input.value = state.advanced[key];
          updateAdvancedDisplay(key, state.advanced[key], advDisplays);
        }
      });

      saveAdvancedSettings();
    });
  }
}

function updateAdvancedDisplay(key, value, displaysMap) {
  let display;
  if (displaysMap) {
    display = displaysMap[key];
  } else {
    display = document.getElementById(key + "Val");
  }

  if (!display) return;

  let unit = "";
  if (key.includes("Octaves")) unit = " oct";
  else if (key.includes("Cents")) unit = " ct";
  else unit = " st";

  display.textContent = (value > 0 ? "+" : "") + value + unit;
}

function saveAdvancedSettings() {
  localStorage.setItem(
    "guitar_advanced_settings",
    JSON.stringify(state.advanced)
  );
}

// --- Custom Chords & Interaction ---

function initCustomChords() {
  if (saveChordBtn) {
    saveChordBtn.addEventListener("click", () => {
      if (!state.customChord) return;

      const name = prompt(
        window.t ? window.t("prompt_chord_name") : "Enter chord name:"
      );
      if (name) {
        state.customChords[name] = state.customChord;
        localStorage.setItem(
          "guitar_custom_chords",
          JSON.stringify(state.customChords)
        );
        alert(window.t ? window.t("msg_chord_saved") : "Chord saved!");

        // Exit custom mode? Or stay?
        // Maybe reload to show it in a list?
        // For now, just save.
      }
    });
  }

  if (deleteChordBtn) {
    deleteChordBtn.addEventListener("click", () => {
      if (
        confirm(window.t ? window.t("confirm_delete_chord") : "Delete chord?")
      ) {
        state.isCustomMode = false;
        state.customChord = null;
        updateDisplay();

        if (saveChordBtn) saveChordBtn.style.display = "none";
        if (deleteChordBtn) deleteChordBtn.style.display = "none";
        if (deleteTuningBtn) deleteTuningBtn.style.display = "inline-flex"; // Restore
        if (saveTuningBtn) saveTuningBtn.style.display = "inline-flex";
      }
    });
  }
}

function enterCustomMode() {
  if (state.isCustomMode) return;

  const variations = getVariations();
  const currentChord = variations[state.voicingIndex];
  if (!currentChord) return;

  state.isCustomMode = true;
  state.customChord = JSON.parse(JSON.stringify(currentChord));
  state.customChord.fingers = state.customChord.fingers.map(() => 0);

  // Initialize baseFret
  const frets = state.customChord.frets.filter((f) => f > 0);
  const minFret = frets.length ? Math.min(...frets) : 0;
  const maxFret = frets.length ? Math.max(...frets) : 0;
  state.baseFret = maxFret > 5 ? minFret : 1;

  // Show chord buttons
  if (saveChordBtn) saveChordBtn.style.display = "inline-flex";
  if (deleteChordBtn) deleteChordBtn.style.display = "inline-flex";
  if (deleteTuningBtn) deleteTuningBtn.style.display = "none";
  if (saveTuningBtn) saveTuningBtn.style.display = "none";

  const chordInfo = document.querySelector(".chord-info");
  if (chordInfo) chordInfo.style.display = "none";

  const instructions = document.querySelector(".custom-chord-instructions");
  if (instructions) {
    instructions.style.display = "block";
    if (window.t) {
      instructions.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = window.t(key);
      });
    }
  }

  // Hide voicing controls
  if (prevBtn) prevBtn.style.display = "none";
  if (nextBtn) nextBtn.style.display = "none";
  if (voicingCounter) voicingCounter.style.display = "none";

  // Show Fret Nav
  const fretNav = document.getElementById("fretNavControls");
  if (fretNav) {
    fretNav.style.display = "flex";
    updateFretNavButtons();
  }

  const handsIcon = document.querySelector(".hands-icon");
  if (handsIcon) handsIcon.style.display = "none";
}

function initCanvasInteractions() {
  const getCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = canvas.width;
    const marginX = 40;
    const marginY = 60;
    const stringSpacing = (w - 2 * marginX) / 5;
    const fretSpacing = 50;

    let stringIndex = Math.round((x - marginX) / stringSpacing);
    if (stringIndex < 0) stringIndex = 0;
    if (stringIndex > 5) stringIndex = 5;

    let visualFret = Math.ceil((y - marginY) / fretSpacing);
    let fret = visualFret;

    if (y < marginY) fret = 0; // Open/Mute area
    if (y < marginY - 30) fret = -1;

    // Adjust for baseFret if in custom mode and fret > 0
    if (state.isCustomMode && state.baseFret > 1 && fret > 0) {
      fret = visualFret + state.baseFret - 1;
    }

    return { stringIndex, fret, x, y };
  };

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Only allow left click
    const { stringIndex, fret, x, y } = getCoords(e);

    // Check if we are finalizing a barre creation
    if (state.interaction.barreCreating) {
      const b = state.interaction.barreCreating;
      // Finalize barre
      // Use the original fret for the barre
      const s1 = Math.min(b.startString + 1, stringIndex + 1);
      const s2 = Math.max(b.startString + 1, stringIndex + 1);

      state.customChord.bar = {
        fret: b.fret,
        finger: 0,
        strings: [s1, s2],
      };

      state.interaction.barreCreating = null;
      drawChord(state.customChord);
      updateChordIdentification();
      return;
    }

    // If not in custom mode, enter it
    if (!state.isCustomMode) {
      enterCustomMode();
    }

    // Start Dragging
    state.interaction.dragging = {
      stringIndex,
      originalFret: state.customChord.frets[stringIndex],
    };
    state.interaction.dragPos = { x, y };
    state.interaction.snapFret = fret;

    drawChord(state.customChord);
  });

  canvas.addEventListener("mousemove", (e) => {
    const { stringIndex, fret, x, y } = getCoords(e);

    if (state.interaction.barreCreating) {
      state.interaction.barreCreating.endString = stringIndex;
      drawChord(state.customChord);
      return;
    }

    if (state.interaction.dragging) {
      state.interaction.dragPos = { x, y };
      state.interaction.snapFret = fret;
      state.interaction.snapString = stringIndex;

      drawChord(state.customChord);
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    if (state.interaction.dragging) {
      const sourceString = state.interaction.dragging.stringIndex;
      const { stringIndex: targetString, fret: targetFret } = getCoords(e);

      // Check if target string is occupied by another note (and not the one we are moving)
      // If targetString == sourceString, we are just moving the note, so no conflict.
      // If targetString != sourceString, we need to check if targetString has a note > 0.
      let conflict = false;
      if (targetString !== sourceString) {
        const existingFret = state.customChord.frets[targetString];
        if (existingFret > 0) {
          conflict = true;
        }
      }

      if (!conflict) {
        // Apply move
        // Clear source
        state.customChord.frets[sourceString] = 0; // Or keep as is if we want to copy? No, move.
        state.customChord.fingers[sourceString] = 0;

        // Set target
        state.customChord.frets[targetString] = targetFret;
        state.customChord.fingers[targetString] = 0;
      } else {
        // Conflict: Revert to original? Or just do nothing (cancel drop)
        // User said: "No me deberia dejar es poner un punteo donde ya hay uno"
        // So we just don't apply the change. The drag ends, and the note snaps back to original.
      }

      // Clear drag state
      state.interaction.dragging = null;
      state.interaction.dragPos = null;
      state.interaction.snapFret = null;
      state.interaction.snapString = null;

      drawChord(state.customChord);

      updateChordIdentification();
    }
  });

  canvas.addEventListener("mouseleave", (e) => {
    if (state.interaction.dragging) {
      // Cancel drag or finalize? Let's finalize at last known pos or cancel.
      // Let's cancel for safety or just stop dragging.
      state.interaction.dragging = null;
      state.interaction.dragPos = null;
      state.interaction.snapFret = null;
      drawChord(state.customChord);
    }
  });

  // Double click for Barre
  canvas.addEventListener("dblclick", (e) => {
    const { stringIndex, fret } = getCoords(e);
    if (fret > 0) {
      // Start barre creation mode
      state.interaction.barreCreating = {
        startString: stringIndex,
        endString: stringIndex,
        fret: fret,
      };
      drawChord(state.customChord);
    }
  });

  // Context Menu
  const contextMenu = document.getElementById("chordContextMenu");
  const ctxAddNote = document.getElementById("ctxAddNote");
  const ctxRemoveNote = document.getElementById("ctxRemoveNote");
  const ctxOpenString = document.getElementById("ctxOpenString");
  const ctxMuteString = document.getElementById("ctxMuteString");
  const ctxDisableLogic = document.getElementById("ctxDisableLogic");

  // Hide menu on click anywhere
  document.addEventListener("click", () => {
    if (contextMenu) contextMenu.style.display = "none";
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();

    // Ensure we are in custom mode
    if (!state.isCustomMode) {
      enterCustomMode();
    }

    const { stringIndex, fret, x, y } = getCoords(e);

    // Position menu
    contextMenu.style.display = "block";
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;

    // Determine options based on location
    // Hide all first
    ctxAddNote.style.display = "none";
    ctxRemoveNote.style.display = "none";
    ctxOpenString.style.display = "none";
    ctxMuteString.style.display = "none";
    if (ctxDisableLogic) ctxDisableLogic.style.display = "none";

    const currentFret = state.customChord.frets[stringIndex];

    if (fret <= 0) {
      // Top area (Nut/Open)
      ctxOpenString.style.display = "flex";
      ctxMuteString.style.display = "flex";
      if (ctxDisableLogic) ctxDisableLogic.style.display = "flex";

      ctxOpenString.onclick = () => {
        state.customChord.frets[stringIndex] = -2; // Explicit Open
        state.customChord.fingers[stringIndex] = 0;
        drawChord(state.customChord);
        updateChordIdentification();
      };

      ctxMuteString.onclick = () => {
        state.customChord.frets[stringIndex] = -1;
        state.customChord.fingers[stringIndex] = 0;
        drawChord(state.customChord);
        updateChordIdentification();
      };

      if (ctxDisableLogic) {
        ctxDisableLogic.onclick = () => {
          state.customChord.frets[stringIndex] = 0; // Default (Barre applies)
          state.customChord.fingers[stringIndex] = 0;
          drawChord(state.customChord);
          updateChordIdentification();
        };
      }
    } else {
      // Fretboard area
      if (currentFret === fret) {
        // Clicking on existing note
        ctxRemoveNote.style.display = "flex";
        ctxRemoveNote.onclick = () => {
          // Remove note -> Set to Default (0)
          state.customChord.frets[stringIndex] = 0;
          state.customChord.fingers[stringIndex] = 0;
          drawChord(state.customChord);
          updateChordIdentification();
        };
      } else {
        // Clicking on empty spot
        ctxAddNote.style.display = "flex";
        ctxAddNote.onclick = () => {
          state.customChord.frets[stringIndex] = fret;
          state.customChord.fingers[stringIndex] = 0;
          drawChord(state.customChord);
          updateChordIdentification();
        };
      }
    }

    // Update translations in menu
    if (window.t) {
      contextMenu.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = window.t(key);
      });
    }
  });
}

function getEffectiveFrets(chord) {
  let frets = [...chord.frets];
  if (chord.bar) {
    const barFret = chord.bar.fret;
    // bar.strings are 1-based, e.g. [1, 6]
    const startStr = Math.min(...chord.bar.strings) - 1;
    const endStr = Math.max(...chord.bar.strings) - 1;

    for (let i = startStr; i <= endStr; i++) {
      // Logic:
      // -1 (Mute): Keep muted.
      // -2 (Explicit Open): Treat as 0 (Open), ignore barre.
      // 0 (Default/Empty): Apply barre.
      // >0 (Fret): If covered by barre, use MAX(fret, barFret).

      if (frets[i] === -1) {
        // Keep muted
      } else if (frets[i] === -2) {
        frets[i] = 0; // Explicit open
      } else if (frets[i] === 0) {
        frets[i] = barFret; // Barre takes over
      } else {
        // Fret > 0
        // If fret is lower than barre, barre overrides it (physically)
        // Unless it's higher pitch? No, higher fret number = higher pitch.
        // If I press fret 2 and fret 3 (barre), fret 3 sounds.
        frets[i] = Math.max(frets[i], barFret);
      }
    }
  } else {
    // No barre, just convert -2 to 0
    for (let i = 0; i < 6; i++) {
      if (frets[i] === -2) frets[i] = 0;
    }
  }
  return frets;
}

function updateChordIdentification() {
  const effectiveFrets = getEffectiveFrets(state.customChord);
  const identified = identifyChord(effectiveFrets);

  if (identified) {
    const rootIndex = NOTES_SHARP.indexOf(identified.root);
    const displayRoot =
      rootIndex !== -1 ? getNoteName(rootIndex) : identified.root;
    const displayType = window.t
      ? window.t("type_" + identified.type)
      : identified.type;
    chordNameDisplay.innerHTML = `${displayRoot} ${displayType} <span style="font-size:0.6em; color:#888">${window.t(
      "label_detected"
    )}</span>`;
  } else {
    // Try to find a translation for unknown_chord, or default
    const unknownText = window.t ? window.t("unknown_chord") : "Unknown chord";
    // If translation returns key (missing), show "Unknown chord"
    const displayText =
      unknownText === "unknown_chord" ? "Unknown chord" : unknownText;
    chordNameDisplay.innerHTML = displayText;
  }
}

function identifyChord(frets) {
  for (const root in CHORD_DATA) {
    for (const type in CHORD_DATA[root]) {
      const variations = CHORD_DATA[root][type];
      for (const variation of variations) {
        if (arraysEqual(variation.frets, frets)) {
          return { root, type };
        }
      }
    }
  }
  return null;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function updateFretNavButtons() {
  const upBtn = document.getElementById("fretUpBtn");
  const downBtn = document.getElementById("fretDownBtn");

  if (upBtn) {
    upBtn.disabled = state.baseFret <= 1;
    upBtn.onclick = () => {
      if (state.baseFret > 1) {
        state.baseFret--;
        drawChord(state.customChord);
        updateFretNavButtons();
      }
    };
  }

  if (downBtn) {
    downBtn.disabled = state.baseFret >= 19; // Max fret 24 - 5 visible = 19
    downBtn.onclick = () => {
      if (state.baseFret < 19) {
        state.baseFret++;
        drawChord(state.customChord);
        updateFretNavButtons();
      }
    };
  }
}

function updateRootFrequencyDisplay() {
  if (!rootFreqDisplay) return;

  // If custom mode, maybe clear or show nothing?
  if (state.isCustomMode) {
    rootFreqDisplay.textContent = "";
    return;
  }

  const variations = getVariations();
  const currentChord = variations[state.voicingIndex];
  if (!currentChord) {
    rootFreqDisplay.textContent = "";
    return;
  }

  // Find the root note frequency
  // 1. Identify Root Pitch Class
  const rootIndex = NOTES_SHARP.indexOf(state.root); // 0-11
  if (rootIndex === -1) {
    rootFreqDisplay.textContent = "";
    return;
  }

  // 2. Iterate strings to find the first note that matches the root PC
  // state.currentTuning is [High E, ..., Low E] (Strings 1 to 6)
  // We need [Low E, ..., High E] to match currentChord.frets order
  const stringBaseMidi = [...state.currentTuning].reverse();
  
  let rootMidi = null;

  // Iterate from String 6 (index 0) to String 1 (index 5)
  // We want the lowest root note, so the first one we find is likely the bass/root.
  for (let i = 0; i < 6; i++) {
    const fret = currentChord.frets[i];
    if (fret >= 0) {
      const midi = stringBaseMidi[i] + fret;
      if (midi % 12 === rootIndex) {
        rootMidi = midi;
        break; // Found the lowest root
      }
    }
  }

  if (rootMidi === null) {
    // Fallback: if no root note found (e.g. rootless voicing), maybe show nothing?
    rootFreqDisplay.textContent = "";
    return;
  }

  // 3. Calculate Frequency with Detune
  // Base freq
  let freq = 440 * Math.pow(2, (rootMidi - 69) / 12);

  // Apply Advanced Pitch Shift
  const totalDetuneCents =
    state.advanced.shiftOctaves * 1200 +
    state.advanced.shiftSemitones * 100 +
    state.advanced.shiftFull * 100 +
    state.advanced.shiftCents;

  if (totalDetuneCents !== 0) {
    freq = freq * Math.pow(2, totalDetuneCents / 1200);
  }

  rootFreqDisplay.textContent = `(${freq.toFixed(1)} Hz)`;
}

// Update frequency every 100ms
setInterval(updateRootFrequencyDisplay, 100);

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
  const frets = chord.frets.filter((f) => f > 0);
  const minFret = frets.length ? Math.min(...frets) : 0;
  const maxFret = frets.length ? Math.max(...frets) : 0;

  let startFret = 1;
  if (state.isCustomMode && state.baseFret !== undefined) {
    startFret = state.baseFret;
  } else if (maxFret > 5) {
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
  const drawBarre = (bar, isGhost = false) => {
    const barFret = bar.fret - startFret + 1;
    if (barFret > 0 && barFret <= numFrets) {
      const s1 = Math.min(bar.strings[0], bar.strings[1]);
      const s2 = Math.max(bar.strings[0], bar.strings[1]);

      const startIdx = s1 - 1;
      const endIdx = s2 - 1;

      const x1 = marginX + startIdx * stringSpacing;
      const x2 = marginX + endIdx * stringSpacing;
      const y = marginY + (barFret - 0.5) * fretSpacing;

      ctx.lineCap = "round";
      ctx.lineWidth = 14;
      ctx.strokeStyle = isGhost
        ? "rgba(51, 51, 51, 0.5)"
        : getFingerColor(bar.finger);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  };

  if (chord.bar) {
    drawBarre(chord.bar);
  }

  if (state.interaction.barreCreating) {
    const b = state.interaction.barreCreating;
    drawBarre(
      {
        fret: b.fret,
        strings: [b.startString + 1, b.endString + 1],
        finger: 0,
      },
      true
    );
  }

  // Draw Dots / Markers
  chord.frets.forEach((fret, stringIndex) => {
    // Skip if this is the dot being dragged
    if (
      state.interaction.dragging &&
      state.interaction.dragging.stringIndex === stringIndex
    ) {
      return;
    }

    const x = marginX + stringIndex * stringSpacing;

    // Muted/Open
    if (fret === -1) {
      ctx.fillStyle = "#444";
      ctx.font = "20px Arial";
      ctx.fillText("X", x - 6, marginY - 10);
    } else if (fret === 0 || fret === -2) {
      // Check if covered by barre (only if 0, not -2)
      let drawnAsBarre = false;
      if (fret === 0 && chord.bar) {
        const bMin = Math.min(chord.bar.strings[0], chord.bar.strings[1]);
        const bMax = Math.max(chord.bar.strings[0], chord.bar.strings[1]);
        const stringNum = stringIndex + 1;
        if (stringNum >= bMin && stringNum <= bMax) {
          // It is covered by barre, so it's effectively the barre fret.
          // We should draw a dot on the barre fret?
          // Usually the barre line is enough.
          // But if we want to be explicit, we can leave it.
          // The barre line is drawn separately.
          drawnAsBarre = true;
        }
      }

      if (!drawnAsBarre || fret === -2) {
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, marginY - 15, 6, 0, Math.PI * 2);
        ctx.stroke();

        // If explicit open (-2), maybe add a small indicator?
        if (fret === -2) {
          ctx.fillStyle = "#444";
          ctx.font = "10px Arial";
          ctx.fillText("O", x - 4, marginY - 12);
        }
      }
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
          // Check if this note is being shadowed by a dragged note
          let isShadowed = false;

          // 1. Shadowed by Drag
          if (
            state.interaction.dragging &&
            state.interaction.snapString === stringIndex
          ) {
            const snapFret = state.interaction.snapFret;
            // If dragging ONTO this string
            if (state.interaction.dragging.stringIndex !== stringIndex) {
              if (snapFret > fret) {
                isShadowed = true; // Dragged note is higher, so this one is shadowed
              }
            }
          }

          // 2. Shadowed by Barre
          if (chord.bar) {
            const bMin = Math.min(chord.bar.strings[0], chord.bar.strings[1]);
            const bMax = Math.max(chord.bar.strings[0], chord.bar.strings[1]);
            const stringNum = stringIndex + 1; // 1-based index

            if (stringNum >= bMin && stringNum <= bMax) {
              if (fret < chord.bar.fret) {
                isShadowed = true;
              }
            }
          }

          ctx.fillStyle = isShadowed ? "#ff0000" : getFingerColor(finger);
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Finger number (only if not custom/0)
          if (finger !== 0) {
            ctx.fillStyle = "#fff";
            ctx.font = "14px Arial";
            ctx.fillText(finger, x - 4, y + 5);
          }
        }
      }
    }
  });

  // Draw Dragging Dot
  if (state.interaction.dragging && state.interaction.dragPos) {
    const { x, y } = state.interaction.dragPos;

    // Draw ghost at snap target if available
    if (
      state.interaction.snapFret !== undefined &&
      state.interaction.snapFret !== null
    ) {
      const snapFret = state.interaction.snapFret;
      const snapString =
        state.interaction.snapString !== undefined
          ? state.interaction.snapString
          : state.interaction.dragging.stringIndex;
      const sx = marginX + snapString * stringSpacing;

      // Check for conflict/shadowing
      let isShadowed = false;
      let isShadowing = false;

      // If we are on a different string than source, check existing note
      if (snapString !== state.interaction.dragging.stringIndex) {
        const existingFret = chord.frets[snapString];
        if (existingFret > 0) {
          // Conflict exists
          if (snapFret < existingFret) {
            isShadowed = true; // New note is behind existing
          } else if (snapFret > existingFret) {
            isShadowing = true; // New note shadows existing
          } else {
            // Same fret - overlap (maybe red too?)
            isShadowed = true;
          }
        }
      }

      if (snapFret === -1) {
        // Mute ghost
        ctx.fillStyle = "rgba(68, 68, 68, 0.5)";
        ctx.font = "20px Arial";
        ctx.fillText("X", sx - 6, marginY - 10);
      } else if (snapFret === 0) {
        // Open ghost
        ctx.strokeStyle = "rgba(68, 68, 68, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, marginY - 15, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fret ghost
        const displayFret = snapFret - startFret + 1;
        if (displayFret > 0 && displayFret <= numFrets) {
          const sy = marginY + (displayFret - 0.5) * fretSpacing;

          // Color logic
          if (isShadowed) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Red if shadowed
          } else {
            ctx.fillStyle = "rgba(51, 51, 51, 0.3)"; // Normal ghost
          }

          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw the dragged dot (semi-transparent)
    ctx.fillStyle = "rgba(51, 51, 51, 0.8)";
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
window.renderChordLibrary = renderChordLibrary;

})();
