export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.spritesheet("loading", `assets/img/start/ice_spritesheet.png`, { frameWidth: 105, frameHeight: 128 });
    this.load.image("logo", `assets/img/start/icecandy_logo.png`);
  }

  create() {
    const { width, height } = this.scale;
    
    // 하늘색 배경 생성
    const bg = this.add.rectangle(0, 0, width, height, 0xc9effa).setOrigin(0, 0);
    
    // 아이스캔디 로고 생성 (초기 투명 상태)
    const logo = this.add.image(width / 2, height / 2, 'logo').setAlpha(0).setScale(0.7);
    
    // 로고 시작 위치를 아래로 이동
    logo.setY(logo.y + 100);

    // 로고 등장 애니메이션: 위로 튀어오르기 
    this.tweens.add({ targets: logo, alpha: 1, y: '-=120', duration: 150, ease: 'ease-in-out', repeat: 0,
      onComplete: () => {
        this.tweens.add({ targets: logo, alpha: 1, y: '+=20', duration: 100, ease: 'ease-in-out', repeat: 0 });
      }
    });

    // 1.2초 후 페이드아웃 시작
    this.time.delayedCall(1200, () => {
      this.tweens.add({ targets: [logo, bg], alpha: 0, duration: 200, ease: 'ease-in-out', repeat: 0 });
    });
    
    // 1.5초 후 Preloader 씬으로 전환
    this.time.delayedCall(1500, () => this.scene.start('Preloader'));
  }
}
