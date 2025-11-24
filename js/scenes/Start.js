/**
 * 시작 씬 - 게임 메인 화면
 */

import { addHoverEffectFrame } from '../utils';

const LAYOUT = {
  TITLE: { x: 640, y: 220, scale: 0.6 },
  CHAR: { x: 600, y: 450, scale: 0.6 },
  START_BTN: { x: 640, y: 630, scale: 0.6667 },
  HOW_BTN: { x: 1180, y: 100, scale: 0.6667 },
  BGM_BTN: { x: 1140, y: 610 }
};

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  /**
   * 씬 생성 및 초기화: 배경, UI, 버튼 세팅
   */
  create() {
    this.initScene();
    this.createBackground();
    this.createUI();
    this.createButtons();
  }

  /**
   * 씬 상태 초기화 및 BGM 씬 관리
   */
  initScene() {
    this.registry.set('myMedals', { 1: 0, 2: 0, 3: 0, 4: 0 });
    ['PlayScene', 'QuizScene', 'GameOverScene', 'MedalScene'].forEach(scene => this.scene.stop(scene));
  }

  /**
   * 배경 이미지 생성 및 화면 크기에 맞게 스케일 조정
   */
  createBackground() {
    const { width, height } = this.sys.game.config;
    const background = this.add.image(0, 0, 'bg').setOrigin(0);
    const scale = Math.max(width / background.width, height / background.height);
    background.setScale(scale).setScrollFactor(0);
  }

  /**
   * UI 요소(타이틀, 캐릭터) 생성
   */
  createUI() {
    this.add.image(LAYOUT.TITLE.x, LAYOUT.TITLE.y, 'start_title').setScale(LAYOUT.TITLE.scale);
    this.add.image(LAYOUT.CHAR.x, LAYOUT.CHAR.y, 'start_char').setScale(LAYOUT.CHAR.scale);
  }

  /**
   * 버튼(시작, 도움말, BGM) 생성
   */
  createButtons() {
    this.createStartButton();
    this.createHowToPlayButton();
  }

  /**
   * 시작 버튼 생성 및 이벤트 등록
   */
  createStartButton() {
    const startButton = this.add.sprite(LAYOUT.START_BTN.x, LAYOUT.START_BTN.y, 'start_btn', 0)
      .setInteractive({ useHandCursor: true })
      .setScale(LAYOUT.START_BTN.scale);

    startButton.on('pointerdown', () => {
      this.sound.play('click');
      this.cameras.main.fadeOut(200, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PlayScene', { showMedalOnStart: true });
      });
    });
    addHoverEffectFrame(startButton);
  }

  /**
   * 도움말 버튼 생성 및 이벤트 등록
   */
  createHowToPlayButton() {
    const howToPlayButton = this.add.sprite(LAYOUT.HOW_BTN.x, LAYOUT.HOW_BTN.y, 'how_btn', 0).setInteractive({ useHandCursor: true }).setScale(LAYOUT.HOW_BTN.scale);

    howToPlayButton.on('pointerdown', () => this.scene.launch('HelpScene'));
    addHoverEffectFrame(howToPlayButton);
  }
}