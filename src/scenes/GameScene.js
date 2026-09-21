import Phaser from "phaser";
import SoundManager from "../utils/SoundManager.js";
import SpineBird from "../utils/SpineBird.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.level = data && typeof data.level === "number" ? data.level : 2;
    this.gameMode = data && data.gameMode ? data.gameMode : "birds";
    this.score = data && typeof data.score === "number" ? data.score : 0;
    this.starCount =
      data && typeof data.starCount === "number"
        ? data.starCount
        : data && typeof data.birdCount === "number"
          ? data.birdCount
          : data && typeof data.appleCount === "number"
            ? data.appleCount
            : 0;
    this.birdCount = this.starCount; // backwards compatibility
    this.appleCount = this.starCount; // backwards compatibility
    this.timeLeft =
      data && typeof data.timeLeft === "number" ? data.timeLeft : 120;
    this.streak = data && typeof data.streak === "number" ? data.streak : 0;
    this.totalAnswered =
      data && typeof data.totalAnswered === "number" ? data.totalAnswered : 0;
    this.baskets = Math.floor(this.score / 5);
    this.isPaused = false;
    this.correctCountPopup = null;
    this.sequenceStep =
      data && typeof data.sequenceStep === "number" ? data.sequenceStep : 0;
  }

  create() {
    const { width, height } = this.scale;
    this.isInputLocked = false;
    this.isPaused = false;
    this.currentStars = [];
    this.currentBirds = this.currentStars; // alias for compatibility
    this.currentApples = this.currentStars; // alias for compatibility
    this.currentButtons = [];
    this.tappedCount = 0;
    this.currentCount = 0;

    // 1. Background: Desert for Level 2 (Bird Counting) & Meadow for Level 1 (Star Counting)
    const isLevel2 = this.gameMode === "birds" || this.level === 2;
    const bgKey = isLevel2 && this.textures.exists("bg_desert") ? "bg_desert" : "bg_main";
    this.background = this.add.image(width / 2, height / 2, bgKey);
    this.background.setDisplaySize(width, height);

    // Start or ensure background music is playing
    SoundManager.init();
    SoundManager.startBGM();
    this.input.once("pointerdown", () => {
      SoundManager.init();
      SoundManager.startBGM();
    });

    this.tweens.add({
      targets: this.countingLogo,
      y: 338,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 2. Top HUD using Real Timer & Score panels, and Star counter badge
    this.createHUD(width);

    // 3. Star / Sparkle Particle Emitter Setup
    this.starParticles = this.add.particles(0, 0, "particle_star", {
      speed: { min: 140, max: 360 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 900,
      gravityY: 200,
      emitting: false,
    });

    // 4. Guided Mistake Banner
    this.createFeedbackBanner(width);

    // 5. Pause Modal Popup
    this.createPauseModal(width, height);

    // 6. Timer Loop (120s countdown)
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });

    // 7. Start First Question
    this.nextQuestion();
  }

  createHUD(width) {
    const isLevel2 = this.gameMode === "birds" || this.level === 2;

    // 1. Timer Panel
    this.add.image(160, 100, "panel_timer").setScale(1).setDepth(6);
    this.timeText = this.add
      .text(200, 118, `${this.timeLeft}`, {
        fontFamily: "Comic Sans MS, Quicksand, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#5d2b00",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(61);

    // 2. Score Panel (Birdhouse with Nest, Food & Water Bowls)
    const panelX = 0;
    const panelY = 0;
    const panelScale = 0.92;

    this.scoreContainer = this.add.container(480, 110).setDepth(60);
    this.scorePanel = this.add.image(panelX, panelY, "panel_score").setScale(panelScale);

    this.scoreText = this.add
      .text(panelX, panelY - Math.round(19 * panelScale), `${this.score}`, {
        fontFamily: "Comic Sans MS, Quicksand, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#5d2b00",
        stroke: "#ffffff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.scoreContainer.add([this.scorePanel, this.scoreText]);

    // Interactive tap on score birdhouse for a fun bounce
    this.scorePanel.setInteractive({ useHandCursor: true });
    this.scorePanel.on("pointerdown", () => {
      SoundManager.playBirdChirp();
      this.starParticles.emitParticleAt(
        this.scoreContainer.x,
        this.scoreContainer.y + 15,
        12,
      );
      this.punchScoreBadge(1.18, 90);
    });

    // Backwards compatibility aliases
    this.headerStarContainer = this.scoreContainer;
    this.headerStarIcon = { x: 0, y: 15 };
    this.headerBirdContainer = this.headerStarContainer;
    this.headerBirdIcon = this.headerStarIcon;
    this.headerAppleContainer = this.headerStarContainer;
    this.headerAppleIcon = this.headerStarIcon;
    this.headerStarCountText = this.scoreText;
    this.headerBirdCountText = this.scoreText;
    this.headerAppleCountText = this.scoreText;

    // 4. Sound Toggle Button
    this.soundBtn = this.add
      .image(
        810,
        100,
        SoundManager.isMuted ? "btn_game_mute" : "btn_game_unmute",
      )
      .setScale(1)
      .setDepth(60)
      .setInteractive({ useHandCursor: true });

    this.soundBtn.on("pointerdown", () => {
      SoundManager.init();
      SoundManager.startBGM();
      const isMuted = SoundManager.toggleMute();
      this.sound.mute = isMuted;
      this.soundBtn.setTexture(isMuted ? "btn_game_mute" : "btn_game_unmute");
      if (!isMuted) {
        SoundManager.playPop();
      }
      this.tweens.add({
        targets: this.soundBtn,
        scale: 1.02,
        duration: 100,
        yoyo: true,
        ease: "Quad.easeInOut",
      });
    });

    // 5. Pause Button
    this.pauseBtn = this.add
      .image(955, 100, "btn_game_pause")
      .setScale(0.88)
      .setDepth(60)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn.on("pointerover", () => {
      this.tweens.add({
        targets: this.pauseBtn,
        scale: 0.94,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    this.pauseBtn.on("pointerout", () => {
      this.tweens.add({
        targets: this.pauseBtn,
        scale: 0.88,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });

    this.pauseBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: this.pauseBtn,
        scale: 0.82,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => this.openPauseModal(),
      });
    });
  }

  createFeedbackBanner(width) {
    this.bannerContainer = this.add.container(width / 2, 285).setDepth(65).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 0.94);
    bg.fillRoundedRect(-440, -36, 880, 72, 22);
    bg.lineStyle(4, 0xfacc15, 1);
    bg.strokeRoundedRect(-440, -36, 880, 72, 22);

    const initialText =
      this.gameMode === "birds"
        ? "Count the birds: 1... 2... 3! 🐦"
        : "Count the stars: 1... 2... 3! ⭐";

    this.bannerText = this.add
      .text(0, 0, initialText, {
        fontFamily: "Comic Sans MS, Quicksand, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.bannerContainer.add([bg, this.bannerText]);
  }

  onTimerTick() {
    if (this.isPaused) return;
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.timeText.setText(`${this.timeLeft}`);

      if (this.timeLeft <= 10) {
        SoundManager.playTick();
        this.timeText.setColor("#ff5252");
      } else {
        this.timeText.setColor("#ffffff");
      }

      if (this.timeLeft === 0) {
        this.gameOver();
      }
    }
  }

  nextQuestion() {
    this.isInputLocked = false;
    this.tappedCount = 0;

    if (this.correctCountPopup) {
      this.correctCountPopup.destroy();
      this.correctCountPopup = null;
    }

    // Clean up previous stars/birds and kill active tweens / timers
    this.currentStars.forEach((s) => {
      this.tweens.killTweensOf(s);
      if (s.starPulse) s.starPulse.remove();
      if (s.flapTimer) s.flapTimer.remove();
      if (s.list) s.list.forEach((child) => this.tweens.killTweensOf(child));
      s.destroy();
    });
    this.currentStars = [];
    this.currentBirds = this.currentStars;
    this.currentApples = this.currentStars;

    this.currentButtons.forEach((b) => {
      this.tweens.killTweensOf(b);
      if (b.list) b.list.forEach((child) => this.tweens.killTweensOf(child));
      b.destroy();
    });
    this.currentButtons = [];

    // Ensure score badge scale is clean and un-stretched
    if (this.scoreContainer) {
      this.tweens.killTweensOf(this.scoreContainer);
      this.scoreContainer.setScale(1);
    }
    if (this.scoreText) {
      this.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1);
    }

    // Structured progression: 1, 2, 3... 9, then random
    this.sequenceStep++;
    if (this.sequenceStep <= 9) {
      this.currentCount = this.sequenceStep;
    } else {
      let nextCount;
      do {
        nextCount = Phaser.Math.Between(1, 9);
      } while (nextCount === this.currentCount);
      this.currentCount = nextCount;
    }

    // Spawn items and voice prompt based on Level mode
    if (this.gameMode === "birds") {
      this.spawnBirds(this.currentCount);
      this.bannerText.setText("Count the birds: 1... 2... 3! 🐦");
      this.time.delayedCall(220, () => {
        if (!this.isPaused && !this.isInputLocked) {
          SoundManager.playHowManyBirds(this);
        }
      });
    } else {
      this.spawnStars(this.currentCount);
      this.bannerText.setText("Count the stars: 1... 2... 3! ⭐");
      this.time.delayedCall(220, () => {
        if (!this.isPaused && !this.isInputLocked) {
          SoundManager.playHowManyStars(this);
        }
      });
    }

    // Spawn 4 real option boxes (numbers 1 to 9)
    this.spawnOptionBoxes(this.currentCount);
  }

  getStarLayout(count) {
    const { width } = this.scale;
    const cx = width / 2; // 540

    // Standard row heights placed gracefully in the open sky
    const rowTop = 720;
    const rowMid = 920;
    const rowBot = 1120;

    switch (count) {
      case 1:
        // Level 1: 1 star centered
        return [{ x: cx, y: 920 }];

      case 2:
        // Level 2: 2 stars centered horizontally
        return [
          { x: cx - 140, y: 920 },
          { x: cx + 140, y: 920 },
        ];

      case 3:
        // Level 3: Triangle (1 top center, 2 bottom)
        return [
          { x: cx, y: 770 },
          { x: cx - 160, y: 1060 },
          { x: cx + 160, y: 1060 },
        ];

      case 4:
        // Level 4: 2x2 grid
        return [
          { x: cx - 150, y: 780 },
          { x: cx + 150, y: 780 },
          { x: cx - 150, y: 1060 },
          { x: cx + 150, y: 1060 },
        ];

      case 5:
        // Level 5: Quincunx (2 top, 1 center, 2 bottom)
        return [
          { x: cx - 180, y: rowTop },
          { x: cx + 180, y: rowTop },
          { x: cx, y: rowMid },
          { x: cx - 180, y: rowBot },
          { x: cx + 180, y: rowBot },
        ];

      case 6:
        // Level 6: 2 rows of 3
        return [
          { x: cx - 190, y: 810 },
          { x: cx, y: 810 },
          { x: cx + 190, y: 810 },
          { x: cx - 190, y: 1040 },
          { x: cx, y: 1040 },
          { x: cx + 190, y: 1040 },
        ];

      case 7:
        // Level 7: 3 top, 1 middle, 3 bottom (3 + 1 + 3 = 7)
        return [
          { x: cx - 210, y: rowTop },
          { x: cx, y: rowTop },
          { x: cx + 210, y: rowTop },
          { x: cx, y: rowMid },
          { x: cx - 210, y: rowBot },
          { x: cx, y: rowBot },
          { x: cx + 210, y: rowBot },
        ];

      case 8:
        // Level 8: 3 top, 2 middle, 3 bottom (3 + 2 + 3 = 8)
        return [
          { x: cx - 210, y: rowTop },
          { x: cx, y: rowTop },
          { x: cx + 210, y: rowTop },
          { x: cx - 130, y: rowMid },
          { x: cx + 130, y: rowMid },
          { x: cx - 210, y: rowBot },
          { x: cx, y: rowBot },
          { x: cx + 210, y: rowBot },
        ];

      case 9:
        // Level 9: 3x3 grid (3 top, 3 middle, 3 bottom = 9)
        return [
          { x: cx - 210, y: rowTop },
          { x: cx, y: rowTop },
          { x: cx + 210, y: rowTop },
          { x: cx - 210, y: rowMid },
          { x: cx, y: rowMid },
          { x: cx + 210, y: rowMid },
          { x: cx - 210, y: rowBot },
          { x: cx, y: rowBot },
          { x: cx + 210, y: rowBot },
        ];

      case 10:
        return [
          { x: cx - 240, y: rowTop },
          { x: cx, y: rowTop },
          { x: cx + 240, y: rowTop },
          { x: cx - 360, y: rowMid },
          { x: cx - 180, y: rowMid },
          { x: cx, y: rowMid },
          { x: cx + 180, y: rowMid },
          { x: cx + 360, y: rowMid },
          { x: cx - 180, y: rowBot },
          { x: cx + 180, y: rowBot },
        ];

      default:
        const cols = Math.min(count, 3);
        const list = [];
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = cx + (col - (cols - 1) / 2) * 200;
          const y = 780 + row * 190;
          list.push({ x, y });
        }
        return list;
    }
  }

  getBirdLayout(count) {
    return this.getStarLayout(count);
  }

  spawnStars(count) {
    const layout = this.getStarLayout(count);

    layout.forEach((pos, idx) => {
      const starContainer = this.add.container(pos.x, pos.y);

      let starScale = 1.0;
      if (count <= 4) {
        starScale = 1.05;
      } else if (count <= 6) {
        starScale = 0.96;
      } else {
        starScale = 0.88;
      }

      const starSprite = this.add.image(0, 0, "star").setScale(starScale);

      starContainer.add(starSprite);
      starContainer.setSize(140, 140);
      starContainer.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 140, 140),
        Phaser.Geom.Rectangle.Contains,
      );
      starContainer.input.cursor = "pointer";
      starContainer.starIndex = idx + 1;
      starContainer.birdIndex = idx + 1; // alias
      starContainer.isCounted = false;
      starContainer.starSprite = starSprite;
      starContainer.birdSprite = starSprite; // alias
      starContainer.baseScale = starScale;

      // Gentle floating / hovering animation (synchronized vertical bob)
      const bobDuration = 1200 + (idx % 3) * 150;
      this.tweens.add({
        targets: starSprite,
        y: { from: -8, to: 8 },
        duration: bobDuration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Gentle subtle rotation sway (twinkling charm)
      this.tweens.add({
        targets: starSprite,
        angle: { from: -5, to: 5 },
        duration: 1500 + (idx % 3) * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Gentle breathing shimmer
      this.tweens.add({
        targets: starSprite,
        scale: { from: starScale * 0.95, to: starScale * 1.05 },
        duration: 1100 + (idx % 4) * 140,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Interactive Touch-to-Count mechanic
      starContainer.on("pointerdown", () => {
        if (this.isInputLocked || this.isPaused || starContainer.isCounted)
          return;
        this.tappedCount++;
        starContainer.isCounted = true;

        SoundManager.playStarTwinkle();
        SoundManager.playCount(this.tappedCount);

        // Sparkle particles at star
        this.starParticles.emitParticleAt(pos.x, pos.y, 8);

        // Joyful 360 spin and elastic bounce
        this.tweens.add({
          targets: starSprite,
          angle: starSprite.angle + 360,
          duration: 340,
          ease: "Back.easeOut",
        });

        this.tweens.add({
          targets: starContainer,
          scale: 1.25,
          duration: 110,
          yoyo: true,
          ease: "Quad.easeInOut",
        });

        // Add count badge above the star
        const badge = this.add.image(0, -66, "badge_count").setScale(0);
        const badgeText = this.add
          .text(0, -66, `${this.tappedCount}`, {
            fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
            fontSize: "30px",
            fontStyle: "900",
            color: "#d84315",
          })
          .setOrigin(0.5)
          .setScale(0);

        starContainer.add([badge, badgeText]);

        this.tweens.add({
          targets: [badge, badgeText],
          scale: 1.15,
          duration: 220,
          ease: "Back.easeOut",
        });
      });

      this.currentStars.push(starContainer);
    });
  }

  spawnBirds(count) {
    const layout = this.getStarLayout(count);

    layout.forEach((pos, idx) => {
      let birdScale = 0.32;
      if (count <= 4) {
        birdScale = 0.35;
      } else if (count <= 6) {
        birdScale = 0.30;
      } else {
        birdScale = 0.26;
      }

      const birdContainer = SpineBird.create(this, pos.x, pos.y, {
        scale: birdScale,
        index: idx + 1,
        facingDir: 1,
        interactive: true,
      });

      this.currentStars.push(birdContainer);
    });
  }

  spawnOptionBoxes(correctNumber) {
    // Pick 4 unique choices strictly within 1..9
    const choices = [correctNumber];
    while (choices.length < 4) {
      let offset = Phaser.Math.Between(-3, 3);
      let cand = correctNumber + offset;
      if (cand < 1) cand = Phaser.Math.Between(1, 9);
      if (cand > 9) cand = Phaser.Math.Between(1, 9);
      if (!choices.includes(cand)) {
        choices.push(cand);
      }
    }

    Phaser.Utils.Array.Shuffle(choices);

    // Single horizontal row using the 4 real box textures: box1, box2, box3, box4 at original scale 1
    const boxTextures = ["box1", "box2", "box3", "box4"];
    const rowY = 1660;
    const rowCoords = [
      { x: 150, y: rowY },
      { x: 410, y: rowY },
      { x: 670, y: rowY },
      { x: 930, y: rowY },
    ];

    choices.forEach((choiceNum, idx) => {
      const pos = rowCoords[idx];
      const boxKey = boxTextures[idx];
      const btnContainer = this.add.container(pos.x, pos.y);

      const btnBg = this.add.image(0, 0, boxKey).setScale(1.0);

      // Large Extra Bold Numeral (sized for scale 1 box: 218x199)
      const numText = this.add
        .text(0, 0, `${choiceNum}`, {
          fontFamily:
            '"Fredoka", "Arial Black", Impact, "Comic Sans MS", sans-serif',
          fontSize: "150px",
          // fontStyle: "800",
          color: "#ffffff",
          stroke: "#381702",
          strokeThickness: 8,
          shadow: {
            offsetX: 0,
            offsetY: 5,
            color: "rgba(0, 0, 0, 0.45)",
            blur: 2,
            stroke: true,
            fill: true,
          },
        })
        .setOrigin(0.5);

      btnContainer.add([btnBg, numText]);
      btnContainer.setSize(218, 199);
      btnContainer.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 218, 199),
        Phaser.Geom.Rectangle.Contains,
      );
      btnContainer.input.cursor = "pointer";
      btnContainer.choiceValue = choiceNum;
      btnContainer.bg = btnBg;
      btnContainer.baseY = pos.y;

      // Hover Effect (lift, scale up, warm sunlit tint)
      btnContainer.on("pointerover", () => {
        if (this.isInputLocked || this.isPaused) return;
        btnBg.setTint(0xfff3e0);
        this.tweens.add({
          targets: btnContainer,
          scale: 1.08,
          y: pos.y - 14,
          duration: 160,
          ease: "Back.easeOut",
        });
      });

      btnContainer.on("pointerout", () => {
        if (this.isInputLocked || this.isPaused) return;
        btnBg.clearTint();
        this.tweens.add({
          targets: btnContainer,
          scale: 1.0,
          y: pos.y,
          duration: 160,
          ease: "Quad.easeOut",
        });
      });

      // Press / Click Effect
      btnContainer.on("pointerdown", () => {
        if (this.isInputLocked || this.isPaused) return;
        btnBg.clearTint();
        this.tweens.add({
          targets: btnContainer,
          scale: 0.94,
          duration: 70,
          yoyo: true,
          ease: "Quad.easeInOut",
          onComplete: () => {
            this.handleAnswer(choiceNum, btnContainer, correctNumber);
          },
        });
      });

      this.currentButtons.push(btnContainer);
    });
  }

  handleAnswer(selectedNumber, buttonContainer, correctNumber) {
    this.isInputLocked = true;
    this.totalAnswered++;

    // Stop question voice prompt if still speaking
    SoundManager.stopHowManyStars(this);

    if (selectedNumber === correctNumber) {
      this.handleCorrectAnswer(buttonContainer);
    } else {
      this.handleWrongAnswer(buttonContainer, correctNumber);
    }
  }

  punchScoreBadge(scale = 1.22, duration = 85) {
    if (!this.scoreContainer) return;
    this.tweens.killTweensOf(this.scoreContainer);
    this.scoreContainer.setScale(1);

    this.tweens.add({
      targets: this.scoreContainer,
      scale: scale,
      duration: duration,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  handleCorrectAnswer(buttonContainer) {
    SoundManager.playCorrect();

    // 1. Increment Streak (Score increments when stars/birds collect into the Score Badge)
    this.streak++;
    this.baskets = Math.floor((this.score + 1) / 5);

    // 2. Celebratory Cheer Indicator for Right Answer
    const cheers =
      this.gameMode === "birds"
        ? [
          "LOVELY BIRDS! 🐦",
          "GREAT JOB! 🎉",
          "CORRECT! 🌟",
          "SUPER BIRDS! 🕊️",
          "AWESOME! 👏",
          "EXCELLENT! ✨",
        ]
        : [
          "AWESOME! ⭐",
          "GREAT JOB! 🌟",
          "CORRECT! 🎉",
          "SUPER STARS! ✨",
          "LOVELY STARS! 💫",
          "EXCELLENT! 🎈",
          "BRAVO! 👏",
        ];
    const cheerPhrase = Phaser.Utils.Array.GetRandom(cheers);

    const cheerText = this.add
      .text(buttonContainer.x, buttonContainer.y - 80, cheerPhrase, {
        fontFamily: '"Fredoka", "Arial Black", sans-serif',
        fontSize: "44px",
        fontStyle: "900",
        color: "#ffeb3b",
        stroke: "#5d2b00",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: "rgba(0, 0, 0, 0.4)",
          blur: 4,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setScale(0.8);

    this.tweens.add({
      targets: cheerText,
      y: cheerText.y - 90,
      scale: 1.15,
      alpha: 0,
      duration: 900,
      ease: "Back.easeOut",
      onComplete: () => cheerText.destroy(),
    });

    // 3. Particles at selected button
    this.starParticles.emitParticleAt(buttonContainer.x, buttonContainer.y, 22);

    // 4. Celebratory Flight: Items fly into the Score Badge!
    const totalItems = this.currentStars.length;
    // Target is the bird nest / food & water bowls in the Score Birdhouse
    const targetX = this.scoreContainer ? this.scoreContainer.x : 480;
    const targetY = this.scoreContainer ? this.scoreContainer.y + 15 : 120;

    let scoreIncremented = false;

    const handleItemArrival = (idx) => {
      // Play count audio, pop, & twinkle / chirp
      SoundManager.playPop();
      SoundManager.playCount(idx + 1);
      if (this.gameMode === "birds") {
        SoundManager.playBirdChirp();
      } else {
        SoundManager.playStarTwinkle();
      }

      // Sparkle burst at the score badge
      this.starParticles.emitParticleAt(targetX, targetY, 12);

      // Punch and zoom the Score Badge for EVERY item collected!
      this.punchScoreBadge(1.22, 85);

      // When all items are collected into the Score Badge, increase score by 1 point
      if (idx === totalItems - 1 && !scoreIncremented) {
        scoreIncremented = true;
        this.score++;
        this.starCount = this.score;
        this.birdCount = this.score;
        this.appleCount = this.score;
        this.scoreText.setText(`${this.score}`);

        SoundManager.playStarChime();

        // Extra celebratory punch when score point increments
        this.punchScoreBadge(1.28, 110);

        // Score text joyful bounce
        this.tweens.killTweensOf(this.scoreText);
        this.scoreText.setScale(1);
        this.tweens.add({
          targets: this.scoreText,
          scale: 1.45,
          duration: 120,
          yoyo: true,
          ease: "Back.easeOut",
        });

        // Golden sparkle burst at score number
        this.starParticles.emitParticleAt(
          this.scoreContainer ? this.scoreContainer.x + 40 : 520,
          this.scoreContainer ? this.scoreContainer.y + 18 : 118,
          14,
        );

        // Transition after brief celebration pause
        this.time.delayedCall(600, () => {
          if (this.streak > 0 && this.streak % 5 === 0) {
            this.scene.pause("GameScene");
            this.scene.launch("WellDoneScene", {
              level: this.level,
              gameMode: this.gameMode,
              baskets: this.baskets,
              score: this.score,
              starCount: this.starCount,
              birdCount: this.starCount,
              appleCount: this.starCount,
              streak: this.streak,
              timeLeft: this.timeLeft,
              timePlayed: 120 - this.timeLeft,
            });
          } else {
            this.nextQuestion();
          }
        });
      }
    };

    this.currentStars.forEach((item, idx) => {
      if (typeof item.flyTo === "function") {
        // Spine Bird with articulated flight along random curved swoops
        item.flyTo(targetX, targetY, {
          duration: 650 + Phaser.Math.Between(0, 100),
          delay: idx * 110,
          onComplete: () => handleItemArrival(idx),
        });
      } else {
        item.isFlying = true;

        // Clean up idle floating/bobbing
        this.tweens.killTweensOf(item);
        if (item.flapTimer) item.flapTimer.remove();
        if (item.list && item.list.length > 0) {
          this.tweens.killTweensOf(item.list[0]);
          item.list[0].setAngle(0);
          if (item.list.length > 1) {
            const extraChildren = item.list.slice(1);
            extraChildren.forEach((child) => child.destroy());
          }
        }
        item.setDepth(150);

        // Fast rotation animation for stars
        const spr = item.starSprite || item.birdSprite || item.list[0];
        if (spr) {
          this.tweens.add({
            targets: spr,
            angle: "+=720",
            duration: 520,
            ease: "Linear",
          });
        }

        // Trailing sparkle timer
        const trailTimer = this.time.addEvent({
          delay: 60,
          callback: () => {
            if (!item.active) return;
            this.starParticles.emitParticleAt(item.x, item.y, 1);
          },
          loop: true,
        });

        // Smooth flight arc up to the Score Badge
        this.tweens.add({
          targets: item,
          x: targetX,
          y: targetY,
          scale: 0.3,
          duration: 520,
          delay: idx * 130,
          ease: "Power2.easeIn",
          onComplete: () => {
            trailTimer.remove();
            item.destroy();
            handleItemArrival(idx);
          },
        });
      }
    });
  }

  handleWrongAnswer(buttonContainer, correctNumber) {
    SoundManager.playWrong();
    this.streak = 0;

    // Shake the wrong box
    this.tweens.add({
      targets: buttonContainer,
      x: buttonContainer.x + 14,
      duration: 60,
      yoyo: true,
      repeat: 4,
    });

    // Highlight correct box
    const correctBtn = this.currentButtons.find(
      (b) => b.choiceValue === correctNumber,
    );
    if (correctBtn) {
      this.tweens.add({
        targets: correctBtn,
        scale: 1.08,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    }

    // Pedagogical Correction: Sequentially highlight each item
    const itemName = this.gameMode === "birds" ? "birds! 🐦" : "stars! ⭐";
    this.bannerText.setText(
      `Let's count together: There are ${correctNumber} ${itemName}`,
    );
    this.tweens.add({
      targets: this.bannerContainer,
      alpha: 1,
      duration: 250,
    });

    this.currentStars.forEach((item, idx) => {
      this.time.delayedCall(idx * 380 + 250, () => {
        SoundManager.playCount(idx + 1);
        if (this.gameMode === "birds") {
          SoundManager.playBirdChirp();
        } else {
          SoundManager.playStarTwinkle();
        }

        this.starParticles.emitParticleAt(item.x, item.y, 6);

        const guideBadge = this.add.image(0, -66, "badge_count").setScale(0);
        const guideText = this.add
          .text(0, -66, `${idx + 1}`, {
            fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
            fontSize: "30px",
            fontStyle: "900",
            color: "#b71c1c",
          })
          .setOrigin(0.5)
          .setScale(0);

        item.add([guideBadge, guideText]);

        this.tweens.add({
          targets: [guideBadge, guideText],
          scale: 1.2,
          duration: 180,
          yoyo: true,
        });

        this.tweens.add({
          targets: item,
          scale: 1.24,
          duration: 160,
          yoyo: true,
        });
      });
    });

    const reviewDelay = Math.max(2200, correctNumber * 380 + 500);
    this.time.delayedCall(reviewDelay, () => {
      this.tweens.add({
        targets: this.bannerContainer,
        alpha: 0,
        duration: 200,
      });

      if (correctBtn) {
        this.tweens.killTweensOf(correctBtn);
        correctBtn.setScale(1.0);
      }

      this.showCorrectCountPopup(correctNumber);
    });
  }

  showCorrectCountPopup(correctNumber) {
    const { width, height } = this.scale;
    SoundManager.playPop();

    // Container for the popup message (Depth 180, under pause modal 200)
    this.correctCountPopup = this.add
      .container(width / 2, height / 2)
      .setDepth(180);

    // 1. Soft darkened overlay backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.45);
    backdrop.fillRect(-width / 2, -height / 2, width, height);
    backdrop.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains,
    );

    // 2. Card background with shadow & dual border
    const card = this.add.graphics();
    // Drop shadow
    card.fillStyle(0x000000, 0.28);
    card.fillRoundedRect(-350, -170, 700, 340, 32);

    // Card body (warm creamy card)
    card.fillStyle(0xfffaec, 1);
    card.fillRoundedRect(-350, -174, 700, 340, 32);

    // Border
    const borderCol = this.gameMode === "birds" ? 0x0284c7 : 0xf59e0b;
    card.lineStyle(6, borderCol, 1);
    card.strokeRoundedRect(-350, -174, 700, 340, 32);

    // Soft inner border
    card.lineStyle(2, 0xfde68a, 0.85);
    card.strokeRoundedRect(-342, -166, 684, 324, 26);

    // Top decorative highlight bar
    card.fillStyle(0xffffff, 0.5);
    card.fillRoundedRect(-325, -164, 650, 20, 10);

    // 3. Icon with gentle breathing pulse
    const iconKey = this.gameMode === "birds" ? "spine_bird_full" : "star";
    const iconScale = this.gameMode === "birds" ? 0.24 : 0.65;
    const itemIcon = this.add.image(0, -78, iconKey).setScale(iconScale);
    this.tweens.add({
      targets: itemIcon,
      scale: iconScale * 1.1,
      angle: { from: -4, to: 4 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 4. "Correct Count = X" Big Bold Text
    const titleText = this.add
      .text(0, 15, `Correct Count = ${correctNumber}`, {
        fontFamily: '"Fredoka", "Arial Black", Impact, sans-serif',
        fontSize: "52px",
        fontStyle: "900",
        color: this.gameMode === "birds" ? "#0369a1" : "#b45309",
        stroke: "#ffffff",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: "rgba(0, 0, 0, 0.25)",
          blur: 4,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    // 5. Friendly encouraging subtitle
    const subLabel =
      this.gameMode === "birds"
        ? "🐦 Count the birds carefully!"
        : "⭐ Count the stars carefully!";
    const subText = this.add
      .text(0, 85, subLabel, {
        fontFamily: '"Fredoka", "Arial Black", sans-serif',
        fontSize: "30px",
        fontStyle: "900",
        color: "#15803d",
      })
      .setOrigin(0.5);

    // 6. Tap anywhere hint
    const hintText = this.add
      .text(0, 132, "Tap anywhere to continue ▶", {
        fontFamily: '"Fredoka", "Arial Black", sans-serif',
        fontSize: "22px",
        fontStyle: "bold",
        color: "#78716c",
      })
      .setOrigin(0.5);

    this.correctCountPopup.add([
      backdrop,
      card,
      itemIcon,
      titleText,
      subText,
      hintText,
    ]);

    // Animate entrance: pop in with bounce
    this.correctCountPopup.setScale(0.6);
    this.correctCountPopup.setAlpha(0);
    this.tweens.add({
      targets: this.correctCountPopup,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: "Back.easeOut",
    });

    let isDismissed = false;
    const dismissPopup = () => {
      if (isDismissed) return;
      isDismissed = true;
      SoundManager.playPop();
      if (!this.correctCountPopup) {
        this.nextQuestion();
        return;
      }
      this.tweens.add({
        targets: this.correctCountPopup,
        scale: 0.75,
        alpha: 0,
        duration: 200,
        ease: "Quad.easeIn",
        onComplete: () => {
          if (this.correctCountPopup) {
            this.correctCountPopup.destroy();
            this.correctCountPopup = null;
          }
          this.nextQuestion();
        },
      });
    };

    // Tap anywhere to advance immediately
    backdrop.on("pointerdown", dismissPopup);

    // Auto-advance after 2200ms
    this.time.delayedCall(2200, dismissPopup);
  }

  createPauseModal(width, height) {
    this.pauseModalContainer = this.add
      .container(width / 2, height / 2)
      .setDepth(200)
      .setVisible(false);

    // Dark backdrop overlay that intercepts clicks behind modal
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(-width, -height, width * 2, height * 2);
    backdrop.setInteractive(
      new Phaser.Geom.Rectangle(-width, -height, width * 2, height * 2),
      Phaser.Geom.Rectangle.Contains,
    );

    // Real Game Paused Board (GamePaused.avif)
    const popupBoard = this.add
      .image(0, 0, "popup_game_paused")
      .setScale(0.94)
      .setInteractive();

    popupBoard.on("pointerdown", (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
    });

    // Score text displayed directly within the yellow pill box on GamePaused.avif (x: -155, y: 32)
    this.pauseScoreText = this.add
      .text(-140, 83, `${this.score}`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "50px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#881337",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Time text displayed directly within the pink pill box on GamePaused.avif (x: 215, y: 32)
    this.pauseTimeText = this.add
      .text(250, 83, `${this.timeLeft}s`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "50px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#881337",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Basket Status Banner ("1 basket is filled")
    // this.pauseBasketBg = this.add.graphics();
    // this.pauseBasketBg.fillStyle(0xfff7ed, 0.95);
    // this.pauseBasketBg.fillRoundedRect(-240, 88, 480, 56, 18);
    // this.pauseBasketBg.lineStyle(3, 0xfdba74, 1);
    // this.pauseBasketBg.strokeRoundedRect(-240, 88, 480, 56, 18);

    // this.pauseBasketText = this.add
    //   .text(0, 116, "🧺 0 baskets filled", {
    //     fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
    //     fontSize: "30px",
    //     fontStyle: "900",
    //     color: "#c2410c",
    //   })
    //   .setOrigin(0.5);

    // 1. Real Resume Button (resume.avif) placed nicely in parchment area
    const resumeBtn = this.add
      .image(0, 250, "btn_pause_resume")
      .setScale(0.9)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: resumeBtn,
      scale: 0.94,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    resumeBtn.on("pointerover", () => {
      this.tweens.add({
        targets: resumeBtn,
        scale: 0.95,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    resumeBtn.on("pointerout", () => {
      this.tweens.add({
        targets: resumeBtn,
        scale: 0.9,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    resumeBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: resumeBtn,
        scale: 0.82,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => this.closePauseModal(),
      });
    });

    // 2. Real Home Button (Home.avif)
    const homeBtn = this.add
      .image(-170, 430, "btn_pause_home")
      .setScale(0.9)
      .setInteractive({ useHandCursor: true });

    homeBtn.on("pointerover", () => {
      this.tweens.add({
        targets: homeBtn,
        scale: 0.95,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    homeBtn.on("pointerout", () => {
      this.tweens.add({
        targets: homeBtn,
        scale: 0.9,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    homeBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: homeBtn,
        scale: 0.82,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.scene.start("MenuScene");
        },
      });
    });

    // 3. Real Replay Button (replay.avif)
    const replayBtn = this.add
      .image(170, 430, "btn_pause_replay")
      .setScale(0.9)
      .setInteractive({ useHandCursor: true });

    replayBtn.on("pointerover", () => {
      this.tweens.add({
        targets: replayBtn,
        scale: 0.95,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    replayBtn.on("pointerout", () => {
      this.tweens.add({
        targets: replayBtn,
        scale: 0.9,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    replayBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: replayBtn,
        scale: 0.82,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.scene.restart({
            score: 0,
            starCount: 0,
            birdCount: 0,
            appleCount: 0,
            timeLeft: 120,
            streak: 0,
            totalAnswered: 0,
            sequenceStep: 0,
          });
        },
      });
    });

    this.pauseModalContainer.add([
      backdrop,
      popupBoard,
      this.pauseScoreText,
      this.pauseTimeText,
      // this.pauseBasketBg,
      // this.pauseBasketText,
      resumeBtn,
      homeBtn,
      replayBtn,
    ]);
  }

  openPauseModal() {
    if (this.isInputLocked) return;
    this.isPaused = true;
    SoundManager.stopHowManyStars(this);
    SoundManager.playPop();
    this.pauseScoreText.setText(`${this.score}`);
    this.pauseTimeText.setText(`${this.timeLeft}s`);

    this.baskets = Math.floor(this.score / 5);
    const basketMsg =
      this.baskets === 1
        ? "🧺 1 basket is filled"
        : `🧺 ${this.baskets} baskets filled`;
    // this.pauseBasketText.setText(basketMsg);

    this.pauseModalContainer.setVisible(true);
    this.pauseModalContainer.setAlpha(0);
    this.pauseModalContainer.setScale(0.85);
    this.tweens.add({
      targets: this.pauseModalContainer,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: "Back.easeOut",
    });
  }

  closePauseModal() {
    this.tweens.add({
      targets: this.pauseModalContainer,
      scale: 0.85,
      alpha: 0,
      duration: 180,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.pauseModalContainer.setVisible(false);
        this.isPaused = false;
      },
    });
  }

  gameOver() {
    this.timerEvent.remove();
    this.isInputLocked = true;
    SoundManager.playCelebration();

    if (this.correctCountPopup) {
      this.correctCountPopup.destroy();
      this.correctCountPopup = null;
    }

    this.cameras.main.fade(400, 255, 255, 255);
    this.time.delayedCall(450, () => {
      this.scene.start("GameOverScene", {
        score: this.score,
        starCount: this.starCount,
        birdCount: this.starCount,
        appleCount: this.starCount,
        totalAnswered: this.totalAnswered,
        baskets: this.baskets,
      });
    });
  }

  createVerticalParallax(width, height) {
    // 1. Primary Desert Background Layer (Distant Sky, Sun, Far Mountains)
    const bgKey = this.textures.exists("bg_desert") ? "bg_desert" : "bg_main";
    this.desertBg = this.add.image(width / 2, height / 2, bgKey).setDepth(0);
    // Sized slightly larger than screen to permit smooth vertical parallax movement
    this.desertBg.setDisplaySize(width, height + 180);
    this.desertBgBaseY = height / 2;

    // 2. Midground Canyon & Mountain Depth Layer
    if (this.textures.exists("bg_parallax_mountains")) {
      this.mountainLayer = this.add
        .image(width / 2, height / 2, "bg_parallax_mountains")
        .setDepth(1)
        .setAlpha(0.75);
      this.mountainLayer.setDisplaySize(width, height + 240);
      this.mountainBaseY = height / 2;
    }

    // 3. Foreground Rolling Sand Dunes Layer
    if (this.textures.exists("bg_parallax_dunes")) {
      this.duneLayer = this.add
        .image(width / 2, height / 2, "bg_parallax_dunes")
        .setDepth(2)
        .setAlpha(0.85);
      this.duneLayer.setDisplaySize(width, height + 300);
      this.duneBaseY = height / 2;
    }

    // 4. Ambient Rising Desert Dust & Heat Haze Particles (Depth 3)
    if (this.textures.exists("particle_heat_dust")) {
      this.heatDustParticles = this.add.particles(0, 0, "particle_heat_dust", {
        x: { min: 0, max: width },
        y: { min: height, max: height + 60 },
        speedY: { min: -40, max: -90 },
        speedX: { min: -15, max: 15 },
        scale: { start: 1.0, end: 0.1 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 5000,
        frequency: 240,
      });
      this.heatDustParticles.setDepth(3);
    }
  }

  update(time, delta) {
    if (!this.desertBg) return;
    const { height } = this.scale;

    // 1. Smooth Multi-Harmonic Vertical Floating Wave (Simulates air currents)
    const bgWave = Math.sin(time * 0.0006) * 12;
    const mountainWave = Math.sin(time * 0.001 + 0.9) * 24;
    const duneWave = Math.sin(time * 0.0014 + 1.8) * 42;

    // 2. Interactive Pointer / Touch Vertical Parallax
    let pointerNormY = 0;
    const pointer = this.input.activePointer;
    if (pointer && (pointer.isDown || pointer.x > 0 || pointer.y > 0)) {
      pointerNormY = Phaser.Math.Clamp(
        (pointer.y - height / 2) / (height / 2),
        -1,
        1,
      );
    }

    // 3. Smooth Damped Interpolation across depths
    const targetBgY = this.desertBgBaseY + bgWave + pointerNormY * 18;
    this.desertBg.y = Phaser.Math.Linear(this.desertBg.y, targetBgY, 0.05);

    if (this.mountainLayer) {
      const targetMountainY =
        this.mountainBaseY + mountainWave + pointerNormY * 38;
      this.mountainLayer.y = Phaser.Math.Linear(
        this.mountainLayer.y,
        targetMountainY,
        0.05,
      );
    }

    if (this.duneLayer) {
      const targetDuneY = this.duneBaseY + duneWave + pointerNormY * 68;
      this.duneLayer.y = Phaser.Math.Linear(
        this.duneLayer.y,
        targetDuneY,
        0.05,
      );
    }
  }

  shutdown() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    if (this.correctCountPopup) {
      this.correctCountPopup.destroy();
      this.correctCountPopup = null;
    }
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
