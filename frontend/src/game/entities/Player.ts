import { AnimatedSprite, Texture } from "pixi.js";
import { MAP_SIZE } from "../config/constants";
import { isoX, isoY } from "../world/iso";
import { Inventory } from "./Inventory";

export type InputState = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
};

export type PlayerTextures = {
    playerDown1: Texture;
    playerDown2: Texture;
    playerUp1: Texture;
    playerUp2: Texture;
    playerLeft1: Texture;
    playerLeft2: Texture;
    playerRight1: Texture;
    playerRight2: Texture;
    playerStand: Texture;
};

type Direction = "up" | "down" | "left" | "right";

export class Player {
    sprite: AnimatedSprite;

    readonly inventory = new Inventory();

    gridX = 0;
    gridY = 0;

    speed = 10;

    private direction: Direction = "down";
    private readonly textures: PlayerTextures;

    constructor(textures: PlayerTextures) {
        this.textures = textures;

        this.sprite = new AnimatedSprite([
            textures.playerDown1,
            textures.playerDown2,
        ]);

        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.5);

        this.sprite.animationSpeed = 0.12;
        this.sprite.loop = true;
        this.sprite.stop();

        this.sprite.texture = textures.playerStand;
    }

    placeAt(gridX: number, gridY: number) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.syncSpritePosition();
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
            this.updateDirection(moveX, moveY);

            if (!this.sprite.playing) {
                this.sprite.play();
            }

            const step = this.speed * deltaSeconds;

            this.gridX += (moveX / magnitude) * step;
            this.gridY += (moveY / magnitude) * step;
        } else {
            this.sprite.stop();
            this.sprite.texture = this.textures.playerStand;
        }

        this.gridX = Math.max(0, Math.min(MAP_SIZE - 1, this.gridX));
        this.gridY = Math.max(0, Math.min(MAP_SIZE - 1, this.gridY));

        this.syncSpritePosition();
    }

    private updateDirection(moveX: number, moveY: number) {
        const newDirection =
            Math.abs(moveX) > Math.abs(moveY)
                ? moveX < 0 ? "left" : "right"
                : moveY < 0 ? "up" : "down";

        if (newDirection === this.direction) {
            return;
        }

        this.direction = newDirection;
        this.setWalkAnimation();
    }

    private setWalkAnimation() {
        const animations = {
            down: [
                this.textures.playerDown1,
                this.textures.playerDown2,
            ],
            up: [
                this.textures.playerUp1,
                this.textures.playerUp2,
            ],
            left: [
                this.textures.playerLeft1,
                this.textures.playerLeft2,
            ],
            right: [
                this.textures.playerRight1,
                this.textures.playerRight2,
            ],
        };

        this.sprite.textures = animations[this.direction];
        this.sprite.gotoAndPlay(0);
    }

    private syncSpritePosition() {
        this.sprite.x = isoX(this.gridX, this.gridY);
        this.sprite.y = isoY(this.gridX, this.gridY);
        this.sprite.zIndex = this.gridX + this.gridY + 1;
    }
}