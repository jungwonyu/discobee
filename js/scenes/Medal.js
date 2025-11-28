import { createOverlay, addHoverEffect, addHoverEffectFrame } from '../utils.js';
import { bgmManager } from "../manager/BgmManager";
import { FONT_FAMILY } from '../config';

const numberStyle = {
  fontSize: '24px',
  color: '#804515',
  fontFamily: FONT_FAMILY,
};

const textStyle = {
  fontSize: '40px',
  color: '#11390E', 
  fontFamily: FONT_FAMILY
};

const middleStyle = {
  fontSize: '40px',
  color: '#FFD33C', 
  fontFamily: FONT_FAMILY,
  stroke: '#942D05',         
  strokeThickness: 5,
  padding: { x: 0, y: -3 }
};

const resultTextMap = {
  default: [
    { text: '숨겨진 ', style: textStyle },
    { text: '그림의 정체를 ', style: middleStyle },
    { text: '밝혀내라!', style: textStyle },
  ],
  finish: [
    { text: '숨겨진 ', style: textStyle },
    { text: '그림의 정체를 ', style: middleStyle },
    { text: '모두 밝혔다!', style: textStyle },
  ]
};

export default class MedalScene extends Phaser.Scene {
  constructor() {
    super('MedalScene');
  }

  init(data) {
    this.remainingQuizzes = data.remainingQuizzes;
  }

  create() {
    this.centerX = this.cameras.main.width / 2;
    this.centerY = this.cameras.main.height / 2;

    createOverlay(this, 0x000000, 0.7);
    this.createUI();
    this.createButton();
    this.initBgm();
  }

  initBgm() {
    bgmManager.isOn ? bgmManager.play() : bgmManager.stop();
  }

  /**
   * 버튼 생성
   */
  createButton() {
    const texture = this.remainingQuizzes?.length > 0 ? 'start_button' : 'reset_button';
    this.actionButton = this.add.image(this.centerX, 640, texture).setInteractive({ useHandCursor: true });
    this.homeButton = this.add.image(50, 50, 'home_button').setInteractive({ useHandCursor: true });

    addHoverEffectFrame(this.homeButton);
    addHoverEffectFrame(this.actionButton);

    this.homeButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });

    this.actionButton.on('pointerdown', () => {
      this.sound.play('click');
      this.changeScene();
    });

    this.createBgmButton();
  }

  /**
   * scene 변경
   */
  changeScene() {
    if (this.remainingQuizzes?.length > 0) {
      this.scene.stop('MedalScene');
      this.scene.resume('PlayScene');
    } else {
      this.scene.stop('PlayScene');
      this.scene.stop('MedalScene');
      this.scene.start('StartScene');
    }
  }

  /**
   * UI요소 생성
   */
  createUI() {
    this.add.image(this.centerX, this.centerY - 30, 'medal_bg');
    this.createResultText();
    this.createMedalBox();
  }
  
  /**
   * 메달 박스 생성
   */
  createMedalBox() {
    const medals = this.registry.get('myMedals') || { 1: 0, 2: 0, 3: 0, 4: 0 };

    const medalInfo = [ 
      { x: this.centerX - 267, y: 390,  medalId: 1 }, // 다이아
      { x: this.centerX - 85, y: 390, medalId: 2 }, // 금
      { x: this.centerX + 96, y: 390, medalId: 3 }, // 은
      { x: this.centerX + 277, y: 390, medalId: 4 }  // 동
    ]
    
     medalInfo.forEach((info) => {
      const {key, x, y, medalId} = info;
      this.add.text(info.x, y + 70, `${medals[medalId]}`, numberStyle).setOrigin(0.5);
    });
  }

  createResultText() {
    const textParts = this.remainingQuizzes?.length > 0 ? resultTextMap.default : resultTextMap.finish;
    const textContainer = this.add.container(0, 0);
    let currentX = 0;

    for (const part of textParts) {
      const text = this.add.text(0, 0, part.text, part.style);
      text.setX(currentX);
      currentX += text.width;
      textContainer.add(text);
    }

    // 컨테이너 크기 계산
    const bounds = textContainer.getBounds();
    // 중앙 정렬 위치로 이동
    textContainer.setPosition(this.centerX - bounds.width / 2, this.centerY + 130);
  }

  
  /**
   * BGM 토글 버튼 생성 및 상태 이벤트 등록
   */
  createBgmButton() {
    this.bgmButton = this.add.image(1243, 686, 'volume_button').setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.updateBgmButtonTexture(!bgmManager.isOn);
    addHoverEffectFrame(this.bgmButton);
    this.bgmButton.on('pointerdown', () => {
      bgmManager.toggle();
      this.updateBgmButtonTexture(!bgmManager.isOn);
      this.sound.play('click');
    });
  }

  updateBgmButtonTexture(isPlaying) {
    this.bgmButton.setTexture(isPlaying ? 'mute_button' : 'volume_button');
  }
}