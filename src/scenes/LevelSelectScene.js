import Phaser from "phaser";
import SoundManager from "../utils/SoundManager.js";

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create() {
    const { width, height } = this.scale;

    // 1. Shared Meadow Sky Background
    const background = this.add.image(width / 2, height / 2, "bg_main");
    background.setDisplaySize(width, height);

    // 2. Sound Toggle Button
    const soundBtn = this.add
      .image(width - 85, 85, SoundManager.isMuted ? "icon_mute" : "icon_unmute")
      .setScale(1)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    soundBtn.on("pointerdown", () => {
      SoundManager.init();
      SoundManager.startBGM();
      const isMuted = SoundManager.toggleMute();
      soundBtn.setTexture(isMuted ? "icon_mute" : "icon_unmute");
      if (!isMuted) {
        SoundManager.playPop();
      }
      this.tweens.add({
        targets: soundBtn,
        scale: 1.05,
        duration: 100,
        yoyo: true,
        ease: "Quad.easeInOut",
      });
    });

    // 3. Back to Menu Button
    const backBtnContainer = this.add
      .container(130, 85)
      .setSize(180, 70)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    const backBtnBg = this.add.graphics();
    backBtnBg.fillStyle(0xd97706, 1);
    backBtnBg.fillRoundedRect(-85, -34, 170, 68, 20);
    backBtnBg.lineStyle(4, 0xfef3c7, 1);
    backBtnBg.strokeRoundedRect(-85, -34, 170, 68, 20);

    const backBtnText = this.add
      .text(0, 0, "◀ MENU", {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "28px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#78350f",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    backBtnContainer.add([backBtnBg, backBtnText]);

    backBtnContainer.on("pointerover", () => {
      this.tweens.add({
        targets: backBtnContainer,
        scale: 1.06,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    backBtnContainer.on("pointerout", () => {
      this.tweens.add({
        targets: backBtnContainer,
        scale: 1.0,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    backBtnContainer.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: backBtnContainer,
        scale: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.cameras.main.fade(250, 255, 255, 255);
          this.time.delayedCall(250, () => {
            this.scene.start("MenuScene");
          });
        },
      });
    });

    // 4. Header Banner: "SELECT LEVEL"
    const headerContainer = this.add.container(width / 2, 280);

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x000000, 0.25);
    bannerBg.fillRoundedRect(-320, -56, 640, 112, 32);

    bannerBg.fillStyle(0x78350f, 1);
    bannerBg.fillRoundedRect(-315, -60, 630, 108, 30);

    bannerBg.fillStyle(0xd97706, 1);
    bannerBg.fillRoundedRect(-295, -48, 590, 84, 22);

    bannerBg.lineStyle(6, 0xfef3c7, 1);
    bannerBg.strokeRoundedRect(-295, -48, 590, 84, 22);

    const headerText = this.add
      .text(0, -6, "SELECT LEVEL", {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "50px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#5d2b00",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: "rgba(0, 0, 0, 0.4)",
          blur: 4,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    headerContainer.add([bannerBg, headerText]);

    // Floating header animation
    this.tweens.add({
      targets: headerContainer,
      y: 295,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Sparkle Particle Emitter
    this.particles = this.add.particles(0, 0, "particle_star", {
      speed: { min: 80, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      gravityY: 100,
      emitting: false,
    });

    // 5. Mascot Owl bobbing on tree branch
    const owl = this.add.image(width / 2, 590, "mascot_owl").setScale(0.85);
    this.tweens.add({
      targets: owl,
      y: 605,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    owl.setInteractive({ useHandCursor: true });
    owl.on("pointerdown", () => {
      SoundManager.playPop();
      SoundManager.playBirdChirp();
      this.particles.emitParticleAt(owl.x, owl.y - 40, 8);
      this.tweens.add({
        targets: owl,
        scaleY: 0.95,
        y: owl.y - 25,
        duration: 160,
        yoyo: true,
        ease: "Back.easeOut",
      });
    });

    // 6. LEVEL 1 CARD: ⭐ STAR COUNTING ⭐
    this.createLevelCard({
      x: width / 2,
      y: 930,
      levelNum: 1,
      title: "Star Counting",
      emoji: "⭐",
      description: "Count the shiny glowing stars in the sky!",
      iconKey: "star",
      isBird: false,
      bgColor1: 0xfffbeb,
      bgColor2: 0xfef3c7,
      accentColor: 0xf59e0b,
      textColor: "#92400e",
      onClick: () => {
        SoundManager.playStarTwinkle();
        this.particles.emitParticleAt(width / 2, 930, 20);
        this.startLevel(1, "stars");
      },
      onHover: () => {
        SoundManager.playStarTwinkle();
      },
    });

    // 7. LEVEL 2 CARD: 🐦 BIRD COUNTING 🐦
    this.createLevelCard({
      x: width / 2,
      y: 1360,
      levelNum: 2,
      title: "Bird Counting",
      emoji: "🐦",
      description: "Count the cute singing birds in the meadow!",
      iconKey: "bird1",
      isBird: true,
      bgColor1: 0xf0fdf4,
      bgColor2: 0xdcfce7,
      accentColor: 0x16a34a,
      textColor: "#166534",
      onClick: () => {
        SoundManager.playBirdChirp();
        this.particles.emitParticleAt(width / 2, 1360, 20);
        this.startLevel(2, "birds");
      },
      onHover: () => {
        SoundManager.playBirdChirp();
      },
    });
  }

  createLevelCard({
    x,
    y,
    levelNum,
    title,
    emoji,
    description,
    iconKey,
    isBird,
    bgColor1,
    bgColor2,
    accentColor,
    textColor,
    onClick,
    onHover,
  }) {
    const cardContainer = this.add.container(x, y);
    const cardW = 860;
    const cardH = 340;

    // Card Graphics Background with Drop Shadow & Dual Border
    const bg = this.add.graphics();
    // Shadow
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2 + 10, cardW, cardH, 36);

    // Outer Wooden Frame
    bg.fillStyle(0x78350f, 1);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 36);

    // Inner Creamy Card Surface
    bg.fillStyle(bgColor1, 1);
    bg.fillRoundedRect(-cardW / 2 + 10, -cardH / 2 + 10, cardW - 20, cardH - 20, 28);

    // Golden / Emerald Accent Border
    bg.lineStyle(6, accentColor, 1);
    bg.strokeRoundedRect(-cardW / 2 + 10, -cardH / 2 + 10, cardW - 20, cardH - 20, 28);

    // Left Circular Icon Badge
    const iconBadge = this.add.container(-275, 0);
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0xffffff, 0.95);
    iconBg.fillCircle(0, 0, 95);
    iconBg.lineStyle(5, accentColor, 1);
    iconBg.strokeCircle(0, 0, 95);

    const sprite = this.add.image(0, 0, iconKey).setScale(isBird ? 1.15 : 1.05);

    if (isBird) {
      // Bobbing & wing flapping animation
      this.tweens.add({
        targets: sprite,
        y: { from: -10, to: 10 },
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      let flapState = false;
      this.time.addEvent({
        delay: 450,
        callback: () => {
          if (sprite && sprite.active) {
            flapState = !flapState;
            sprite.setTexture(flapState ? "bird2" : "bird1");
          }
        },
        loop: true,
      });
    } else {
      // Twinkle & pulse animation
      this.tweens.add({
        targets: sprite,
        scale: { from: 1.0, to: 1.16 },
        angle: { from: -8, to: 8 },
        duration: 950,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    iconBadge.add([iconBg, sprite]);

    // Level Tag
    const tagBg = this.add.graphics();
    tagBg.fillStyle(accentColor, 1);
    tagBg.fillRoundedRect(-155, -125, 185, 48, 14);

    const tagText = this.add
      .text(-62, -101, `LEVEL ${levelNum}`, {
        fontFamily: '"Fredoka", "Arial Black", sans-serif',
        fontSize: "26px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Title Text
    const titleText = this.add.text(-155, -60, `${title} ${emoji}`, {
      fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
      fontSize: "44px",
      fontStyle: "900",
      color: "#1e293b",
      stroke: "#ffffff",
      strokeThickness: 4,
    });

    // Subtitle / Description Text
    const descText = this.add.text(-155, 0, description, {
      fontFamily: '"Fredoka", "Arial", sans-serif',
      fontSize: "26px",
      fontStyle: "bold",
      color: "#475569",
      wordWrap: { width: 370 },
    });

    // Right "PLAY ▶" Button Pill
    const playPill = this.add.container(285, 0);
    const playBg = this.add.graphics();
    playBg.fillStyle(0x22c55e, 1);
    playBg.fillRoundedRect(-95, -50, 190, 100, 26);
    playBg.lineStyle(5, 0xbbf7d0, 1);
    playBg.strokeRoundedRect(-95, -50, 190, 100, 26);

    const playText = this.add
      .text(0, 0, "PLAY ▶", {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "36px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    playPill.add([playBg, playText]);

    // Pulsing Play Pill
    this.tweens.add({
      targets: playPill,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    cardContainer.add([
      bg,
      iconBadge,
      tagBg,
      tagText,
      titleText,
      descText,
      playPill,
    ]);

    cardContainer.setSize(cardW, cardH);
    cardContainer.setInteractive({ useHandCursor: true });

    // Hover & Click Interactions
    cardContainer.on("pointerover", () => {
      this.tweens.add({
        targets: cardContainer,
        scale: 1.04,
        y: y - 10,
        duration: 150,
        ease: "Back.easeOut",
      });
      if (onHover) onHover();
    });

    cardContainer.on("pointerout", () => {
      this.tweens.add({
        targets: cardContainer,
        scale: 1.0,
        y: y,
        duration: 150,
        ease: "Quad.easeOut",
      });
    });

    cardContainer.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: cardContainer,
        scale: 0.94,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          if (onClick) onClick();
        },
      });
    });

    return cardContainer;
  }

  startLevel(level, gameMode) {
    this.cameras.main.fade(300, 255, 255, 255);
    this.time.delayedCall(300, () => {
      this.scene.start("GameScene", {
        level: level,
        gameMode: gameMode,
        score: 0,
        starCount: 0,
        birdCount: 0,
        timeLeft: 120,
        streak: 0,
        totalAnswered: 0,
        sequenceStep: 0,
      });
    });
  }
}
