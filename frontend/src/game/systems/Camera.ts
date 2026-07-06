/**
 * Camera System
 * 
 * Manages the viewport and camera movement.
 * Smoothly follows the player while keeping them centered on screen.
 * Implements bounds checking to prevent showing out-of-map areas.
 */

import { Container } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { Player } from "../entities/Player";
import { isoX, isoY, tileHeight, tileWidth } from "../world/iso";

/**
 * Camera class - manages viewport and smooth player following
 */
export class Camera {
    // Reference to the world container that will be panned
    world: Container;

    // Current camera position (offset of world container)
    x = 0;
    y = 0;

    // Camera follow speed (affects smoothness of tracking)
    speed = 10;

    /**
     * Constructor - initializes camera with world reference
     * @param world - The Pixi.js container to pan/move
     */
    constructor(world: Container) {
        this.world = world;
    }

    /**
     * Update camera position to follow player
     * @param player - The player to follow
     * @param screenW - Screen width in pixels
     * @param screenH - Screen height in pixels
     * @param deltaSeconds - Time since last frame (seconds)
     */
    update(player: Player, screenW: number, screenH: number, deltaSeconds: number) {
        // Convert player grid coordinates to isometric world pixel coordinates
        const targetX = isoX(player.gridX, player.gridY);
        const targetY = isoY(player.gridX, player.gridY);

        // Calculate desired camera offset to center player on screen
        const desiredX = screenW / 2 - targetX;
        const desiredY = screenH / 2 - targetY;

        // Calculate camera bounds to prevent viewing outside the map
        const minX = screenW - MAP_SIZE * tileWidth / 2;
        const maxX = MAP_SIZE * tileWidth / 2;
        const minY = screenH - (MAP_SIZE * tileHeight - tileHeight / 2);
        const maxY = tileHeight / 2;

        // Clamp desired position to bounds
        const clampedX = Math.max(minX, Math.min(maxX, desiredX));
        const clampedY = Math.max(minY, Math.min(maxY, desiredY));

        // Smooth camera following using exponential decay (lerp)
        const follow = 1 - Math.exp(-this.speed * deltaSeconds);

        // Interpolate towards clamped position
        this.x += (clampedX - this.x) * follow;
        this.y += (clampedY - this.y) * follow;

        // Apply camera offset to world container
        this.world.x = this.x;
        this.world.y = this.y;
    }
}