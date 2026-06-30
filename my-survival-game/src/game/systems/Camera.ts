import { Container } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { Player } from "../entities/Player";
import { isoX, isoY, tileHeight, tileWidth } from "../world/iso";

export class Camera {
    world: Container;

    x = 0;
    y = 0;

    speed = 10;

    constructor(world: Container) {
        this.world = world;
    }

    update(player: Player, screenW: number, screenH: number, deltaSeconds: number) {

        // convert player grid → world pixel position
        const targetX = isoX(player.gridX, player.gridY);
        const targetY = isoY(player.gridX, player.gridY);

        // center camera on player
        const desiredX = screenW / 2 - targetX;
        const desiredY = screenH / 2 - targetY;

        const minX = screenW - MAP_SIZE * tileWidth / 2;
        const maxX = MAP_SIZE * tileWidth / 2;
        const minY = screenH - (MAP_SIZE * tileHeight - tileHeight / 2);
        const maxY = tileHeight / 2;

        const clampedX = Math.max(minX, Math.min(maxX, desiredX));
        const clampedY = Math.max(minY, Math.min(maxY, desiredY));

        // smooth follow (lerp)
        const follow = 1 - Math.exp(-this.speed * deltaSeconds);

        this.x += (clampedX - this.x) * follow;
        this.y += (clampedY - this.y) * follow;

        this.world.x = this.x;
        this.world.y = this.y;
    }
}