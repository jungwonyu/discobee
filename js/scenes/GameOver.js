import { FONT_KKATURI } from '../config.js';
import { createOverlay } from '../utils.js';

const balloonText = [
  '아쉬워!\n할 수 있었는데!',
  '아까워!\n실수한 거야!',
  '아,\n잘하고 있었는데!',
  '다시 해보자!\n할 수 있어!',
  '괜찮아,\n다시 하면 돼!',
  '다음엔\n꼭 성공한다!',
  '조금 어렵지만\n할 수 있어!',
  '침착하게\n다시 해보자!',
  '포기 안 해!\n다시 할거야!',
  '이제 알겠어!\n다시 도전!',
  '감 잡았어!\n이번엔 성공할거야!',
  '앗! 아깝다~!\n다시 도전!',
  '실수할 수도 있지!\n다시 하자!'
]

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.reason = data.reason;
  }

  create() {
    // 화면의 가로, 세로 중앙 좌표를 계산합니다.
    this.centerX = this.cameras.main.width / 2;
    this.centerY = this.cameras.main.height / 2;
    
    createOverlay(this, 0x000000, 0.7);
    this.createUI();
    this.createText();
    this.createButton();
  }

  /**
   * 반투명 dim 배경 설정
   */
  initBackground() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height);
  }

  /**
   * UI요소 생성
   */
  createUI() {
    const bee = this.add.image(this.centerX, this.centerY - 130, 'game_over_bee');

    this.tweens.add({
      targets: bee,
      y: bee.y - 10,   // 위로 10px 이동
      duration: 800,          // 0.8초
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,              // 무한 반복
      delay: 500
    });

    this.add.image(915, 167, 'game_over_balloon');
    this.add.image(this.centerX, this.centerY + 100, 'game_over_text_box');
  }

  /**
   * 텍스트 생성
   */
  createText() {
    this.createResonText();
    this.createBalloonText();
  }

  /**
   * 버튼 생성
   */
  createButton() {
    const returnButton = this.add.sprite(this.centerX, this.centerY + 260, 'return_button').setInteractive({ useHandCursor: true });
    returnButton.on('pointerover', () => returnButton.setFrame(1));    
    returnButton.on('pointerout', () => returnButton.setFrame(0));    
    returnButton.on('pointerdown', () => {
      this.sound.play('click');
      this.chageScene();
    });
  }

  /**
   * scene 변경
   */
  chageScene() {
    this.scene.stop('GameOverScene');
    this.scene.start('StartScene');
  }

  /**
   * game over 상태에 따라 text 변경
   */
  createResonText() {
    this.add.image(this.centerX, this.centerY + 96, `${this.reason}_text`);
  }

  /**
   * 풍선 텍스트 랜덤 생성
   */
  createBalloonText() {
    const randomIndex = Math.floor(Math.random() * balloonText.length);
    const balloonMessage = balloonText[randomIndex];
    this.add.text(916, 154, balloonMessage, { fontSize: '32px', fontFamily: FONT_KKATURI, color: '#000000', align: 'center' }).setOrigin(0.5, 0.5);
  }
}