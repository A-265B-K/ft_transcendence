import { AnimatedSprite, Texture } from "pixi.js";
import { isoX, isoY } from "../world/iso";

type Direction = "up" | "down" | "left" | "right";

export type RemotePlayerTextures = {
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

export class RemotePlayer {
    readonly sprite: AnimatedSprite;

    userId: string;
    gridX = 0;
    gridY = 0;

    private direction: Direction = "down";
    private readonly textures: RemotePlayerTextures;

    constructor(
        textures: RemotePlayerTextures,
        userId: string
    ) {
        this.userId = userId;
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

    placeAt(x: number, y: number) {
        this.gridX = x;
        this.gridY = y;

        this.sprite.x = isoX(x, y);
        this.sprite.y = isoY(x, y);
        this.sprite.zIndex = x + y + 1;
    }

    updatePosition(x: number, y: number) {
        const deltaX = x - this.gridX;
        const deltaY = y - this.gridY;

        const moved = Math.hypot(deltaX, deltaY) > 0.001;

        if (!moved) {
            this.stopWalking();
            this.placeAt(x, y);
            return;
        }

        this.updateDirection(deltaX, deltaY);
        this.startWalking();

        this.placeAt(x, y);
    }

    private updateDirection(
        deltaX: number,
        deltaY: number
    ) {
        let newDirection: Direction;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newDirection =
                deltaX < 0
                    ? "left"
                    : "right";
        } else {
            newDirection =
                deltaY < 0
                    ? "up"
                    : "down";
        }

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

        this.sprite.textures =
            animations[this.direction];

        this.sprite.gotoAndPlay(0);
    }

    private startWalking() {
        if (!this.sprite.playing) {
            this.sprite.play();
        }
    }

    private stopWalking() {
        this.sprite.stop();
        this.sprite.texture =
            this.textures.playerStand;
    }
}