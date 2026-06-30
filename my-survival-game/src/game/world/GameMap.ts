import { Container, Sprite, Texture, } from "pixi.js";
import { isoX, isoY } from "./iso";
import { MAP_SIZE } from "../config/constants";
import { TileType } from "./TileType";

export class GameMap {
    container: Container;
    textures: Record<TileType, Texture>;
    map: TileType[][] = [];

    // visible tile pool
    tiles: Sprite[] = [];

    viewSize = 25;

    constructor(grass: Texture, wood: Texture, iron: Texture) {
        this.container = new Container();
        this.container.sortableChildren = true;

        this.textures = {
            [TileType.Grass]: grass,
            [TileType.Wood]: wood,
            [TileType.Iron]: iron,
        };

        this.generateMap();

        const poolSize = 3000;

        for (let i = 0; i < poolSize; i++) {
            const tile = new Sprite(this.textures[TileType.Grass]);
            // tile.anchor.set(0.5, 0.5);
            tile.width = 64;
            tile.height = 32;
            tile.visible = false;

            this.tiles.push(tile);
            this.container.addChild(tile);
        }
    }


    private generateMap() {
        for (let y = 0; y < MAP_SIZE; y++) {
            this.map[y] = [];

            for (let x = 0; x < MAP_SIZE; x++) {
                const r = Math.random();
                if (r < 0.0012) this.map[y][x] = TileType.Iron;
                else if (r < 0.008) this.map[y][x] = TileType.Wood;
                else this.map[y][x] = TileType.Grass;
            }
    }
    }

    update(playerX: number, playerY: number) {
        let index = 0;

        const view = this.viewSize;
        const centerX = Math.floor(playerX);
        const centerY = Math.floor(playerY);

        for (let x = centerX - view; x < centerX + view; x++) {
            for (let y = centerY - view; y < centerY + view; y++) {

                if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) continue;

                const tile = this.tiles[index++];
                if (!tile) return;

                const tileType = this.map[y]?.[x] ?? TileType.Grass;
                tile.visible = true;
                tile.texture = this.textures[tileType];
                tile.x = isoX(x, y);
                tile.y = isoY(x, y);
                tile.zIndex = x + y;
            }
        }

        for (; index < this.tiles.length; index++) {
            this.tiles[index].visible = false;
        }
    }
}