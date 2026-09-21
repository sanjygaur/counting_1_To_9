import Phaser from "phaser";
import SoundManager from "../utils/SoundManager.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    // 1. Shared Real Background
    const background = this.add.image(width / 2, height / 2, "bg_main");
    background.setDisplaySize(width, height);

    // Start background soundscape on first interaction (browser autoplay policy)
    this.input.once("pointerdown", () => {
      SoundManager.init();
      SoundManager.startBGM();
    });

    // 2. Sound Toggle Button (Using real icons Mute.avif & unmute.avif)
    const soundBtn = this.add
      .image(width - 85, 85, SoundManager.isMuted ? "icon_mute" : "icon_unmute")
      .setScale(1)
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

    // 3. Real Game Logo (logo.avif) with floating animation
    const logoImg = this.add.image(width / 2, 290, "logo").setScale(0.95);
    this.tweens.add({
      targets: logoImg,
      y: 315,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 4. Real Owl Mascot (owl.avif) with breathing/bobbing animation
    const owl = this.add.image(width / 2, 1100, "mascot_owl").setScale(1.0);
    // this.tweens.add({
    //   targets: owl,
    //   y: 1120,
    //   duration: 1600,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: "Sine.easeInOut",
    // });

    // Make Owl interactive (hops and chirps when clicked)
    owl.setInteractive({ useHandCursor: true });
    owl.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: owl,
        scaleY: 1.1,
        y: owl.y - 30,
        duration: 180,
        yoyo: true,
        ease: "Back.easeOut",
      });
    });

    // 5. Real Start Button (start.avif) with pulsing animation
    const startBtn = this.add
      .image(width / 2, 1550, "btn_start")
      .setScale(1.0)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: startBtn,
      scale: 1.06,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    startBtn.on("pointerdown", () => {
      SoundManager.init();
      SoundManager.startBGM();
      SoundManager.playPop();
      this.tweens.add({
        targets: startBtn,
        scale: 0.9,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.cameras.main.fade(280, 255, 255, 255);
          this.time.delayedCall(280, () => {
            this.scene.start("GameScene", {
              level: 2,
              gameMode: "birds",
              score: 0,
              starCount: 0,
              birdCount: 0,
              appleCount: 0,
              timeLeft: 120,
              streak: 0,
              totalAnswered: 0,
              sequenceStep: 0,
            });
          });
        },
      });
    });

    // 6. Real How To Play Button (howtoplay.avif) with Hover & Click Effects
    const howToPlayBtn = this.add
      .image(width / 2, 1770, "btn_howtoplay")
      .setScale(0.95)
      .setInteractive({ useHandCursor: true });

    howToPlayBtn.on("pointerover", () => {
      howToPlayBtn.setTint(0xfff8e7);
      this.tweens.add({
        targets: howToPlayBtn,
        scale: 1.04,
        y: 1764,
        duration: 140,
        ease: "Back.easeOut",
      });
    });

    howToPlayBtn.on("pointerout", () => {
      howToPlayBtn.clearTint();
      this.tweens.add({
        targets: howToPlayBtn,
        scale: 0.95,
        y: 1770,
        duration: 140,
        ease: "Quad.easeOut",
      });
    });

    howToPlayBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: howToPlayBtn,
        scaleX: 0.88,
        scaleY: 0.86,
        y: 1774,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.showHowToPlayModal(width, height);
        },
      });
    });

    // Create How To Play Modal Container (Hidden by default)
    this.createHowToPlayModal(width, height);
  }

  createHowToPlayModal(width, height) {
    this.modalContainer = this.add
      .container(width / 2, height / 2)
      .setDepth(200)
      .setVisible(false);

    // Dark backdrop that blocks clicks behind the modal and closes on outside click
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(-width, -height, width * 2, height * 2);
    backdrop.setInteractive(
      new Phaser.Geom.Rectangle(-width, -height, width * 2, height * 2),
      Phaser.Geom.Rectangle.Contains,
    );
    backdrop.on("pointerdown", () => {
      SoundManager.playPop();
      this.hideHowToPlayModal();
    });

    // Real How To Play Popup Image (Howtoplay_popup.avif)
    // Scaled to fit comfortably within the 1080x1920 canvas
    const popupImg = this.add
      .image(0, -40, "popup_howtoplay")
      .setScale(0.94)
      .setInteractive();

    // Prevent clicks on popup image from propagating to backdrop
    popupImg.on("pointerdown", (pointer, localX, localY, event) => {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
    });

    // Real Got It Button (gotitbutton.avif)
    const gotItBtn = this.add
      .image(0, 560, "btn_gotit")
      .setScale(0.95)
      .setInteractive({ useHandCursor: true });

    gotItBtn.on("pointerover", () => {
      this.tweens.add({
        targets: gotItBtn,
        scale: 1.02,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    gotItBtn.on("pointerout", () => {
      this.tweens.add({
        targets: gotItBtn,
        scale: 0.95,
        duration: 120,
        ease: "Quad.easeOut",
      });
    });

    gotItBtn.on("pointerdown", () => {
      SoundManager.playPop();
      this.tweens.add({
        targets: gotItBtn,
        scale: 0.88,
        duration: 80,
        yoyo: true,
        ease: "Quad.easeInOut",
        onComplete: () => {
          this.hideHowToPlayModal();
        },
      });
    });

    this.modalContainer.add([backdrop, popupImg, gotItBtn]);
  }

  showHowToPlayModal() {
    this.modalContainer.setVisible(true);
    this.modalContainer.setAlpha(0);
    this.modalContainer.setScale(0.85);
    this.tweens.add({
      targets: this.modalContainer,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: "Back.easeOut",
    });
  }

  hideHowToPlayModal() {
    this.tweens.add({
      targets: this.modalContainer,
      scale: 0.85,
      alpha: 0,
      duration: 180,
      ease: "Back.easeIn",
      onComplete: () => {
        this.modalContainer.setVisible(false);
      },
    });
  }
}
