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
// Frets: -1 = Muted (x), 0 = Open (o), >0 = Fret number

// --- Chord Shapes Definition ---
const CHORD_SHAPES = {
  Major: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 1, 0, 0],
      fingers: [1, 3, 4, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 2, 0],
      fingers: [0, 1, 2, 3, 4, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  Minor: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 0, 0, 0],
      fingers: [1, 3, 4, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 1, 0],
      fingers: [0, 1, 3, 4, 2, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  7: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 1, 0, 0],
      fingers: [1, 3, 1, 2, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 0, 2, 0],
      fingers: [0, 1, 3, 1, 4, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  5: [
    {
      rootString: 6,
      offsets: [0, 2, 2, -1, -1, -1],
      fingers: [1, 3, 4, 0, 0, 0],
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, -1, -1],
      fingers: [0, 1, 3, 4, 0, 0],
    },
  ],
  6: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 1, 2, 0],
      fingers: [1, 3, 4, 2, 4, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 2, 2],
      fingers: [0, 1, 2, 2, 2, 2],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  m6: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 0, 2, 0],
      fingers: [1, 3, 4, 1, 4, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 1, 2],
      fingers: [0, 1, 3, 4, 2, 4],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  maj7: [
    {
      rootString: 6,
      offsets: [0, 2, 1, 1, 0, 0],
      fingers: [1, 3, 2, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 1, 2, 0],
      fingers: [0, 1, 3, 2, 4, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  m7: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 0, 0, 0],
      fingers: [1, 3, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 0, 1, 0],
      fingers: [0, 1, 3, 1, 2, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  m7b5: [
    {
      rootString: 6,
      offsets: [0, 1, 2, 0, 3, -1],
      fingers: [1, 2, 4, 1, 4, 0],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 1, 0, 1, -1],
      fingers: [0, 1, 2, 1, 3, 0],
      bar: { finger: 1, strings: [2, 4] },
    },
  ],
  dim7: [
    {
      rootString: 6,
      offsets: [0, -1, -1, -1, -1, -1],
      fingers: [1, 0, 0, 0, 0, 0],
    },
    {
      rootString: 5,
      offsets: [-1, 0, 1, -1, 1, -1],
      fingers: [0, 2, 3, 1, 4, 0],
    },
  ],
  "m(maj7)": [
    {
      rootString: 5,
      offsets: [-1, 0, 2, 1, 1, 0],
      fingers: [0, 1, 3, 2, 2, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  9: [
    {
      rootString: 5,
      offsets: [-1, 0, -1, 0, 0, 0],
      fingers: [0, 2, 1, 3, 3, 3],
      bar: { finger: 3, strings: [1, 3] },
    },
  ],
  maj9: [
    {
      rootString: 5,
      offsets: [-1, 0, -1, 1, 0, -1],
      fingers: [0, 2, 1, 4, 3, 0],
    },
  ],
  m9: [
    {
      rootString: 5,
      offsets: [-1, 0, -2, 0, 0, -1],
      fingers: [0, 2, 1, 3, 3, 0],
    },
  ],
  11: [
    {
      rootString: 6,
      offsets: [0, 0, 0, 0, 0, 0],
      fingers: [1, 1, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
  ],
  m11: [
    {
      rootString: 6,
      offsets: [0, 2, 0, 0, 0, 0],
      fingers: [1, 3, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
  ],
  13: [
    {
      rootString: 6,
      offsets: [0, -1, 0, 1, 2, 2],
      fingers: [1, 0, 2, 3, 4, 4],
    },
  ],
  maj13: [
    {
      rootString: 6,
      offsets: [0, -1, 1, 1, 2, -1],
      fingers: [1, 0, 2, 3, 4, 0],
    },
  ],
  m13: [
    {
      rootString: 6,
      offsets: [0, -1, 0, 0, 2, -1],
      fingers: [1, 0, 2, 2, 4, 0],
    },
  ],
  "6/9": [
    {
      rootString: 5,
      offsets: [-1, 0, -1, -1, 0, 0],
      fingers: [0, 2, 1, 1, 3, 4],
      bar: { finger: 1, strings: [3, 4] },
    },
  ],
  sus2: [
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 0, 0],
      fingers: [0, 1, 3, 4, 1, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  sus4: [
    {
      rootString: 6,
      offsets: [0, 2, 2, 2, 0, 0],
      fingers: [1, 3, 4, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 3, 0],
      fingers: [0, 1, 2, 3, 4, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  "7sus4": [
    {
      rootString: 6,
      offsets: [0, 2, 0, 2, 0, 0],
      fingers: [1, 3, 1, 4, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 0, 3, 0],
      fingers: [0, 1, 2, 1, 4, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  "7b5": [
    {
      rootString: 6,
      offsets: [0, -1, 0, 1, -1, -1],
      fingers: [2, 0, 3, 4, 0, 0],
    },
  ],
  "7b9": [
    {
      rootString: 5,
      offsets: [-1, 0, -1, 0, -1, -1],
      fingers: [0, 2, 1, 3, 1, 0],
    },
  ],
  "9sus4": [
    {
      rootString: 5,
      offsets: [-1, 0, 0, 0, 0, 0],
      fingers: [0, 1, 1, 1, 1, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  add9: [
    {
      rootString: 6,
      offsets: [0, 2, 4, 1, 0, 0],
      fingers: [1, 2, 4, 1, 1, 1],
      bar: { finger: 1, strings: [1, 6] },
    },
    {
      rootString: 5,
      offsets: [-1, 0, 2, 2, 0, 0],
      fingers: [0, 1, 3, 4, 1, 1],
      bar: { finger: 1, strings: [1, 5] },
    },
  ],
  aug9: [
    {
      rootString: 5,
      offsets: [-1, 0, -1, 0, 1, -1],
      fingers: [0, 2, 1, 3, 4, 0],
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

        const frets = shape.offsets.map((offset) => {
          if (offset === -1) return -1;
          return baseFret + offset;
        });

        let bar = null;
        if (shape.bar) {
          bar = { ...shape.bar, fret: baseFret };
        }

        data[root][type].push({
          frets: frets,
          fingers: shape.fingers,
          bar: bar,
        });
      });
    }
  });
  return data;
}

const CHORD_DATA = generateChordData();

// --- State ---
const state = {
  root: "C",
  type: "Major",
  voicingIndex: 0,
  tuning: "standard",
  notation: localStorage.getItem("guitar_notation") || "anglo",
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
const tuningSelect = document.getElementById("tuningSelect");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
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

  // Initial Render
  updateDisplay();
}

function getNoteName(noteIndex) {
  if (state.notation === "latin") {
    return NOTES_LATIN[noteIndex];
  }
  return NOTES_SHARP[noteIndex];
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

  chordNameDisplay.textContent = `${displayRoot} ${displayType}`;

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
