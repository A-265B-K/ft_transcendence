/**
 * Game Map System
 * 
 * Generates and manages the game world map.
 * Uses a sprite pool for efficient rendering of visible tiles.
 * Implements view frustum culling to only render tiles near the player.
 */

import { Container, Sprite, Texture, } from "pixi.js";
import { isoX, isoY } from "./iso";
import { MAP_SIZE } from "../config/constants";
import { TileType } from "./TileType";

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

    // View radius in tiles (tiles within this distance of player are rendered)
    viewSize = 25;

    /**
     * Constructor - initializes map with textures and generates terrain
     * @param grass - Texture for grass tiles
     * @param wood - Texture for wood/forest tiles
     * @param iron - Texture for iron ore tiles
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

        // Generate the procedural map
        this.generateMap();

        // Create a pool of reusable tile sprites to avoid allocation overhead
        const poolSize = 3000;
        for (let i = 0; i < poolSize; i++) {
            const tile = new Sprite(this.textures[TileType.Grass]);
            // Tile dimensions for isometric rendering
            tile.width = 64;
            tile.height = 32;
            tile.visible = false; // Hidden by default, shown when in view

            this.tiles.push(tile);
            this.container.addChild(tile);
        }
    }


    /**
     * Generate a procedural map using random tile distribution
     * Probabilities:
     * - 0.12% iron ore
     * - 0.8% wood/forest
     * - 99.08% grass
     */
    private generateMap() {
        for (let y = 0; y < MAP_SIZE; y++) {
            this.map[y] = [];

            for (let x = 0; x < MAP_SIZE; x++) {
                const r = Math.random();
                if (r < 0.0012) this.map[y][x] = TileType.Iron;        // Rare
                else if (r < 0.008) this.map[y][x] = TileType.Wood;    // Uncommon
                else this.map[y][x] = TileType.Grass;                   // Common
            }
        }
    }

    /**
     * Update visible tiles based on player position
     * Only renders tiles within viewSize of the player (view frustum culling)
     * @param playerX - Player's grid X coordinate
     * @param playerY - Player's grid Y coordinate
     */
    update(playerX: number, playerY: number) {
        let index = 0;

        // Calculate view boundaries around player
        const view = this.viewSize;
        const centerX = Math.floor(playerX);
        const centerY = Math.floor(playerY);

        // Iterate through visible tiles around the player
        for (let x = centerX - view; x < centerX + view; x++) {
            for (let y = centerY - view; y < centerY + view; y++) {
                // Skip tiles outside map bounds
                if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) continue;

                // Get sprite from pool
                const tile = this.tiles[index++];
                if (!tile) return;

                // Get tile type from map data
                const tileType = this.map[y]?.[x] ?? TileType.Grass;
                
                // Configure and render the tile
                tile.visible = true;
                tile.texture = this.textures[tileType];
                tile.x = isoX(x, y);           // Convert to screen coordinates
                tile.y = isoY(x, y);
                tile.zIndex = x + y;           // Depth sorting for isometric rendering
            }
        }

        // Hide remaining sprites in pool
        for (; index < this.tiles.length; index++) {
            this.tiles[index].visible = false;
        }
    }
}