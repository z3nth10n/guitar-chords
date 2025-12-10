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
  // Canvas base + wrapper para multi-chunk
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  const baseCanvas = document.getElementById("tab-canvas");

  if (!canvasWrapper || !baseCanvas) return;

  canvasWrapper.innerHTML = "";
  const errorCanvas = baseCanvas;
  errorCanvas.width = 800;
  errorCanvas.height = 200;
  canvasWrapper.appendChild(errorCanvas);

  // Reasignamos globales para que funcionen otras cosas si fuera necesario
  // aunque aquí solo pintamos el error
  const ctx = errorCanvas.getContext("2d");

  ctx.fillStyle = "#200";
  ctx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
  ctx.fillStyle = "#f88";
  ctx.font = "16px monospace";
  ctx.fillText(msg, 10, 50);
}

async function renderVisualTab() {
  let currentNotation = "english";

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
      if (currentTab && currentTab.content) {
        const parsedData = parseTabContent(currentTab.content);
        renderVisualTab(parsedData);
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
        window.loadTranslations(newLang);
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

  // Initial load
  if (window.loadTranslations) {
    window.loadTranslations(userLang);
  }

  const selectionContainer = document.getElementById("selection-container");
  const playerContainer = document.getElementById("player-container");
  const backButton = document.getElementById("back-to-selection");

  // Canvas base + wrapper para multi-chunk
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  const baseCanvas = document.getElementById("tab-canvas");

  // Estas dos se irán reasignando al canvas del chunk que toque
  let canvas = baseCanvas;
  let ctx = canvas.getContext("2d");

  // Para poder saber qué chunks tenemos
  let currentChunks = []; // array de { canvas, blocks }
  let chunkObserver = null;

  // Tooltip element
  let tooltipEl = document.createElement("div");
  tooltipEl.className = "chord-tooltip";
  document.body.appendChild(tooltipEl);

  const accordionContainer = document.getElementById("accordion-container");
  const searchInput = document.getElementById("songsterr-search");
  const searchResults = document.getElementById("search-results");

  let currentTab = null;
  let tabsData = [];

  // Initialize
  // await loadTabs(); // Moved to end to ensure constants are loaded

  backButton.addEventListener("click", () => {
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
      // actualizamos por si han cambiado slug / título
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
      id: `remote:${entry.id}`, // esto se usará en ?tab=
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
    // ATENCIÓN: ahora llamamos a nuestra propia API, no directamente a Songsterr
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
    // Guardar/actualizar entrada en la caché local
    const entry = ensureRemoteTabEntry({
      songId: songMeta.songId,
      artist: songMeta.artist,
      title: songMeta.title,
    });

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
      renderAccordion(tabsData); // que aparezca en el acordeón
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

      // Añadir tabs remotas desde localStorage a tabsData
      hydrateRemoteTabsIntoTabsData();

      renderAccordion(tabsData);

      // Comprobar query param ?tab=
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
      if (lower.startsWith("canción:") || lower.startsWith("song:")) {
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
    return { song, artist, bpm, timeSig };
  }

  function renderAccordion(tabs) {
    // Agrupar por artista
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
    currentTab = tab;
    selectionContainer.style.display = "none";
    playerContainer.style.display = "flex";

    // Si es remota y aún no tenemos contenido, lo pedimos a la API
    if (tab.isRemote && !tab.content) {
      try {
        const apiUrl = `${TABS_API_BASE}/tab?url=${encodeURIComponent(
          tab.remoteUrl
        )}`;
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`tabs API error: ${res.status}`);
        }
        const data = await res.json();
        tab.content = data.tab;

        // Actualizar metadatos desde el propio texto
        const meta = parseMetadata(tab.content);
        tab.song = meta.song || tab.song;
        tab.artist = meta.artist || tab.artist;
        tab.bpm = meta.bpm;
        tab.timeSig = meta.timeSig;

        // Persistir cambios mínimos en la caché (título/artista)
        const cache = loadRemoteTabsCache();
        const idx = cache.findIndex((e) => `remote:${e.id}` === tab.id);
        if (idx !== -1) {
          cache[idx].title = tab.song;
          cache[idx].artist = tab.artist;
          saveRemoteTabsCache(cache);
        }
      } catch (e) {
        console.error("Error fetching remote tab", e);
        alert("Error downloading tab from server.");
        return;
      }
    }

    // Actualizar URL (?tab=<id>)
    const url = new URL(window.location);
    const idForUrl = tab.id || tab.file;
    if (idForUrl) {
      url.searchParams.set("tab", idForUrl);
    }
    window.history.pushState({}, "", url);

    document.getElementById("current-song-title").textContent = tab.song;
    let artistText = tab.artist || "";
    if (tab.bpm) artistText += ` | BPM: ${tab.bpm}`;
    if (tab.timeSig) artistText += ` | Time: ${tab.timeSig}`;
    document.getElementById("current-artist-name").textContent = artistText;

    if (!tab.content) {
      console.warn("Tab has no content to render");
      return;
    }

    const parsedData = parseTabContent(tab.content);
    // console.log("parsedData", parsedData);
    renderVisualTab(parsedData);
  }

  function parseTabContent(text) {
    const lines = text.split("\n");
    const blocks = [];
    // Block structure: { strings: [], chords: null, pm: null, measureNums: null, rhythmStems: null, rhythmBeams: null }

    // Regex for tab lines: e|-... or e -... or just starting with string name and |
    const stringRegex = /^[eBGDAE]\|/;

    let tempStrings = [];
    let tempChord = null;
    let tempPM = null;
    let tempMeasureNums = null;
    let tempRhythmStems = null;
    let tempRhythmBeams = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd(); // Keep leading spaces
      if (stringRegex.test(line.trim())) {
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
        !stringRegex.test(line.trim()) &&
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

    return blocks;
  }

  // Nº de compases por canvas
  const BARS_PER_CHUNK = 4; // o 2, 4, 8... a tu gusto
  const CHORD_TOKEN_REGEX = /\*|([A-Za-z][^\s]*?)(?=\s*(?:[A-Z]|\*|$))/g;

  function createChunks(blocks) {
    const chunks = [];
    if (!blocks || !blocks.length) return chunks;

    blocks.forEach((block) => {
      if (!block.strings || !block.strings.length) return;

      const refLine = block.measureNums || block.strings[0];
      const totalLen = refLine.length;

      // 1) Encontrar todas las posiciones de '|'
      const barPositions = [];
      for (let i = 0; i < refLine.length; i++) {
        if (refLine[i] === "|") {
          barPositions.push(i);
        }
      }

      // Si no hay barras de compás, hacemos un único chunk con el bloque entero
      if (barPositions.length === 0) {
        chunks.push([block]);
        return;
      }

      // 2) Construir rangos de compás [start, end)
      //    Cada compás va de un '|' al siguiente '|' (o al final de la línea)
      const bars = [];
      for (let i = 0; i < barPositions.length; i++) {
        const start = barPositions[i];
        const end =
          i + 1 < barPositions.length ? barPositions[i + 1] : totalLen;
        bars.push({ start, end });
      }

      // 3) Agrupar compases en chunks de BARS_PER_CHUNK
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

        // Cada chunk es un array de blocks, para reutilizar renderChunk()
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

  // Mapa de figuras rítmicas según los códigos de rhythmStems
  // Ajusta aquí si en json2tab usas otros caracteres.
  const RHYTHM_GLYPHS = {
    // w: redonda (por si algún día la usas)
    w: { type: "note", filled: false, stem: false, flags: 0 },

    // h/b: blanca (dos opciones por si usas 'h' o 'b')
    h: { type: "note", filled: false, stem: true, flags: 0 },
    b: { type: "note", filled: false, stem: true, flags: 0 },

    // n: negra
    n: { type: "note", filled: true, stem: true, flags: 0 },

    // c: corchea
    c: { type: "note", filled: true, stem: true, flags: 1 },

    // s: semicorchea
    s: { type: "note", filled: true, stem: true, flags: 2 },

    // t: fusa (por si acaso)
    t: { type: "note", filled: true, stem: true, flags: 3 },

    // r: silencio (usamos un símbolo genérico de silencio de negra)
    r: { type: "rest" },
  };

  function getRhythmWidthMultiplier(ch) {
    if (!ch) return 1;
    const code = ch.toLowerCase();
    switch (code) {
      case "t": // fusa
        return 0.5;
      case "f": // semifusa (no habitual, por si acaso)
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
      case "r": // silencio genérico
      default:
        return 1;
    }
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

    // Silencios: si es 'r' o si pasamos isRest=true
    if (shape.type === "rest" || isRest) {
      const x0 = x;
      const restBase = baselineY;
      // Ajuste vertical según el tipo de silencio
      
      if (code === 'w') {
          // Redonda: rectángulo bajo la línea
          ctx.fillRect(x0 - 6, restBase - 10, 12, 6);
      } else if (code === 'h' || code === 'b') {
          // Blanca: rectángulo sobre la línea
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
          // Negra (o default para 'r'/'n')
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

    // Notas
    const headWidth = Math.min(fretWidth * 0.5, 12);
    const headHeight = headWidth * 0.7;
    const headY = baselineY - 5;

    // Cabeza de la nota (ovalada)
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
    const COMPACT_FRET_WIDTH = 0; // Ancho reducido para compases vacíos
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

      // Detectar compases vacíos
      let currentBarStart = 0;

      const checkRangeEmpty = (start, end) => {
        for (let c = start; c < end; c++) {
          for (let s = 0; s < block.strings.length; s++) {
            const char = block.strings[s][c];
            // Si hay dígito o 'x' (nota muerta), no es vacío
            if (/\d/.test(char) || char.toLowerCase() === "x") return false;
          }
        }
        return true;
      };

      for (let i = 0; i <= len; i++) {
        const isBar = (i < len && block.strings[0][i] === "|") || i === len;
        if (isBar) {
          // Revisar el rango anterior [currentBarStart, i)
          let start = currentBarStart;
          // Si empieza con '|', saltarlo para el chequeo de contenido
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

        const rhythmChar = block.rhythmStems ? block.rhythmStems[i] : null;
        const isBar = block.strings[0][i] === "|";

        if (isBar) {
          w = 0; // sin avance en barras de compás
        } else if (rhythmChar && rhythmChar !== "|") {
          if (rhythmChar.trim() === "") {
            w = COMPACT_FRET_WIDTH; // sin figura: espaciado mínimo
          } else {
            w = BASE_FRET_WIDTH * getRhythmWidthMultiplier(rhythmChar);
          }
        } else {
          // Si es compacta usamos ancho pequeño, si no el base
          // (Las barras '|' quedan con ancho base para separar)
          w = isColumnCompact[i] ? COMPACT_FRET_WIDTH : BASE_FRET_WIDTH;
        }

        columnWidths[i] = w;
        x += w;
      }

      blockLayouts.set(block, { columnX, columnWidths, totalWidth: x });
      totalWidthAllBlocks += x;
    });

    // Ajustamos escala si nos pasamos del ancho máximo
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

    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    const stringNames = ["e", "B", "G", "D", "A", "E"];
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
        ctx.fillText(stringNames[s], 10, y + 7);
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

          // Detectar silencio por 'z' en las cuerdas
          // Un compás es silencio si NO hay notas y hay al menos una 'z' (o es 'r' explícito)
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
            const noteHeight = 32; // altura fija; solo la anchura sigue la figura temporal
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

  // Renderiza la tablatura completa creando varios canvas (uno por chunk)
  function renderVisualTab(blocks) {
    // console.log("renderVisualTab (multi-chunk) blocks:", blocks);

    if (!canvasWrapper || !baseCanvas) {
      console.error("No canvas wrapper or base canvas found");
      return;
    }

    // Limpiar canvases anteriores del wrapper
    canvasWrapper.innerHTML = "";

    // Crear los chunks
    const chunks = createChunks(blocks);
    if (!chunks.length) {
      console.warn("No chunks generated, nothing to render");
      return;
    }

    currentChunks = [];

    chunks.forEach((chunkBlocks, index) => {
      let chunkCanvas;

      if (index === 0) {
        // Reutilizamos el canvas base
        chunkCanvas = baseCanvas;
      } else {
        // Clonamos el base SIN hijos ni contenido
        chunkCanvas = baseCanvas.cloneNode(false);
        // Evitamos IDs duplicados
        chunkCanvas.removeAttribute("id");
      }

      chunkCanvas.classList.add("tab-canvas-chunk");
      canvasWrapper.appendChild(chunkCanvas);

      currentChunks.push({
        canvas: chunkCanvas,
        blocks: chunkBlocks,
        rendered: false,
      });
    });

    // Si ya había un observer anterior, lo desconectamos
    if (chunkObserver) {
      chunkObserver.disconnect();
    }

    // Observer para ir pintando según se van viendo los canvases
    chunkObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.chunkIndex);
          const info = currentChunks[idx];
          if (!info) return;

          if (entry.isIntersecting && !info.rendered) {
            // El chunk entra en la vista -> LO CARGAMOS
            canvas = info.canvas;
            ctx = info.canvas.getContext("2d");
            // console.log("Rendering chunk", idx, "into canvas", info.canvas);
            info.interactiveRegions = [];
            renderChunk(info.blocks, info.interactiveRegions, idx);
            info.rendered = true;
          } else if (!entry.isIntersecting && info.rendered) {
            // El chunk sale de la vista -> LO DESCARGAMOS
            const cctx = info.canvas.getContext("2d");
            // console.log("Clearing chunk", idx);
            cctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
            info.rendered = false;
          }
        });
      },
      {
        root: canvasWrapper, // el scroll horizontal es del wrapper
        // threshold: 0.1, // con que se vea un 10% nos vale
        rootMargin: "0px 200px" // para precargar un poco antes
      }
    );

    // Registrar cada canvas en el observer
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
            const openMidi = STANDARD_TUNING_MIDI[s];
            notesMidi.push(openMidi + parseInt(fretInfo.value, 10));
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
