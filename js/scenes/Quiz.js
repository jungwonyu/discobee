import { FONT_FAMILY } from '../config';

// 버튼 스타일 상수
const BUTTON = { WIDTH: 300, HEIGHT: 80, PADDING_X: 20, PADDING_Y: 20, COLOR_PURPLE: 0x8c4c9e, COLOR_YELLOW: 0xfddc3e };

// 피드백 텍스트 스타일 생성 함수
const createFeedbackStyle = (color, fontSize = '48px') => {
  return { fontFamily: FONT_FAMILY, fontStyle: 'bold', padding: { top: 5 }, color, fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize };
}

// 피드백 스타일 모음
const FEEDBACK_STYLE = {
  PINK:    createFeedbackStyle('#f471aa'),
  BLUE:    createFeedbackStyle('#346f9e'),
  DIAMOND: createFeedbackStyle('#10c4c4'),
  GOLD:    createFeedbackStyle('#ffd15b'),
  SILVER:  createFeedbackStyle('#cbe5e8'),
  BRONZE:  createFeedbackStyle('#ca6e59'),
  BROWN:   createFeedbackStyle('#6d4a43', '40px')
};

// 메달 이름/스타일 상수
const MEDAL_NAME = { 1: '다이아몬드', 2: '금', 3: '은', 4: '동' };
const MEDAL_STYLE = { 1: FEEDBACK_STYLE.DIAMOND, 2: FEEDBACK_STYLE.GOLD, 3: FEEDBACK_STYLE.SILVER, 4: FEEDBACK_STYLE.BRONZE };

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
  }

  // 씬 데이터 초기화
  init(data) {
    this.quiz = data.quiz;
    this.allQuizzes = data.allQuizzes;
    this.canvasSize = data.canvasSize;
    this.medalNumber = data.medalNumber;
  }

  // 리소스 프리로드
  preload() {
    this.load.image(this.quiz.answer + '_full', this.quiz.fullImage);
  }

  // 씬 생성
  create() {
    const canvas = document.querySelector('canvas');
    canvas.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      canvas.style.opacity = '1';
      canvas.style.transition = '';
      this.cameras.main.setBackgroundColor('#4a2e1d');
    }, 20);

    if (!this.anims.exists('bee_incorrect_ani')) {
      this.anims.create({
        key: 'bee_incorrect_ani',
        frames: this.anims.generateFrameNumbers('bee_incorrect', { start: 0, end: 89 }), // 프레임 수에 맞게 수정
        frameRate: 10,
        repeat: -1
      });
    }

    // 메달 애니메이션 생성
    for (let i = 1; i <= 4; i++) this.createMedalAnimation(i);

    this.add.text(this.scale.width / 2,  80,  '그림이 나타내는 영어 단어는 무엇일까요?',  { fontSize: '50px', color: '#ffffff', fontFamily: FONT_FAMILY }).setOrigin(0.45);
    this.add.image(100, 80, `medal_${this.medalNumber}`).setScale(1);
    if (this.textures.exists('worldSnapshot')) this.snapshotImage = this.renderMaskedImage('worldSnapshot');
    this.renderAnswerButtons();
    this.exitButton = this.renderFeedbackButton('exit_btn', () => this.returnToPlayScene()); // 나가기 버튼 생성
  }

  // 육각형 마스크 Graphics 생성 함수
  createHexMaskGraphics(frameX, frameY, frameSize) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = frameX + frameSize / 2 + 6;
    const cy = frameY + frameSize / 2;
    const r = frameSize / 2;
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    graphics.fillPath();
    return graphics;
  }

  // 마스킹된 이미지 생성 (육각형 마스크 적용)
  renderMaskedImage(key, alpha = 1, frameSize = 300, centerY = 300) {
    const { w } = this.canvasSize;
    const frameX = w / 2 - frameSize - 100;
    const frameY = centerY - frameSize / 4 - 2;

    // 이미지 생성 및 크기/위치 조정
    const image = this.add.image(w / 4, centerY, key).setOrigin(0, 0).setAlpha(alpha);
    const { width: imgW, height: imgH } = image;
    const scale = frameSize / (imgW > imgH ? imgH : imgW);
    image.setScale(scale).setPosition(frameX, frameY);

    // 육각형 마스크 생성 및 적용
    const hexMaskGraphics = this.createHexMaskGraphics(frameX, frameY, frameSize);
    const mask = hexMaskGraphics.createGeometryMask();
    image.setMask(mask);

    return image;
  }

  // 객관식 버튼 생성
  renderAnswerButtons() {
    const correctAnswer = this.quiz.answer;
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...this.quiz.options]);
    const areaCenterX = this.canvasSize.w / 2 + 150;
    const startY = 220;

    this.itemButtonGroup = this.add.group();

    shuffledOptions.forEach((optionText, idx) => {
      const buttonX = areaCenterX;
      const buttonY = startY + idx * (BUTTON.HEIGHT + BUTTON.PADDING_Y);

      const button = this.createAnswerButton(buttonX, buttonY, optionText, () => {
        this.itemButtonGroup.children.iterate(child => child.disableInteractive && child.disableInteractive()); // 모든 객관식 버튼 비활성화
        if (this.exitButton && this.exitButton.active) this.exitButton.destroy(); // 나가기 버튼 제거
        // 정오답 처리
        (optionText === correctAnswer) ? this.correct() : this.incorrect();
      });
      this.itemButtonGroup.add(button);
    });
  }

  // 가로로 긴 육각형 좌표 생성
  getWideHexagonPoints(width, height) {
    return [ 0, height / 2, width * 0.1, 0, width * 0.9, 0, width, height / 2, width * 0.9, height, width * 0.1, height];
  }

  // 육각형 버튼 생성
  createAnswerButton(x, y, text, callback) {
    const hexPoints = this.getWideHexagonPoints(BUTTON.WIDTH, BUTTON.HEIGHT);
    const buttonPolygon = new Phaser.Geom.Polygon(hexPoints);
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(BUTTON.COLOR_YELLOW);
    buttonGraphics.fillPoints(buttonPolygon.points, true);
    const buttonText = this.add.text(BUTTON.WIDTH / 2, BUTTON.HEIGHT / 2, text, {
      fontSize: '36px',
      fontFamily: FONT_FAMILY,
      color: `#${BUTTON.COLOR_PURPLE.toString(16)}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const button = this.add.container(x, y, [buttonGraphics, buttonText]);
    button.setInteractive(buttonPolygon, Phaser.Geom.Polygon.Contains);
    button.on('pointerdown', callback);
    button.on('pointerover', () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(BUTTON.COLOR_PURPLE);
      buttonGraphics.lineStyle(4, BUTTON.COLOR_YELLOW);
      buttonGraphics.fillPoints(buttonPolygon.points, true);
      buttonGraphics.strokePoints(buttonPolygon.points, true);
      buttonText.setColor(`#${BUTTON.COLOR_YELLOW.toString(16)}`);
      this.setCursor('pointer');
    });
    button.on('pointerout', () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(BUTTON.COLOR_YELLOW);
      buttonGraphics.fillPoints(buttonPolygon.points, true);
      buttonText.setColor(`#${BUTTON.COLOR_PURPLE.toString(16)}`);
      this.setCursor('default');
    });
    return button;
  }

  // 피드백 텍스트/이미지 레이아웃 배치
  renderFeedbackContent(contentInfo) {
    let totalWidth = 0;
    let textMaxHeight = 0;
    const padding = 10;
    const beeFailGap = 20;

    const sizes = contentInfo.map((info) => {
      if (info.type === 'image' && info.key === 'bee_incorrect') {
        const width = 128 * info.scale + beeFailGap; // bee_incorrect 이미지 너비 + 여백
        const height = 128 * info.scale;
        totalWidth += width;
        return { width, height };
      } else {
        const tempText = this.make.text({ text: info.text, style: info.style }, false);
        totalWidth += tempText.width;
        if (tempText.height > textMaxHeight) textMaxHeight = tempText.height;
        return { width: tempText.width, height: tempText.height };
      }
    });
    totalWidth += padding * (contentInfo.length - 1);

    let currentX = (this.canvasSize.w - totalWidth) / 2;
    const boxCenterY = 80;
    const textBaselineY = boxCenterY + textMaxHeight / 2;

    contentInfo.forEach((info, index) => {
      if (info.type === 'image' && info.key === 'bee_incorrect') {
        const bee = this.add.sprite(currentX + 64 * info.scale, boxCenterY + 20, 'bee_incorrect').setScale(info.scale).setOrigin(0.5, 0.5);
        bee.play('bee_incorrect_ani');
      } else {
        this.add.text(currentX, textBaselineY, info.text, info.style).setOrigin(0, 1);
      }
      currentX += sizes[index].width + padding;
    });
  }

  // 커서 스타일 변경
  setCursor(type = 'default') {
    if (this.input && this.input.setDefaultCursor) {
      this.input.setDefaultCursor(type);
    }
  }

  // 정답 처리
  correct() {
    this.handleAnswerResult(true);
  }

  // 오답 처리
  incorrect() {
    this.handleAnswerResult(false);
  }

  // 정답/오답 처리 통합 함수
  handleAnswerResult(isCorrect) {
    this.setCursor('default');
    this.sound.play(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      this.increaseMedalCount(this.medalNumber);
      this.showFullAnswerImage(this.snapshotImage);
    }
    this.renderFeedbackBox(isCorrect);
    const btnName = isCorrect ? 'next_btn' : 'main_btn';
    this.renderFeedbackButton(btnName, () => this.goToNextQuiz());
  }

  // 정답 이미지 애니메이션 표시
  showFullAnswerImage(snapshotImage) {
    const { x, y, displayWidth, displayHeight, mask } = snapshotImage;
    snapshotImage.destroy();
    const fullImage = this.add.image(x, y, 'worldSnapshotNoHexagon').setAlpha(0).setOrigin(0, 0);
    const scaleX = displayWidth / fullImage.width;
    const scaleY = displayHeight / fullImage.height;
    const scale = Math.min(scaleX, scaleY);
    fullImage.setScale(scale);
    fullImage.setPosition(x, y);
    if (mask) fullImage.setMask(mask);
    this.tweens.add({ targets: fullImage, alpha: 1, duration: 1000, ease: 'Linear' });
  }

  // 다음 퀴즈로 이동
  goToNextQuiz () {
    this.sound.play('click');
    this.scene.stop('PlayScene');
    this.scene.stop('QuizScene');

    const remainingQuizzes = this.allQuizzes.filter((q) => q.answer !== this.quiz.answer);

    if (remainingQuizzes.length === 0) {
      this.scene.start('PlayScene', { quiz: this.quiz, allQuizzes: remainingQuizzes, showMedalOnStart: true, medalNumber: this.medalNumber });
    } else { 
      this.scene.start('PlayScene', { allQuizzes: remainingQuizzes, showMedalOnStart: true, medalNumber: this.medalNumber });
    }
  }

  // PlayScene으로 복귀
  returnToPlayScene() {
    this.scene.stop('QuizScene');
    this.scene.resume('PlayScene');
  }

  // 피드백 버튼 생성
  renderFeedbackButton(name, callback) {
    const x = this.canvasSize.w - 50;
    const y = this.canvasSize.h - 50;

    const button = this.add.image(x, y, name).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setDepth(2);
    button.on('pointerdown', () => callback());
    button.on('pointerover', () => button.setTexture(`${name}_h`));
    button.on('pointerout', () => button.setTexture(`${name}`));
    return button;
  }

  // 피드백 텍스트/이미지 정보 생성
  buildFeedbackContent(isCorrect) {
    if (isCorrect) {
      return [
        { type: 'text', text: '정답', style: FEEDBACK_STYLE.PINK },
        { type: 'text', text: '입니다! ', style: FEEDBACK_STYLE.BROWN },
        { type: 'text', text: `${MEDAL_NAME[this.medalNumber]}메달`, style: MEDAL_STYLE[this.medalNumber] },
        { type: 'text', text: `획득!`, style: FEEDBACK_STYLE.BROWN },
      ];
    } else {
      return [
        { type: 'image', key: 'bee_incorrect', scale: 0.6 },
        { type: 'text', text: '오답', style: FEEDBACK_STYLE.BLUE },
        { type: 'text', text: '입니다!', style: FEEDBACK_STYLE.BROWN },
      ];
    }
  }

  // 피드백 박스 및 텍스트 표시
  renderFeedbackBox(isCorrect = true) {
    const contentInfo = this.buildFeedbackContent(isCorrect);
    const feedbackBoxHeight = 100;
    const feedbackBoxY = 80 - feedbackBoxHeight / 2;
    const medalAniName = `medal_${this.medalNumber}_ani`;

    this.add.graphics().fillStyle(0xf5eeda, 1).fillRect(0, feedbackBoxY, this.canvasSize.w, feedbackBoxHeight);

    if (isCorrect) {
      const bee = this.add.sprite(this.canvasSize.w / 2, this.canvasSize.h / 2, `medal_${this.medalNumber}_1`).setOrigin(0.5, 0.5).setDepth(2);
      this.add.graphics().fillStyle(0x000000, 0.5).fillRect(0, 0, this.canvasSize.w, this.canvasSize.h).setDepth(1);
      bee.play(medalAniName);
    }
    this.renderFeedbackContent(contentInfo);
  }

  // 메달 애니메이션 생성 함수
  createMedalAnimation(medalNum) {
    const key = `medal_${medalNum}_ani`;
    if (this.anims.exists(key)) return;
    const frames = [];
    for (let i = 1; i <= 5; i++) frames.push(...this.anims.generateFrameNumbers(`medal_${medalNum}_${i}`, { start: 0, end: 17 }));
    this.anims.create({ key, frames, frameRate: 10, repeat: -1 });
  }

  // 메달 개수 증가
  increaseMedalCount(medalNumber) {
    let medals = this.registry.get('myMedals') || { 1: 0, 2: 0, 3: 0, 4: 0 };
    medals[medalNumber]++;
    this.registry.set('myMedals', medals);
  }
}