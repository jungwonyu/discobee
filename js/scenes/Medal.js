import { createOverlay, addHoverEffect } from '../utils.js';
import { bgmManager } from "../manager/BgmManager";
import { FONT_FAMILY } from '../config';

const textStyle = {
  fontSize: '40px',
  color: '#ffffff', 
  fontStyle: 'bold',
  fontFamily: FONT_FAMILY
}

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
    this.createButton();
    this.createUI();
    this.initBgm();
  }

  initBgm() {
    bgmManager.isOn ? bgmManager.play() : bgmManager.stop();
  }

  /**
   * 버튼 생성
   */
  createButton() {
    const texture = this.remainingQuizzes?.length > 0 ? 'start_btn' : 'reset_btn';
    this.actionButton = this.add.image(this.centerX, 660, texture).setScale(0.6667).setInteractive({ useHandCursor: true });
    this.homeButton = this.add.image(50, 50, 'home_btn').setOrigin(0,0).setInteractive({ useHandCursor: true });

    this.homeButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('StartScene');
    });

    this.actionButton.on('pointerdown', () => {
      this.sound.play('click');
      this.changeScene();
    });

    addHoverEffect(this.actionButton, `${texture}`);
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
    this.add.image(250, this.centerY + 15, 'bee_medal');
    this.medalUI = this.createMedalBox().setPosition(this.centerX - 150, this.centerY - 40);
  }
  
  /**
   * 메달 박스 생성
   */
  createMedalBox() {
    const titleText = this.remainingQuizzes?.length > 0 ? '숨겨진 그림의 정체를 밝혀내라!' : '숨겨진 그림의 정체를 모두 밝혔다!';
    const medals = this.registry.get('myMedals') || { 1: 0, 2: 0, 3: 0, 4: 0 };

    const medalContainer = this.add.container(0, 0);

    const boxWidth = 700;
    const boxHeight = 180;
    const text = this.add.text(boxWidth / 2, -60, titleText, textStyle).setOrigin(0.5);

    const medalBox = this.add.graphics();
    medalBox.lineStyle(4, 0xfddc3e, 1);
    medalBox.fillStyle(0x000000, 0.5);
    medalBox.strokeRoundedRect(0, 0, boxWidth, boxHeight, 15);
    medalBox.fillRoundedRect(0, 0, boxWidth, boxHeight, 15);

    const elements = [medalBox, text];

    const medalKeys = ['medal_1', 'medal_2', 'medal_3', 'medal_4'];
    const step = boxWidth / medalKeys.length;

    medalKeys.forEach((key, index) => {
      const x = step * (index + 0.5);
      const y = 70;
      const medalImg = this.add.image(x, y, key).setScale(1.2);
      const medalText = this.add.text(x, y + 70, `${medals[index + 1]}`, textStyle).setOrigin(0.5);

      elements.push(medalImg, medalText)
    });

    medalContainer.add(elements);
    return medalContainer;
  }

  
  /**
   * BGM 토글 버튼 생성 및 상태 이벤트 등록
   */
  createBgmButton() {
    this.bgmBtn = this.add.image(1140, 610, 'bgm_O').setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.updateBgmButtonTexture(!bgmManager.isOn);
    this.bgmBtn.on('pointerdown', () => {
      bgmManager.toggle();
      this.updateBgmButtonTexture(!bgmManager.isOn);
      this.sound.play('click');
    });
  }

  updateBgmButtonTexture(isPlaying) {
    this.bgmBtn.setTexture(isPlaying ? 'bgm_X' : 'bgm_O');
  }
}