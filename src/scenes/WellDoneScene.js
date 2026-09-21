import Phaser from "phaser";
import SoundManager from "../utils/SoundManager.js";

export default class WellDoneScene extends Phaser.Scene {
  constructor() {
    super("WellDoneScene");
  }

  create(data) {
    data = data || {};
    const { width, height } = this.scale;
    const baskets = data.baskets || 1;
    const streak = data.streak || 5;
    const score = data.score || 0;
    const timePlayed =
      data.timePlayed !== undefined
        ? data.timePlayed
        : data.timeLeft !== undefined
          ? 120 - data.timeLeft
          : 0;

    SoundManager.playCelebration();

    // 1. Darkened overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains,
    );

    // 2. Confetti Star Particles
    this.add.particles(width / 2, height / 2 - 200, "particle_star", {
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.3, end: 0.3 },
      lifespan: 1500,
      gravityY: 150,
      quantity: 4,
    });

    // 3. Modal Container (Centered card)
    const cardContainer = this.add.container(width / 2, height / 2);

    // Main WellDone Card Board (Welldone.avif: 892 x 1276)
    const cardImg = this.add.image(0, 0, "card_welldone").setOrigin(0.5);
    cardContainer.add(cardImg);

    // 4. Milestone 3 Celebration Stars (Popping directly into the 3 star sockets at top of card)
    const starTexture = this.textures.exists("star_welldone")
      ? "star_welldone"
      : "star";

    const starOffsets = [
      { x: -203, y: -458, scale: 1.02, delay: 220, note: 3 },
      { x: 0, y: -505, scale: 1.15, delay: 420, note: 5 },
      { x: 182, y: -455, scale: 1.02, delay: 620, note: 8 },
    ];

    starOffsets.forEach((pos) => {
      const star = this.add.image(pos.x, pos.y, starTexture);
      star.setScale(0);
      cardContainer.add(star);

      this.tweens.add({
        targets: star,
        scale: pos.scale,
        duration: 380,
        delay: pos.delay,
        ease: "Back.easeOut",
        onStart: () => {
          SoundManager.playStarTwinkle();
          SoundManager.playCount(pos.note);
        },
        onComplete: () => {
          this.tweens.add({
            targets: star,
            scale: pos.scale * 1.05,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        },
      });
    });

    // 5. Streak Message in the dedicated space provided on Welldone.avif
    const streakText = this.add
      .text(0, 290, `${streak} IN A ROW!`, {
        fontFamily:
          '"Fredoka", "Arial Black", Impact, "Comic Sans MS", sans-serif',
        fontSize: "44px",
        fontStyle: "900",
        color: "#c2410c",
        stroke: "#ffffff",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: "rgba(0, 0, 0, 0.22)",
          blur: 4,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setScale(0);

    cardContainer.add(streakText);

    this.tweens.add({
      targets: streakText,
      scale: 1,
      duration: 380,
      delay: 350,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: streakText,
          scale: 1.05,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // 6. Dynamic Stats inside the two wooden plaques of Welldone.avif
    // Plaque 1: Score (Left wooden plaque under trophy)
    const scoreValText = this.add
      .text(-130, 505, `${score}`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "60px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#5d2b00",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    cardContainer.add(scoreValText);

    // Plaque 2: Time Taken (Right wooden plaque under clock)
    const timeTakenText = this.add
      .text(275, 505, `${timePlayed}s`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "60px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#5d2b00",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    cardContainer.add(timeTakenText);

    // 7. Responsive scaling and smooth card entrance
    const targetScale = Math.min(
      1.0,
      (width * 0.94) / 892,
      (height * 0.88) / 1276,
    );

    cardContainer.setScale(targetScale * 0.82).setAlpha(0);
    this.tweens.add({
      targets: cardContainer,
      scale: targetScale,
      alpha: 1,
      duration: 380,
      ease: "Back.easeOut",
    });

    // 7. Auto-Dismiss and Resume Game automatically (No buttons needed!)
    let isDismissed = false;
    const dismiss = () => {
      if (isDismissed) return;
      isDismissed = true;

      SoundManager.playPop();

      this.tweens.add({
        targets: cardContainer,
        scale: targetScale * 0.72,
        alpha: 0,
        duration: 240,
        ease: "Back.easeIn",
        onComplete: () => {
          this.scene.stop("WellDoneScene");
          this.scene.resume("GameScene");
          const gameScene = this.scene.get("GameScene");
          if (gameScene && gameScene.nextQuestion) {
            gameScene.nextQuestion();
          }
        },
      });

      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 220,
      });
    };

    // Auto-advance after showing celebration (2.4 seconds)
    this.time.delayedCall(2400, dismiss);

    // Optional: Tap anywhere to skip immediately if player wants to keep going fast
    overlay.on("pointerdown", dismiss);
    cardImg.setInteractive();
    cardImg.on("pointerdown", dismiss);
  }
}
