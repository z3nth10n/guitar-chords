document.addEventListener('DOMContentLoaded', async () => {
    let currentNotation = "english";

    // Language & Notation Selector Logic
    const langSelect = document.getElementById("langSelect");
    const notationSelect = document.getElementById("notationSelect");
    
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

    const selectionContainer = document.getElementById('selection-container');
    const playerContainer = document.getElementById('player-container');
    const backButton = document.getElementById('back-to-selection');
    const canvas = document.getElementById('tab-canvas');
    const ctx = canvas.getContext('2d');

    let currentTab = null;
    let tabsData = [];

    // Initialize
    // await loadTabs(); // Moved to end to ensure constants are loaded

    backButton.addEventListener('click', () => {
        playerContainer.style.display = 'none';
        selectionContainer.style.display = 'block';
        
        // Clear URL param
        const url = new URL(window.location);
        url.searchParams.delete('tab');
        window.history.pushState({}, '', url);
    });

    async function loadTabs() {
        try {
            const response = await fetch('tabs/manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            const files = await response.json();
            
            // Fetch each file to get metadata
            const loadedTabs = await Promise.all(files.map(async (file) => {
                try {
                    const res = await fetch(`tabs/${file}`);
                    const text = await res.text();
                    const metadata = parseMetadata(text);
                    return { file, ...metadata, content: text };
                } catch (e) {
                    console.error(`Error loading ${file}`, e);
                    return null;
                }
            }));

            tabsData = loadedTabs.filter(t => t !== null);
            renderAccordion(tabsData);

            // Check for query param
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab');
            if (tabParam) {
                const found = tabsData.find(t => t.file === tabParam);
                if (found) {
                    playTab(found);
                }
            }
        } catch (e) {
            console.error(e);
            selectionContainer.innerHTML = `<div class="error">Error loading tabs. Please ensure tabs/manifest.json exists.</div>`;
        }
    }

    function parseMetadata(text) {
        const lines = text.split('\n');
        let song = 'Unknown Song';
        let artist = 'Unknown Artist';
        let bpm = null;
        let timeSig = null;
        
        lines.forEach(line => {
            const lower = line.toLowerCase();
            if (lower.startsWith('canción:') || lower.startsWith('song:')) {
                song = line.split(':')[1].trim();
            }
            if (lower.startsWith('artista:') || lower.startsWith('artist:')) {
                artist = line.split(':')[1].trim();
            }
            if (lower.startsWith('bpm:')) {
                bpm = line.split(':')[1].trim();
            }
            if (lower.startsWith('time:') || lower.startsWith('tiempo:')) {
                timeSig = line.split(':')[1].trim();
            }
        });
        return { song, artist, bpm, timeSig };
    }

    function renderAccordion(tabs) {
        // Group by artist
        const byArtist = {};
        tabs.forEach(tab => {
            const artistName = tab.artist || 'Unknown Artist';
            if (!byArtist[artistName]) byArtist[artistName] = [];
            byArtist[artistName].push(tab);
        });

        selectionContainer.innerHTML = '';
        
        if (Object.keys(byArtist).length === 0) {
            selectionContainer.innerHTML = '<div class="error">No tabs found.</div>';
            return;
        }

        Object.keys(byArtist).forEach((artist, index) => {
            const artistGroup = document.createElement('div');
            artistGroup.className = 'accordion-item';
            
            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `<span>${artist}</span> <span class="material-icons">expand_more</span>`;
            
            const content = document.createElement('div');
            content.className = 'accordion-content';
            
            byArtist[artist].forEach(tab => {
                const songItem = document.createElement('div');
                songItem.className = 'song-item';
                songItem.innerHTML = `<span class="material-icons">music_note</span> ${tab.song}`;
                songItem.onclick = () => playTab(tab);
                content.appendChild(songItem);
            });

            header.onclick = () => {
                const isActive = content.classList.contains('active');
                // Close all others
                document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
                if (!isActive) content.classList.add('active');
            };

            artistGroup.appendChild(header);
            artistGroup.appendChild(content);
            selectionContainer.appendChild(artistGroup);
        });
    }

    function playTab(tab) {
        currentTab = tab;
        selectionContainer.style.display = 'none';
        playerContainer.style.display = 'flex';
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('tab', tab.file);
        window.history.pushState({}, '', url);

        document.getElementById('current-song-title').textContent = tab.song;
        let artistText = tab.artist;
        if (tab.bpm) artistText += ` | BPM: ${tab.bpm}`;
        if (tab.timeSig) artistText += ` | Time: ${tab.timeSig}`;
        document.getElementById('current-artist-name').textContent = artistText;

        const parsedData = parseTabContent(tab.content);
        renderVisualTab(parsedData);
    }

    function parseTabContent(text) {
        const lines = text.split('\n');
        const blocks = [];
        // Block structure: { strings: [], chords: null, pm: null }
        
        // Regex for tab lines: e|-... or e -... or just starting with string name and |
        const stringRegex = /^[eBGDAE]\|/; 
        
        let tempStrings = [];
        let tempChord = null;
        let tempPM = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (stringRegex.test(line)) {
                // If we already have 6 strings and find a new one, it's a new block
                if (tempStrings.length === 6) {
                    if (!tempChord) {
                        tempChord = generateChordLine({ strings: tempStrings });
                    }
                    blocks.push({ strings: tempStrings, chords: tempChord, pm: tempPM });
                    tempStrings = [];
                    tempChord = null;
                    tempPM = null;
                }
                tempStrings.push(line);
            } else if (line.startsWith('x|')) {
                tempChord = line;
            } else if (line.startsWith('PM|') || line.startsWith('P.M.|')) {
                tempPM = line;
            }
        }
        // Push last block
        if (tempStrings.length > 0) {
            if (!tempChord) {
                tempChord = generateChordLine({ strings: tempStrings });
            }
            blocks.push({ strings: tempStrings, chords: tempChord, pm: tempPM });
        }
        
        return blocks;
    }

    function renderVisualTab(blocks) {
        const FRET_WIDTH = 40; 
        const STRING_SPACING = 40;
        const TOP_MARGIN = 80; 
        const LEFT_MARGIN = 60; 
        
        // Calculate total width
        let totalSteps = 0;
        blocks.forEach(block => {
            if (block.strings.length > 0) {
                totalSteps += block.strings[0].length;
            }
        });
        
        const width = LEFT_MARGIN + (totalSteps * FRET_WIDTH) + 100;
        const height = TOP_MARGIN + (6 * STRING_SPACING) + 50;
        
        canvas.width = width;
        canvas.height = height;
        
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
        const stringColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']; 

        // Helper to iterate blocks and track X
        function iterateBlocks(callback) {
            let currentX = LEFT_MARGIN;
            blocks.forEach(block => {
                if (block.strings.length === 0) return;
                const blockLength = block.strings[0].length;
                callback(block, currentX);
                currentX += blockLength * FRET_WIDTH;
            });
        }

        // 1. Draw Grid (Strings & Vertical Lines) (Layer 1)
        
        // Vertical Lines
        iterateBlocks((block, currentX) => {
            const blockLength = block.strings[0].length;
            for (let i = 0; i < blockLength; i++) {
                if (i % 4 === 0) { 
                    const x = currentX + (i * FRET_WIDTH);
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, TOP_MARGIN);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }
            }
        });

        // Draw PM Lines (Layer 1.5)
        iterateBlocks((block, currentX) => {
            if (block.pm) {
                const pmLine = block.pm;
                // PM|--...
                // We look for '-' or other chars indicating PM
                // Usually PM|-------|
                // We can just draw a line where there are non-space chars after the prefix
                
                // Find start and end of PM segments
                let inPM = false;
                let startIdx = -1;
                
                // Prefix length is usually 3 ("PM|") or more.
                // We should align with the string length.
                // Assuming PM line length matches string line length.
                
                for (let i = 0; i < pmLine.length; i++) {
                    const char = pmLine[i];
                    // Skip prefix "PM|"
                    if (i < 3) continue; 
                    
                    const isPMChar = char !== ' ' && char !== '|'; // Assuming spaces mean no PM
                    
                    if (isPMChar && !inPM) {
                        inPM = true;
                        startIdx = i;
                    } else if (!isPMChar && inPM) {
                        inPM = false;
                        // Draw PM line from startIdx to i
                        const startX = currentX + (startIdx * FRET_WIDTH);
                        const endX = currentX + (i * FRET_WIDTH);
                        
                        ctx.strokeStyle = '#888';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(startX, TOP_MARGIN - 20);
                        ctx.lineTo(endX, TOP_MARGIN - 20);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        
                        ctx.fillStyle = '#888';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'left';
                        ctx.fillText("P.M.", startX, TOP_MARGIN - 25);
                    }
                }
                // If still in PM at end of line
                if (inPM) {
                    const startX = currentX + (startIdx * FRET_WIDTH);
                    const endX = currentX + (pmLine.length * FRET_WIDTH);
                    
                    ctx.strokeStyle = '#888';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(startX, TOP_MARGIN - 20);
                    ctx.lineTo(endX, TOP_MARGIN - 20);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    ctx.fillStyle = '#888';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText("P.M.", startX, TOP_MARGIN - 25);
                }
            }
        });

        // Horizontal Strings
        ctx.lineWidth = 3;
        for (let s = 0; s < 6; s++) {
            const y = TOP_MARGIN + (s * STRING_SPACING);
            
            ctx.strokeStyle = '#444';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            ctx.fillStyle = stringColors[s];
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left'; // Reset alignment
            ctx.fillText(stringNames[s], 10, y + 7);
        }

        // 2. Draw Chord Blocks (Layer 2)
        iterateBlocks((block, currentX) => {
            if (block.chords) {
                const chordLine = block.chords;
                const chordRegex = /([A-Za-z0-9#]+)/g;
                let match;
                while ((match = chordRegex.exec(chordLine)) !== null) {
                    if (match.index < 2) continue; 
                    
                    const charIndex = match.index;
                    const chordName = match[0];
                    const x = currentX + (charIndex * FRET_WIDTH);
                    
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

                    const blockTop = TOP_MARGIN + (minString * STRING_SPACING) - 20;
                    const blockBottom = TOP_MARGIN + (maxString * STRING_SPACING) + 20;
                    const blockHeight = blockBottom - blockTop;
                    
                    const gradient = ctx.createLinearGradient(x, blockTop, x, blockBottom);
                    gradient.addColorStop(0, '#3b82f6');
                    gradient.addColorStop(1, '#1d4ed8');
                    ctx.fillStyle = gradient;
                    
                    ctx.beginPath();
                    const w = Math.max(50, ctx.measureText(chordName).width + 30);
                    
                    ctx.roundRect(x - 15, blockTop, w, blockHeight, 10);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#60a5fa';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(chordName, x + (w/2) - 15, blockTop + (blockHeight/2) + 8);
                    ctx.shadowBlur = 0;
                }
            }
        });
        
        // 3. Draw Notes (Layer 3)
        iterateBlocks((block, currentX) => {
            const chordPositions = new Set();
            if (block.chords) {
                const chordRegex = /([A-Za-z0-9#]+)/g;
                let match;
                while ((match = chordRegex.exec(block.chords)) !== null) {
                    if (match.index >= 2) chordPositions.add(match.index);
                }
            }

            for (let s = 0; s < 6; s++) {
                if (s >= block.strings.length) continue;
                
                const line = block.strings[s];
                const y = TOP_MARGIN + (s * STRING_SPACING);
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const x = currentX + (i * FRET_WIDTH);

                    if (!isNaN(parseInt(char))) {
                        if (chordPositions.has(i)) {
                            continue;
                        }

                        ctx.fillStyle = stringColors[s];
                        ctx.beginPath();
                        ctx.arc(x, y, 16, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = '#000';
                        ctx.font = 'bold 16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(char, x, y + 6);
                        
                        ctx.shadowColor = stringColors[s];
                        ctx.shadowBlur = 10;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    } else if (char.toLowerCase() === 'h' || char.toLowerCase() === 'p') {
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
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([4, 4]);
                            ctx.beginPath();
                            
                            const startX = currentX + (prevIndex * FRET_WIDTH);
                            const endX = currentX + (nextIndex * FRET_WIDTH);
                            const midX = (startX + endX) / 2;
                            const noteRadius = 16; // Match the note circle radius
                            
                            // Start and end at the top of the note circle to avoid overlapping
                            ctx.moveTo(startX, y - noteRadius);
                            
                            // Curve higher if distance is large
                            const dist = Math.abs(nextIndex - prevIndex);
                            const curveHeight = 30 + (dist * 5);
                            
                            // Control point needs to be higher than the start/end
                            ctx.quadraticCurveTo(midX, y - curveHeight, endX, y - noteRadius);
                            ctx.stroke();
                            ctx.restore();

                            // Label
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 14px Arial';
                            ctx.textAlign = 'center';
                            // Draw text slightly above the curve peak
                            ctx.fillText(char.toUpperCase(), midX, y - (curveHeight / 2) - 20);
                        }
                    } else if (char === '/') {
                        // Slide
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x - FRET_WIDTH/2, y + 10);
                        ctx.lineTo(x + FRET_WIDTH/2, y - 10);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        });
    }
    
    // Polyfill for roundRect if needed (Chrome supports it, but just in case)
    if (!ctx.roundRect) {
        ctx.roundRect = function(x, y, w, h, r) {
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
        }
    }

    // --- Chord Detection Logic ---
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const NOTE_NAMES_LATIN = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
    
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
            const intervals = pcs.map((pc) => (pc - rootPc + 12) % 12).sort((a, b) => a - b);
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
        let chordLine = Array(length).fill(' ');
        
        // We need to prefix with 'x|' to match the format expected by renderVisualTab
        // But renderVisualTab expects 'x|' at the beginning of the string.
        // The length of the string includes the prefix 'e|' etc.
        // So we should start filling from index 2 (after 'x|')
        
        // Wait, the strings in block.strings include the prefix 'e|'.
        // So we should iterate from index 0 to length.
        // But usually tabs have 'e|--...'
        // We should only detect chords where there are notes.
        
        let lastChord = "";
        
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
                        // Calculate MIDI note
                        // Standard tuning: E A D G B e -> 40 45 50 55 59 64 (reversed in array usually?)
                        // In visual-tab.js: stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
                        // stringColors = ...
                        // So index 0 is high 'e' (MIDI 64), index 5 is low 'E' (MIDI 40).
                        // STANDARD_TUNING_MIDI in chord-by-fret was [64, 59, 55, 50, 45, 40] which matches.
                        
                        const openMidi = STANDARD_TUNING_MIDI[s];
                        notesMidi.push(openMidi + fret);
                    }
                }
            }
            
            if (hasNote && notesMidi.length >= 2) { // Only detect if at least 2 notes? Or 3?
                // Convert to PC
                const notesPc = notesMidi.map(m => m % 12);
                const chord = detectChord(notesPc);
                
                if (chord) {
                    // Avoid repeating the same chord immediately if it's the same
                    if (chord.name !== lastChord) {
                        // Place chord name at index i
                        // We need to make sure we don't overwrite previous chord if it's too close
                        // But we are building an array of chars.
                        
                        const name = chord.name;
                        // Check if we have space
                        let canFit = true;
                        for(let k=0; k<name.length; k++) {
                            if (i+k < length && chordLine[i+k] !== ' ') {
                                // Overlap
                                // If the overlap is with the previous chord, maybe we shouldn't place this one
                                // or we should have placed the previous one earlier?
                                // For now, let's just skip if it overlaps?
                                // Or maybe we overwrite?
                                // Let's try to place it.
                            }
                        }
                        
                        // Actually, let's just write it if there is space at i
                        // If previous chord is "Am" at i-1, then i is 'm'.
                        // We should probably space them out.
                        
                        // Simple approach: Write the chord name into the array
                        for (let k = 0; k < name.length; k++) {
                            if (i + k < length) {
                                chordLine[i + k] = name[k];
                            }
                        }
                        lastChord = chord.name;
                    }
                } else {
                    // If notes change but no chord detected, maybe reset lastChord?
                    // So if we go back to the same chord later it is redrawn.
                    // But maybe not reset immediately to avoid flickering on single note changes?
                    // Let's reset if we have notes but no chord.
                    lastChord = "";
                }
            } else if (hasNote) {
                // Single note or no chord detected
                lastChord = "";
            }
        }
        
        // Construct the line
        // The prefix should be 'x|'
        // But the array corresponds to the whole line including prefix.
        // The strings usually start with 'e|'.
        // So we should make sure the first 2 chars are 'x|'.
        
        chordLine[0] = 'x';
        chordLine[1] = '|';
        
        return chordLine.join('');
    }

    await loadTabs();
});
