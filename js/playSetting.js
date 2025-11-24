// 타일 개수(맵 크기) 설정
const HEXAGON_W = 64;
const HEXAGON_H = 55;
const TILE_COLS = 62; // 열 개수 
const TILE_ROWS = 54; // 행 개수

// 자동 계산된 월드 크기
const WORLD_W = (TILE_COLS - 1) * (HEXAGON_W * 0.75) + HEXAGON_W;
const WORLD_H = (TILE_ROWS - 1) * HEXAGON_H + HEXAGON_H;

const playConfig = {
  "WORLD_W": WORLD_W,
  "WORLD_H": WORLD_H,
  "HEXAGON_W": HEXAGON_W,
  "HEXAGON_H": HEXAGON_H,
  "CANVAS_W": 1280,
  "CANVAS_H": 720,

  "PLAY_SPEED": 150,
  "TURN_EASE": 5,
  "LINE_INTERVAL": 10,
  "TRAIL_WIDTH": 10,
  "TRAIL_COLOR": "0xff3366",

  "EARLY_ENEMY_COUNT": 30,
  "EARLY_ENEMY_SPEED": 60,
  "EARLY_ENEMY_RANGE": 100,
  "EARLY_ENEMY_RADIUS": 10
};

export default playConfig;
