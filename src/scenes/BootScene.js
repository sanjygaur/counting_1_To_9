import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("bg_main", "/assets/preloadScene/Background.avif");
    this.load.image("logo", "/assets/preloadScene/logo.avif");
    this.load.image("preloader_bg", "/assets/preloadScene/loaderBg.avif");
  }

  create() {
    this.cameras.main.setBackgroundColor("#86d5e3");
    this.scene.start("PreloaderScene");
  }
}
