// ItemManager.js
// 아이템 생성, 효과 적용, 타이머 관리 등 아이템 관련 기능을 담당

export default class ItemManager {
  constructor(scene) {
    this.scene = scene;
    this.items = scene.physics.add.group();
    this.activeTimers = [];
    this.itemTypes = ['freeze', 'speed', 'invincible'];
  }

  start() {
    this.itemTimer = this.scene.time.addEvent({  // 아이템 생성 타이머 시작
      delay: 7000,
      callback: () => this.spawnItem(),
      callbackScope: this,
      loop: true
    });
    this.activeTimers.push(this.itemTimer);
  }

  shutdown() {
    this.activeTimers.forEach(timer => timer && timer.remove());
    this.activeTimers = [];
    this.items.getChildren().forEach(item => item && item.destroy());
  }

  spawnItem() {
    const scene = this.scene;
    const itemType = Phaser.Math.RND.pick(this.itemTypes);
    const existingItems = this.items.getChildren ? this.items.getChildren() : [];
    const hexList = scene.hexagonList;
    let spawnHex = null;

    // hexagonList에서 랜덤하게 최대 30회만 시도
    for (let i = 0; i < 30; i++) {
      const hex = Phaser.Math.RND.pick(hexList);
      if (hex.texture?.key === 'limit' || scene.isOnMyHexagon(hex.x, hex.y)) continue;
      const tooClose = existingItems.some(item => {
        const dx = (item.x ?? 0) - hex.x;
        const dy = (item.y ?? 0) - (hex.y - 10);
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });
      if (!tooClose) {
        spawnHex = hex;
        break;
      }
    }

    if (!spawnHex) return;
    const item = this.items.create(spawnHex.x, spawnHex.y - 10, `item_${itemType}`);
    item.setScale(0.53);
    item.itemType = itemType;
    scene.time.delayedCall(30000, () => {
      if (item.active) item.destroy();
    }, [], this);
  }

  eatItem(player, item) {
    this.applyItemEffect(item);
    item.destroy();
  }

  applyItemEffect(item) {
    switch(item.itemType) {
      case 'freeze':
          this.freezeEnemies(10000);
        break;
      case 'speed':
          this.boostPlayerSpeed(10000, 100);
        break;
      case 'invincible':
          this.makePlayerInvincible(10000);
        break;
    }
  }

    // 적 얼리기
    freezeEnemies(duration) {
      const scene = this.scene;
      if (scene.enemyFrozen) {
        scene.time.delayedCall(duration, () => this.unfreezeEnemies(), [], this);
        return;
      }
      scene.enemyFrozen = true;
      if (scene.spawnTimer) scene.spawnTimer.paused = true;
      const enemies = scene.enemies.getChildren();
      for (const enemy of enemies) {
        scene.tweens.killTweensOf(enemy);
        enemy.setVelocity(0);
        enemy.setTexture('enemy_freeze');
        scene.frozenEnemies.add(enemy);
      }
      scene.time.delayedCall(duration, () => this.unfreezeEnemies(), [], this);
    }

    // 적 얼음 해제
    unfreezeEnemies() {
      this.scene.enemyFrozen = false;
      for (const enemy of this.scene.frozenEnemies) {
        if (enemy && enemy.active) {
          enemy.setTexture('enemy');
          this.scene.enemyManager.startPattern(enemy, this.scene.enemyManager.pickPattern());
        }
      }
      this.scene.frozenEnemies.clear();
      this.scene.time.delayedCall(0, () => this.scene.cullEnemiesOnMyHex()); // 얼음 풀릴 때 my_hexagon 위 적 정리
      if (this.scene.spawnTimer) this.scene.spawnTimer.paused = false;
    }

    // 플레이어 스피드 업
    boostPlayerSpeed(duration, boostAmount) {
      const scene = this.scene;
      if (scene.speedBoostTimer) {
        const remainingTime = scene.speedBoostTimer.getRemaining();
        scene.speedBoostTimer.remove();
        duration += remainingTime;
      }
      if (scene.speedBoostTimer) scene.speedBoostTimer.remove();
      scene.playerSpeed = scene.originalPlayerSpeed + boostAmount;
      if (!scene.anims.exists('speed_effect')) {
        scene.anims.create({
          key: 'speed_effect',
          frames: scene.anims.generateFrameNumbers('buster_effect', { start: 0, end: 41 }),
          frameRate: 15,
          repeat: -1
        });
      }
      if (!scene.speedEffect) {
        scene.speedEffect = scene.add.sprite(scene.player.x, scene.player.y, 'buster_effect');
        scene.speedEffect.setDepth(scene.player.depth - 1);
        scene.activeEffects.push(scene.speedEffect);
      }
      scene.speedEffect.setVisible(true);
      scene.speedEffect.play('speed_effect', true);
      scene.speedBoostTimer = scene.time.delayedCall(duration, () => {
        scene.playerSpeed = scene.originalPlayerSpeed;
        scene.player.setTexture('player');
        if (scene.speedEffect) scene.speedEffect.setVisible(false);
      }, [], scene);
      scene.activeTimers.push(scene.speedBoostTimer);
    }

    // 무적 효과
    makePlayerInvincible(duration) {
      const scene = this.scene;
      if (scene.shieldEffectTimer) scene.shieldEffectTimer.remove();
      scene.isInvincible = true;
      if (!scene.anims.exists('shield_effect')) {
        scene.anims.create({
          key: 'shield_effect',
          frames: scene.anims.generateFrameNumbers('shield_effect', { start: 0, end: 33 }),
          frameRate: 20,
          repeat: -1
        });
      }
      if (!scene.shieldEffect) {
        scene.shieldEffect = scene.add.sprite(scene.player.x, scene.player.y, 'shield_effect');
        scene.shieldEffect.setDepth(2);
        scene.activeEffects.push(scene.shieldEffect);
      }
      scene.shieldEffect.setVisible(true);
      scene.shieldEffect.play('shield_effect', true);
      scene.shieldEffectTimer = scene.time.delayedCall(duration, () => {
        scene.isInvincible = false;
        scene.player.setTexture('player');
        if (scene.shieldEffect) scene.shieldEffect.setVisible(false);
      }, [], scene);
      scene.activeTimers.push(scene.shieldEffectTimer);
    }
}