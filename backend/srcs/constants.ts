export const PORT = 3000
export const HOST = '0.0.0.0'

export const PLAYER_DEFAULT_HP = 100
export const PLAYER_DEFAULT_X = 0 //GENERATE IT?
export const PLAYER_DEFAULT_Y = 0

export const ROOM_MAX_SIZE = 4
export const GAME_TICK_RATE = 60 // 60MS

export const PLAYER_DEFAULT_IRON = 0
export const PLAYER_DEFAULT_WOOD = 0
export const PLAYER_DEFAULT_CASTLE_LEVEL = 1

export const MAP_WIDTH = 100
export const MAP_HEIGHT = 100
export const CASTLE_RADIUS = 8
export const PLAYER_RADIUS = 1

export const MIN_DIST_CASTLE = 50

// Anti-teleport: matches the frontend Player.speed (tiles/second).
export const PLAYER_MAX_SPEED = 10
// Extra slack per move to absorb network jitter / frame hitches.
export const MOVE_TOLERANCE_SECONDS = 0.2
// Caps how much idle time can be "banked" into a single move's budget.
export const MOVE_MAX_ELAPSED_SECONDS = 1