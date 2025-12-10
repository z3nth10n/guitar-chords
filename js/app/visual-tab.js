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

document.addEventListener("DOMContentLoaded", async () => {
  let currentNotation = "english";

  const SONGSTERR_BASE_URL = "https://www.songsterr.com";
  const TABS_API_BASE = getApiLocation();
  const REMOTE_TABS_KEY = "visualTab_remoteTabs";
  const ABSOLUTE_PATH = getAbsolutePath();

  // Language & Notation Selector Logic
  const langSelect = document.getElementById("langSelect");
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

      // Auto-switch notation
      if (newLang === "es") {
        currentNotation = "latin";
      } else {
        currentNotation = "english";
      }
      if (notationSelect) {
        notationSelect.value = currentNotation;
      }
      localStorage.setItem("portal_notation", currentNotation);

      // Re-render if a tab is active
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

        const chunkBlock = {
          strings: block.strings.map(sliceLine),
          chords: sliceLine(block.chords),
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

  function drawRhythmSymbol(ctx, ch, x, baselineY, fretWidth) {
    const code = ch.toLowerCase();
    const shape = RHYTHM_GLYPHS[code];
    if (!shape) return;

    ctx.save();
    ctx.strokeStyle = "#ddd";
    ctx.fillStyle = "#ddd";
    ctx.lineWidth = 2;

    // Silencios
    if (shape.type === "rest") {
      // Silencio tipo negra, estilizado
      const x0 = x;
      const y0 = baselineY - 18;
      ctx.beginPath();
      ctx.moveTo(x0 - 4, y0);
      ctx.lineTo(x0 + 3, y0 + 6);
      ctx.lineTo(x0 - 3, y0 + 12);
      ctx.lineTo(x0 + 4, y0 + 18);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x0 + 4, y0 + 21, 2, 0, Math.PI * 2);
      ctx.fill();

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

  function renderChunk(blocks, interactiveRegions = null) {
    // console.log("renderChunk blocks:", blocks);

    const BASE_FRET_WIDTH = 40;
    const STRING_SPACING = 40;
    const TOP_MARGIN = 100; // Increased for measure numbers
    const LEFT_MARGIN = 60;
    const MAX_CANVAS_WIDTH = 10000;

    if (!blocks || !blocks.length) {
      console.warn("renderVisualTab: no blocks to render");
      return;
    }

    // Calculamos el número máximo de columnas (caracteres) entre todas las líneas
    const getMaxLineLength = (str) => (str ? str.length : 0);

    let totalSteps = 0;
    blocks.forEach((block) => {
      (block.strings || []).forEach((line) => {
        totalSteps = Math.max(totalSteps, getMaxLineLength(line));
      });
      totalSteps = Math.max(totalSteps, getMaxLineLength(block.chords));
      totalSteps = Math.max(totalSteps, getMaxLineLength(block.measureNums));
      totalSteps = Math.max(totalSteps, getMaxLineLength(block.rhythmStems));
    });

    // Ajustamos el ancho de columna en función del total de steps
    let fretWidth = BASE_FRET_WIDTH;
    let naturalWidth = LEFT_MARGIN + totalSteps * BASE_FRET_WIDTH + 100;

    if (naturalWidth > MAX_CANVAS_WIDTH) {
      fretWidth = (MAX_CANVAS_WIDTH - LEFT_MARGIN - 100) / totalSteps;
      naturalWidth = LEFT_MARGIN + totalSteps * fretWidth + 100;
      console.log("Canvas demasiado ancho, comprimiendo:", {
        totalSteps,
        BASE_FRET_WIDTH,
        fretWidth,
        naturalWidth,
      });
    }

    const width = naturalWidth;
    const height = TOP_MARGIN + 6 * STRING_SPACING + 100;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // console.log("canvas size", canvas.width, canvas.height);

    // console.log("canvas element:", canvas);
    // console.log("canvas getContext:", ctx);

    const stringNames = ["e", "B", "G", "D", "A", "E"];
    const stringColors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#a855f7",
    ];

    // Helper to iterate blocks and track X
    function iterateBlocks(callback) {
      let currentX = LEFT_MARGIN;
      blocks.forEach((block) => {
        if (block.strings.length === 0) return;
        const blockLength = block.strings[0].length;
        callback(block, currentX);
        currentX += blockLength * fretWidth;
      });
    }

    // 0. Draw Measure Numbers (Layer 0)
    iterateBlocks((block, currentX) => {
      if (block.measureNums) {
        const line = block.measureNums;
        // Format: | 1 | 2
        // We need to align chars
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (/\d/.test(char)) {
            // Find full number
            let num = char;
            let k = i + 1;
            while (k < line.length && /\d/.test(line[k])) {
              num += line[k];
              k++;
            }

            const x = currentX + i * fretWidth;
            ctx.fillStyle = "#aaa";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(num, x, TOP_MARGIN - 50);

            // Skip processed digits
            i = k - 1;
          } else if (char === "|") {
            const x = currentX + i * fretWidth;
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

    // Vertical Lines (Default grid if no measure bars)
    iterateBlocks((block, currentX) => {
      const blockLength = block.strings[0].length;
      for (let i = 0; i < blockLength; i++) {
        // Only draw faint grid if not a measure bar
        // We check if there is a measure bar at this index in strings
        let isMeasureBar = false;
        if (block.strings[0][i] === "|") isMeasureBar = true;

        if (!isMeasureBar && i % 4 === 0) {
          const x = currentX + i * fretWidth;
          ctx.strokeStyle = "#222";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, TOP_MARGIN);
          ctx.lineTo(x, TOP_MARGIN + 5 * STRING_SPACING);
          ctx.stroke();
        }
      }
    });

    // Draw PM Lines (Layer 1.5)
    iterateBlocks((block, currentX) => {
      if (block.pm) {
        const pmLine = block.pm;
        // PM----|
        let inPM = false;
        let startIdx = -1;

        for (let i = 0; i < pmLine.length; i++) {
          const char = pmLine[i];

          if ((char === "P" || char === "M" || char === "-") && !inPM) {
            inPM = true;
            startIdx = i;
          } else if (char === "|" && inPM) {
            inPM = false;
            // Draw PM line
            const startX = currentX + startIdx * fretWidth;
            const endX = currentX + i * fretWidth;

            ctx.strokeStyle = "#888";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, TOP_MARGIN - 20);
            ctx.lineTo(endX, TOP_MARGIN - 20);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw vertical end
            ctx.beginPath();
            ctx.moveTo(endX, TOP_MARGIN - 20);
            ctx.lineTo(endX, TOP_MARGIN - 10);
            ctx.stroke();

            ctx.fillStyle = "#888";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "left";
            ctx.fillText("P.M.", startX, TOP_MARGIN - 25);
          } else if (char === " " && inPM) {
            // End of PM without bar?
            inPM = false;
            const startX = currentX + startIdx * fretWidth;
            const endX = currentX + i * fretWidth;

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

      ctx.fillStyle = stringColors[s];
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left"; // Reset alignment
      ctx.fillText(stringNames[s], 10, y + 7);
    }

    // Draw Rhythm / Time Figures (Layer 4 - Bottom)
    iterateBlocks((block, currentX) => {
      const bottomY = TOP_MARGIN + 5 * STRING_SPACING + 40;

      if (block.rhythmStems) {
        const line = block.rhythmStems;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          const x = currentX + i * fretWidth;

          if (ch === "|") {
            // pequeña barra separadora bajo la tablatura
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, bottomY - 10);
            ctx.lineTo(x, bottomY + 20);
            ctx.stroke();
          } else if (ch !== " ") {
            // dibujar la figura musical en lugar de la letra
            drawRhythmSymbol(ctx, ch, x, bottomY, fretWidth);
          }
        }
      }
    });

    // 2. Draw Chord Blocks (Layer 2)
    if (showChords) {
    iterateBlocks((block, currentX) => {
      if (block.chords) {
        const chordLine = block.chords;
        // Regex to find chords OR the repetition marker '*'
        const chordRegex = /([A-Za-z0-9#]+|\*)/g;
        let match;
        let lastChordName = "";

        while ((match = chordRegex.exec(chordLine)) !== null) {
          if (match.index < 2) continue;

          const charIndex = match.index;
          let chordName = match[0];

          // Handle repetition marker
          if (chordName === "*") {
            if (lastChordName) {
              chordName = lastChordName;
            } else {
              continue; 
            }
          } else {
            lastChordName = chordName;
          }

          const x = currentX + charIndex * fretWidth;

          let minString = 5;
          let maxString = 0;
          let hasNotes = false;

          for (let s = 0; s < 6; s++) {
            if (s < block.strings.length) {
              const char = block.strings[s][charIndex];
              if (!isNaN(parseInt(char))) {
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

          const gradient = ctx.createLinearGradient(
            x,
            blockTop,
            x,
            blockBottom
          );
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(1, "#1d4ed8");
          ctx.fillStyle = gradient;

          ctx.beginPath();
          const w = Math.max(50, ctx.measureText(chordName).width + 30);

          ctx.roundRect(x - 15, blockTop, w, blockHeight, 10);
          ctx.fill();

          ctx.strokeStyle = "#60a5fa";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 4;
          ctx.fillText(
            chordName,
            x + w / 2 - 15,
            blockTop + blockHeight / 2 + 8
          );
          ctx.shadowBlur = 0;

          if (interactiveRegions) {
            let frets = [];
            // Collect frets for tooltip (High e to Low E)
            for (let s = 0; s < 6; s++) {
              // Collect frets for tooltip (Low E to High e)
              // for (let s = 5; s >= 0; s--) {
              if (s < block.strings.length) {
                const char = block.strings[s][charIndex];
                if (/[0-9]/.test(char)) {
                  frets.push(char);
                } else if (/[xX]/.test(char)) {
                  frets.push("x");
                } else {
                  frets.push("x"); // Treat '-' or space as muted/not played
                }
              } else {
                frets.push("x");
              }
            }
            interactiveRegions.push({
              x: x - 15,
              y: blockTop,
              w: w,
              h: blockHeight,
              tooltip: frets.join("-"),
            });
          }
        }
      }
    });
    }

    // 3. Draw Notes (Layer 3)
    iterateBlocks((block, currentX) => {
      const chordPositions = new Set();
      if (showChords && block.chords) {
        const chordRegex = /([A-Za-z0-9#]+|\*)/g;
        let match;
        while ((match = chordRegex.exec(block.chords)) !== null) {
          if (match.index >= 2) chordPositions.add(match.index);
        }
      }

      for (let s = 0; s < 6; s++) {
        if (s >= block.strings.length) continue;

        const line = block.strings[s];
        const y = TOP_MARGIN + s * STRING_SPACING;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const x = currentX + i * fretWidth;

          if (!isNaN(parseInt(char))) {
            if (chordPositions.has(i)) {
              continue;
            }

            ctx.fillStyle = stringColors[s];
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#000";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(char, x, y + 6);

            ctx.shadowColor = stringColors[s];
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (char.toLowerCase() === "h" || char.toLowerCase() === "p") {
            // Find previous note index
            let prevIndex = -1;
            for (let k = i - 1; k >= 0; k--) {
              if (!isNaN(parseInt(line[k]))) {
                prevIndex = k;
                break;
              }
            }

            // Find next note index
            let nextIndex = -1;
            for (let k = i + 1; k < line.length; k++) {
              if (!isNaN(parseInt(line[k]))) {
                nextIndex = k;
                break;
              }
            }

            if (prevIndex !== -1 && nextIndex !== -1) {
              // Draw Arc (Slur)
              ctx.save();
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();

              const startX = currentX + prevIndex * fretWidth;
              const endX = currentX + nextIndex * fretWidth;
              const midX = (startX + endX) / 2;
              const noteRadius = 16; // Match the note circle radius

              // Start and end at the top of the note circle to avoid overlapping
              ctx.moveTo(startX, y - noteRadius);

              // Curve higher if distance is large
              const dist = Math.abs(nextIndex - prevIndex);
              const curveHeight = 30 + dist * 5;

              // Control point needs to be higher than the start/end
              ctx.quadraticCurveTo(midX, y - curveHeight, endX, y - noteRadius);
              ctx.stroke();
              ctx.restore();

              // Label
              ctx.fillStyle = "#fff";
              ctx.font = "bold 14px Arial";
              ctx.textAlign = "center";
              // Draw text slightly above the curve peak
              ctx.fillText(char.toUpperCase(), midX, y - curveHeight / 2 - 20);
            }
          } else if (char === "/") {
            // Slide
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - fretWidth / 2, y + 10);
            ctx.lineTo(x + fretWidth / 2, y - 10);
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
            renderChunk(info.blocks, info.interactiveRegions);
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
        threshold: 0.1, // con que se vea un 10% nos vale
        // opcional: rootMargin: "0px 200px" para precargar un poco antes
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

    for (let i = 0; i < length; i++) {
      // Check if this column has notes
      let notesMidi = [];
      let hasNote = false;

      for (let s = 0; s < 6; s++) {
        if (s < block.strings.length) {
          const char = block.strings[s][i];
          const fret = parseInt(char);
          if (!isNaN(fret)) {
            hasNote = true;
            const openMidi = STANDARD_TUNING_MIDI[s];
            notesMidi.push(openMidi + fret);
          }
        }
      }

      if (hasNote && notesMidi.length >= 2) {
        const notesPc = notesMidi.map((m) => m % 12);
        const chord = detectChord(notesPc);

        if (chord) {
          const name = chord.name;
          
          // Check if we overlap with previous text
          const overlaps = (i < lastChordEnd);

          if (name === lastWrittenChord) {
             // Same chord as previous -> use compact marker '*'
             // This avoids overlap issues and visual clutter
             if (i < length) {
                 chordLine[i] = '*';
                 lastChordEnd = i + 1;
             }
          } else {
             // Different chord -> write full name
             // (Even if it overlaps, we prioritize the new chord info)
             for (let k = 0; k < name.length; k++) {
               if (i + k < length) {
                 chordLine[i + k] = name[k];
               }
             }
             lastChordEnd = i + name.length;
             lastWrittenChord = name;
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
});
