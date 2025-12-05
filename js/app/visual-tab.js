document.addEventListener('DOMContentLoaded', async () => {
    const selectionContainer = document.getElementById('selection-container');
    const playerContainer = document.getElementById('player-container');
    const backButton = document.getElementById('back-to-selection');
    const canvas = document.getElementById('tab-canvas');
    const ctx = canvas.getContext('2d');

    let currentTab = null;
    let tabsData = [];

    // Initialize
    await loadTabs();

    backButton.addEventListener('click', () => {
        playerContainer.style.display = 'none';
        selectionContainer.style.display = 'block';
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
        } catch (e) {
            console.error(e);
            selectionContainer.innerHTML = `<div class="error">Error loading tabs. Please ensure tabs/manifest.json exists.</div>`;
        }
    }

    function parseMetadata(text) {
        const lines = text.split('\n');
        let song = 'Unknown Song';
        let artist = 'Unknown Artist';
        
        lines.forEach(line => {
            const lower = line.toLowerCase();
            if (lower.startsWith('canción:') || lower.startsWith('song:')) {
                song = line.split(':')[1].trim();
            }
            if (lower.startsWith('artista:') || lower.startsWith('artist:')) {
                artist = line.split(':')[1].trim();
            }
        });
        return { song, artist };
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
        
        document.getElementById('current-song-title').textContent = tab.song;
        document.getElementById('current-artist-name').textContent = tab.artist;

        const parsedData = parseTabContent(tab.content);
        renderVisualTab(parsedData);
    }

    function parseTabContent(text) {
        const lines = text.split('\n');
        const blocks = [];
        let currentBlock = { strings: [], chords: null };
        
        // Regex for tab lines: e|-... or e -... or just starting with string name and |
        const stringRegex = /^[eBGDAE]\|/; 
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trimEnd(); // Keep indentation? Usually tabs are left aligned.
            
            if (stringRegex.test(line)) {
                currentBlock.strings.push(line);
            } else if (line.startsWith('x|')) {
                currentBlock.chords = line;
            }
            
            // If we have 6 strings, we might be done with this block, 
            // BUT the chord line might come AFTER.
            // So we should wait until we hit a non-tab line or end of file?
            // Or just group them.
            // A simple heuristic: if we have 6 strings and encounter a blank line or a new string line, push block.
            // But the chord line is part of the block.
            
            // Let's try this:
            // If we encounter a string line and we already have 6 strings, push the previous block.
            if (stringRegex.test(line) && currentBlock.strings.length > 6) {
                 // This shouldn't happen if we push immediately after 6? 
                 // No, because we need to wait for the chord line.
            }
        }
        
        // Re-implementing block parsing to be more robust
        // Iterate lines, collect groups of 6 strings + optional chord line
        
        let tempStrings = [];
        let tempChord = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (stringRegex.test(line)) {
                // If we already have 6 strings and find a new one, it's a new block
                if (tempStrings.length === 6) {
                    blocks.push({ strings: tempStrings, chords: tempChord });
                    tempStrings = [];
                    tempChord = null;
                }
                tempStrings.push(line);
            } else if (line.startsWith('x|')) {
                tempChord = line;
            }
        }
        // Push last block
        if (tempStrings.length > 0) {
            blocks.push({ strings: tempStrings, chords: tempChord });
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
                    } else if (char === 'h' || char === 'p' || char === '/') {
                        ctx.fillStyle = '#aaa';
                        ctx.font = 'italic 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(char, x, y - 10);
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
});
