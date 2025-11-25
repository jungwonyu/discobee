import { HEXAGON_SIZE, WORLD_SIZE } from './config';

export default class Stage {
  constructor({ scene, properties }) {
    this.scene = scene;
    this.hexagonList = [];
    this.hexagonMap = new Map();
    this.answer = properties.answer;

    // 타일 크기 계산
    this.tileWidth = HEXAGON_SIZE.width * 0.75;
    this.tileHeight = HEXAGON_SIZE.height;

    // 맵 반지름 계산
    this.radiusByWidth = (WORLD_SIZE.width / this.tileWidth) / 2;
    this.radiusByHeight = (WORLD_SIZE.height / this.tileHeight) / 2;
    this.mapRadius = Math.floor(Math.min(this.radiusByWidth, this.radiusByHeight)) - 1;

    this.init();
  }

  init() {
    this.initQuizBg();
    this.createHexagon();
    this.createHexMask(); // 기존 전체 hexagon mask(외곽용)
    this.createQuizMask(); // my_hexagon 영역만 보이게 하는 마스크
  }

  /**
   * my_hexagon 타일만 퀴즈 이미지가 보이도록 동적 마스크 생성
   */
  createQuizMask() {
    // Graphics 객체 생성 및 저장
    this.quizMaskGraphics = this.scene.make.graphics({ add: false });
    this.updateQuizMask();
    if (this.quizBg) {
      const mask = new Phaser.Display.Masks.GeometryMask(this.scene, this.quizMaskGraphics);
      this.quizBg.setMask(mask);
    }
  }

  /**
   * my_hexagon 타일만 마스크로 뚫어서 퀴즈 이미지가 보이게 함
   */
  updateQuizMask() {
    if (!this.quizMaskGraphics) return;
    this.quizMaskGraphics.clear();
    // my_hexagon 타일만 마스킹
    for (const hex of this.hexagonList) {
      if (hex.texture && hex.texture.key !== 'my_hexagon') continue;
      const x = hex.x, y = hex.y;
      const points = this.getHexPoints(x, y, HEXAGON_SIZE.width, HEXAGON_SIZE.height);
      this.quizMaskGraphics.fillStyle(0xffffff, 1);
      this.quizMaskGraphics.beginPath();
      this.quizMaskGraphics.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) this.quizMaskGraphics.lineTo(points[i], points[i + 1]);
      this.quizMaskGraphics.closePath();
      this.quizMaskGraphics.fillPath();
    }
  }

  /**
   * 퀴즈 배경 설정
   */
  initQuizBg() {
    this.quizBg = this.scene.add.image(WORLD_SIZE.width / 2, WORLD_SIZE.height / 2, this.answer).setDepth(0).setVisible(true);
    // yu 월드 전체에 검정색 투명 딤 추가 (hexa보다 아래 / 미니맵에서 배경 깔기 위해 추가)
    this.bgDim = this.scene.add.graphics();
    this.bgDim.fillStyle(0x000000, 0.45).fillRect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height).setDepth(-10);
  }

  /**
   * 육각형 맵 제외 요소에 mask 씌우기
   */
  createHexMask() {
    const maskGraphics = this.scene.make.graphics({ add: false });

    this.hexagonList.forEach((hex) => {
      const { x, y, texture } = hex;
      if (texture.key === 'limit') return;
      const points = this.getHexPoints(x, y, HEXAGON_SIZE.width, HEXAGON_SIZE.height);
      const poly = new Phaser.Geom.Polygon(points);
      maskGraphics.fillPoints(poly.points, true);
    });

    const mask = new Phaser.Display.Masks.GeometryMask(this.scene, maskGraphics);
    this.bgDim.setMask(mask);
  }

  /**
   * 퀴즈 이미지 가리는 hexagon 생성
   */
  createHexagon() {
    const cols = Math.ceil((WORLD_SIZE.width + HEXAGON_SIZE.width) / this.tileWidth); 
    const rows = Math.ceil((WORLD_SIZE.height + HEXAGON_SIZE.height / 2) / HEXAGON_SIZE.height);

    const centerHex = { col: Math.floor(cols/2), row: Math.floor(rows/2) };
    const centerCube = this.offsetToCube(centerHex.col, centerHex.row);

    // 중심 정렬을 위한 offset 계산
    const mapPixelWidth = (cols - 1) * this.tileWidth + HEXAGON_SIZE.width;
    const mapPixelHeight = (rows - 1) * HEXAGON_SIZE.height + HEXAGON_SIZE.height;
    const offsetX = (WORLD_SIZE.width / 2) - (mapPixelWidth / 2);
    const offsetY = (WORLD_SIZE.height / 2) - (mapPixelHeight / 2) - 25;

    for (let col = -1; col < cols; col++) {
      for (let row = -1; row < rows; row++) {
        const targetCube = this.offsetToCube(col, row);
        const distance = this.getCubeDistance(centerCube, targetCube);

        if (distance > this.mapRadius + 1) continue; // 생성 안함

        const isOddCol = (col % 2 !== 0);
        const x = col * this.tileWidth + HEXAGON_SIZE.width / 2 + offsetX;
        const y = row * HEXAGON_SIZE.height + (isOddCol ? HEXAGON_SIZE.height / 2 : 0) + HEXAGON_SIZE.height / 2 + offsetY;

        const texture = distance > this.mapRadius ? 'limit' : 'hexagon';
        const tile = this.scene.add.image(x, y, texture).setOrigin(0.5);
        // hexagon(기본)은 월드에서 보이게 alpha=1 (미니맵에서만 ignore)
        if (texture === 'hexagon') tile.setAlpha(1);
        tile.col = col;
        tile.row = row;

        this.hexagonList.push(tile);
        this.hexagonMap.set(`${col},${row}`, tile);
      }
    }
  }

  /**
  * 초기 플레이어 땅 설정
  * - 중앙 타일과 주변 타일을 모두 'my_hexagon'으로 변경
  */
  createRandomStartTerritory() {
    // 주변 6개 타일 모두 playable인지 확인
    const validCenters = this.hexagonList.filter((hex) => 
      this.getAroundTiles(hex.col).every((offset) => {
        const neighbor = this.hexagonMap.get(`${hex.col + offset[0]},${hex.row + offset[1]}`);
        return neighbor && neighbor.texture.key !== 'limit';
      })
    );

    // 중앙 타일 선택 (valid 없으면 전체에서 랜덤)
    const centerTile = Phaser.Utils.Array.GetRandom(validCenters);
    if (!centerTile) return null; // 안전하게 null 반환

    // 중앙 타일과 주변 타일 모두 'my_hexagon'으로 설정
    [centerTile, ...this.getAroundTiles(centerTile.col).map((offset) => 
      this.hexagonMap.get(`${centerTile.col + offset[0]},${centerTile.row + offset[1]}`)
    ).filter(Boolean)].forEach(tile => tile.setTexture('my_hexagon'));
    // 마스크 갱신
    this.updateQuizMask && this.updateQuizMask();
    return centerTile;
  }

  /**
  * 해당 열(col) 기준 주변 6개 타일의 offset 좌표 반환
  * - 홀수 열과 짝수 열에 따라 offset이 다름
  */
  getAroundTiles(col) {
    return (col % 2 !== 0) 
      ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]   // 홀수 열
      : [[0, -1], [0, 1], [-1, -1], [1, -1], [-1, 0], [1, 0]];
  }

  /**
  * offset 좌표 (col, row)를 큐브 좌표(x, y, z)로 변환
  * - 육각형 맵에서 거리 계산에 용이
  */
  offsetToCube(col, row) {
    const x = col;
    const z = row - (col - (col & 1)) / 2;
    const y = -x - z;
    return { x, y, z };
  }

  /**
  * 두 큐브 좌표 간 거리 계산
  * - 육각형 격자에서 중심 타일과의 거리 측정
  */
  getCubeDistance(a, b) {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  }

  /**
  * 육각형 타일의 꼭지점 좌표 배열 반환
  */
  getHexPoints(x, y, width, height) {
    return [
      x - (width / 2), y,
      x - (width / 4), y - (height / 2),
      x + (width / 4), y - (height / 2),
      x + (width / 2), y,
      x + (width / 4), y + (height / 2),
      x - (width / 4), y + (height / 2),
    ];
  }
}