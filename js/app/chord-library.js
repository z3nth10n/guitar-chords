// Chord Library Logic

// --- Data ---
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTES_LATIN = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Finger mapping: 1=Index (Yellow), 2=Middle (Purple), 3=Ring (Blue), 4=Pinky (Orange)
// Frets: -1 = Muted (x), 0 = Open (o), >0 = Fret number
const CHORD_DATA = {
  'C': {
    'Major': [
      { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, // Open C
      { frets: [8, 10, 10, 9, 8, 8], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 8, finger: 1, strings: [1, 6] } } // Barre C (E shape)
    ],
    'Minor': [
      { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 3, finger: 1, strings: [1, 5] } },
      { frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 8, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
      { frets: [8, 10, 8, 9, 8, 8], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 8, finger: 1, strings: [1, 6] } }
    ]
  },
  'C#': {
    'Major': [
      { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 4, finger: 1, strings: [1, 5] } },
      { frets: [9, 11, 11, 10, 9, 9], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 9, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 4, finger: 1, strings: [1, 5] } },
      { frets: [9, 11, 11, 9, 9, 9], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 9, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 4, finger: 1, strings: [1, 5] } }
    ]
  },
  'D': {
    'Major': [
      { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
      { frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 5, finger: 1, strings: [1, 5] } }
    ],
    'Minor': [
      { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
      { frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 5, finger: 1, strings: [1, 5] } }
    ],
    '7': [
      { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
      { frets: [-1, 5, 7, 5, 7, 5], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 5, finger: 1, strings: [1, 5] } }
    ]
  },
  'D#': {
    'Major': [
      { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 6, finger: 1, strings: [1, 5] } },
      { frets: [11, 13, 13, 12, 11, 11], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 11, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 6, finger: 1, strings: [1, 5] } },
      { frets: [11, 13, 13, 11, 11, 11], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 11, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 6, finger: 1, strings: [1, 5] } }
    ]
  },
  'E': {
    'Major': [
      { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
      { frets: [-1, 7, 9, 9, 9, 7], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 7, finger: 1, strings: [1, 5] } }
    ],
    'Minor': [
      { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
      { frets: [-1, 7, 9, 9, 8, 7], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 7, finger: 1, strings: [1, 5] } }
    ],
    '7': [
      { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
      { frets: [-1, 7, 9, 7, 9, 7], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 7, finger: 1, strings: [1, 5] } }
    ]
  },
  'F': {
    'Major': [
      { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 1, finger: 1, strings: [1, 6] } },
      { frets: [-1, 8, 10, 10, 10, 8], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 8, finger: 1, strings: [1, 5] } }
    ],
    'Minor': [
      { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 1, finger: 1, strings: [1, 6] } },
      { frets: [-1, 8, 10, 10, 9, 8], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 8, finger: 1, strings: [1, 5] } }
    ],
    '7': [
      { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 1, finger: 1, strings: [1, 6] } }
    ]
  },
  'F#': {
    'Major': [
      { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 2, finger: 1, strings: [1, 6] } },
      { frets: [-1, 9, 11, 11, 11, 9], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 9, finger: 1, strings: [1, 5] } }
    ],
    'Minor': [
      { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 2, finger: 1, strings: [1, 6] } },
      { frets: [-1, 9, 11, 11, 10, 9], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 9, finger: 1, strings: [1, 5] } }
    ],
    '7': [
      { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 2, finger: 1, strings: [1, 6] } }
    ]
  },
  'G': {
    'Major': [
      { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
      { frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 3, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 3, finger: 1, strings: [1, 6] } },
      { frets: [-1, 10, 12, 12, 11, 10], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 10, finger: 1, strings: [1, 5] } }
    ],
    '7': [
      { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
      { frets: [3, 5, 3, 4, 3, 3], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 3, finger: 1, strings: [1, 6] } }
    ]
  },
  'G#': {
    'Major': [
      { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 4, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 4, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 4, finger: 1, strings: [1, 6] } }
    ]
  },
  'A': {
    'Major': [
      { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
      { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 5, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
      { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 5, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
      { frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 5, finger: 1, strings: [1, 6] } }
    ]
  },
  'A#': {
    'Major': [
      { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 1, finger: 1, strings: [1, 5] } },
      { frets: [6, 8, 8, 7, 6, 6], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 6, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 1, finger: 1, strings: [1, 5] } },
      { frets: [6, 8, 8, 6, 6, 6], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 6, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 1, finger: 1, strings: [1, 5] } },
      { frets: [6, 8, 6, 7, 6, 6], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 6, finger: 1, strings: [1, 6] } }
    ]
  },
  'B': {
    'Major': [
      { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], bar: { fret: 2, finger: 1, strings: [1, 5] } },
      { frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], bar: { fret: 7, finger: 1, strings: [1, 6] } }
    ],
    'Minor': [
      { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], bar: { fret: 2, finger: 1, strings: [1, 5] } },
      { frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], bar: { fret: 7, finger: 1, strings: [1, 6] } }
    ],
    '7': [
      { frets: [-1, 2, 4, 2, 4, 2], fingers: [0, 1, 3, 1, 4, 1], bar: { fret: 2, finger: 1, strings: [1, 5] } },
      { frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], bar: { fret: 7, finger: 1, strings: [1, 6] } }
    ]
  }
};

// --- State ---
const state = {
  root: 'C',
  type: 'Major',
  voicingIndex: 0,
  tuning: 'standard',
  notation: localStorage.getItem('guitar_notation') || 'anglo'
};

// --- DOM Elements ---
const rootPicker = document.getElementById('rootPicker');
const typeSelect = document.getElementById('typeSelect');
const chordNameDisplay = document.getElementById('chordNameDisplay');
const canvas = document.getElementById('fretboardCanvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prevVoicing');
const nextBtn = document.getElementById('nextVoicing');
const voicingCounter = document.getElementById('voicingCounter');
const langSelect = document.getElementById('langSelect');
const notationSelect = document.getElementById('notationSelect');
const tuningSelect = document.getElementById('tuningSelect');

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  // Set translation prefix
  if (window.setTranslationPrefix) {
    window.setTranslationPrefix('chord-library/chord-library');
  }

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  let userLang = browserLang.startsWith('es') ? 'es' : 'en';

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
    if (userLang === 'es') {
      state.notation = 'latin';
      notationSelect.value = 'latin';
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
    if (newLang === 'en') {
      state.notation = 'anglo';
      notationSelect.value = 'anglo';
    } else if (newLang === 'es') {
      state.notation = 'latin';
      notationSelect.value = 'latin';
    }
    localStorage.setItem("guitar_notation", state.notation);

    if (window.loadTranslations) {
      window.loadTranslations(newLang, () => {
        renderRootPicker(); // Re-render to update note names
        renderTypeSelect(); // Re-render types to update translations
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
  renderTypeSelect();
  
  // Event Listeners
  typeSelect.addEventListener('change', (e) => {
    state.type = e.target.value;
    state.voicingIndex = 0;
    updateDisplay();
  });

  prevBtn.addEventListener('click', () => {
    if (state.voicingIndex > 0) {
      state.voicingIndex--;
      updateDisplay();
    }
  });

  nextBtn.addEventListener('click', () => {
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
  if (state.notation === 'latin') {
    return NOTES_LATIN[noteIndex];
  }
  return NOTES_SHARP[noteIndex];
}

function renderRootPicker() {
  rootPicker.innerHTML = '';
  NOTES_SHARP.forEach((note, index) => {
    const btn = document.createElement('button');
    btn.className = `note-btn ${note === state.root ? 'active' : ''}`;
    btn.textContent = getNoteName(index);
    btn.onclick = () => {
      document.querySelectorAll('.note-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.root = note;
      state.voicingIndex = 0;
      updateDisplay();
    };
    rootPicker.appendChild(btn);
  });
}

function renderTypeSelect() {
  const types = ['Major', 'Minor', '7']; // Add more as needed
  const currentVal = typeSelect.value;
  
  typeSelect.innerHTML = types.map(t => {
    const label = window.t ? window.t('type_' + t) : t;
    return `<option value="${t}">${label}</option>`;
  }).join('');
  
  if (currentVal && types.includes(currentVal)) {
      typeSelect.value = currentVal;
  }
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
  const displayType = window.t ? window.t('type_' + state.type) : state.type;
  
  chordNameDisplay.textContent = `${displayRoot} ${displayType}`;

  // Update Controls
  voicingCounter.textContent = variations.length > 0 ? `${state.voicingIndex + 1} / ${variations.length}` : '0 / 0';
  prevBtn.disabled = state.voicingIndex === 0;
  nextBtn.disabled = state.voicingIndex >= variations.length - 1;

  // Draw
  if (currentChord) {
    drawChord(currentChord);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Chord not found', 80, 200);
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
  const frets = chord.frets.filter(f => f > 0);
  const minFret = frets.length ? Math.min(...frets) : 0;
  const maxFret = frets.length ? Math.max(...frets) : 0;
  
  let startFret = 1;
  if (maxFret > 5) {
    startFret = minFret; 
  }

  // Draw Fretboard Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  // Draw Frets
  ctx.strokeStyle = '#444';
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
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
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
      
      ctx.lineCap = 'round';
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
      ctx.fillStyle = '#444';
      ctx.font = '20px Arial';
      ctx.fillText('X', x - 6, marginY - 10);
    } else if (fret === 0) {
      ctx.strokeStyle = '#444';
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
        if (chord.bar && fret === chord.bar.fret && finger === chord.bar.finger) {
            coveredByBar = true;
        }

        if (!coveredByBar) {
            ctx.fillStyle = getFingerColor(finger);
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Finger number
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(finger, x - 4, y + 5);
        }
      }
    }
  });
}

function getFingerColor(finger) {
  switch (finger) {
    case 1: return '#f1c40f'; // Yellow
    case 2: return '#9b59b6'; // Purple
    case 3: return '#3498db'; // Blue
    case 4: return '#e67e22'; // Orange
    default: return '#000';
  }
}
