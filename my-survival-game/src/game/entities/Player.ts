import { Sprite, Texture } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { isoX, isoY } from "../world/iso";

export type InputState = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
};

export class Player {
    sprite: Sprite;
    inventory = {
        wood: 0,
        iron: 0,
    }
    gridX = 100;
    gridY = 100;

    speed = 15;

    constructor(texture: Texture) {
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.5);
    }

    update(input: InputState, deltaSeconds: number) {
        let moveX = 0;
        let moveY = 0;

        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        const magnitude = Math.hypot(moveX, moveY);

        if (magnitude > 0) {
            const step = this.speed * deltaSeconds;
            this.gridX += (moveX / magnitude) * step;
            this.gridY += (moveY / magnitude) * step;
        }

        this.gridX = Math.max(0, Math.min(MAP_SIZE - 1, this.gridX));
        this.gridY = Math.max(0, Math.min(MAP_SIZE - 1, this.gridY));

        this.sprite.x = isoX(this.gridX, this.gridY);
        this.sprite.y = isoY(this.gridX, this.gridY);
    }
}