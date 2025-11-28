import { bgmManager } from '../manager/BgmManager';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    this.cameras.main.setBackgroundColor(0xc9effa);

    // 로딩 바 스타일 설정
    const color = 0x94ccdc;
    const size = { width: 500, height: 30 };
    const position = {
      x: this.scale.width / 2 - size.width / 2,
      y: this.scale.height / 2 - size.height / 2,
    };
    const radius = size.height / 2;

    // 로딩 바 배경 스타일 설정
    const add = 8;
    const bgSize = { width: size.width + add, height: size.height + add };
    const bgRadius = radius + add;
    const bgPosition = { x: position.x - add / 2, y: position.y - add / 2 };
    const loadingBG = this.add.graphics({
      fillStyle: { color: 0xffffff },
      lineStyle: { width: 3, color },
    });

    // 로딩 바 배경 생성
    loadingBG.fillRoundedRect(bgPosition.x, bgPosition.y, bgSize.width, bgSize.height, bgRadius);
    loadingBG.strokeRoundedRect(bgPosition.x, bgPosition.y, bgSize.width, bgSize.height, bgRadius);

    // 로딩 진행 상태를 표시할 바 생성
    const loadingBar = this.add.graphics({ fillStyle: { color } });
    loadingBar.fillRoundedRect(position.x, position.y, size.height, size.height, radius);

    // 로딩 캐릭터 애니메이션 생성 및 재생
    this.anims.create({
      key: 'loading',
      frames: this.anims.generateFrameNumbers('loading', { start: 1, end: 4 }),
      frameRate: 12,
      repeat: -1,
    });
    const loadingChar = this.add.sprite(0, 0, 'loading').play('loading');
    loadingChar.setScale(0.5);
    loadingChar.y = position.y + size.height / 2 - loadingChar.height / 2 + 14;

    this.load.on('progress', (progress) => {
      const barWidth = Math.max(size.height, size.width * progress);
      loadingBar.clear();
      loadingBar.fillRoundedRect(position.x, position.y, barWidth, size.height, radius);
      loadingChar.x = position.x + barWidth - size.height / 2; // 캐릭터 위치 업데이트
    });
  }

  preload() {
    // fonts
    this.load.font('Cafe24Surround', 'assets/font/Cafe24Ssurround-v2.0.ttf');
    this.load.font('TMoneyDungunbaram','assets/font/TMONEYROUNDWINDEXTRABOLD.TTF');
    this.load.font('Eommakkaturi', 'assets/font/Katuri.woff');
    this.load.font('MaplestoryBold', 'assets/font/MaplestoryBold.ttf');

    // bgmScene
    this.load.audio('bgm_audio', './assets/mp3/bgm.mp3');
    this.load.audio('lose', './assets/mp3/lose.mp3');
    this.load.audio('click', './assets/mp3/click.mp3');
    this.load.audio('correct', 'assets/mp3/correct.mp3'); // 정답 사운드
    this.load.audio('incorrect', 'assets/mp3/incorrect.mp3'); // 오답 사운드

    // startScene
    this.load.image('bg', 'assets/img/start/start_bg.png');
    this.load.image('start_title', 'assets/img/start/start_title.png');
    this.load.image('start_char', 'assets/img/start/start_char.png');
    this.load.image('start_btn', 'assets/img/start/start_btn.png');
    this.load.image('start_btn_h', 'assets/img/start/start_btn_h.png');
    this.load.image('how_btn', 'assets/img/start/how_btn.png');
    this.load.image('how_btn_h', 'assets/img/start/how_btn_h.png');

    // help scene
    this.load.image('help_next_btn', 'assets/img/help/help_next_btn.png');
    this.load.image('help_next_btn_h', 'assets/img/help/help_next_btn_h.png');
    this.load.image('help_prev_btn', 'assets/img/help/help_prev_btn.png');
    this.load.image('help_prev_btn_h', 'assets/img/help/help_prev_btn_h.png');
    this.load.image('close_btn', 'assets/img/help/close_btn.png');
    this.load.image('close_btn_h', 'assets/img/help/close_btn_h.png');
    this.load.image('help_1', 'assets/img/help/help_1.png');
    this.load.image('help_2', 'assets/img/help/help_2.png');
    this.load.image('help_3', 'assets/img/help/help_3.png');
    this.load.image('help_4', 'assets/img/help/help_4.png');
    this.load.image('help_text_1', 'assets/img/help/help_text_1.png');
    this.load.image('help_text_2', 'assets/img/help/help_text_2.png');
    this.load.image('help_text_3', 'assets/img/help/help_text_3.png');
    this.load.image('help_text_4', 'assets/img/help/help_text_4.png');

    // playScene
    this.load.image('hexagon', 'assets/img/play/hexagon.png'); // 육각형
    this.load.image('limit', 'assets/img/play/limit.png'); // 제한 육각형
    this.load.image('my_hexagon', 'assets/img/play/hexagon_h.png'); // my 육각형
    this.load.image('player', 'assets/img/play/player.png'); // 플레이어
    this.load.image('player_speed', 'assets/img/play/player_speed.png'); // 부스터 플레이어
    this.load.image('player_invincible', 'assets/img/play/player_invincible.png'); // 무적 플레이어
    this.load.image('enemy', 'assets/img/play/enemy.png'); // 적
    this.load.image('enemy_freeze', 'assets/img/play/enemy_freeze.png'); // 얼린 적
    this.load.image('item_freeze', 'assets/img/play/freeze.png'); // 얼음
    this.load.image('item_speed', 'assets/img/play/speed.png'); // 스피드
    this.load.image('item_invincible', 'assets/img/play/invincible.png'); // 무적
    this.load.spritesheet('buster_effect', 'assets/img/play/buster_effect.png', { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet('shield_effect', 'assets/img/play/shield_effect.png', { frameWidth: 200, frameHeight: 200 });

    // gameOverScene
    this.load.image('game_over_bee', 'assets/img/over/over_bee.png');
    this.load.image('game_over_balloon', 'assets/img/over/over_ballon.png');
    this.load.image('game_over_text_box', 'assets/img/over/over_text_box.png');

    //medalScene
    this.load.image('medal_bg', 'assets/img/medal/medal_bg.png'); 

    // button
    this.load.spritesheet('return_button', 'assets/img/button/return_button.png', { frameWidth: 215.5, frameHeight: 103 });
    this.load.spritesheet('home_button', 'assets/img/button/home_button.png', { frameWidth: 72, frameHeight: 74 }); 
    this.load.spritesheet('reset_button', 'assets/img/button/reset_button.png', { frameWidth: 218, frameHeight: 105 }); 
    this.load.spritesheet('volume_button', 'assets/img/button/volume_button.png', { frameWidth: 72, frameHeight: 73 }); 
    this.load.spritesheet('mute_button', 'assets/img/button/mute_button.png', { frameWidth: 72, frameHeight: 73 }); 
    this.load.spritesheet('start_button', 'assets/img/button/start_button.png', { frameWidth: 231, frameHeight: 106 });

    // map
    this.load.image('quiz_start', 'assets/img/map/quiz_start.png');
    this.load.image('quiz_start_h', 'assets/img/map/quiz_start_h.png');
    this.load.image('mini_medal_1', 'assets/img/map/mini_medal_1.png');
    this.load.image('mini_medal_2', 'assets/img/map/mini_medal_2.png');
    this.load.image('mini_medal_3', 'assets/img/map/mini_medal_3.png');
    this.load.image('mini_medal_4', 'assets/img/map/mini_medal_4.png');
    this.load.image('map_bg', 'assets/img/quiz/map_bg.png');
    this.load.image('minimap_bg', 'assets/img/map/minimap_bg.png');

    // quizScene
    this.load.image('quiz_bg', 'assets/img/quiz/quiz_bg.png');
    this.load.image('word_bg', 'assets/img/quiz/word_bg.png');
    this.load.image('word_bg_h', 'assets/img/quiz/word_bg_h.png');
    this.load.image('text_incorrect', 'assets/img/quiz/text_incorrect.png');
    this.load.image('text_1', 'assets/img/quiz/text_1.png');
    this.load.image('text_2', 'assets/img/quiz/text_2.png');
    this.load.image('text_3', 'assets/img/quiz/text_3.png');
    this.load.image('text_4', 'assets/img/quiz/text_4.png');
    this.load.spritesheet('incorrect_1', 'assets/img/quiz/incorrect_1.png', { frameWidth: 355.2, frameHeight: 448 });
    this.load.spritesheet('incorrect_2', 'assets/img/quiz/incorrect_2.png', { frameWidth: 355.2, frameHeight: 448 });
    this.load.spritesheet('incorrect_3', 'assets/img/quiz/incorrect_3.png', { frameWidth: 355.2, frameHeight: 448 });
    this.load.spritesheet('incorrect_4', 'assets/img/quiz/incorrect_4.png', { frameWidth: 355.2, frameHeight: 448 });
    this.load.spritesheet('incorrect_5', 'assets/img/quiz/incorrect_5.png', { frameWidth: 355.2, frameHeight: 448 });

    // 메달
    this.load.image('medal_1', 'assets/img/quiz/medal_1.png'); // 다이아 메달
    this.load.spritesheet('medal_1_1', 'assets/img/quiz/medal_1_1.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_1_2', 'assets/img/quiz/medal_1_2.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_1_3', 'assets/img/quiz/medal_1_3.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_1_4', 'assets/img/quiz/medal_1_4.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_1_5', 'assets/img/quiz/medal_1_5.png', { frameWidth: 506.5, frameHeight: 592 });

    this.load.image('medal_2', 'assets/img/quiz/medal_2.png'); // 금 메달
    this.load.spritesheet('medal_2_1', 'assets/img/quiz/medal_2_1.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_2_2', 'assets/img/quiz/medal_2_2.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_2_3', 'assets/img/quiz/medal_2_3.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_2_4', 'assets/img/quiz/medal_2_4.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_2_5', 'assets/img/quiz/medal_2_5.png', { frameWidth: 506.5, frameHeight: 592 });

    this.load.image('medal_3', 'assets/img/quiz/medal_3.png'); // 은 메달
    this.load.spritesheet('medal_3_1', 'assets/img/quiz/medal_3_1.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_3_2', 'assets/img/quiz/medal_3_2.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_3_3', 'assets/img/quiz/medal_3_3.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_3_4', 'assets/img/quiz/medal_3_4.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_3_5', 'assets/img/quiz/medal_3_5.png', { frameWidth: 506.5, frameHeight: 592 });

    this.load.image('medal_4', 'assets/img/quiz/medal_4.png'); // 동 메달
    this.load.spritesheet('medal_4_1', 'assets/img/quiz/medal_4_1.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_4_2', 'assets/img/quiz/medal_4_2.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_4_3', 'assets/img/quiz/medal_4_3.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_4_4', 'assets/img/quiz/medal_4_4.png', { frameWidth: 506.5, frameHeight: 592 });
    this.load.spritesheet('medal_4_5', 'assets/img/quiz/medal_4_5.png', { frameWidth: 506.5, frameHeight: 592 });

    this.load.image('main_btn', 'assets/img/quiz/mainPage_btn.png'); 
    this.load.image('main_btn_h', 'assets/img/quiz/mainPage_btn_h.png');
    this.load.image('next_btn', 'assets/img/quiz/next_btn.png'); 
    this.load.image('next_btn_h', 'assets/img/quiz/next_btn_h.png');
    this.load.image('exit_btn', 'assets/img/quiz/exit_btn.png');
    this.load.image('exit_btn_h', 'assets/img/quiz/exit_btn_h.png'); 
  }

  create() {
    this.initBgm();
    this.time.delayedCall(500, () => {
      this.scene.start('StartScene');
    });
  }

  initBgm() {
    bgmManager.init(this, 'bgm_audio', { loop: true, volume: 0.05 });
  }
}