import Boot from './scenes/Boot.js';
import Preloader from './scenes/Preloader.js';
import StartScene from './scenes/Start.js';
import HelpScene from './scenes/Help.js';
import PlayScene from './scenes/Play.js';
import GameOverScene from './scenes/GameOver.js';
import QuizScene from './scenes/Quiz.js';
import MedalScene from './scenes/Medal.js';

const config = {
  type: Phaser.WEBGL,
  width: 1280,
  height: 720,
  parent: 'gameContainer',
  backgroundColor: '0xc9effa',
  scene: [ Boot, Preloader, StartScene, HelpScene, PlayScene, GameOverScene, QuizScene, MedalScene ],
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
