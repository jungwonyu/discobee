

/**
 * 도움말 씬 - 게임 방법을 설명하는 4페이지 팝업
 */
import { FONT_FAMILY } from '../config.js';
import { createOverlay, addHoverEffect } from '../utils.js';

const COLORS = { // 임시
  OVERLAY: 0x000000,
  OVERLAY_ALPHA: 0.7,
  HELP_BG: 0xffffff,
  VIDEO_BG: 0xffffff,
  TEXT: '#000000',
  NAV_BG: 0x888888,
  DOT_INACTIVE: 0xcccccc,
  DOT_HOVER: 0xaaaaaa,
  DOT_ACTIVE: 0x333333
};

const LAYOUT = {
  HELP_BOX: { width: 900, height: 600 },
  CLOSE_BTN: { offsetX: 420, offsetY: -280, scale: 0.8 },
  VIDEO_BOX: { width: 600, height: 338, offsetY: -80, scale: 0.3 },
  TEXT: { startY: 140, spacing: 40, fontSize: '22px', strokeThickness: 0.5 },
  NAV_BTN: { offsetX: 350, radius: 25, scale: 0.4, depth: { bg: 99, btn: 100 } },
  INDICATOR: { offsetY: 250, spacing: 30, radius: { normal: 6, active: 8 } }
};

const pageData = [
  {
    videoId: 'help-video-1',
    texts: [
      '마우스를 움직이면 꿀벌이 따라와요.',
      '꿀벌이 선을 그어 표시한 곳은 숨겨진 그림이 드러나요.'
    ]
  },
  {
    videoId: 'help-video-2',
    texts: [
      '도전하기 버튼을 눌러 그림의 정체를 맞추면 메달을 얻을 수 있어요.',
      '그림의 정체를 맞추지 못하면 게임이 끝나요.'
    ]
  },
  {
    videoId: 'help-video-3',
    texts: [
      '말벌과 부딪히면 게임이 끝나요.',
      '선에 말벌이나 꿀벌이 닿아도 게임이 끝나요.'
    ]
  },
  {
    videoId: 'help-video-4',
    texts: [
      '아이템을 먹으면 다양한 효과를 얻을 수 있어요.'
    ]
  }
];

export default class HelpScene extends Phaser.Scene {
  /**
   * HelpScene 생성자 - 주요 배열 및 상태 초기화
   */
  constructor() {
    super('HelpScene');
    this.totalPages = pageData.length;
    this.currentPage = 0;
    this.videoElements = [];
    this.pages = [];
    this.pageIndicators = [];
  }

  /**
   * 씬 생성 및 UI/페이지/네비게이션 초기화
   */
  create() {
    this.initScene();
    this.createUI();
    this.createPages();
    this.createNavigationButtons();
    this.createPageIndicator();
    this.showPage(0);
  }

  /**
   * 씬 상태 및 좌표 초기화, 기존 리소스 정리
   */
  initScene() {
    const { width, height } = this.sys.game.config;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.cleanup();
    
    this.videoElements = [];
    this.pages = [];
    this.pageIndicators = [];
    this.currentPage = 0;
  }

  /**
   * 오버레이, 도움말 박스, 닫기 버튼 생성
   */
  createUI() {
    createOverlay(this, COLORS.OVERLAY, COLORS.OVERLAY_ALPHA).setInteractive();
    this.add.rectangle(this.centerX, this.centerY, LAYOUT.HELP_BOX.width, LAYOUT.HELP_BOX.height, COLORS.HELP_BG);
    this.createCloseButton();
  }

  /**
   * 닫기 버튼 생성 및 이벤트 등록
   */
  createCloseButton() {
    const { offsetX, offsetY, scale } = LAYOUT.CLOSE_BTN;
    const closeButton = this.add.image(this.centerX + offsetX, this.centerY + offsetY, 'close_btn').setInteractive({ useHandCursor: true }).setScale(scale);
    
    addHoverEffect(closeButton, 'close_btn');
    closeButton.on('pointerdown', () => {
      this.videoElements.forEach(video => video.isPlaying() && video.stop());
      this.scene.stop();
    });
  }

  /**
   * 각 페이지(비디오+텍스트) 컨테이너 생성
   */
  createPages() {
    pageData.forEach((data, index) => {
      const page = this.add.container(this.centerX, this.centerY);
      
      // 비디오
      const { width, height, offsetY, scale } = LAYOUT.VIDEO_BOX;
      const videoBox = this.add.rectangle(0, offsetY, width, height, COLORS.VIDEO_BG);
      const video = this.add.video(0, offsetY, data.videoId).setOrigin(0.5).setLoop(true).setScale(scale);
      
      this.videoElements.push(video);
      page.add([videoBox, video]);

      // 텍스트
      data.texts.forEach((text, i) => {
        const { startY, spacing, fontSize } = LAYOUT.TEXT;
        const helpText = this.add.text(0, startY + (i * spacing), text, { fontSize, fontFamily: FONT_FAMILY, color: COLORS.TEXT, align: 'center', wordWrap: { width: 800 } }).setOrigin(0.5);
        page.add(helpText);
      });

      page.setVisible(false);
      this.pages[index] = page;
    });
  }

  /**
   * 이전/다음 네비게이션 버튼 및 배경 생성
   */
  createNavigationButtons() {
    const { offsetX, radius, scale, depth } = LAYOUT.NAV_BTN;
    const navConfig = [
      { x: -offsetX, btn: 'prevButton', bg: 'prevBg', key: 'help_prev_btn', action: () => this.prevPage() },
      { x: offsetX, btn: 'nextButton', bg: 'nextBg', key: 'help_next_btn', action: () => this.nextPage() }
    ];

    navConfig.forEach(({ x, btn, bg, key, action }) => {
      this[bg] = this.add.circle(this.centerX + x, this.centerY, radius, COLORS.NAV_BG).setDepth(depth.bg);
      this[btn] = this.add.image(this.centerX + x, this.centerY, key).setInteractive({ useHandCursor: true }).setDepth(depth.btn).setScale(scale);
      
      addHoverEffect(this[btn], key);
      this[btn].on('pointerdown', action);
    });
  }

  /**
   * 하단 페이지 인디케이터(도트) 생성
   */
  createPageIndicator() {
    this.pageIndicators = [];
    const { offsetY, spacing, radius } = LAYOUT.INDICATOR;
    const startX = this.centerX - ((this.totalPages - 1) * spacing) / 2;
    
    for (let i = 0; i < this.totalPages; i++) {
      const dot = this.add.circle(startX + (i * spacing), this.centerY + offsetY, radius.normal, COLORS.DOT_INACTIVE).setInteractive({ useHandCursor: true });
      
      dot.on('pointerdown', () => this.showPage(i));
      dot.on('pointerover', () => this.currentPage !== i && dot.setFillStyle(COLORS.DOT_HOVER));
      dot.on('pointerout', () => this.currentPage !== i && dot.setFillStyle(COLORS.DOT_INACTIVE));
      
      this.pageIndicators.push(dot);
    }
  }

  /**
   * 지정 페이지 표시 및 상태 갱신
   */
  showPage(pageIndex) {
    this.pages.forEach(page => { page.setVisible(false); page.setAlpha(0); });
    this.currentPage = pageIndex;
    const page = this.pages[pageIndex];
    if (page) {
      page.setVisible(true);
      this.tweens.add({ targets: page, alpha: 1, duration: 300, ease: 'Cubic.easeOut' });
    }
    this.updateNavigationButtons(pageIndex);
    this.updatePageIndicators(pageIndex);
    this.playVideo(pageIndex);
  }

  /**
   * 네비게이션 버튼 활성/비활성 처리
   */
  updateNavigationButtons(pageIndex) {
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === this.totalPages - 1;
    
    this.prevButton.setVisible(!isFirst);
    this.prevBg.setVisible(!isFirst);
    this.nextButton.setVisible(!isLast);
    this.nextBg.setVisible(!isLast);
  }

  /**
   * 페이지 인디케이터(도트) 활성화 상태 갱신
   */
  updatePageIndicators(activeIndex) {
    const { radius } = LAYOUT.INDICATOR;
    this.pageIndicators.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.setFillStyle(isActive ? COLORS.DOT_ACTIVE : COLORS.DOT_INACTIVE);
      dot.setRadius(isActive ? radius.active : radius.normal);
    });
  }

  /**
   * 현재 페이지 비디오만 재생, 나머지는 정지
   */
  playVideo(pageIndex) {
    this.videoElements.forEach((video, index) => {
      if (video.isPlaying()) video.stop();
      
      if (index === pageIndex) {
        video.setCurrentTime(0);
        video.setVolume(0);
        video.play();
      }
    });
  }

  /**
   * 이전 페이지로 이동
   */
  prevPage() {
    if (this.currentPage > 0) this.showPage(this.currentPage - 1);
  }

  /**
   * 다음 페이지로 이동
   */
  nextPage() {
    if (this.currentPage < this.totalPages - 1) this.showPage(this.currentPage + 1);
  }

  /**
   * 씬 내 동적 객체/배열 정리 및 destroy
   */
  cleanup() {
    this.videoElements?.forEach(video => video?.destroy());
    this.pages?.forEach(page => page?.destroy());
    this.pageIndicators?.forEach(dot => dot?.destroy());
    this.prevButton?.destroy();
    this.nextButton?.destroy();
    this.prevBg?.destroy();
    this.nextBg?.destroy();
  }
}