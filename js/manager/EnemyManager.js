// 적 이동 패턴 및 생성/관리 전담 클래스
const SAFE_NEIGHBOR_DIST = 60;
const MIN_SPAWN_DIST = 200;
const MAX_TRIES = 50;
const CIRCLE_SEG = 12;
const LR_DEFAULT_RANGE = 200;
const UD_DEFAULT_RANGE = 200;
const RECT_W_RANGE = [160, 260];
const RECT_H_RANGE = [120, 220];

function isSafeHex(scene, hx, hy) {
  const hex = scene.getNearestHexagon(hx, hy);
  if (!hex || hex.texture.key === 'limit' || scene.isOnMyHexagon(hx, hy)) return false;
  const neighbors = scene.hexagonList.filter(h => Phaser.Math.Distance.Between(h.x, h.y, hex.x, hex.y) < SAFE_NEIGHBOR_DIST && h !== hex);
  return !neighbors.some(nb => nb.texture?.key === 'limit');
}

export default class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.config = {
      enemyGroup: scene.enemies,
      enemyRadius: scene.enemyRadius,
      enemyRange: scene.enemyRange,
      enemySpeed: scene.enemySpeed,
      canvasSize: scene.canvasSize,
      world: scene.world,
      player: () => scene.player,
      hexagonList: scene.hexagonList
    };
    this.bounds = {
      minX: scene.canvasSize.w / 2,
      minY: scene.canvasSize.h / 2,
      maxX: scene.world.w,
      maxY: scene.world.h
    };
  }

  pickPattern() {
    return Phaser.Math.RND.pick(['LR', 'APPROACH', 'UD', 'APPROACH', 'CIRCLE', 'RECT', 'APPROACH']);
  }

  spawnEnemySimple(type = this.pickPattern()) {
    const cfg = this.config;
    const bounds = this.bounds;
    if (!cfg.enemyGroup) return;
    let x, y, tries = 0;
    let isValidSpawn = false;
    while (!isValidSpawn && tries < MAX_TRIES) {
      x = Phaser.Math.Between(bounds.minX, bounds.maxX);
      y = Phaser.Math.Between(bounds.minY, bounds.maxY);
      const distanceFromPlayer = Phaser.Math.Distance.Between(x, y, cfg.player().x, cfg.player().y);
      if (isSafeHex(this.scene, x, y) && distanceFromPlayer > MIN_SPAWN_DIST) { isValidSpawn = true; }
      tries++;
    }
    if (isValidSpawn) {
      const enemy = cfg.enemyGroup.create(x, y, 'enemy');
      enemy.setSize(cfg.enemyRadius * 2, cfg.enemyRadius * 2);
      enemy.setScale(0.7);
      enemy.setDepth(1);
      this.startPattern(enemy, type);
      return enemy;
    }
    return null;
  }

  startPattern(enemy, type) {
    const bounds = this.bounds;
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    switch (type) {
      case 'LR': return this.startLR(enemy, bounds.minX, bounds.maxX);
      case 'UD': return this.startUD(enemy, bounds.minY, bounds.maxY);
      case 'CIRCLE': return this.startCircle(enemy, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
      case 'APPROACH': return this.startApproach(enemy, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
      default: return this.startRect(enemy, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
    }
  }

  nextPattern(enemy) {
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    this.startPattern(enemy, this.pickPattern());
  }

  go(enemy, to, onDone) {
    const cfg = this.config;
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, to.x, to.y);
    const duration = Math.max(50, (dist / (cfg.enemySpeed || 90)) * 1000);
    this.scene.tweens.killTweensOf(enemy);
    this.scene.tweens.add({
      targets: enemy,
      x: to.x, y: to.y,
      duration,
      ease: 'Linear',
      onComplete: onDone
    });
  }

  chain(enemy, points, onComplete) {
    let i = 0;
    const step = () => {
      if (!enemy || !enemy.active || enemy.pendingRemoval) return;
      if (i >= points.length) { onComplete && onComplete(); return; }
      const to = points[i++];
      this.go(enemy, to, step);
    };
    step();
  }

  startLR(enemy, minX, maxX) {
    const cfg = this.config;
    const half = Math.floor((cfg.enemyRange || LR_DEFAULT_RANGE) / 2);
    const left = Phaser.Math.Clamp(enemy.x - half, minX, maxX);
    const right = Phaser.Math.Clamp(enemy.x + half, minX, maxX);
    const points = [];
    if (isSafeHex(this.scene, left, enemy.y)) points.push({x:left, y:enemy.y});
    if (isSafeHex(this.scene, right, enemy.y)) points.push({x:right, y:enemy.y});
    if (points.length < 2) return this.nextPattern(enemy);
    const nearFirst = Math.abs(enemy.x - left) <= Math.abs(enemy.x - right);
    const ordered = nearFirst ? points : points.slice().reverse();
    this.chain(enemy, ordered, () => this.nextPattern(enemy));
  }

  startUD(enemy, minY, maxY) {
    const cfg = this.config;
    const half = Math.floor((cfg.enemyRange || UD_DEFAULT_RANGE) / 2);
    const top = Phaser.Math.Clamp(enemy.y - half, minY, maxY);
    const bottom = Phaser.Math.Clamp(enemy.y + half, minY, maxY);
    const points = [];
    if (isSafeHex(this.scene, enemy.x, top)) points.push({x:enemy.x, y:top});
    if (isSafeHex(this.scene, enemy.x, bottom)) points.push({x:enemy.x, y:bottom});
    if (points.length < 2) return this.nextPattern(enemy);
    const nearFirst = Math.abs(enemy.y - top) <= Math.abs(enemy.y - bottom);
    const ordered = nearFirst ? points : points.slice().reverse();
    this.chain(enemy, ordered, () => this.nextPattern(enemy));
  }

  startCircle(enemy, minX, maxX, minY, maxY) {
    const rawR = Phaser.Math.Between(80, 140);
    const maxSafeR = Math.min(enemy.x - minX, maxX - enemy.x, enemy.y - minY, maxY - enemy.y);
    const r = Math.max(20, Math.min(rawR, maxSafeR));
    const cx = enemy.x, cy = enemy.y;
    const points = [];
    for (let k = 1; k <= CIRCLE_SEG; k++) {
      const th = (2 * Math.PI * k) / CIRCLE_SEG;
      const px = cx + r * Math.cos(th);
      const py = cy + r * Math.sin(th);
      if (isSafeHex(this.scene, px, py)) points.push({ x: px, y: py });
    }
    if (points.length < 3) return this.nextPattern(enemy);
    this.chain(enemy, points, () => this.nextPattern(enemy));
  }

  startRect(enemy, minX, maxX, minY, maxY) {
    const cfg = this.config;
    const halfW = Math.floor(Phaser.Math.Between(...RECT_W_RANGE) / 2);
    const halfH = Math.floor(Phaser.Math.Between(...RECT_H_RANGE) / 2);
    const left = Phaser.Math.Clamp(enemy.x - halfW, minX, maxX);
    const right = Phaser.Math.Clamp(enemy.x + halfW, minX, maxX);
    const top = Phaser.Math.Clamp(enemy.y - halfH, minY, maxY);
    const bottom = Phaser.Math.Clamp(enemy.y + halfH, minY, maxY);
    const points = [];
    if (isSafeHex(this.scene, left, top)) points.push({x:left, y:top});
    if (isSafeHex(this.scene, right, top)) points.push({x:right, y:top});
    if (isSafeHex(this.scene, right, bottom)) points.push({x:right, y:bottom});
    if (isSafeHex(this.scene, left, bottom)) points.push({x:left, y:bottom});
    if (points.length < 3) return this.nextPattern(enemy);
    this.chain(enemy, points, () => this.nextPattern(enemy));
  }

  startApproach(enemy, minX, maxX, minY, maxY) {
    const cfg = this.config;
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    const player = cfg.player();
    if (!player) return this.nextPattern(enemy);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return this.nextPattern(enemy);
    const step = Math.min(cfg.enemyRange || 100, dist);
    const ux = dx / dist, uy = dy / dist;
    let tx = enemy.x + ux * step;
    let ty = enemy.y + uy * step;
    tx = Phaser.Math.Clamp(tx, minX, maxX);
    ty = Phaser.Math.Clamp(ty, minY, maxY);
    this.go(enemy, { x: tx, y: ty }, () => this.nextPattern(enemy));
  }
}