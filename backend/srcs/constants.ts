export const ROOM_MAX_SIZE = 4;
export const PLAYER_DEFAULT_HP = 100;

export const CASTLE_HEAL_LVL = 2;
export const CASTLE_HEAL = 2;
export const CASTLE_HEAL_INTERVAL = 3;
export const CASTLE_HEAL_RADIUS = 10;

export const PLAYER_DEFAULT_IRON = 0;
export const PLAYER_DEFAULT_WOOD = 0;
export const PLAYER_DEFAULT_CASTLE_LEVEL = 1;

export const MAP_SIZE = 100;
export const MAP_WIDTH = MAP_SIZE;
export const MAP_HEIGHT = MAP_SIZE;
export const CASTLE_RADIUS = 8;

export const PLAYER_RADIUS = 1;

export const MIN_DIST_CASTLE = 50;

// Anti-teleport: matches the frontend Player.speed (tiles/second).
export const PLAYER_MAX_SPEED = 10;
// Extra slack per move to absorb network jitter / frame hitches.
export const MOVE_TOLERANCE_SECONDS = 0.2;
// Caps how much idle time can be "banked" into a single move's budget.
export const MOVE_MAX_ELAPSED_SECONDS = 1;
