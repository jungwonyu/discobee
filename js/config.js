// size
export const HEXAGON_SIZE = { width: 64, height: 55 };
export const CANVAS_SIZE = { width: 1280, height: 720 };
export const TILE_GRID = { col: 62, row: 53 };
export const WORLD_SIZE = { 
  width: (TILE_GRID.col - 1) * (HEXAGON_SIZE.width * 0.75) + HEXAGON_SIZE.width, 
  height: (TILE_GRID.row - 1) * HEXAGON_SIZE.height + HEXAGON_SIZE.height 
};

export const PLAY_SPEED = 150;
export const TURN_EASE = 5;
export const LINE_INTERVAL = 10;

export const TRAIL_WIDTH = 10;
export const TRAIL_COLOR = '0xff3366';

export const EARLY_ENEMY_COUNT = 30;
export const EARLY_ENEMY_SPEED = 60;
export const EARLY_ENEMY_RANGE = 100;
export const EARLY_ENEMY_RADIUS = 10;

export const FONT_FAMILY = 'Cafe24Surround';