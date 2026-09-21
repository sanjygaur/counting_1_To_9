import Phaser from "phaser";
import SoundManager from "../utils/SoundManager.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data) {
    const { width, height } = this.scale;
    const score = data.score || 0;
    const count =
      data.starCount !== undefined
        ? data.starCount
        : data.birdCount !== undefined
          ? data.birdCount
          : data.appleCount !== undefined
            ? data.appleCount
            : score;
    const totalAnswered = data.totalAnswered || 0;
    const baskets = data.baskets || Math.floor(score / 5);
    const accuracy =
      totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    const timePlayed = data.timePlayed || 120;

    SoundManager.playCelebration();

    // 1. Real Background Asset
    if (this.textures.exists("bg_gameover")) {
      this.add
        .image(width / 2, height / 2, "bg_gameover")
        .setDisplaySize(width, height);
    }

    // Soft dim backdrop overlay for high contrast
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0f172a, 0.35);
    overlay.fillRect(0, 0, width, height);

    // 3. Main Modal Container (Real GameOver assets)
    const cardContainer = this.add.container(width / 2, 690);

    // Main Time's Up Card Board (timesup.avif)
    const cardImg = this.add.image(0, 0, "card_gameover").setOrigin(0.5);
    cardImg.setInteractive();
    cardImg.on("pointerdown", (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
    });
    cardContainer.add(cardImg);

    // 4. Dynamic Stats inside the two wooden plaques of timesup.avif
    // Plaque 1: "Your Score" (Left wooden plaque under trophy)
    const scoreValText = this.add
      .text(-152, 415, `${score}`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "92px",
        fontStyle: "900",
        color: "#f0dd08",
        stroke: "#5d2b00",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    cardContainer.add(scoreValText);

    // Plaque 2: "Time Taken" (Right wooden plaque under clock)
    const timeTakenText = this.add
      .text(320, 415, `${timePlayed}s`, {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "92px",
        fontStyle: "900",
        color: "#f0dd08",
        stroke: "#5d2b00",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    cardContainer.add(timeTakenText);

    // 6. Action Buttons (positioned floating under the bottom rim of the card)
    // A. "HOME" Button (home.avif)
    const homeBtn = this.add
      .image(-200, 580, "btn_gameover_home")
      .setScale(0.88)
      .setInteractive({ useHandCursor: true });

    homeBtn.on("pointerover", () => {
      this.tweens.add({
        targets: homeBtn,
        scale: 0.9,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    homeBtn.on("pointerout", () => {
      this.tweens.add({
        targets: homeBtn,
        scale: 0.85,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    homeBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: homeBtn,
        scale: 0.78,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.scene.start("MenuScene");
        },
      });
    });
    cardContainer.add(homeBtn);

    // B. "REPLAY" Button (replay.avif)
    const replayBtn = this.add
      .image(200, 580, "btn_gameover_replay")
      .setScale(0.88)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: replayBtn,
      scale: 0.91,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    replayBtn.on("pointerover", () => {
      this.tweens.add({
        targets: replayBtn,
        scale: 0.94,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    replayBtn.on("pointerout", () => {
      this.tweens.add({
        targets: replayBtn,
        scale: 0.88,
        duration: 100,
        ease: "Quad.easeOut",
      });
    });
    replayBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: replayBtn,
        scale: 0.8,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.scene.start("GameScene", {
            level: data.level || 1,
            gameMode: data.gameMode || (data.level === 2 ? "birds" : "stars"),
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
    cardContainer.add(replayBtn);

    // 7. Responsive scaling and smooth entrance animation
    const targetScale = Math.min(
      0.94,
      (width * 0.94) / 1080,
      (height * 0.82) / 1250,
    );
    cardContainer.setScale(targetScale * 0.85).setAlpha(0);
    this.tweens.add({
      targets: cardContainer,
      scale: targetScale,
      alpha: 1,
      duration: 450,
      ease: "Back.easeOut",
    });
  }
}
