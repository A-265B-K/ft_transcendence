/**
 * Game Map System
 * 
 * Generates and manages the game world map.
 * Uses a sprite pool for efficient rendering of visible tiles.
 * Implements view frustum culling to only render tiles near the player.
 */

import { Container, Sprite, Texture } from "pixi.js";
import { isoX, isoY, tileHeight, tileWidth } from "./iso";
import { MAP_SIZE } from "../config/constants";
import { TileType } from "./TileType";
import { generateTerrainMap } from "./generateTerrainMap";
import { isHarvestableTile, type HarvestableTile } from "./tileResource";

/**
 * GameMap class - manages procedural world generation and tile rendering
 */
export class GameMap {
    // Container holding all visible tile sprites
    container: Container;
    
    // Texture lookup table for each tile type
    textures: Record<TileType, Texture>;
    
    // 2D array representing the world map tile types
    map: TileType[][] = [];

    // Sprite pool for efficient rendering (reuse sprites instead of creating new ones)
    tiles: Sprite[] = [];

    // Small padding to cover tile corners at the screen edges
    viewPadding = 2;

    /**
     * Constructor - initializes map with textures and generates terrain
     */
    constructor(grass: Texture, wood: Texture, iron: Texture) {
        // Create container for all tile sprites
        this.container = new Container();
        this.container.sortableChildren = true; // Enable manual depth sorting via zIndex

        // Store texture references for quick lookup
        this.textures = {
            [TileType.Grass]: grass,
            [TileType.Wood]: wood,
            [TileType.Iron]: iron,
        };

        this.map = generateTerrainMap();

        //make a pool wiht grass and resoses
        const poolSize = 3500;
        for (let i = 0; i < poolSize; i++) {
            const tile = new Sprite(this.textures[TileType.Grass]);
            tile.width = tileWidth;
            tile.height = tileHeight;
            tile.visible = false; 

            this.tiles.push(tile);
            this.container.addChild(tile);
        }
    }

    /**
     * Update visible tiles based on screen size and camera position
     */
    update(screenWidth: number, screenHeight: number, cameraX: number, cameraY: number) {
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

        const minGridX = Math.floor(Math.min(...corners.map((corner) => corner.x))) - this.viewPadding;
        const maxGridX = Math.ceil(Math.max(...corners.map((corner) => corner.x))) + this.viewPadding;
        const minGridY = Math.floor(Math.min(...corners.map((corner) => corner.y))) - this.viewPadding;
        const maxGridY = Math.ceil(Math.max(...corners.map((corner) => corner.y))) + this.viewPadding;

for (let x = minGridX; x <= maxGridX; x++) {
            for (let y = minGridY; y <= maxGridY; y++) {
                if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) {
                    continue;
                }

                const tileX = isoX(x, y);
                const tileY = isoY(x, y);
                const screenX = tileX + cameraX;
                const screenY = tileY + cameraY;

                const bufferX = tileWidth;
                const bufferY = tileHeight;
                if (
                    screenX < -bufferX || 
                    screenX > screenWidth + bufferX || 
                    screenY < -bufferY || 
                    screenY > screenHeight + bufferY
                ) {
                    continue; 
                }

                // LAYER 1: Always render GRASS (ground) first
                const grassTile = this.tiles[index++];
                if (!grassTile) return;

                grassTile.visible = true;
                grassTile.texture = this.textures[TileType.Grass];
                grassTile.anchor.set(0, 0); // Top-left corner of the rhombus
                grassTile.width = tileWidth;
                grassTile.height = tileHeight;
                grassTile.x = tileX;
                grassTile.y = tileY;
                grassTile.zIndex = x + y; // Default zIndex of the ground

                // LAYER 2: Render object (wood/ore) on top of grass
                const tileType = this.map[y]?.[x] ?? TileType.Grass;

                if (tileType !== TileType.Grass) {
                    const objectTile = this.tiles[index++];
                    if (!objectTile) return;

                    objectTile.visible = true;
                    objectTile.texture = this.textures[tileType];
                    objectTile.anchor.set(0.5, 0.6); // Bottom-center
                    objectTile.scale.set(0.25);    // Keep proportions and scale down to 25%
                    
                    // Position the object exactly in the center of the grass rhombus
                    objectTile.x = tileX + tileWidth / 2;
                    objectTile.y = tileY + tileHeight / 2;
                    
                    // A tiny offset of +0.1 forces the object to render on top of its grass tile
                    objectTile.zIndex = x + y + 0.1; 
                }
            }
        }

        // Hide remaining unused sprites in the pool
        for (; index < this.tiles.length; index++) {
            this.tiles[index].visible = false;
        }
    }

    harvestAt(x: number, y: number): HarvestableTile | null {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) {
            return null;
        }

        const tileType = this.map[y]?.[x] ?? TileType.Grass;

        if (!isHarvestableTile(tileType)) {
            return null;
        }

        this.map[y][x] = TileType.Grass;

        return tileType;
    }

    clearTile(x: number, y: number) {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) {
            return;
        }

        this.map[y][x] = TileType.Grass;
    }

    private screenToGrid(screenX: number, screenY: number) {
        return {
            x: screenY / tileHeight + screenX / tileWidth,
            y: screenY / tileHeight - screenX / tileWidth,
        };
    }
}