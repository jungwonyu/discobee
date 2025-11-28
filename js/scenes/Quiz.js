import { FONT_MAPLESTORY_BOLD, STYLE_SCALE } from '../config';
import { createOverlay, addHoverEffect } from '../utils';

const buttonColor = { main: '#ee5d62', hover: '#4d8900', white: '#ffffff', black: '#000000' };

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

  // 씬 생성
  create() {
    const canvas = document.querySelector('canvas');
    canvas.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      canvas.style.opacity = '1';
      canvas.style.transition = '';
      this.add.image(this.scale.width / 2, this.scale.height / 2, 'quiz_bg').setScale(STYLE_SCALE).setDepth(-1);
    }, 20);

    for (let i = 1; i <= 4; i++) this.createAnimation(i); // 메달 애니메이션 생성
    this.createAnimation('incorrect'); // 오답 애니메이션 생성
    this.add.image(292, 56, `medal_${this.medalNumber}`).setScale(0.5);

    if (this.textures.exists('worldSnapshot')) this.snapshotImage = this.renderMaskedImage('worldSnapshot');
    this.renderAnswerButtons();
    this.exitButton = this.renderFeedbackButton('exit_btn', () => this.returnToPlayScene()); // 나가기 버튼 생성
  }

  // 육각형 마스크 Graphics 생성 함수
  createHexMaskGraphics(frameX, frameY, frameSize) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = frameX + frameSize / 2;
    const cy = frameY + frameSize / 2;
    const r = frameSize / 2;
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i + 30);
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

  // 마스킹된 이미지 생성
  renderMaskedImage(key) {
    const { w, h } = this.canvasSize;
    const image = this.add.image(w / 2, h / 2, key).setOrigin(0, 0);

    const positionX = 100;
    const positionY = h / 4;
    const frameSize = 482; // 원하는 마스크 크기(px)
    const hexMaskGraphics = this.createHexMaskGraphics(108, positionY, frameSize);
    const mask = hexMaskGraphics.createGeometryMask();

    image.setScale(STYLE_SCALE).setPosition(positionX, positionY).setMask(mask);
    this.add.image(136, 178, 'map_bg').setOrigin(0, 0).setScale(STYLE_SCALE);

    return image;
  }

  // 객관식 버튼 생성
  renderAnswerButtons() {
    const correctAnswer = this.quiz.answer;
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...this.quiz.options]);
    const areaCenterX = this.canvasSize.w / 2 + 270;
    const startY = 270;

    this.itemButtonGroup = this.add.group();

    shuffledOptions.forEach((optionText, idx) => {
      const buttonX = areaCenterX;
      const buttonY = startY + idx * 120;

      const button = this.createAnswerButton(buttonX, buttonY, optionText, () => {
        this.itemButtonGroup.children.iterate(child => child.disableInteractive && child.disableInteractive()); // 모든 객관식 버튼 비활성화
        if (this.exitButton && this.exitButton.active) this.exitButton.destroy(); // 나가기 버튼 제거
        (optionText === correctAnswer) ? this.correct() : this.incorrect(); // 정오답 처리
      });
      this.itemButtonGroup.add(button);
    });
  }

  // 버튼 생성
  createAnswerButton(x, y, text, callback) {
    const button = this.createButtonImage(x, y, 'word_bg', callback);
    const buttonText = this.createButtonText(x, y - 10, text);
    this.applyButtonHoverEffect(button, buttonText);
    return button;
  }

  createButtonImage(x, y, texture, callback) {
    const btn = this.add.image(x, y, texture).setInteractive({ useHandCursor: true }).setScale(STYLE_SCALE);
    btn.on('pointerdown', callback);
    return btn;
  }

  createButtonText(x, y, text) {
    const txt = this.add.text(x, y, text, { fontSize: '44px', fontFamily: FONT_MAPLESTORY_BOLD, color: buttonColor.white, fontStyle: 'bold' }).setOrigin(0.5);
    txt.setShadow(3, 3, buttonColor.main, 0, true, true);
    return txt;
  }

  applyButtonHoverEffect(button, buttonText) {
    button.on('pointerover', () => {
      button.setTexture('word_bg_h');
      buttonText.setColor(buttonColor.hover);
      buttonText.setShadow(0, 0, buttonColor.black, 0, false, false);
      this.setCursor('pointer');
    });
    button.on('pointerout', () => {
      button.setTexture('word_bg');
      buttonText.setColor(buttonColor.white);
      buttonText.setShadow(3, 3, buttonColor.main, 0, true, true);
      this.setCursor('default');
    });
  }

  // 커서 스타일 변경
  setCursor(type = 'default') {
    if (this.input && this.input.setDefaultCursor) this.input.setDefaultCursor(type);
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
      this.showAnswerImage(this.snapshotImage);
    }
    this.showFeedback(isCorrect);
    const btnName = isCorrect ? 'next_btn' : 'main_btn';
    this.renderFeedbackButton(btnName, () => this.goToNextQuiz());
  }

  // 정답 이미지 애니메이션 표시
  showAnswerImage(snapshotImage) {
    const { x, y, mask } = snapshotImage;
    snapshotImage.destroy();
    const answerImage = this.add.image(x, y, 'worldSnapshotNoHexagon').setAlpha(0).setOrigin(0, 0);
    answerImage.setScale(STYLE_SCALE).setPosition(x, y).setMask(mask);
    this.tweens.add({ targets: answerImage, alpha: 1, duration: 1000, ease: 'Linear' });
    this.add.image(136, 178, 'map_bg').setOrigin(0, 0).setScale(STYLE_SCALE);
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
    const x = this.canvasSize.w - 270;
    const y = this.canvasSize.h - 50;

    const button = this.add.image(x, y, name).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setScale(STYLE_SCALE);
    button.on('pointerdown', () => callback());
    addHoverEffect(button, `${name}`);

    return button;
  }

  // 피드백 박스 및 텍스트 표시
  showFeedback(isCorrect) {
    const medalNum = this.medalNumber;
    const config = isCorrect
      ? { img: `medal_${medalNum}_1`, ani: `medal_${medalNum}_ani`, txt: `text_${medalNum}` }
      : { img: 'bee_incorrect', ani: 'incorrect_ani', txt: 'text_incorrect' };

    const dim = createOverlay(this).setDepth(1).setInteractive(new Phaser.Geom.Rectangle(0, 0, this.canvasSize.w, this.canvasSize.h), Phaser.Geom.Rectangle.Contains);
    const sprite = this.add.sprite(this.canvasSize.w / 2, this.canvasSize.h / 2, config.img).setOrigin(0.5).setDepth(2);
    sprite.play(config.ani);
    const text = this.add.image(this.canvasSize.w / 2, this.canvasSize.h - 100, config.txt).setOrigin(0.5).setDepth(2).setScale(STYLE_SCALE);

    let playCount = 0;
    sprite.on('animationrepeat', () => {
      playCount++;
      if (playCount === 1) {
        this.tweens.add({ targets: [sprite, text, dim], alpha: 0, duration: 1000, ease: 'Linear',
          onComplete: () => { sprite.destroy(); text.destroy(); dim.destroy(); }
        });
      }
    });
  }

  // 애니메이션 생성
  createAnimation(medalNum) {
    const [key, prefix] = medalNum === 'incorrect' ? ['incorrect_ani', 'incorrect_'] : [`medal_${medalNum}_ani`, `medal_${medalNum}_`];
    if (this.anims.exists(key)) return;

    const frames = Array.from({ length: 5 }, (_, i) => this.anims.generateFrameNumbers(`${prefix}${i + 1}`, { start: 0, end: 17 })).flat();
    this.anims.create({ key, frames, frameRate: 20, repeat: -1 });
  }

  // 메달 개수 증가
  increaseMedalCount(medalNumber) {
    let medals = this.registry.get('myMedals') || { 1: 0, 2: 0, 3: 0, 4: 0 };
    medals[medalNumber]++;
    this.registry.set('myMedals', medals);
  }
}