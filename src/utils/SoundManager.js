class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmGain = null;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.stepIndex = 0;
    this.nextStepTime = 0;
    this.ambientStarTimer = 0;
    this.ambientBirdTimer = 0;

    // 32-step musical progression (4 bars at 108 BPM, joyful nature meadow vibe)
    this.bgmMelody = [
      // Bar 1 (C Major):
      { step: 0, freq: 523.25, dur: 1.8 }, // C5
      { step: 2, freq: 659.25, dur: 1.8 }, // E5
      { step: 4, freq: 783.99, dur: 1.8 }, // G5
      { step: 6, freq: 659.25, dur: 1.8 }, // E5

      // Bar 2 (A Minor):
      { step: 8, freq: 880.00, dur: 1.8 }, // A5
      { step: 10, freq: 783.99, dur: 1.8 }, // G5
      { step: 12, freq: 659.25, dur: 1.8 }, // E5
      { step: 14, freq: 587.33, dur: 1.8 }, // D5

      // Bar 3 (F Major):
      { step: 16, freq: 698.46, dur: 1.8 }, // F5
      { step: 18, freq: 659.25, dur: 1.8 }, // E5
      { step: 20, freq: 587.33, dur: 1.8 }, // D5
      { step: 22, freq: 523.25, dur: 1.8 }, // C5

      // Bar 4 (G Major):
      { step: 24, freq: 587.33, dur: 1.8 }, // D5
      { step: 26, freq: 659.25, dur: 1.8 }, // E5
      { step: 28, freq: 587.33, dur: 1.8 }, // D5
      { step: 30, freq: 493.88, dur: 1.8 }, // B4
    ];

    this.bgmBass = [
      { step: 0, freq: 130.81, dur: 3.5 }, // C3
      { step: 4, freq: 196.00, dur: 3.5 }, // G3
      { step: 8, freq: 220.00, dur: 3.5 }, // A3
      { step: 12, freq: 164.81, dur: 3.5 }, // E3
      { step: 16, freq: 174.61, dur: 3.5 }, // F3
      { step: 20, freq: 130.81, dur: 3.5 }, // C3
      { step: 24, freq: 196.00, dur: 3.5 }, // G3
      { step: 28, freq: 146.83, dur: 3.5 }, // D3
    ];

    this.bgmHarmony = [
      { step: 1, freq: 329.63 }, // E4
      { step: 3, freq: 392.00 }, // G4
      { step: 5, freq: 329.63 }, // E4
      { step: 7, freq: 392.00 }, // G4

      { step: 9, freq: 349.23 }, // F4
      { step: 11, freq: 440.00 }, // A4
      { step: 13, freq: 349.23 }, // F4
      { step: 15, freq: 440.00 }, // A4

      { step: 17, freq: 349.23 }, // F4
      { step: 19, freq: 440.00 }, // A4
      { step: 21, freq: 349.23 }, // F4
      { step: 23, freq: 523.25 }, // C5

      { step: 25, freq: 392.00 }, // G4
      { step: 27, freq: 493.88 }, // B4
      { step: 29, freq: 392.00 }, // G4
      { step: 31, freq: 493.88 }, // B4
    ];
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.08, now + 0.1);
    }
    return this.isMuted;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);
    }
  }

  startBGM() {
    this.init();
    if (this.isBgmPlaying || !this.ctx) return;
    this.isBgmPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.stepIndex = 0;
    this.ambientStarTimer = this.ctx.currentTime + 3.0;
    this.ambientBirdTimer = this.ambientStarTimer;

    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;
      this.scheduleBGM();
    }, 100);
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playBgmNote(freq, time, duration, gainVal = 0.22) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBgmBass(freq, time, duration, gainVal = 0.20) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playAmbientStarlight(time) {
    if (!this.ctx || !this.bgmGain) return;
    // Gentle magical glockenspiel / music box twinkle tones in the background
    const pattern = [
      { delay: 0, freq: 1760.00, dur: 0.14 }, // A6
      { delay: 0.12, freq: 2093.00, dur: 0.16 }, // C7
      { delay: 0.24, freq: 2637.02, dur: 0.25 }, // E7
    ];

    pattern.forEach((p) => {
      const t = time + p.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p.freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + p.dur);
    });
  }

  playAmbientBirdSong(time) {
    this.playAmbientStarlight(time);
  }

  scheduleBGM() {
    if (!this.ctx || !this.isBgmPlaying) return;
    const stepDur = 0.278; // 108 BPM eighth notes

    while (this.nextStepTime < this.ctx.currentTime + 0.45) {
      const step = this.stepIndex % 32;

      // Melody notes
      this.bgmMelody.forEach((m) => {
        if (m.step === step) {
          this.playBgmNote(m.freq, this.nextStepTime, m.dur * stepDur, 0.24);
        }
      });

      // Bass notes
      this.bgmBass.forEach((b) => {
        if (b.step === step) {
          this.playBgmBass(b.freq, this.nextStepTime, b.dur * stepDur, 0.20);
        }
      });

      // Harmony arpeggio notes
      this.bgmHarmony.forEach((h) => {
        if (h.step === step) {
          this.playBgmNote(h.freq, this.nextStepTime, 1.4 * stepDur, 0.11);
        }
      });

      // Ambient star twinkle music box sound
      if (this.nextStepTime >= this.ambientStarTimer) {
        this.playAmbientStarlight(this.nextStepTime);
        this.ambientStarTimer = this.nextStepTime + 4.5 + Math.random() * 4.0;
        this.ambientBirdTimer = this.ambientStarTimer;
      }

      this.nextStepTime += stepDur;
      this.stepIndex++;
    }
  }

  playPop() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCount(index) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    // Ascending scale from 1 to 10: C4 to E5
    const notes = [
      261.63, // 1: C4
      293.66, // 2: D4
      329.63, // 3: E4
      349.23, // 4: F4
      392.00, // 5: G4
      440.00, // 6: A4
      493.88, // 7: B4
      523.25, // 8: C5
      587.33, // 9: D5
      659.25  // 10: E5
    ];
    const freq = notes[Math.min(Math.max(index - 1, 0), notes.length - 1)];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // pleasant marimba/bell tone
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playCorrect() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    // Pleasant 3-note arpeggio (C5 -> E5 -> G5)
    const chord = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  playWrong() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    // Gentle soft descending boing
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  playBonusTime() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playCelebration() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.35 }
    ];
    let offset = 0;
    const now = this.ctx.currentTime;

    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + offset;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.d);
      offset += note.d * 0.9;
    });
  }

  playTick() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playStarTwinkle() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sparkling bright crystal chime tones
    [
      { delay: 0, freq: 2093.00, dur: 0.18 }, // C7
      { delay: 0.05, freq: 2637.02, dur: 0.22 }, // E7
      { delay: 0.10, freq: 3135.96, dur: 0.28 }  // G7
    ].forEach((p) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + p.delay;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + p.dur);
    });
  }

  playStarChime() {
    this.playStarTwinkle();
  }

  playChirp() {
    this.playBirdChirp();
  }

  playBirdChirp() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Cheerful, realistic sweet dual-tone bird chirp
    const chirpNotes = [
      { f1: 2200, f2: 3400, dur: 0.08, delay: 0 },
      { f1: 2800, f2: 4200, dur: 0.10, delay: 0.09 },
      { f1: 3200, f2: 4600, dur: 0.12, delay: 0.20 }
    ];

    chirpNotes.forEach((note) => {
      const t = now + note.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f1, t);
      osc.frequency.exponentialRampToValueAtTime(note.f2, t + note.dur * 0.6);
      osc.frequency.exponentialRampToValueAtTime(note.f1 * 1.1, t + note.dur);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.dur);
    });
  }

  playHowManyStars(scene) {
    if (this.isMuted) return;
    if (scene && scene.sound && scene.cache && scene.cache.audio.exists("voice_how_many_stars")) {
      try {
        if (scene.sound.get("voice_how_many_stars")) {
          scene.sound.stopByKey("voice_how_many_stars");
        }
        scene.sound.play("voice_how_many_stars", { volume: 1.0 });
      } catch (e) {
        console.warn("Could not play voice_how_many_stars", e);
      }
    }
  }

  stopHowManyStars(scene) {
    if (scene && scene.sound && scene.cache && scene.cache.audio.exists("voice_how_many_stars")) {
      try {
        scene.sound.stopByKey("voice_how_many_stars");
      } catch (e) {}
    }
    this.stopHowManyBirds();
  }

  playHowManyBirds(scene) {
    if (this.isMuted) return;
    // Play cheerful bird chirp intro
    this.playBirdChirp();

    // Use Web Speech API if available for high quality voice prompt
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("How many birds are there?");
        utterance.rate = 0.95;
        utterance.pitch = 1.25; // Friendly, youthful pitch for kids
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis error:", e);
      }
    }
  }

  stopHowManyBirds() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export default new SoundManager();
