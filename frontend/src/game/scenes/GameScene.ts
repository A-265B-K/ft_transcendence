import { Container } from "pixi.js";
import { Player, type InputState } from "../entities/Player";
import { Castle } from "../entities/Castle";
import { Camera } from "../systems/Camera";
import { GameMap } from "../world/GameMap";
import type { GameTextures } from "../assets/loadGameTextures";
import { MAP_SIZE } from "../config/constants";
import { isoX, isoY } from "../world/iso";

const CASTLE_EDGE_MARGIN_X = 16;
const CASTLE_EDGE_MARGIN_Y = 20;

export class GameScene {
    readonly world: Container;
    readonly map: GameMap;
    readonly player: Player;
    readonly castle: Castle;
    readonly camera: Camera;

    constructor(textures: GameTextures) {
        this.world = new Container();
        this.world.sortableChildren = true;

        this.map = new GameMap(textures.grass, textures.wood, textures.iron);
        this.world.addChild(this.map.container);

        this.player = new Player(textures.player);
        this.player.placeAt(this.getRandomSpawnX(), this.getRandomSpawnY());
        this.world.addChild(this.player.sprite);

        this.castle = new Castle(textures.castle);
        this.castle.placeAt(this.getCastleSpawnX(), this.getCastleSpawnY());
        this.map.clearTile(this.castle.gridX, this.castle.gridY);
        this.world.addChild(this.castle.container);

        this.camera = new Camera(this.world);
    }

    private getCastleSpawnX() {
        return this.player.gridX - 10;
    }

    private getCastleSpawnY() {
        return this.player.gridY - 5;
    }

    private getRandomSpawnX() {
        const minX = CASTLE_EDGE_MARGIN_X + 10;
        const maxX = MAP_SIZE - 2 - CASTLE_EDGE_MARGIN_X;
        
        return minX + Math.floor(Math.random() * (maxX - minX));
    }

     private getRandomSpawnY() {
        const minY = CASTLE_EDGE_MARGIN_Y + 5;
        const maxY = MAP_SIZE - 2 - CASTLE_EDGE_MARGIN_Y;
        
        return minY + Math.floor(Math.random() * (maxY - minY));
    }

    update(inputState: InputState, screenWidth: number, screenHeight: number, deltaSeconds: number) {
        // Updating player input
        this.player.update(inputState, deltaSeconds);

        // 1. The collision of the edges of the map
        this.clampPlayerToMap();

        // 2. Smooth Lock Collision
        this.handleCastleCollision();

        
        const centerX = Math.floor(this.player.gridX);
        const centerY = Math.floor(this.player.gridY);
        
        const range = 1; 
        
        let harvested = false;

       // Bypassing the tile grid inside the box
        for (let dx = -range; dx <= range && !harvested; dx++) {
            for (let dy = -range; dy <= range && !harvested; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;

                const harvestedTile = this.map.harvestAt(x, y);

                if (harvestedTile) {
                    if (harvestedTile === "wood") this.player.inventory.add("wood");
                    if (harvestedTile === "iron") this.player.inventory.add("iron");
                    
                    // We interrupt the collection on this frame so as not to vacuum everything around instantly
                    harvested = true; 
                }
            }
        }

        // Upgrade attempt
        if (inputState.right && this.isNearCastle() && this.tryUpgradeCastle()) {
            // Castle upgrade handled
        }

        // Camera upgrade (smooth follow)
        this.camera.update(this.player, screenWidth, screenHeight, deltaSeconds);

        // (Screen-Space Culling)
        this.map.update(screenWidth, screenHeight, this.camera.x, this.camera.y);
    }

    /** Keeping the player inside the map with an indentation */
    private clampPlayerToMap() {
        const margin = 1.5; 
        const minBound = margin;
        const maxBound = MAP_SIZE - 1 - margin;

        const boundedX = Math.max(minBound, Math.min(maxBound, this.player.gridX));
        const boundedY = Math.max(minBound, Math.min(maxBound, this.player.gridY));

        this.player.placeAt(boundedX, boundedY);
    }

    /** Smooth repulsion (rectangular box collision) from the castle */
    private handleCastleCollision() {
        // Calculate the distance from the center of the castle to the player along the X and Y axes
        const dx = this.player.gridX - this.castle.gridX;
        const dy = this.player.gridY - this.castle.gridY;

        const halfWidth = 3;  // Half-width (X axis)
        const halfHeight = 3; // Half-height (Y axis)

        // Calculate the penetration depth of the player inside the castle rectangle
        const overlapX = halfWidth - Math.abs(dx);
        const overlapY = halfHeight - Math.abs(dy);

        // If the player crosses the boundaries along both axes, a collision has occurred
        if (overlapX > 0 && overlapY > 0) {
            // Push the player out along the axis with the least penetration.
            // This provides a smooth sliding effect along the walls!
            if (overlapX < overlapY) {
                // Push along the X axis (left or right)
                const pushX = dx > 0 ? halfWidth : -halfWidth;
                this.player.placeAt(this.castle.gridX + pushX, this.player.gridY);
            } else {
                // Push along the Y axis (up or down)
                const pushY = dy > 0 ? halfHeight : -halfHeight;
                this.player.placeAt(this.player.gridX, this.castle.gridY + pushY);
            }
        }
    }

    private isNearCastle() {
        const distanceX = Math.abs(this.player.gridX - this.castle.gridX);
        const distanceY = Math.abs(this.player.gridY - this.castle.gridY);
        return Math.max(distanceX, distanceY) <= 3;
    }

    getCastlePointer() {
        const playerScreenX = isoX(this.player.gridX, this.player.gridY);
        const playerScreenY = isoY(this.player.gridX, this.player.gridY);
        const castleScreenX = isoX(this.castle.gridX, this.castle.gridY);
        const castleScreenY = isoY(this.castle.gridX, this.castle.gridY);
        const dx = castleScreenX - playerScreenX;
        const dy = castleScreenY - playerScreenY;
        const distance = Math.hypot(this.castle.gridX - this.player.gridX, this.castle.gridY - this.player.gridY);
        const rotation = Math.atan2(dy, dx);
        const bearingDegrees = (rotation * 180) / Math.PI;
        const normalizedBearing = (bearingDegrees + 360) % 360;

        return {
            rotation,
            distance,
            visible: distance >= 0.1,
            bearingDegrees: normalizedBearing,
            direction: this.getCompassDirection(normalizedBearing),
        };
    }

    private getCompassDirection(degrees: number) {
        const directions = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"];
        const index = Math.round(degrees / 45) % directions.length;
        return directions[index];
    }

    private tryUpgradeCastle() {
        const nextLevel = this.castle.level + 1;
        const cost = this.castle.getUpgradeCost(nextLevel);

        if (!cost) return false;
        if (!this.player.inventory.canAfford(cost)) return false;
        if (!this.player.inventory.spend(cost)) return false;

        return this.castle.upgrade();
    }
}