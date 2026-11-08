import { Container } from 'pixi.js';
import { Player } from '../entities/Player';
import { isoX, isoY, tileHeight, tileWidth } from '../world/iso';

export class Camera {
    private readonly mapWidth: number;
    private readonly mapHeight: number;

    world: Container;
    x = 0;
    y = 0;

    // Camera follow speed (affects smoothness of tracking)
    speed = 10;

    constructor(world: Container, mapWidth: number, mapHeight: number) {
        this.world = world;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }

    update(
        player: Player,
        screenW: number,
        screenH: number,
        deltaSeconds: number
    ) {
        // Convert player grid coordinates to isometric world pixel coordinates
        const targetX = isoX(player.gridX, player.gridY);
        const targetY = isoY(player.gridX, player.gridY);

        // Calculate desired camera offset to center player on screen
        const desiredX = screenW / 2 - targetX;
        const desiredY = screenH / 2 - targetY;

        // Calculate camera bounds to prevent viewing outside the map
        const minX = screenW - (this.mapWidth * tileWidth) / 2;
        const maxX = (this.mapWidth * tileWidth) / 2;

        const minY = screenH - (this.mapHeight * tileHeight - tileHeight / 2);
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
