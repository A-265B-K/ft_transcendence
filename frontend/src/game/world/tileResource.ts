import type { TileType } from './TileType';

export type HarvestableTile = Exclude<TileType, typeof TileType.Grass>;
