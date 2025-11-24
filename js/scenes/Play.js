import playConfig from '../playSetting.js';
import quizData from '../quizData.js';
import Stage from '../Stage.js';
import MiniMap from '../MiniMap.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.playConfig = playConfig;
    this.quizData = quizData;
  }

  // 초기화
  init(data = {}) {
    this.allQuizzes = data.allQuizzes || this.quizData; // 전체 퀴즈 목록
    this.quiz = data.quiz || Phaser.Utils.Array.GetRandom(this.allQuizzes);
    this.showMedalOnStart = data.showMedalOnStart || false;
    this.initGameState();
  }

  // 이미지 로드
  preload() {
    this.load.image(this.quiz.answer, this.quiz.quizImage);  // 퀴즈 이미지
  }

  create() {
    // 배경색 설정
    this.cameras.main.setBackgroundColor('#FBE68D');

    // 맵 및 게임 요소 생성
    this.initStage();
    this.trailGraphics  = this.add.graphics().setDepth(0);
    this.trailPath = [];
    this.player = this.physics.add.sprite(this.playerStartTile.x, this.playerStartTile.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);
    this.physics.world.setBounds(0, 0, this.world.w, this.world.h);
    this.cameras.main.setBounds(0, 0, this.world.w, this.world.h);
    this.cameras.main.startFollow(this.player);
    this.dir = new Phaser.Math.Vector2(1, 0);
    this.player.setVelocity(this.dir.x * this.playerSpeed, this.dir.y * this.playerSpeed);
    this.enemies = this.physics.add.group({ collideWorldBounds: true });
    for (let i = 0; i < this.enemyCount; i++) { this.spawnEnemySimple(); }
    this.spawnTimer = this.time.addEvent({ delay: 3000, callback: this.spawnEnemySimple, callbackScope: this, loop: true });
    this.items = this.physics.add.group();
    this.itemTimer = this.time.addEvent({ delay: 7000, callback: this.spawnItem, callbackScope: this, loop: true });

    // UI 생성/업데이트는 MiniMap에 위임
    this.miniMap = new MiniMap(this);

    // 충돌 설정
    this.physics.add.overlap(this.player, this.enemies, () => !this.isInvincible && this.gameOver('hit_enemy'));
    this.physics.add.overlap(this.player, this.items, this.eatItem, null, this);

    // 메달씬
    if (this.showMedalOnStart) {
      this.scene.pause();
      this.scene.launch('MedalScene', { remainingQuizzes: this.allQuizzes });
    }
  }

  update() {
    this.playerMoving();
    this.updateTrailPath();

    if (this.speedEffect && this.speedEffect.visible) {
      this.speedEffect.x = this.player.x;
      this.speedEffect.y = this.player.y;
    }
    if (this.shieldEffect && this.shieldEffect.visible) {
      this.shieldEffect.x = this.player.x;
      this.shieldEffect.y = this.player.y;
    }
    if (!this.isInvincible && this.checkSelfTrailCollision(this.player)) {
      this.gameOver('hit_trail');
      return;
    }
    if (!this.isInvincible && this.checkEnemiesHitTrail()) return;
    this.cullEnemiesOnMyHex();
    if (this.miniMap) this.miniMap.updateMedal();
  }

  // game stage 초기화
  initStage() {
    this.stage = new Stage ({ scene: this, properties: { answer: this.quiz.answer } })
    this.playerStartTile = this.stage.createRandomStartTerritory();
    this.hexagonList = this.stage.hexagonList;
  }

  // 꼬리 경로에 해당하는 타일에 테두리 그리기
  drawHexBorder(x, y, color = 0xff3366, lineWidth = 4) {
    const w = this.hexagonSize.w;
    const h = this.hexagonSize.h;
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      { x: x - hw, y: y },
      { x: x - hw / 2, y: y - hh },
      { x: x + hw / 2, y: y - hh },
      { x: x + hw, y: y },
      { x: x + hw / 2, y: y + hh },
      { x: x - hw / 2, y: y + hh },
      { x: x - hw, y: y },
    ];
    this.trailGraphics.lineStyle(lineWidth, color, 1);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.trailGraphics.lineTo(points[i].x, points[i].y);
    }
    this.trailGraphics.strokePath();
  }

  // 게임 상태 초기화
  initGameState() {
    this.isGameOver = false;
    
    // MAP
    this.world = {w: this.playConfig.WORLD_W, h: this.playConfig.WORLD_H}; // 전체 크기
    this.canvasSize = {w: this.playConfig.CANVAS_W, h: this.playConfig.CANVAS_H}; // 캔버스 크기
    this.hexagonSize = {w: this.playConfig.HEXAGON_W, h: this.playConfig.HEXAGON_H}; // 육각형 크기
    this.hexagonList = []; // 모든 육각형 타일 배열
    
    // PLAYER
    this.playerSpeed = this.playConfig.PLAY_SPEED; // 플레이어 스피드
    this.turnEase = this.playConfig.TURN_EASE; // 플레이어 방향 부드럽게 (작을수록 브드러움)
    this.isDrawing = false; // 그리기는 중인지 확인
    this.interval = this.playConfig.LINE_INTERVAL; // 선 그리기 간격
    this.trailWidth = this.playConfig.TRAIL_WIDTH; // 꼬리 넓이
    this.trailColor = this.playConfig.TRAIL_COLOR; // 꼬리 색
    
    this.isInvincible = false;
    this.invincibilityTimer = null;
    this.originalPlayerSpeed = this.playerSpeed;
    this.speedBoostTimer = null;
    
    // ENEMY
    this.enemies = null; // 적 그룹
    this.enemyCount = this.playConfig.EARLY_ENEMY_COUNT; // 초기 적 수
    this.enemySpeed = this.playConfig.EARLY_ENEMY_SPEED; // 적 아동 속도
    this.enemyRange = this.playConfig.EARLY_ENEMY_RANGE; // 좌우/상하 왕복 총폭(대략)
    this.enemyRadius = this.playConfig.EARLY_ENEMY_RADIUS; // 적 이동 반지름 (원형)
    
    this.enemyFrozen = false;
    this.frozenEnemies = new Set();
    this.freezeTimer = null;
    
    // item 
    this.items = null;

    // effect 초기화
    this.speedEffect = null;
    this.shieldEffect = null;
  }
// ------ 맵 관련 -------------------------------------------------------------------------------------------------
  // 중앙에 구멍 메우기
  findInnerHoles(fill = true) {
    if (!Array.isArray(this.hexagonList) || !this.hexagonList.length) return [];

    // (col,row) → tile 인덱스
    const key = (c, r) => `${c},${r}`;
    const idx = new Map();
    for (const h of this.hexagonList) {
      if (!h || h.col == null || h.row == null) continue;
      idx.set(key(h.col, h.row), h);
    }
    const getN = (h, dc, dr) => idx.get(key(h.col + dc, h.row + dr)) || null;
    
    // 레이아웃용 이웃 오프셋
    const parityOffsets = (col) =>
      (col % 2 === 0)
        ? [[0,-1],[0,1],[-1,-1],[+1,-1],[-1,0],[+1,0]]    // even col
        : [[0,-1],[0,1],[-1,0],[+1,0],[-1,+1],[+1,+1]];   // odd col

    // my_hexagon도 limit도 아닌 타일
    const isEmpty = (h) => !!h && h.texture?.key !== 'my_hexagon' && h.texture?.key !== 'limit';

    const visited = new Set();
    const holes = [];   // 각 구멍은 타일 묶음으로 push

    for (const start of this.hexagonList) {
      if (!isEmpty(start)) continue;
      const sk = key(start.col, start.row);
      if (visited.has(sk)) continue;

      // BFS로 빈칸 연결요소 수집
      const comp = [];
      const q = [start];
      visited.add(sk);

      let touchesOutside = false; // 맵 밖 또는 limit에 닿았는지

      while (q.length) {
        const cur = q.shift();
        comp.push(cur);

        for (const [dc, dr] of parityOffsets(cur.col)) {
          const nb = getN(cur, dc, dr);

          // 이웃이 없으면 그 방향은 그리드 바깥 → 외부 연결
          if (!nb) { touchesOutside = true; continue; }

          // limit와 맞닿으면 외부로 간주
          if (nb.texture?.key === 'limit') { touchesOutside = true; continue; }

          // 같은 '빈칸'이면 BFS 확장
          if (isEmpty(nb)) {
            const nk = key(nb.col, nb.row);
            if (!visited.has(nk)) {
              visited.add(nk);
              q.push(nb);
            }
          }
        }
      }

      // 구멍 매우기
      if (!touchesOutside) {
        if (fill) comp.forEach(h => this.markAsMyHexagon(h));
        holes.push(comp);
      }
    }
    return holes;
  }

  // 미니맵 
// ------ 맵 관련; ------------------------------------------------------------------------------------------------

// ------ 플레이어 ------------------------------------------------------------------------------------------------
  playerMoving() {
    if (!this.player || !this.player.body) return;

    const pointer = this.input.activePointer;
    const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const tx = worldPt.x - this.player.x;
    const ty = worldPt.y - this.player.y;

    if (this.isLockedOnWall) {
      // 벽에 붙어있을 때, 마우스를 벽 반대 방향으로 크게 움직이면 고정 해제
      const wallNormal = new Phaser.Math.Vector2(this.player.x - this.lastCollidingHex.x, this.player.y - this.lastCollidingHex.y).normalize();
      const mouseDir = new Phaser.Math.Vector2(tx, ty).normalize();
      // 마우스 방향이 벽에서 멀어지려는 방향일 때 (dot product > 0.5) 고정 해제
      if (mouseDir.dot(wallNormal) > 0.5) {
        this.isLockedOnWall = false;
      }
    }

    const targetAngle = new Phaser.Math.Vector2(tx, ty);

    if (targetAngle.length() < 1.0) {
      this.player.setVelocity(0, 0);
      return;
    }
    targetAngle.normalize();

    if (!this.isLockedOnWall) {
      const dt = this.game.loop.delta / 1000;
      const t = 1 - Math.exp(-this.turnEase * dt);
      this.dir.lerp(targetAngle, t);
    }
    this.dir.normalize();
    const finalAngle = this.dir;

    const moveDistance = this.playerSpeed * (this.game.loop.delta / 1000);
    const nextX = this.player.x + finalAngle.x * moveDistance;
    const nextY = this.player.y + finalAngle.y * moveDistance;

    let collisionDetected = false;
    let collidingHex = null;
    const playerRadius = 20;

    const checkPoints = [
      { x: nextX, y: nextY },
      { x: nextX + finalAngle.x * playerRadius, y: nextY + finalAngle.y * playerRadius },
      { x: nextX + finalAngle.y * playerRadius, y: nextY - finalAngle.x * playerRadius },
      { x: nextX - finalAngle.y * playerRadius, y: nextY + finalAngle.x * playerRadius }
    ];

    for (const point of checkPoints) {
      const hex = this.getNearestHexagon(point.x, point.y);
      if (hex && hex.texture.key === 'limit') {
        collisionDetected = true;
        collidingHex = hex;
        break;
      }
    }

    if (!collisionDetected) {
      this.player.setVelocity(finalAngle.x * this.playerSpeed, finalAngle.y * this.playerSpeed);
      this.player.setAngle(Phaser.Math.RadToDeg(Math.atan2(finalAngle.y, finalAngle.x)));
    } else {
      // --- [변경] HEXANAUT.io 스타일 충돌 로직 ---
      this.isLockedOnWall = true;
      this.lastCollidingHex = collidingHex; // 마지막으로 충돌한 타일 저장

      const pushVector = new Phaser.Math.Vector2(this.player.x - collidingHex.x, this.player.y - collidingHex.y);
      const safeDistance = (this.hexagonSize.w / 2) + playerRadius;
      pushVector.setLength(safeDistance);
      this.player.setPosition(collidingHex.x + pushVector.x, collidingHex.y + pushVector.y);

      const wallNormal = new Phaser.Math.Vector2(this.player.x - collidingHex.x, this.player.y - collidingHex.y).normalize();
      
      // 1. 벽과 평행한 두 가지 방향(좌/우)을 계산합니다.
      const tangentRight = new Phaser.Math.Vector2(wallNormal.y, -wallNormal.x);
      const tangentLeft = new Phaser.Math.Vector2(-wallNormal.y, wallNormal.x);

      // 2. 플레이어의 원래 진행 방향(finalAngle)과 더 유사한(가까운) 쪽을 선택합니다.
      const dotRight = finalAngle.dot(tangentRight);
      const dotLeft = finalAngle.dot(tangentLeft);

      const newDir = (dotRight > dotLeft) ? tangentRight : tangentLeft;

      // 3. 계산된 새 방향으로 속도와 방향을 고정합니다.
      this.player.setVelocity(newDir.x * this.playerSpeed, newDir.y * this.playerSpeed);
      this.dir.set(newDir.x, newDir.y);
      this.player.setAngle(Phaser.Math.RadToDeg(Math.atan2(newDir.y, newDir.x)));
    }
  }

  updateTrailPath() {
    const px = this.player.x;
    const py = this.player.y;

    const isOnMy = this.isOnMyHexagon(px, py); // my_hexagon 위인지?

    if (!isOnMy && !this.isDrawing) { // 선 시작
      this.startTrail(px, py);
    } else if (!isOnMy && this.isDrawing) { // MOVE
      this.updateTrail(px, py);
    } else if (isOnMy && this.isDrawing) { // 선 종료
      this.finishTrail();
    }

    if (this.checkSelfTrailCollision(this.player)) {
      this.gameOver('hit_trail');
      return;
    }
  }

  checkSelfTrailCollision(player, skipTail = 6, hitRadius = this.trailWidth) {
    const pathPointCount = this.trailPath.length;
    if (pathPointCount < 3) return false;

    // 머리(최근 위치) 근처 선분은 건너뛰기
    const lastIndexToCheck = pathPointCount - 1 - skipTail;
    if (lastIndexToCheck <= 0) return false;

    const collisionRadius = hitRadius;
    const collisionRadiusSquared = collisionRadius * collisionRadius;

    // 경로의 각 선분과 플레이어 위치의 최소 거리 비교
    for (let i = 0; i < lastIndexToCheck; i++) {
      const segmentStart = this.trailPath[i];
      const segmentEnd = this.trailPath[i + 1];
      const distanceToSegment = this.pointToSegmentDistance(
        player.x, player.y,
        segmentStart.x, segmentStart.y,
        segmentEnd.x, segmentEnd.y
      );
      if (distanceToSegment * distanceToSegment <= collisionRadiusSquared) {
        return true;
      }
    }
    return false;
  }

  // 점과 선분 사이의 최소 거리 계산
  pointToSegmentDistance(pointX, pointY, startX, startY, endX, endY) {
    const segmentLengthSquared = this.squaredDistance(startX, startY, endX, endY);
    // 선분의 양 끝점이 같은 경우: 점과 점 거리
    if (segmentLengthSquared === 0) {
      return Math.sqrt(this.squaredDistance(pointX, pointY, startX, startY));
    }

    // 투영 비율
    const t = this.clampToUnit(
      ((pointX - startX) * (endX - startX) + (pointY - startY) * (endY - startY)) / segmentLengthSquared
    );

    const projectionX = startX + t * (endX - startX);
    const projectionY = startY + t * (endY - startY);

    return Math.sqrt(this.squaredDistance(pointX, pointY, projectionX, projectionY));
  }

  // 두 점 사이의 제곱 거리 
  squaredDistance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  // 0~1 범위로 값 제한 
  clampToUnit(value) { return value < 0 ? 0 : (value > 1 ? 1 : value) }

  // my_hexagon 위에 있는지 확인
  isOnMyHexagon(x, y) {
    const nearest = this.getNearestHexagon(x, y);
    if (!nearest) return false; // 타일 없음

    // my_hexagon(내 영역)만 '안'으로 친다
    if (nearest.texture?.key !== 'my_hexagon') return false;

    // 헥사곤 실제 폭/높이 추정: 타일에 displayWidth/Height가 없으면 hexagonSize 사용
    const w = nearest.displayWidth  || this.hexagonSize.w;
    const h = nearest.displayHeight || this.hexagonSize.h;

    // 폴리곤 포함 판정 (살짝 축소해서 경계 오검 줄이기; 0.96~0.98 가이드)
    return this.pointInFlatTopHex(x, y, nearest.x, nearest.y, w, h, 1);
  }

  pointInFlatTopHex(px, py, cx, cy, w, h, shrink = 1) {
    const hw = (w * shrink) / 2;   // 반폭
    const hh = (h * shrink) / 2;   // 반높이

    // Flat-top 육각형의 6개 꼭짓점(시계 방향) — 중심 기준
    const verts = [
      cx - hw, cy,          // 좌
      cx - hw/2, cy - hh,   // 좌상
      cx + hw/2, cy - hh,   // 우상
      cx + hw, cy,          // 우
      cx + hw/2, cy + hh,   // 우하
      cx - hw/2, cy + hh    // 좌하
    ];

    const hexPoly = new Phaser.Geom.Polygon(verts);
    return Phaser.Geom.Polygon.Contains(hexPoly, px, py);
  }

  // 꼬리 start
  startTrail(x, y) {
    this.isDrawing = true;
    this.trailPath.length = 0;
    this.trailPath.push({ x, y });

    // 프리뷰 초기화 후 첫 점 찍기 (원으로)
    this.trailGraphics.clear();
    this.trailGraphics.fillStyle(this.trailColor, 1);
    this.trailGraphics.fillCircle(x, y, this.trailWidth / 2);
  }

  // 꼬리 move
  updateTrail(x, y) {
    const last = this.trailPath[this.trailPath.length - 1];
    const d = Phaser.Math.Distance.Between(last.x, last.y, x, y);
    if (d < this.interval) return;

    this.trailPath.push({ x, y });

    const steps = Math.ceil(d / (this.trailWidth * 0.6));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ix = Phaser.Math.Interpolation.Linear([last.x, x], t);
      const iy = Phaser.Math.Interpolation.Linear([last.y, y], t);
      this.trailGraphics.fillCircle(ix, iy, this.trailWidth / 2);
      // 해당 위치에 가장 가까운 hex에 테두리 표시
      const hex = this.getNearestHexagon(ix, iy);
      if (hex && hex.texture?.key !== 'my_hexagon' && hex.texture?.key !== 'limit') {
        this.drawHexBorder(hex.x, hex.y);
      }
    }
  }

  // 꼬리 end
  finishTrail() {
    this.isDrawing = false;
    if (this.trailPath.length < 5) {
      this.trailGraphics.clear();
      this.trailPath.length = 0;
      return;
    }

    // 꼬리 및 테두리 즉시 지우기 (타일 채우기 전에)
    this.trailGraphics.clear();

    const points = this.trailPath.slice();
    // 내부 목록만 받고(바로 칠하지 않음)
    const insideHexes = this.activeHexagon(points, false);
    // 내부 + 경계 타일을 한 번에 칠하기
    this.paintInsideAndBorder(points, insideHexes);

    this.trailPath.length = 0;
    this.findInnerHoles(true);
  }

  // my_hexagon로 타일 변경
  paintInsideAndBorder(points, insideList) {
    const painted = new Set();
    const mark = (hex) => {
      if (!hex) return;
      if (hex.texture?.key === 'my_hexagon') return;
      // 타일이 가진 식별자가 없다면 col,row를 키로 사용
      const key = (hex.col !== undefined && hex.row !== undefined)
        ? `${hex.col},${hex.row}`
        : `${hex.x},${hex.y}`; // col/row가 없다면 좌표로 fallback
      if (painted.has(key)) return;
      painted.add(key);
      // hex.setTexture('my_hexagon');
      this.markAsMyHexagon(hex);
    };

    // 내부 타일 먼저
    for (const hex of insideList) mark(hex);

    // 경로를 따라 최근접 타일(중복 제거됨)
    for (const p of points) {
      const nearest = this.getNearestHexagon(p.x, p.y);
      mark(nearest);
    }
  }

  // 경로에 포함된 육각형 타일 찾기
  activeHexagon(points = this.trailPath,  mutate = true) {
    if (!points || points.length < 3 || !Array.isArray(this.hexagonList)) return [];

    // 경로 닫기
    const clonePath = points.slice();
    const first = clonePath[0]
    const last = clonePath[clonePath.length - 1];
    if (Phaser.Math.Distance.Between(first.x, first.y, last.x, last.y) > 1) clonePath.push({ x: first.x, y: first.y });
    
    // 폴리곤 & 바운딩 박스
    const flat = [];
    for (const p of clonePath) { flat.push(p.x, p.y); }
    const poly = new Phaser.Geom.Polygon(flat);
    const bounds = Phaser.Geom.Rectangle.FromPoints( clonePath.map(p => new Phaser.Geom.Point(p.x, p.y)) );

    // 포함 판정
    const inside = [];
    const expand = Math.max(1, Math.min(this.hexagonSize.w, this.hexagonSize.h) * 0.35); 
    const samples = 8; // 중심 주변 원 위를 샘플링할 점 개수

    const containsWithCenterMargin = (px, py) => {
      // 원래 중심점 포함이면 즉시 true
      if (Phaser.Geom.Polygon.Contains(poly, px, py)) return true;

      // 중심 주변 원(반지름 expand)의 가장자리에서 샘플링 검사
      for (let i = 0; i < samples; i++) {
        const theta = (Math.PI * 2 * i) / samples;
        const sx = px + expand * Math.cos(theta);
        const sy = py + expand * Math.sin(theta);
        if (Phaser.Geom.Polygon.Contains(poly, sx, sy)) return true;
      }
      return false;
    };

    for (const hex of this.hexagonList) {
      const { x, y } = hex;
      // 바운딩 박스는 폴리곤을 넉넉히 감싼 exBounds를 쓰는 게 좋아요(이미 있다면 그걸 사용)
      if (!Phaser.Geom.Rectangle.Contains(bounds, x, y)) continue;
      if (containsWithCenterMargin(x, y)) inside.push(hex);
    }


    // if (mutate) inside.forEach(inside => inside.setTexture('my_hexagon'));
    if (mutate) inside.forEach(h => this.markAsMyHexagon(h));
    return inside;
  }

  // x, y값으로 가장 가까운 육각형 찾기
  getNearestHexagon(x, y) {
    let nearest = null;
    let bestDist = Infinity;
    for (const hex of this.hexagonList) {
      const d = Phaser.Math.Distance.Between(x, y, hex.x, hex.y);
      if (d < bestDist) {
        bestDist = d;
        nearest = hex;
      }
    }
    return nearest;
  }

  // 점에서 가장 가까운 벽(육각형 선분) 찾기
  getClosestWallToPoint(point) {
    let closestLine = null;
    let minDistance = Infinity;

    const points = this.playerBoundsHexagon.points;

    // 정육각형의 6개 선분을 순회
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const line = new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y);
      
      const tempPoint = new Phaser.Geom.Point();
      Phaser.Geom.Line.GetNearestPoint(line, point, tempPoint);
      
      const distance = Phaser.Math.Distance.Between(point.x, point.y, tempPoint.x, tempPoint.y);

      if (distance < minDistance) {
        minDistance = distance;
        closestLine = line; // 가장 가까운 선분(벽) 정보 저장
      }
    }
    return closestLine;
  }
// ------ 플레이어; -----------------------------------------------------------------------------------------------

// ------ 게임 오버 -----------------------------------------------------------------------------------------------
  gameOver(reason = 'hit_trail') {
    // 물리 & 입력 정지
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.world.pause();
    this.player.setVelocity(0, 0);
    this.isDrawing = false;
    this.spawnTimer?.remove(); // 더 이상 적이 생기지 않게 타이머 정지
    this.tweens.add({ targets: this.player, alpha: { from: 1, to: 0.2 }, yoyo: true, duration: 100, repeat: 4 });
    this.time.delayedCall(350, () => {
      this.scene.pause();
      this.scene.launch('GameOverScene', { reason }); // GameOverScene을 PlayScene 위에 띄웁니다.
    });
  }
// ------ 게임 오버; ----------------------------------------------------------------------------------------------

// ------ 몬스터 --------------------------------------------------------------------------------------------------
  // 몬스터 랜덤 패턴
  pickPattern() { return Phaser.Math.RND.pick(['LR', 'APPROACH', 'UD', 'APPROACH', 'CIRCLE', 'RECT', 'APPROACH']) };

  // 몬스터 생성
  spawnEnemySimple(type = this.pickPattern()) {
    if (!this.enemies) return;

    const minX = this.canvasSize.w / 2;
    const minY = this.canvasSize.h / 2;
    const maxX = this.world.w;
    const maxY = this.world.h;
    
    const MAX_TRIES = 50; // 유효 위치를 찾기 위한 최대 시도 횟수
    const MIN_DISTANCE_FROM_PLAYER = 200; // 플레이어로부터 최소 스폰 거리

    let x, y, tries = 0;
    let isValidSpawn = false;

    // limit에 인접한 타일도 제외하는 안전 체크
    const isSafeHex = (hx, hy) => {
      const hex = this.getNearestHexagon(hx, hy);
      if (!hex || hex.texture.key === 'limit' || this.isOnMyHexagon(hx, hy)) return false;
      // limit에 인접한 타일도 제외
      const neighbors = this.hexagonList.filter(h => Phaser.Math.Distance.Between(h.x, h.y, hex.x, hex.y) < 60 && h !== hex);
      return !neighbors.some(nb => nb.texture?.key === 'limit');
    };

    // 유효한 스폰 위치를 찾을 때까지 반복
    while (!isValidSpawn && tries < MAX_TRIES) {
      x = Phaser.Math.Between(minX, maxX);
      y = Phaser.Math.Between(minY, maxY);

      const distanceFromPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);

      if (isSafeHex(x, y) && distanceFromPlayer > MIN_DISTANCE_FROM_PLAYER) { isValidSpawn = true; }
      tries++;
    }

    // 유효한 위치를 찾았을 경우에만 적을 생성
    if (isValidSpawn) {
      const enemy = this.enemies.create(x, y, 'enemy');
      enemy.setSize(this.enemyRadius * 2, this.enemyRadius * 2);
      enemy.setScale(0.7);
      enemy.setDepth(1);
      this.startPattern(enemy, type);
      return enemy;
    }

    return null;
  }

  // 몬스터 패턴 생성
  startPattern(enemy, type) {
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    const minX = this.canvasSize.w / 2,  minY = this.canvasSize.h / 2;
    const maxX = this.world.w,      maxY = this.world.h;
    switch (type) {
      case 'LR':     return this.startLR(enemy, minX, maxX);
      case 'UD':     return this.startUD(enemy, minY, maxY);
      case 'CIRCLE': return this.startCircle(enemy, minX, maxX, minY, maxY);
      case 'APPROACH': return this.startApproach(enemy, minX, maxX, minY, maxY);
      default: return this.startRect(enemy, minX, maxX, minY, maxY);
    }
  };

  // 기존 패턴 끝나면 랜덤 패턴 부여
  nextPattern(enemy) {
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    this.startPattern(enemy, this.pickPattern());
  }

  // 패턴 이동
  go(enemy, to, onDone) {
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, to.x, to.y);
    const duration = Math.max(50, (dist / (this.enemySpeed || 90)) * 1000);

    this.tweens.killTweensOf(enemy); // 겹치는 트윈 방지(한 번에 하나만)
    this.tweens.add({
      targets: enemy,
      x: to.x, y: to.y,
      duration,
      ease: 'Linear',
      onComplete: onDone
    });
  };
  
  // this.go 를 연결 (한점 한점 연결)
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

  // 좌우 패턴
  startLR(enemy, minX, maxX) {
    const half = Math.floor((this.enemyRange || 200) / 2);
    const left = Phaser.Math.Clamp(enemy.x - half, minX, maxX);
    const right = Phaser.Math.Clamp(enemy.x + half, minX, maxX);

    // 안전한 좌표만 이동하도록 보정
    const safe = (x, y) => {
      const hex = this.getNearestHexagon(x, y);
      return hex && hex.texture.key !== 'limit';
    };
    const points = [];
    if (safe(left, enemy.y)) points.push({x:left, y:enemy.y});
    if (safe(right, enemy.y)) points.push({x:right, y:enemy.y});
    if (points.length < 2) return this.nextPattern(enemy);

    // 현재 위치에서 더 가까운 끝 → 반대 끝 순서
    const nearFirst = Math.abs(enemy.x - left) <= Math.abs(enemy.x - right);
    const ordered = nearFirst ? points : points.slice().reverse();
    this.chain(enemy, ordered, () => this.nextPattern(enemy));
  }

  // 위아래 패턴
  startUD(enemy, minY, maxY) {
    const half = Math.floor((this.enemyRange || 200) / 2);
    const top = Phaser.Math.Clamp(enemy.y - half, minY, maxY);
    const bottom = Phaser.Math.Clamp(enemy.y + half, minY, maxY);

    // 안전한 좌표만 이동하도록 보정
    const safe = (x, y) => {
      const hex = this.getNearestHexagon(x, y);
      return hex && hex.texture.key !== 'limit';
    };
    const points = [];
    if (safe(enemy.x, top)) points.push({x:enemy.x, y:top});
    if (safe(enemy.x, bottom)) points.push({x:enemy.x, y:bottom});
    if (points.length < 2) return this.nextPattern(enemy);

    const nearFirst = Math.abs(enemy.y - top) <= Math.abs(enemy.y - bottom);
    const ordered = nearFirst ? points : points.slice().reverse();
    this.chain(enemy, ordered, () => this.nextPattern(enemy));
  }

  // 원형 패턴
  startCircle(enemy, minX, maxX, minY, maxY) {
    const rawR = Phaser.Math.Between(80, 140);
    const maxSafeR = Math.min(enemy.x - minX, maxX - enemy.x, enemy.y - minY, maxY - enemy.y);
    const r = Math.max(20, Math.min(rawR, maxSafeR));

    const cx = enemy.x, cy = enemy.y;
    const SEG = 12;
    const points = [];
    const safe = (x, y) => {
      const hex = this.getNearestHexagon(x, y);
      return hex && hex.texture.key !== 'limit';
    };
    for (let k = 1; k <= SEG; k++) {
      const th = (2 * Math.PI * k) / SEG;
      const px = cx + r * Math.cos(th);
      const py = cy + r * Math.sin(th);
      if (safe(px, py)) points.push({ x: px, y: py });
    }
    if (points.length < 3) return this.nextPattern(enemy);
    this.chain(enemy, points, () => this.nextPattern(enemy));
  }

  // 사각형 패턴
  startRect(enemy, minX, maxX, minY, maxY) {
    const halfW = Math.floor(Phaser.Math.Between(160,260) / 2);
    const halfH = Math.floor(Phaser.Math.Between(120,220) / 2);

    const left = Phaser.Math.Clamp(enemy.x - halfW, minX, maxX);
    const right = Phaser.Math.Clamp(enemy.x + halfW, minX, maxX);
    const top = Phaser.Math.Clamp(enemy.y - halfH, minY, maxY);
    const bottom = Phaser.Math.Clamp(enemy.y + halfH, minY, maxY);

    const safe = (x, y) => {
      const hex = this.getNearestHexagon(x, y);
      return hex && hex.texture.key !== 'limit';
    };
    const points = [];
    if (safe(left, top)) points.push({x:left, y:top});
    if (safe(right, top)) points.push({x:right, y:top});
    if (safe(right, bottom)) points.push({x:right, y:bottom});
    if (safe(left, bottom)) points.push({x:left, y:bottom});
    if (points.length < 3) return this.nextPattern(enemy);
    this.chain(enemy, points, () => this.nextPattern(enemy));
  }

  // 플레이어 있는 쪽으로 이동 패턴
  startApproach(enemy, minX, maxX, minY, maxY) {
    if (!enemy || !enemy.active || enemy.pendingRemoval) return;
    if (!this.player) return this.nextPattern(enemy);

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    // 너무 가까우면 다음 패턴
    if (dist < 1) return this.nextPattern(enemy);

    // 한 스텝 길이: enemyRange(=EARLY_ENEMY_RANGE) 혹은 남은 거리 중 더 작은 쪽
    const step = Math.min(this.enemyRange || 100, dist);
    const ux = dx / dist, uy = dy / dist;

    // 목표 지점
    let tx = enemy.x + ux * step;
    let ty = enemy.y + uy * step;

    // 이동 가능 영역으로 클램프
    tx = Phaser.Math.Clamp(tx, minX, maxX);
    ty = Phaser.Math.Clamp(ty, minY, maxY);

    // 등속 1구간 이동 후 다음 랜덤 패턴
    this.go(enemy, { x: tx, y: ty }, () => this.nextPattern(enemy));
  }

  cullEnemiesOnMyHex() {
    if (!this.enemies) return;
    // 안전하게 복사된 배열(or 역순 루프)로 순회하며 제거
    const list = this.enemies.getChildren();
    for (let i = list.length - 1; i >= 0; i--) {
      const enemy = list[i];
      if (!enemy || !enemy.active) continue;
      if (this.isOnMyHexagon(enemy.x, enemy.y)) this.fadeOutAndRemoveEnemy(enemy);
    }
  }

  // MyHexagon 위 적 삭제
  fadeOutAndRemoveEnemy(enemy) {
    if (enemy.pendingRemoval) return;
    enemy.pendingRemoval = true;

    // 움직임/충돌 정지
    this.tweens.killTweensOf(enemy); // LR/UD/RECT 트윈 정지
    enemy.setVelocity?.(0, 0);
    if (enemy.body) { enemy.body.enable = false; }

    // 깜빡임 추가
    this.tweens.add({
      targets: enemy,
      alpha: { from: 1, to: 0.2 },
      yoyo: true,
      duration: 120, // 한 번 깜빡임 시간(ms)
      repeat: 4, // 총 5번 깜빡
      onComplete: () => {
        this.tweens.killTweensOf(enemy);
        enemy.destroy();
      }
    });
  };

  // 플레이어 꼬리 & 적 충돌
  checkEnemiesHitTrail() {
    if (!this.enemies || !this.isDrawing) return;

    const trailLength = this.trailPath.length;
    if (trailLength < 2) return false; // 꼬리 점이 거의 없으면 검사 불필요

    const enemies = this.enemies.getChildren();
    if (!enemies || enemies.length === 0) return false;

    for (let e = 0; e < enemies.length; e++) {
      const enemy = enemies[e];
      if (!enemy || !enemy.active || enemy.pendingRemoval) continue;
      
      const hitR = (this.trailWidth * 0.5) + this.enemyRadius; // 충동 반경 (반지름)

      for (let i = 0; i < trailLength; i += 1) {
        const trail = this.trailPath[i];
        const dx = enemy.x - trail.x;
        const dy = enemy.y - trail.y;
        if (dx * dx + dy * dy <= hitR * hitR) {
          this.gameOver('enemy_hit_trail');
          return true;
        }
      };
    };
    return false;
  };
  // 타일을 my_hexagon으로 바꾸기
  markAsMyHexagon(hex) {
    if (!hex) return;
    if (hex.texture?.key === 'my_hexagon' || hex.texture?.key === 'limit') return;
    // 타일 칠하기 및 depth 조정 (꼬리 위에 오도록)
    hex.setTexture('my_hexagon');
    if (hex.setDepth) hex.setDepth(1);
    // my_hexagon이 늘어날 때마다 퀴즈 마스크 갱신
    if (this.stage && typeof this.stage.updateQuizMask === 'function') {
      this.stage.updateQuizMask();
    }
  }
// ------ 몬스터; -------------------------------------------------------------------------------------------------

// ------ ITEM ----------------------------------------------------------------------------------------------------
  // 아이템 생성
  spawnItem() {
    if (!this.items) return;
    const itemTypes = ['freeze', 'speed', 'invincible'];
    const itemType = Phaser.Math.RND.pick(itemTypes);

    const existingItems = this.items.getChildren ? this.items.getChildren() : [];
    const spawnHexes = this.hexagonList.filter(hex => {
      if (hex.texture?.key === 'limit' || this.isOnMyHexagon(hex.x, hex.y)) return false;
      return !existingItems.some(item => {
        const dx = (item.x ?? 0) - hex.x;
        const dy = (item.y ?? 0) - (hex.y - 10);
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });
    });

    if (spawnHexes.length === 0) return;
    const spawnHex = Phaser.Math.RND.pick(spawnHexes);
    const item = this.items.create(spawnHex.x, spawnHex.y - 10, `item_${itemType}`);
    item.setScale(0.53);
    item.itemType = itemType;
    this.time.delayedCall(30000, () => {
      if (item.active) item.destroy();
    }, [], this);
  }

  // 아이템 먹었을 때
  eatItem(player, item) {
    this.applyItemEffect(item);
    item.destroy();
  }

  // 아이템 먹을 시 효과
  applyItemEffect(item) {
    switch(item.itemType) {
      case 'freeze':
        this.freezeEnemies(10000); // 5초
        break;
      case 'speed':
        this.boostPlayerSpeed(10000, 100); // 5초, +100
        break;
      case 'invincible':
        this.makePlayerInvincible(10000); // 5초
        break;
    }
  }

  // 얼음
  freezeEnemies(duration) {
    if (this.enemyFrozen) {
      this.time.delayedCall(duration, this.unfreezeEnemies, [], this);
      return;
    }

    this.enemyFrozen = true;
    if (this.spawnTimer) this.spawnTimer.paused = true; // 적 생성 일시 정지

    const enemies = this.enemies.getChildren();
    for (const enemy of enemies) {
      this.tweens.killTweensOf(enemy);
      enemy.setVelocity(0);
      enemy.setTexture('enemy_freeze');
      this.frozenEnemies.add(enemy);
    }
    
    this.time.delayedCall(duration, this.unfreezeEnemies, [], this);
  }

  // 얼음 되돌리기
  unfreezeEnemies() {
    this.enemyFrozen = false;
    for (const enemy of this.frozenEnemies) {
      if (enemy && enemy.active) {
        enemy.setTexture('enemy');
        this.startPattern(enemy, this.pickPattern());
      }
    }
    this.frozenEnemies.clear();
    this.time.delayedCall(0, () => this.cullEnemiesOnMyHex()); // my_hexagon 위 적 정리
    if (this.spawnTimer) this.spawnTimer.paused = false;
  }

  // 스피드 업
  boostPlayerSpeed(duration, boostAmount) {
    if (this.speedBoostTimer) {
      const remainingTime = this.speedBoostTimer.getRemaining();
      this.speedBoostTimer.remove();
      duration += remainingTime;
    }

    if (this.speedBoostTimer) this.speedBoostTimer.remove();
    this.playerSpeed = this.originalPlayerSpeed + boostAmount;

    if (!this.anims.exists('speed_effect')) {
      this.anims.create({
        key: 'speed_effect',
        frames: this.anims.generateFrameNumbers('buster_effect', { start: 0, end: 41 }),
        frameRate: 15,
        repeat: -1
      });
    }
    if (!this.speedEffect) {
      this.speedEffect = this.add.sprite(this.player.x, this.player.y, 'buster_effect');
      this.speedEffect.setDepth(this.player.depth - 1);
    }
    this.speedEffect.setVisible(true);
    this.speedEffect.play('speed_effect', true);

    this.speedBoostTimer = this.time.delayedCall(duration, () => {
      this.playerSpeed = this.originalPlayerSpeed;
      this.player.setTexture('player');
      if (this.speedEffect) this.speedEffect.setVisible(false);
    }, [], this);
  }

  // 무적 invincible
  makePlayerInvincible(duration) {
    if (this.shieldEffectTimer) this.shieldEffectTimer.remove();
    this.isInvincible = true;
    if (!this.anims.exists('shield_effect')) {
      this.anims.create({
        key: 'shield_effect',
        frames: this.anims.generateFrameNumbers('shield_effect', { start: 0, end: 33 }),
        frameRate: 20,
        repeat: -1
      });
    }
    if (!this.shieldEffect) {
      this.shieldEffect = this.add.sprite(this.player.x, this.player.y, 'shield_effect');
      this.shieldEffect.setDepth(2);
    }
    this.shieldEffect.setVisible(true);
    this.shieldEffect.play('shield_effect', true);

    this.shieldEffectTimer = this.time.delayedCall(duration, () => {
      this.isInvincible = false;
      this.player.setTexture('player');
      if (this.shieldEffect) this.shieldEffect.setVisible(false);
    }, [], this);
  }
// ------ ITEM; ---------------------------------------------------------------------------------------------------
};