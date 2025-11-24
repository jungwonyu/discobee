import { bgmManager } from "../manager/BgmManager";

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
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
    const loadingBG = this.add.graphics({ fillStyle: { color: 0xffffff }, lineStyle: { width: 3, color } });

    // 로딩 바 배경 생성
    loadingBG.fillRoundedRect(bgPosition.x, bgPosition.y, bgSize.width, bgSize.height, bgRadius);
    loadingBG.strokeRoundedRect(bgPosition.x, bgPosition.y, bgSize.width, bgSize.height, bgRadius);

    // 로딩 진행 상태를 표시할 바 생성
    const loadingBar = this.add.graphics({ fillStyle: { color } });
    loadingBar.fillRoundedRect(position.x, position.y, size.height, size.height, radius);

    // 로딩 캐릭터 애니메이션 생성 및 재생
    this.anims.create({
      key: "loading",
      frames: this.anims.generateFrameNumbers("loading", { start: 1, end: 4 }),
      frameRate: 12,
      repeat: -1,
    });
    const loadingChar = this.add.sprite(0, 0, "loading").play("loading");
    loadingChar.setScale(0.5);
    loadingChar.y = position.y + size.height / 2 - loadingChar.height / 2 + 14;

    // 'progress' 이벤트를 감지하여 로딩 진행률에 따라 바의 너비를 조절합니다.
    this.load.on("progress", progress => {
      // 최소 너비를 보장하여 원형으로 시작해서 늘어나는 효과를 줍니다.
      const barWidth = Math.max(size.height, size.width * progress);
      loadingBar.clear();
      loadingBar.fillRoundedRect(position.x, position.y, barWidth, size.height, radius);

      // 캐릭터 위치 업데이트
      loadingChar.x = position.x + barWidth - size.height / 2;
    });
  }

  preload() {
    //  bgmScene
    this.load.audio("bgm_audio", "./assets/mp3/bgm.mp3");
    this.load.audio("click", "./assets/mp3/click.mp3");
    this.load.image("bgm_O", "assets/img/start/bgm_O.png");
    this.load.image("bgm_X", "assets/img/start/bgm_X.png");

    //  startScene
    this.load.image("bg", "assets/img/start/start_bg.png");
    this.load.image("start_title", "assets/img/start/start_title.png");
    this.load.image("start_char", "assets/img/start/start_char.png");

    this.load.spritesheet("start_btn", "assets/img/start/start_btn.png", {
      frameWidth: 383.5,
      frameHeight: 143,
    });

    this.load.spritesheet("how_btn", "assets/img/start/howToPlay_btn.png", {
      frameWidth: 141,
      frameHeight: 122,
    });

    this.load.image("howToPlay", "assets/img/start/howToPlay.png");

    this.load.image("close_btn", "assets/img/start/close_btn.png");
    this.load.image("close_btn_h", "assets/img/start/close_btn_h.png");

    // help scene
    this.load.image("play_btn", "assets/img/help/play_btn.png");
    this.load.image("pause_btn", "assets/img/help/pause_btn.png");

    // help buttons
    this.load.image("help_next_btn", "assets/img/help/next_btn.png");
    this.load.image("help_next_btn_h", "assets/img/help/next_btn_h.png");
    this.load.image("help_prev_btn", "assets/img/help/prev_btn.png");
    this.load.image("help_prev_btn_h", "assets/img/help/prev_btn_h.png");
    
    // help videos
    this.load.video("help-video-1", "assets/img/video/semple.mp4");
    this.load.video("help-video-2", "assets/img/video/semple.mp4");
    this.load.video("help-video-3", "assets/img/video/semple.mp4");
    this.load.video("help-video-4", "assets/img/video/semple.mp4");

    //playScene
    this.load.image("hexagon", "assets/img/play/hexagon.png"); // 육각형
    this.load.image("limit", "assets/img/play/limit.png"); // 제한 육각형
    this.load.image("my_hexagon", "assets/img/play/hexagon_h.png"); // my 육각형
    this.load.image("player", "assets/img/play/player.png"); // 플레이어
    this.load.image("player_speed", "assets/img/play/player_speed.png"); // 부스터 플레이어
    this.load.image("player_invincible", "assets/img/play/player_invincible.png"); // 무적 플레이어
    this.load.image("enemy", "assets/img/play/enemy.png"); // 적
    this.load.image("enemy_freeze", "assets/img/play/enemy_freeze.png"); // 얼린 적

    this.load.image("item_freeze", "assets/img/play/freeze.png"); // 얼음
    this.load.image("item_speed", "assets/img/play/speed.png"); // 스피드
    this.load.image("item_invincible", "assets/img/play/invincible.png"); // 무적

    this.load.spritesheet("buster_effect", "assets/img/play/buster_effect.png", {
      frameWidth: 200,
      frameHeight: 200,
    });

    this.load.spritesheet("shield_effect", "assets/img/play/shield_effect.png", {
      frameWidth: 200,
      frameHeight: 200,
    });

    this.load.spritesheet("quiz_start", "assets/img/play/quiz_start.png", {
      frameWidth: 274,
      frameHeight: 99,
    });

    // gameOverScene
    this.load.image("bee_gameOver", "assets/img/over/bee.png"); // 꿀벌 이미지 경로    
    this.load.image("balloon_gameOver", "assets/img/over/balloon.png"); // 꿀벌 말풍선
    this.load.image("text_box", "assets/img/over/text_box.png"); 
    // 리셋
    this.load.spritesheet("return_btn", "assets/img/over/return_btn.png", { frameWidth: 361.5,frameHeight: 134 });

    // quizScene
    this.load.image("bee_incorrect", "assets/img/quiz/bee_incorrect.png"); // 꿀벌
    this.load.image("bee_correct", "assets/img/quiz/bee_correct.png");
    this.load.spritesheet('bee_fail', 'assets/img/quiz/bee_fail.png', { frameWidth: 170, frameHeight: 223 });
    this.load.spritesheet('bee_win', 'assets/img/quiz/bee_win.png', { frameWidth: 520, frameHeight: 591 });

    this.load.image("medal_1", "assets/img/quiz/medal_1.png"); // 다이아 메달
    this.load.image("medal_2", "assets/img/quiz/medal_2.png"); // 금 메달
    this.load.image("medal_3", "assets/img/quiz/medal_3.png"); // 은 메달
    this.load.image("medal_4", "assets/img/quiz/medal_4.png"); // 동 메달

    this.load.image("main_btn", "assets/img/quiz/mainPage_btn.png"); // 처음으로
    this.load.image("main_btn_h", "assets/img/quiz/mainPage_btn_h.png"); // 처음으로 호버
    this.load.image("next_btn", "assets/img/quiz/next_btn.png"); // 다음 문제
    this.load.image("next_btn_h", "assets/img/quiz/next_btn_h.png"); // 다음 문제 호버
    this.load.image("exit_btn", "assets/img/quiz/exit_btn.png"); // 나가기 버튼
    this.load.image("exit_btn_h", "assets/img/quiz/exit_btn_h.png"); // 나가기 버튼 호버

    this.load.audio("correct", "assets/mp3/correct.mp3"); // 정답 사운드
    this.load.audio("incorrect", "assets/mp3/incorrect.mp3"); // 오답 사운드

    //medalScene
    this.load.image("medal_1", "assets/img/quiz/medal_1.png"); // 다이아
    this.load.image("medal_2", "assets/img/quiz/medal_2.png"); // 금
    this.load.image("medal_3", "assets/img/quiz/medal_3.png"); // 은
    this.load.image("medal_4", "assets/img/quiz/medal_4.png"); // 동

    this.load.image("reset_btn", "assets/img/medal/reset_btn.png"); // 초기화 버튼
    this.load.image("reset_btn_h", "assets/img/medal/reset_btn_h.png");

    this.load.image("home_btn", "assets/img/medal/home_btn.png"); // 홈버튼
    this.load.image("bee_medal", "assets/img/medal/bee_medal.png"); // 메달 벌
  }

  create() {
    this.initBgm();
    this.time.delayedCall(500, () => {
      this.scene.start("StartScene");
    });
  }

  initBgm() {
    bgmManager.init(this, 'bgm_audio', { loop: true, volume: 0.05 });
  }
}