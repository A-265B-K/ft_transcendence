import { MAP_SIZE } from "../config/constants";
import { TileType } from "./TileType";

export function generateTerrainMap() {
    const map: TileType[][] = [];

    for (let y = 0; y < MAP_SIZE; y++) {
        map[y] = [];

        for (let x = 0; x < MAP_SIZE; x++) {
            const r = Math.random();

            if (r < 0.0012) {
                map[y][x] = TileType.Iron;
            } else if (r < 0.008) {
                map[y][x] = TileType.Wood;
            } else {
                map[y][x] = TileType.Grass;
            }
        }
    }

    return map;
}