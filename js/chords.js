    // Notes by semitone (pitch class)
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F",
      "F#", "G", "G#", "A", "A#", "B"];
    const NOTE_NAMES_LATIN = ["Do", "Do#", "Re", "Re#", "Mi", "Fa",
      "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

    let currentNotation = "latin";

    function getNoteName(pc) {
      return currentNotation === "latin"
        ? NOTE_NAMES_LATIN[pc]
        : NOTE_NAMES[pc];
    }

    // Built-in tunings
    const builtInTunings = {
      "tuning_e_std":       [4, 11, 7, 2, 9, 4],
      "tuning_drop_d":      [4, 11, 7, 2, 9, 2],
      "tuning_d_std":       [2, 9, 5, 0, 7, 2],
      "tuning_drop_c":      [2, 9, 5, 0, 7, 0],
      "tuning_drop_b":      [1, 8, 4, 11, 6, 11],
      "tuning_drop_a":      [11, 6, 2, 9, 4, 9]
    };

    // Custom tunings
    let customTunings = {};
    const CUSTOM_TUNINGS_KEY = "customGuitarTuningsV1";

    function loadCustomTunings() {
      const raw = localStorage.getItem(CUSTOM_TUNINGS_KEY);
      if (!raw) return {};
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") return obj;
      } catch (e) {
        console.warn("Could not parse custom tunings", e);
      }
      return {};
    }

    function saveCustomTunings() {
      const json = JSON.stringify(customTunings);
      localStorage.setItem(CUSTOM_TUNINGS_KEY, json);
    }

    document.addEventListener("DOMContentLoaded", async () => {
      const tuningSelect = document.getElementById("tuningSelect");
      const notationSelect = document.getElementById("notationSelect");
      const fretInputs = Array.from(document.querySelectorAll(".fret-input"));
      const stringTunings = Array.from(document.querySelectorAll(".string-tuning"));
      const saveTuningButton = document.getElementById("saveTuningButton");
      const calcButton = document.getElementById("calcButton");
      const langSelect = document.getElementById("langSelect");

      currentNotation = notationSelect.value || "latin";

      function updateChordUI() {
        refreshStringTuningOptionLabels();
        populateTuningSelect(document.getElementById("tuningSelect").value);
        updateStringNotes();
        
        const resultEl = document.getElementById("result");
        if (resultEl.textContent) {
            calculateChord();
        }
      }

      // Detect browser language
      const browserLang = navigator.language || navigator.userLanguage || 'en';
      const userLang = browserLang.startsWith('es') ? 'es' : 'en';
      langSelect.value = userLang;

      // Sync notation with default language
      if (userLang === 'en') {
        notationSelect.value = 'anglo';
        currentNotation = 'anglo';
      } else if (userLang === 'es') {
        notationSelect.value = 'latin';
        currentNotation = 'latin';
      }

      buildStringTuningOptions();
      customTunings = loadCustomTunings();
      populateTuningSelect("builtin::tuning_e_std");
      applySelectedTuning();
      
      // Use window.loadTranslations to ensure it's found
      if (window.loadTranslations) {
        await window.loadTranslations(userLang, updateChordUI);
      }

      langSelect.addEventListener("change", (e) => {
        const newLang = e.target.value;

        // Auto-switch notation based on language
        if (newLang === 'en') {
            notationSelect.value = 'anglo';
            currentNotation = 'anglo';
        } else if (newLang === 'es') {
            notationSelect.value = 'latin';
            currentNotation = 'latin';
        }

        if (window.loadTranslations) {
            window.loadTranslations(newLang, updateChordUI);
        }
      });

      notationSelect.addEventListener("change", (e) => {
        currentNotation = e.target.value;
        refreshStringTuningOptionLabels();
        updateStringNotes();
      });

      tuningSelect.addEventListener("change", () => {
        applySelectedTuning();
        clearFretInputs();
        clearMessages();
      });

      stringTunings.forEach(sel => {
        sel.addEventListener("change", () => {
          updateStringNotes();
        });
      });

      fretInputs.forEach(input => {
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            calculateChord();
          } else if (ev.key === "Tab") {
            ev.preventDefault();
            const idx = fretInputs.indexOf(ev.target);
            let nextIndex;
            if (ev.shiftKey) {
              nextIndex = (idx - 1 + fretInputs.length) % fretInputs.length;
            } else {
              nextIndex = (idx + 1) % fretInputs.length;
            }
            fretInputs[nextIndex].focus();
            fretInputs[nextIndex].select();
          }
        });

        input.addEventListener("input", () => {
          updateStringNotes();
        });
      });

      calcButton.addEventListener("click", calculateChord);
      saveTuningButton.addEventListener("click", saveCurrentTuning);

      updateStringNotes();
    });

    function buildStringTuningOptions() {
      const stringTunings = document.querySelectorAll(".string-tuning");
      stringTunings.forEach(sel => {
        sel.innerHTML = "";
        for (let pc = 0; pc < 12; pc++) {
          const opt = document.createElement("option");
          opt.value = String(pc);
          opt.textContent = getNoteName(pc);
          sel.appendChild(opt);
        }
      });
    }

    function refreshStringTuningOptionLabels() {
      const stringTunings = document.querySelectorAll(".string-tuning");
      stringTunings.forEach(sel => {
        Array.from(sel.options).forEach(opt => {
          const pc = parseInt(opt.value, 10);
          opt.textContent = getNoteName(pc);
        });
      });
    }

    function populateTuningSelect(selectedValue) {
      const tuningSelect = document.getElementById("tuningSelect");
      tuningSelect.innerHTML = "";

      const builtGroup = document.createElement("optgroup");
      builtGroup.label = t("group_builtin");
      Object.keys(builtInTunings).forEach(key => {
        const option = document.createElement("option");
        option.value = "builtin::" + key;
        option.textContent = t(key);
        builtGroup.appendChild(option);
      });
      tuningSelect.appendChild(builtGroup);

      const customNames = Object.keys(customTunings);
      if (customNames.length > 0) {
        const customGroup = document.createElement("optgroup");
        customGroup.label = t("group_custom");
        customNames.forEach(name => {
          const option = document.createElement("option");
          option.value = "custom::" + name;
          option.textContent = name;
          customGroup.appendChild(option);
        });
        tuningSelect.appendChild(customGroup);
      }

      const options = Array.from(tuningSelect.options);
      if (
        selectedValue &&
        options.some(o => o.value === selectedValue)
      ) {
        tuningSelect.value = selectedValue;
      } else {
        const defaultValue = "builtin::tuning_e_std";
        tuningSelect.value = options.some(o => o.value === defaultValue)
          ? defaultValue
          : (options[0]?.value || "");
      }
    }

    function applySelectedTuning() {
      const tuningSelect = document.getElementById("tuningSelect");
      const value = tuningSelect.value;
      if (!value) return;

      const [kind, name] = value.split("::");
      let notes;
      if (kind === "builtin") {
        notes = builtInTunings[name];
      } else {
        notes = customTunings[name];
      }
      if (!notes) return;

      const stringTunings = document.querySelectorAll(".string-tuning");
      stringTunings.forEach((sel, index) => {
        sel.value = String(notes[index]);
      });

      const nameInput = document.getElementById("tuningNameInput");
      if (kind === "custom") {
        nameInput.value = name;
      }
      updateStringNotes();
    }

    function clearFretInputs() {
      document.querySelectorAll(".fret-input").forEach(input => {
        input.value = "";
      });
      document.querySelectorAll(".string-note").forEach(out => {
        out.value = "";
      });
    }

    function clearMessages() {
      document.getElementById("errors").textContent = "";
      document.getElementById("result").textContent = "";
      document.getElementById("detail").textContent = "";
    }

    function updateStringNotes() {
      const fretInputs = document.querySelectorAll(".fret-input");
      const noteOutputs = document.querySelectorAll(".string-note");
      const stringTunings = document.querySelectorAll(".string-tuning");

      fretInputs.forEach((input, index) => {
        const out = noteOutputs[index];
        if (!out) return;

        const raw = input.value.trim();
        if (raw === "" || raw.toLowerCase() === "x") {
          out.value = "";
          return;
        }

        const fret = parseInt(raw, 10);
        if (Number.isNaN(fret) || fret < 0 || fret > 24) {
          out.value = "";
          return;
        }

        const openPc = parseInt(stringTunings[index].value, 10);
        const notePc = (openPc + fret) % 12;
        out.value = getNoteName(notePc);
      });
    }

    function calculateChord() {
      const errorsEl = document.getElementById("errors");
      const resultEl = document.getElementById("result");
      const detailEl = document.getElementById("detail");

      errorsEl.textContent = "";
      resultEl.textContent = "";
      detailEl.textContent = "";

      const fretInputs = document.querySelectorAll(".fret-input");
      const stringTunings = document.querySelectorAll(".string-tuning");

      const notes = [];
      let hasAnyNote = false;
      let hasError = false;

      fretInputs.forEach((input, index) => {
        if (hasError) return;
        const raw = input.value.trim();

        if (raw === "" || raw.toLowerCase() === "x") {
          return;
        }

        const fret = parseInt(raw, 10);
        if (Number.isNaN(fret) || fret < 0 || fret > 24) {
          hasError = true;
          errorsEl.textContent = t("msg_error_data");
          return;
        }

        hasAnyNote = true;
        const openPc = parseInt(stringTunings[index].value, 10);
        const notePc = (openPc + fret) % 12;
        notes.push(notePc);
      });

      if (hasError) {
        resultEl.textContent = t("msg_error_data");
        return;
      }

      if (!hasAnyNote) {
        resultEl.textContent = t("msg_no_notes");
        return;
      }

      const chordInfo = detectChord(notes);
      const uniquePcs = Array.from(new Set(notes)).sort((a, b) => a - b);
      const noteNames = uniquePcs.map(pc => getNoteName(pc)).join(" - ");

      if (!chordInfo) {
        resultEl.textContent = t("msg_unknown_chord");
        detailEl.textContent = t("msg_notes_detected") + noteNames;
      } else {
        resultEl.textContent = chordInfo.name;
        let extra;
        if (chordInfo.isPowerChord) {
          extra = t("msg_type") + t("power_chord") + t("msg_notes") + noteNames;
        } else if (chordInfo.quality === "single_note") {
           extra = t("single_note") + t("msg_notes") + noteNames;
        } else {
          extra = t("msg_type") + t(chordInfo.quality) + t("msg_notes") + noteNames;
        }
        detailEl.textContent = extra;
      }

      updateStringNotes();
    }

    const CHORD_PATTERNS = [
      { name: "chord_major",               suffix: "",      intervals: [0, 4, 7] },
      { name: "chord_minor",               suffix: "m",     intervals: [0, 3, 7] },
      { name: "chord_dim",          suffix: "dim",   intervals: [0, 3, 6] },
      { name: "chord_aug",           suffix: "aug",   intervals: [0, 4, 8] },
      { name: "chord_sus2",        suffix: "sus2",  intervals: [0, 2, 7] },
      { name: "chord_sus4",        suffix: "sus4",  intervals: [0, 5, 7] },
      { name: "chord_maj7",             suffix: "maj7",  intervals: [0, 4, 7, 11] },
      { name: "chord_m7",             suffix: "m7",    intervals: [0, 3, 7, 10] },
      { name: "chord_dom7",         suffix: "7",     intervals: [0, 4, 7, 10] },
      { name: "chord_m7b5",    suffix: "m7b5",  intervals: [0, 3, 6, 10] },
      { name: "chord_dim7",        suffix: "dim7",  intervals: [0, 3, 6, 9] },
      { name: "chord_mmaj7",       suffix: "mMaj7", intervals: [0, 3, 7, 11] },
      { name: "chord_maj6",             suffix: "6",     intervals: [0, 4, 7, 9] },
      { name: "chord_m6",             suffix: "m6",    intervals: [0, 3, 7, 9] }
    ];

    function detectChord(notePcs) {
      const pcs = Array.from(new Set(notePcs));
      if (pcs.length === 0) return null;

      pcs.sort((a, b) => a - b);

      if (pcs.length === 1) {
        const rootName = getNoteName(pcs[0]);
        return {
          name: rootName,
          root: rootName,
          quality: "single_note"
        };
      }

      if (pcs.length === 2) {
        const [a, b] = pcs;
        const intervalAB = (b - a + 12) % 12;
        const intervalBA = (a - b + 12) % 12;

        if (intervalAB === 7 || intervalBA === 7) {
          const rootPc = intervalAB === 7 ? a : b;
          const rootName = getNoteName(rootPc);
          return {
            name: rootName + "5",
            root: rootName,
            quality: "power_chord",
            isPowerChord: true
          };
        }
        return null;
      }

      let bestMatch = null;

      pcs.forEach(rootPc => {
        const intervals = pcs.map(pc => (pc - rootPc + 12) % 12).sort((a, b) => a - b);
        const intervalSet = new Set(intervals);

        CHORD_PATTERNS.forEach(pattern => {
          const isSubset = pattern.intervals.every(i => intervalSet.has(i));
          if (isSubset) {
            const score = pattern.intervals.length;
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = {
                rootPc,
                pattern,
                score
              };
            }
          }
        });
      });

      if (!bestMatch) return null;

      const rootName = getNoteName(bestMatch.rootPc);
      return {
        name: rootName + bestMatch.pattern.suffix,
        root: rootName,
        quality: bestMatch.pattern.name
      };
    }

    function saveCurrentTuning() {
      const nameInput = document.getElementById("tuningNameInput");
      const name = nameInput.value.trim();
      if (!name) {
        alert(t("msg_enter_name"));
        return;
      }

      const stringTunings = document.querySelectorAll(".string-tuning");
      if (stringTunings.length !== 6) {
        alert(t("msg_error_reading_strings"));
        return;
      }

      const notes = Array.from(stringTunings).map(sel => parseInt(sel.value, 10));

      customTunings[name] = notes;
      saveCustomTunings();

      const selectedValue = "custom::" + name;
      populateTuningSelect(selectedValue);
      applySelectedTuning();
    }
