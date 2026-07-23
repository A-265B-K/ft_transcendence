import { TileType, type TileType as TileTypeValue } from "./TileType";

export type HarvestableTile = Exclude<TileTypeValue, typeof TileType.Grass>;

export function isHarvestableTile(tileType: TileTypeValue): tileType is HarvestableTile {
    return tileType === TileType.Wood || tileType === TileType.Iron;
}