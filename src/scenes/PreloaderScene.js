import Phaser from "phaser";
import TextureGenerator from "../utils/TextureGenerator.js";

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super("PreloaderScene");
  }

  preload() {
    const { width, height } = this.scale;

    // 1. Scenic Orchard Background (if preloaded by BootScene)
    if (this.textures.exists("bg_main")) {
      this.add
        .image(width / 2, height / 2, "bg_main")
        .setDisplaySize(width, height);
    }

    // 2. Game Logo centered in the upper portion (under the overlay screen)
    if (this.textures.exists("logo")) {
      const logo = this.add
        .image(width / 2, height / 2 - 650, "logo")
        .setScale(0.9);
      // this.tweens.add({
      //   targets: logo,
      //   y: height / 2 - 215,
      //   duration: 1300,
      //   yoyo: true,
      //   repeat: -1,
      //   ease: "Sine.easeInOut",
      // });
    }

    // 3. Full 1080x1920 Black Screen Overlay (covers background and logo)
    const screenOverlay = this.add.graphics();
    screenOverlay.fillStyle(0x000000, 0.55);
    screenOverlay.fillRect(0, 0, width, height);

    // 4. Process Bar at bottom side
    const barY = height - 250;
    const barScale = 0.88;
    const grooveW = 772 * barScale;
    const grooveH = 66 * barScale;
    const radius = grooveH / 2;
    const grooveX = width / 2 - grooveW / 2;
    const grooveY = barY - grooveH / 2;

    // Background loader frame (loaderBg.avif)
    if (this.textures.exists("preloader_bg")) {
      this.add.image(width / 2, barY, "preloader_bg").setScale(barScale);
    } else {
      const fallbackBox = this.add.graphics();
      fallbackBox.fillStyle(0x222222, 0.25);
      fallbackBox.fillRoundedRect(
        grooveX - 6,
        grooveY - 6,
        grooveW + 12,
        grooveH + 12,
        radius + 6,
      );
    }

    // Geometry mask matching the inner cream groove of loaderBg
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(grooveX, grooveY, grooveW, grooveH, radius);
    const barMask = maskShape.createGeometryMask();

    const progressBar = this.add.graphics();
    progressBar.setMask(barMask);

    const title = this.add
      .text(width / 2, barY - 80, "Loading Stars Counting...", {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "42px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, barY + 80, "0%", {
        fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
        fontSize: "36px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#78350f",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.load.on("progress", (value) => {
      progressBar.clear();
      if (value > 0) {
        const fillW = Math.max(1, grooveW * value);

        // Radiant gradient: warm amber orange to sunburst gold
        progressBar.fillGradientStyle(
          0xf97316,
          0xfde047,
          0xea580c,
          0xf59e0b,
          1,
        );
        progressBar.fillRect(grooveX, grooveY, fillW, grooveH);

        // 3D Top Gloss Sheen
        progressBar.fillStyle(0xffffff, 0.35);
        progressBar.fillRect(grooveX, grooveY + 2, fillW, grooveH * 0.42);

        // Subtle bottom inset shadow for 3D depth
        progressBar.fillStyle(0x000000, 0.14);
        progressBar.fillRect(grooveX, grooveY + grooveH - 6, fillW, 6);
      }
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    // 1. Shared Background, Logo & Loader Assets
    this.load.image("bg_main", "/assets/preloadScene/Background.avif");
    this.load.image("logo", "/assets/preloadScene/logo.avif");
    this.load.image("preloader_bg", "/assets/preloadScene/loaderBg.avif");

    // 2. Menu Scene Assets
    this.load.image("btn_start", "/assets/menuScene/start.avif");
    this.load.image("btn_howtoplay", "/assets/menuScene/howtoplay.avif");
    this.load.image(
      "popup_howtoplay",
      "/assets/menuScene/Howtoplay_popup.avif",
    );
    this.load.image("btn_gotit", "/assets/menuScene/gotitbutton.avif");
    this.load.image("mascot_owl", "/assets/menuScene/owl.avif");
    this.load.image("icon_mute", "/assets/menuScene/Mute.avif");
    this.load.image("icon_unmute", "/assets/menuScene/unmute.avif");
    this.load.image("apple_real", "/assets/menuScene/apple.avif");
    this.load.image("apple_count", "/assets/gameScene/Background.avif");

    // 3. Game Scene Assets
    this.load.image("star", "/assets/gameScene/star.avif");
    this.load.image("star_item", "/assets/gameScene/star.avif");
    this.load.image("bird1", "/assets/gameScene/birds1.avif");
    this.load.image("bird2", "/assets/gameScene/birds2.avif");
    this.load.image(
      "banner_howmany_birds",
      "/assets/gameScene/Background.avif",
    );
    // this.load.image("header_bg", "/assets/gameScene/headerBg.avif");
    // this.load.image("tree_real", "/assets/gameScene/trees.avif");
    // this.load.image("basket_real", "/assets/gameScene/Basket.avif");
    this.load.image("box1", "/assets/gameScene/box.avif");
    this.load.image("box2", "/assets/gameScene/box2.avif");
    this.load.image("box3", "/assets/gameScene/box3.avif");
    this.load.image("box4", "/assets/gameScene/box4.avif");
    // this.load.image("panel_score", "/assets/gameScene/score.avif");
    this.load.image("panel_timer", "/assets/gameScene/timer.avif");
    this.load.image("panel_score", "/assets/gameScene/score.avif");
    this.load.image("btn_game_pause", "/assets/gameScene/resume.avif");
    this.load.image("btn_game_resume", "/assets/gameScene/Pause.avif");
    this.load.image("btn_game_mute", "/assets/gameScene/mute.avif");
    this.load.image("btn_game_unmute", "/assets/gameScene/unmute.avif");

    // 3b. Pause Scene / Modal Assets
    this.load.image("popup_game_paused", "/assets/pauseScene/GamePaused.avif");
    this.load.image("btn_pause_resume", "/assets/pauseScene/resume.avif");
    this.load.image("btn_pause_home", "/assets/pauseScene/Home.avif");
    this.load.image("btn_pause_replay", "/assets/pauseScene/replay.avif");

    // 4. WellDone Scene Assets
    this.load.image("card_welldone", "/assets/welldoneScene/Welldone.avif");
    this.load.image("star_welldone", "/assets/welldoneScene/Stars.avif");
    this.load.image(
      "btn_welldone_keepcounting",
      "/assets/welldoneScene/keepcounting.avif",
    );
    this.load.image("btn_welldone_home", "/assets/welldoneScene/Home.avif");
    this.load.image("btn_welldone_replay", "/assets/welldoneScene/replay.avif");
    this.load.image("btn_home", "/assets/welldoneScene/Home.avif");
    this.load.image("btn_replay", "/assets/welldoneScene/replay.avif");

    // 5. GameOver Scene Assets
    this.load.image("bg_gameover", "/assets/gameOverScene/Background.avif");
    this.load.image("card_gameover", "/assets/gameOverScene/timesup.avif");
    this.load.image("timesup", "/assets/gameOverScene/timesup.avif");
    this.load.image("btn_gameover_replay", "/assets/gameOverScene/replay.avif");
    this.load.image("btn_gameover_home", "/assets/gameOverScene/home.avif");

    // 6. Voice Audio Prompts
    this.load.audio("voice_how_many_stars", "/audio/howManyStarsAreThere.wav");
  }

  create() {
    // Generate auxiliary procedural textures (apples, star particles, badges, fallback buttons)
    TextureGenerator.createAllTextures(this);

    this.cameras.main.fade(300, 255, 255, 255);
    this.time.delayedCall(300, () => {
      this.scene.start("MenuScene");
    });
  }
}
