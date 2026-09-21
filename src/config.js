import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import WellDoneScene from './scenes/WellDoneScene.js';
import GameOverScene from './scenes/GameOverScene.js';

export const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#74c7f8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920
  },
  scene: [
    BootScene,
    PreloaderScene,
    MenuScene,
    GameScene,
    WellDoneScene,
    GameOverScene
  ]
};
