import { Container, Sprite, Texture } from "pixi.js";
import { isoX, isoY, tileHeight, tileWidth } from "./iso";
import { TileType } from "./TileType";
import { isHarvestableTile, type HarvestableTile } from "./tileResource";
import type { JoinedPayload } from "../../types/game";


export class GameMap {

    container: Container;
    textures: Record<TileType, Texture>;
    map: TileType[][] = [];
    tiles: Sprite[] = [];
    width: number;
    height: number;

    viewPadding = 2;

    constructor(
        grass: Texture,
        wood: Texture,
        iron: Texture,
        serverMap: JoinedPayload["map"]
    ) {

        this.container = new Container();
        this.container.sortableChildren = true;
        this.textures = {
            [TileType.Grass]: grass,
            [TileType.Wood]: wood,
            [TileType.Iron]: iron,
        };

        this.width = serverMap.width;
        this.height = serverMap.height;

        /*
            Create empty grass map.
            Server decides where resources are.
        */
        this.map = Array.from(
            { length: this.height },
            () => Array(this.width).fill(TileType.Grass)
        );

        /*
            Add server resources
        */
        for (const resource of serverMap.resourceSpawns) {

            const x = Math.floor(resource.x);
            const y = Math.floor(resource.y);

            if (
                x < 0 ||
                y < 0 ||
                x >= this.width ||
                y >= this.height
            ) {
                continue;
            }
            if (resource.type === "wood") {
                this.map[y][x] = TileType.Wood;
            }
            if (resource.type === "iron") {
                this.map[y][x] = TileType.Iron;
            }
        }

        const poolSize = 3500;

        for (let i = 0; i < poolSize; i++) {

            const tile = new Sprite(
                this.textures[TileType.Grass]
            );

            tile.width = tileWidth;
            tile.height = tileHeight;
            tile.visible = false;
            this.tiles.push(tile);
            this.container.addChild(tile);
        }
    }

    update(
        screenWidth: number,
        screenHeight: number,
        cameraX: number,
        cameraY: number
    ) {
        let index = 0;

        const left = -cameraX;
        const top = -cameraY;
        const right = left + screenWidth;
        const bottom = top + screenHeight;

        const corners = [
            this.screenToGrid(left, top),
            this.screenToGrid(right, top),
            this.screenToGrid(left, bottom),
            this.screenToGrid(right, bottom),
        ];

        const minGridX =
            Math.floor(
                Math.min(...corners.map(c => c.x))
            )
            - this.viewPadding;

        const maxGridX =
            Math.ceil(
                Math.max(...corners.map(c => c.x))
            )
            + this.viewPadding;

        const minGridY =
            Math.floor(
                Math.min(...corners.map(c => c.y))
            )
            - this.viewPadding;

        const maxGridY =
            Math.ceil(
                Math.max(...corners.map(c => c.y))
            )
            + this.viewPadding;

        for (let x = minGridX; x <= maxGridX; x++
        ) {

            for ( let y = minGridY; y <= maxGridY; y++
            ) {
                if (
                    x < 0 ||
                    y < 0 ||
                    x >= this.width ||
                    y >= this.height
                ) {
                    continue;
                }

                const tileX = isoX(x, y);
                const tileY = isoY(x, y);

                const screenX = tileX + cameraX;
                const screenY = tileY + cameraY;

                if (
                    screenX < -tileWidth ||
                    screenX > screenWidth + tileWidth ||
                    screenY < -tileHeight ||
                    screenY > screenHeight + tileHeight
                ) {
                    continue;
                }

                const grassTile = this.tiles[index++];

                if (!grassTile)
                    return;

                grassTile.visible = true;
                grassTile.texture = this.textures[TileType.Grass];
                grassTile.anchor.set(0, 0);
                grassTile.width = tileWidth;
                grassTile.height = tileHeight;
                grassTile.x = tileX;
                grassTile.y = tileY;
                grassTile.zIndex = x + y;

                /*
                    Resource layer
                */
                const tileType = this.map[y]?.[x] ?? TileType.Grass;

                if (tileType !== TileType.Grass) {

                    const objectTile =
                        this.tiles[index++];

                    if (!objectTile)
                        return;

                    objectTile.visible = true;
                    objectTile.texture = this.textures[tileType];
                    objectTile.anchor.set(0.5, 0.6);
                    objectTile.scale.set(0.25);
                    objectTile.x = tileX + tileWidth / 2;
                    objectTile.y = tileY + tileHeight / 2;
                    objectTile.zIndex = x + y + 0.1;
                }
            }
        }

        /*
            Hide unused sprites
        */
        for ( ; index < this.tiles.length; index++
        ) {
            this.tiles[index].visible = false;
        }
    }

    harvestAt(x:number, y:number
    ): HarvestableTile | null {

        if (
            x < 0 ||
            y < 0 ||
            x >= this.width ||
            y >= this.height
        ) {
            return null;
        }
        const tileType = this.map[y]?.[x] ?? TileType.Grass;

        if (!isHarvestableTile(tileType)) {

            return null;

        }
        this.map[y][x] =
            TileType.Grass;
        return tileType;
    }
    clearTile(x:number, y:number) {
        if (
            x < 0 ||
            y < 0 ||
            x >= this.width ||
            y >= this.height
        ) {
            return;
        }
        this.map[y][x] =
            TileType.Grass;
    }

    private screenToGrid(
        screenX:number,
        screenY:number
    ) {

        return {
            x:
                screenY / tileHeight + screenX / tileWidth,
            y:
                screenY / tileHeight - screenX / tileWidth,
        };
    }
}