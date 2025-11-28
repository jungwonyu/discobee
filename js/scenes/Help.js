import { STYLE_SCALE } from '../config.js';
import { createOverlay, addHoverEffect } from '../utils.js';

const COLORS = {
  DOT_INACTIVE: 0x8c7a31,
  DOT_ACTIVE: 0xffdb45,
};

/**
 * 도움말 씬 - 게임 방법을 설명하는 4페이지 팝업
 */

export default class HelpScene extends Phaser.Scene {
  constructor() {
    super('HelpScene');
  }

  create() {
    this.initScene();
    this.createUI();
    this.createPages();
    this.showPage(0);
  }

  initScene() {
    const { width, height } = this.sys.game.config;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.pages = [];
    this.pageIndicators = [];
    this.totalPages = 4;
    this.currentPage = 0;
  }

  createUI() {
    createOverlay(this).setInteractive();
    this.createNavigation();
    this.createPageIndicator();
    this.createCloseButton();
  }

  createPages() {
    this.add.image(this.centerX, this.centerY - 50, 'help_bg').setScale(STYLE_SCALE);

    for (let i = 0; i < this.totalPages; i++) {
      const pageContainer = this.add.container(0, 0).setVisible(false);
      const pageText = this.add.image(this.centerX, this.sys.game.config.height - 120, `help_text_${i + 1}`).setScale(STYLE_SCALE);
      pageContainer.add([pageText]);
      this.pages.push(pageContainer);
    }
  }

  createCloseButton() {
    const closeButton = this.add.image(0, 0, 'close_btn').setScale(STYLE_SCALE).setPosition(this.sys.game.config.width - 50, 50).setInteractive({ useHandCursor: true });
    addHoverEffect(closeButton, 'close_btn');
    closeButton.on('pointerdown', () => this.scene.stop());
  }

  createNavigation() {
    const prevButton = this.add.image(0, 0, 'help_prev_btn').setScale(STYLE_SCALE).setPosition(50, this.centerY).setInteractive({ useHandCursor: true });
    addHoverEffect(prevButton, 'help_prev_btn');

    const nextButton = this.add.image(0, 0, 'help_next_btn').setScale(STYLE_SCALE).setPosition(this.sys.game.config.width - 50, this.centerY).setInteractive({ useHandCursor: true });
    addHoverEffect(nextButton, 'help_next_btn');

    prevButton.on('pointerdown', () => this.prevPage());
    nextButton.on('pointerdown', () => this.nextPage());
  }

  createPageIndicator() {
    this.pageIndicators = [];
    for (let i = 0; i < this.totalPages; i++) {
      const x = this.centerX + (i - (this.totalPages - 1) / 2) * 30;
      const y = this.sys.game.config.height - 30;
      const circle = this.add.circle(x, y, 8, COLORS.DOT_INACTIVE).setScale(STYLE_SCALE).setInteractive({ useHandCursor: true });
      const graphics = this.add.graphics().setPosition(x, y).fillStyle(COLORS.DOT_ACTIVE, 1).fillRoundedRect(-20, -8, 40, 16, 8).setScale(STYLE_SCALE).setVisible(false).setDepth(2);

      // 인디케이터 객체로 관리
      this.pageIndicators.push({ circle, graphics });
      circle.on('pointerdown', () => this.showPage(i));
    }
  }

  updatePageIndicators(activeIndex) {
    this.pageIndicators.forEach((indicator, index) => {
      const isActive = index === activeIndex;
      indicator.circle.setVisible(!isActive);
      indicator.graphics.setVisible(isActive);
    });
  }

  showPage(pageIndex) {
    this.pages.forEach((page, index) => page.setVisible(index === pageIndex));
    this.currentPage = pageIndex;
    this.updatePageIndicators(pageIndex);
  }

  nextPage() { // next로 이동
    const newPage = (this.currentPage + 1) % this.totalPages;
    this.showPage(newPage);
  }

  prevPage() { // prev로 이동
    const newPage = (this.currentPage - 1 + this.totalPages) % this.totalPages;
    this.showPage(newPage);
  }
}