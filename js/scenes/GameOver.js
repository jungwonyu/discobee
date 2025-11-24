import { FONT_FAMILY } from '../config.js';
import { createOverlay } from '../utils.js';

const baseTextStyle = { fontSize: '60px',  fontFamily: FONT_FAMILY }
const yellowStyle = { ...baseTextStyle, color: '#fddc3e' }
const whiteStyle = { ...baseTextStyle, color: '#ffffff' }
const purpleStyle = { ...baseTextStyle, color: '#c4a5fd' }

const reasonTextMap = {
  hit_enemy: [
    { text: '꿀벌', style: yellowStyle },
    { text: '이 ', style: whiteStyle },
    { text: '적', style: purpleStyle },
    { text: '과 부딪혔어요!', style: whiteStyle }
  ],
  hit_trail: [
    { text: '꿀벌', style: yellowStyle },
    { text: '이 ', style: whiteStyle },
    { text: '선', style: purpleStyle },
    { text: '에 닿았어요!', style: whiteStyle }
  ],
  enemy_hit_trail: [
    { text: '적', style: yellowStyle },
    { text: '이 ', style: whiteStyle },
    { text: '선', style: purpleStyle },
    { text: '에 닿았어요!', style: whiteStyle }
  ],
  default: [
    { text: '게임 오버!', style: whiteStyle }
  ]
};

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
    this.add.image(this.centerX - 100, this.centerY - 130, 'bee_gameOver').setScale(0.6667);
    this.add.image(this.centerX + 150, this.centerY - 150, 'balloon_gameOver').setScale(0.6667);
    this.add.image(this.centerX, this.centerY + 90, 'text_box').setScale(0.6667);
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
    const returnButton = this.add.image(this.centerX, this.centerY + 245, 'return_btn').setScale(0.6667).setInteractive({ useHandCursor: true });
    returnButton.on('pointerover', () => returnButton.setFrame(1));    
    returnButton.on('pointerout', () => returnButton.setFrame(0));    
    returnButton.on('pointerdown', () => this.chageScene());
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
    const textParts = reasonTextMap[this.reason] || reasonTextMap.default;
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
    textContainer.setPosition(this.centerX - bounds.width / 2, this.centerY + 50);
  }

  /**
   * 풍선 텍스트 랜덤 생성
   */
  createBalloonText() {
    const randomIndex = Math.floor(Math.random() * balloonText.length);
    const balloonMessage = balloonText[randomIndex];
    const balloonContainer = this.add.container(0, 0);
    const balloonTextObj = this.add.text(0, 0, balloonMessage, { fontSize: '48px', fontFamily: FONT_FAMILY, color: '#000000', align: 'center' });
    
    // 컨테이너 크기 계산
    const bounds = balloonTextObj.getBounds();
    // 중앙 정렬 위치로 이동
    balloonTextObj.setPosition(-bounds.width / 2, -bounds.height / 2);
    balloonContainer.add(balloonTextObj);
    balloonContainer.setPosition(this.centerX + 170, this.centerY - 150);
  }
}