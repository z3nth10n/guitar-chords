(function () {
if (window.PlayTab) return;

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
};

const DEFAULT_ADVANCED = {
  shiftFull: 0,
  shiftOctaves: 0,
  shiftSemitones: 0,
  shiftCents: 0,
  formantFull: 0,
  formantSemitones: 0,
  formantCents: 0,
};

const STANDARD_TUNING_HIGH_TO_LOW =
  (window.GUITAR_CONSTS && window.GUITAR_CONSTS.STANDARD_TUNING_MIDI) ||
  [64, 59, 55, 50, 45, 40];
const DEFAULT_TUNING_LOW_TO_HIGH = [...STANDARD_TUNING_HIGH_TO_LOW].reverse();

const profileCaches = new Map();
let sharedAudioCtx = null;

const PROFILE_SETTINGS = {
  default: {
    outputGain: 0.5,
    attack: 0.008,
    decay: 0.08,
    sustain: 0.75,
    release: 0.55,
    minDuration: 0.12,
    lowpass: { frequency: 6500, Q: 0.7 },
    highpass: { frequency: 110, Q: 0.7 },
  },
  "guitar-clean": {
    outputGain: 0.58,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.78,
    release: 0.95,
    minDuration: 0.2,
    lowpass: { frequency: 5200, Q: 0.6 },
    highpass: { frequency: 120, Q: 0.6 },
  },
  "guitar-jazz": {
    outputGain: 0.52,
    attack: 0.012,
    decay: 0.12,
    sustain: 0.82,
    release: 1,
    minDuration: 0.22,
    lowpass: { frequency: 4300, Q: 0.75 },
    highpass: { frequency: 150, Q: 0.65 },
  },
  "guitar-dist1": {
    outputGain: 0.42,
    attack: 0.006,
    decay: 0.08,
    sustain: 0.88,
    release: 0.65,
    minDuration: 0.2,
    highpass: { frequency: 180, Q: 0.9 },
    lowpass: { frequency: 5200, Q: 0.8 },
    distortion: { amount: 32, oversample: "4x" },
    compressor: { threshold: -24, ratio: 6, attack: 0.003, release: 0.08 },
  },
  "guitar-dist2": {
    outputGain: 0.4,
    attack: 0.004,
    decay: 0.07,
    sustain: 0.92,
    release: 0.7,
    minDuration: 0.22,
    highpass: { frequency: 220, Q: 0.9 },
    lowpass: { frequency: 4800, Q: 0.7 },
    distortion: { amount: 45, oversample: "4x" },
    compressor: { threshold: -26, ratio: 8, attack: 0.002, release: 0.09 },
  },
};

function getProfileSettings(profile) {
  return PROFILE_SETTINGS[profile] || PROFILE_SETTINGS.default;
}

function createDistortionCurve(amount = 20, samples = 2048) {
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] =
      ((3 + amount) * x * 20 * deg) /
      (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function resolveSoundBaseUrl() {
  let base = "";
  if (document.currentScript) {
    try {
      const scriptUrl = new URL(
        document.currentScript.src,
        window.location.href
      );
      base = scriptUrl.href.replace(/js\/shared\/play-tab\.js.*$/, "");
    } catch (e) {
      base = "";
    }
  }

  if (!base) {
    const prefix =
      typeof getAbsolutePath === "function" ? getAbsolutePath() : "";
    base = `${window.location.origin}${prefix}`;
  }

  if (!base.endsWith("/")) {
    base += "/";
  }
  return `${base}sounds/`;
}

const SOUND_BASE_URL = resolveSoundBaseUrl();

function getAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioCtx;
}

function getProfileCache(profile) {
  if (!profileCaches.has(profile)) {
    profileCaches.set(profile, {
      arrays: {},
      audioBuffers: {},
      loaded: false,
      loadPromise: null,
    });
  }
  return profileCaches.get(profile);
}

async function fetchSamples(profile) {
  const cache = getProfileCache(profile);
  if (cache.loaded) return cache;
  if (!cache.loadPromise) {
    cache.loadPromise = Promise.all(
      Object.entries(AVAILABLE_SAMPLES).map(async ([midi, file]) => {
        try {
          const url = `${SOUND_BASE_URL}${profile}/${encodeURIComponent(
            file
          )}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const buffer = await response.arrayBuffer();
          cache.arrays[midi] = buffer;
        } catch (err) {
          console.warn(
            `[play-tab] Unable to load sample ${file} for ${profile}`,
            err
          );
        }
      })
    )
      .then(() => {
        cache.loaded = true;
        cache.loadPromise = null;
        return cache;
      })
      .catch((err) => {
        cache.loadPromise = null;
        throw err;
      });
  }
  await cache.loadPromise;
  return cache;
}

async function ensureDecodedBuffers(profile) {
  const cache = await fetchSamples(profile);
  const ctx = getAudioContext();
  const entries = Object.entries(cache.arrays);
  await Promise.all(
    entries.map(async ([midi, arr]) => {
      if (!arr || cache.audioBuffers[midi]) return;
      try {
        const copy = arr.slice(0);
        cache.audioBuffers[midi] = await ctx.decodeAudioData(copy);
      } catch (err) {
        console.warn(
          `[play-tab] Failed to decode sample for MIDI ${midi}`,
          err
        );
      }
    })
  );
  return cache.audioBuffers;
}

function findClosestBuffer(buffers, targetMidi) {
  const candidates = Object.keys(buffers);
  if (!candidates.length) return null;
  let bestMidi = Number(candidates[0]);
  let bestDistance = Math.abs(targetMidi - bestMidi);
  for (let i = 1; i < candidates.length; i++) {
    const midi = Number(candidates[i]);
    const distance = Math.abs(targetMidi - midi);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMidi = midi;
    }
  }
  return { baseMidi: bestMidi, buffer: buffers[bestMidi] };
}

function fretToMidi(fret, baseMidi) {
  if (baseMidi === undefined) return null;
  if (fret === undefined || fret === null) return null;
  if (typeof fret === "string") {
    if (fret.toLowerCase() === "x") return null;
    const parsed = parseInt(fret, 10);
    if (isNaN(parsed)) return null;
    fret = parsed;
  }
  if (typeof fret !== "number" || fret < 0) return null;
  return baseMidi + fret;
}

function getTotalDetune(advanced) {
  if (!advanced) return 0;
  return (
    (advanced.shiftOctaves || 0) * 1200 +
    (advanced.shiftSemitones || 0) * 100 +
    (advanced.shiftFull || 0) * 100 +
    (advanced.shiftCents || 0)
  );
}

function getTotalFormant(advanced) {
  if (!advanced) return 0;
  return (
    (advanced.formantFull || 0) * 100 +
    (advanced.formantSemitones || 0) * 100 +
    (advanced.formantCents || 0)
  );
}

function createEngine(options = {}) {
  const engine = {
    soundProfile: options.soundProfile || "guitar-clean",
    advanced: { ...DEFAULT_ADVANCED, ...(options.advanced || {}) },
    gain: typeof options.outputGain === "number" ? options.outputGain : 0.5,
    activeNodes: new Set(),
    audioBuffers: {},
  };

  engine.preloadSamples = async function () {
    await fetchSamples(this.soundProfile);
  };

  engine.setSoundProfile = async function (profile) {
    if (!profile) return;
    if (profile !== this.soundProfile) {
      this.soundProfile = profile;
    }
    await fetchSamples(this.soundProfile);
  };

  engine.setAdvancedSettings = function (settings) {
    if (!settings) return;
    this.advanced = { ...this.advanced, ...settings };
  };

  engine.prepare = async function () {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn("[play-tab] Unable to resume audio context", err);
      }
    }
    this.audioBuffers = await ensureDecodedBuffers(this.soundProfile);
    return ctx;
  };

  engine.stopAll = function () {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch (e) {
        /* noop */
      }
    });
    this.activeNodes.clear();
  };

  engine.scheduleMidiNote = function (midi, startTime, duration) {
    if (!midi && midi !== 0) return null;
    const ctx = getAudioContext();
    const profileConfig = getProfileSettings(this.soundProfile);
    const attack = profileConfig.attack ?? 0.008;
    const decay = profileConfig.decay ?? 0.08;
    const sustainLevel =
      profileConfig.sustain !== undefined ? profileConfig.sustain : 0.75;
    const release = profileConfig.release ?? 0.6;
    const minDuration = profileConfig.minDuration ?? 0.12;
    const noteHold = Math.max(duration, minDuration);
    const releaseStart = startTime + noteHold;
    const stopTime = releaseStart + release;
    const outputGainValue =
      profileConfig.outputGain !== undefined
        ? profileConfig.outputGain
        : this.gain;
    const targetGain = outputGainValue;
    let nodeRecord;

    if (this.audioBuffers && Object.keys(this.audioBuffers).length) {
      const best = findClosestBuffer(this.audioBuffers, midi);
      if (best && best.buffer) {
        const source = ctx.createBufferSource();
        source.buffer = best.buffer;
        const semitones = midi - best.baseMidi;
        source.playbackRate.value = Math.pow(2, semitones / 12);
        const detune = getTotalDetune(this.advanced);
        if (detune !== 0) {
          source.detune.value = detune;
        }

        let outputNode = source;

        const applyFilter = (type, cfg) => {
          if (!cfg) return;
          const filter = ctx.createBiquadFilter();
          filter.type = type;
          if (cfg.frequency) filter.frequency.value = cfg.frequency;
          if (cfg.Q) filter.Q.value = cfg.Q;
          outputNode.connect(filter);
          outputNode = filter;
        };

        const formantShift = getTotalFormant(this.advanced);
        if (formantShift !== 0) {
          const filter = ctx.createBiquadFilter();
          filter.type = "peaking";
          filter.Q.value = 1;
          filter.gain.value = 6;
          filter.frequency.value = 1000 * Math.pow(2, formantShift / 1200);
          outputNode.connect(filter);
          outputNode = filter;
        }

        applyFilter("highpass", profileConfig.highpass);

        if (profileConfig.distortion) {
          const shaper = ctx.createWaveShaper();
          shaper.curve = createDistortionCurve(
            profileConfig.distortion.amount
          );
          shaper.oversample =
            profileConfig.distortion.oversample || "2x";
          outputNode.connect(shaper);
          outputNode = shaper;
        }

        applyFilter("lowpass", profileConfig.lowpass);

        if (profileConfig.compressor) {
          const comp = ctx.createDynamicsCompressor();
          const { threshold, ratio, attack: compAttack, release: compRelease } =
            profileConfig.compressor;
          if (threshold !== undefined) comp.threshold.value = threshold;
          if (ratio !== undefined) comp.ratio.value = ratio;
          if (compAttack !== undefined) comp.attack.value = compAttack;
          if (compRelease !== undefined) comp.release.value = compRelease;
          outputNode.connect(comp);
          outputNode = comp;
        }

        const gain = ctx.createGain();
        outputNode.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.0001, Math.max(startTime - 0.01, 0));
        gain.gain.linearRampToValueAtTime(
          targetGain,
          startTime + attack
        );
        gain.gain.linearRampToValueAtTime(
          targetGain * sustainLevel,
          startTime + attack + decay
        );
        gain.gain.setValueAtTime(
          targetGain * sustainLevel,
          releaseStart
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        source.start(startTime);
        source.stop(stopTime + 0.05);

        nodeRecord = {
          stop: () => {
            try {
              source.stop();
            } catch (e) {
              /* noop */
            }
          },
        };
        source.onended = () => {
          this.activeNodes.delete(nodeRecord);
        };

        this.activeNodes.add(nodeRecord);
        return nodeRecord;
      }
    }

    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, Math.max(startTime - 0.01, 0));
    gain.gain.linearRampToValueAtTime(
      targetGain * 0.8,
      startTime + attack
    );
    gain.gain.linearRampToValueAtTime(
      targetGain * sustainLevel * 0.8,
      startTime + attack + decay
    );
    gain.gain.setValueAtTime(
      targetGain * sustainLevel * 0.8,
      releaseStart
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
    osc.start(startTime);
    osc.stop(stopTime + 0.05);
    nodeRecord = {
      stop: () => {
        try {
          osc.stop();
        } catch (e) {
          /* noop */
        }
      },
    };
    osc.onended = () => {
      this.activeNodes.delete(nodeRecord);
    };
    this.activeNodes.add(nodeRecord);
    return nodeRecord;
  };

  engine.playChord = async function ({
    frets = [],
    tuning = DEFAULT_TUNING_LOW_TO_HIGH,
    duration = 3.5,
    strumDelay = 0.05,
    direction = "down",
  } = {}) {
    if (!frets.length || !tuning.length) return null;
    const ctx = await this.prepare();
    const midiNotes = [];
    const max = Math.min(frets.length, tuning.length);
    for (let i = 0; i < max; i++) {
      const midi = fretToMidi(frets[i], tuning[i]);
      if (midi !== null) {
        midiNotes.push({ midi, order: i });
      }
    }
    if (!midiNotes.length) return null;

    const order =
      direction === "up" ? [...midiNotes].reverse() : [...midiNotes];
    const baseStart = ctx.currentTime + 0.05;
    const nodes = [];
    order.forEach((note, index) => {
      const node = this.scheduleMidiNote(
        note.midi,
        baseStart + index * strumDelay,
        duration
      );
      if (node) nodes.push(node);
    });

    return {
      stop: () => nodes.forEach((node) => node.stop()),
    };
  };

  engine.playSequence = async function (events, options = {}) {
    if (!Array.isArray(events) || !events.length) return null;
    const ctx = await this.prepare();
    const spread = typeof options.spread === "number" ? options.spread : 0;
    const baseStart = ctx.currentTime + (options.offset || 0.05);
    const nodes = [];

    events.forEach((event) => {
      const duration = Math.max(event.duration || 0.2, 0.05);
      const midis = event.midis || [];
      midis.forEach((midi, index) => {
        const node = this.scheduleMidiNote(
          midi,
          baseStart + event.start + spread * index,
          duration
        );
        if (node) nodes.push(node);
      });
    });

    return {
      stop: () => nodes.forEach((node) => node.stop()),
    };
  };

  engine.getCurrentTime = function () {
    return getAudioContext().currentTime;
  };

  return engine;
}

window.PlayTab = {
  createEngine,
  AVAILABLE_SAMPLES,
};
})();
