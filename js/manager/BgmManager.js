class BgmManager {
  constructor() {
    this.bgm = null;
    this.isOn = true;
  }

  init(scene, name, properties) {
    if (this.bgm) return; // 이미 초기화된 경우
    this.bgm = scene.sound.add(name, {
      ...properties
    });
  }

  play() {
    if (!this.bgm.isPlaying) this.bgm.play();
  }

  toggle() {
    if (!this.bgm) return;
    if (this.isOn) {
      this.bgm.pause();
      this.isOn = false;
    } else {
      if (this.bgm.isPaused) this.bgm.resume();
      else this.bgm.play();
      this.isOn = true;
    }
  }

  pause() {
    if (this.bgm?.isPlaying) this.bgm.pause();
  }

  stop() {
    this.bgm.stop();
    this.isOn = false;
  }

  resume() {
    if (this.bgm && !this.bgm.isPlaying) this.bgm.resume();
  }
}

export const bgmManager = new BgmManager();