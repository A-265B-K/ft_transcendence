import { Sprite, Texture } from "pixi.js";
import { isoX, isoY } from "../world/iso";

export class RemotePlayer {
    readonly sprite: Sprite;

    userID: string;
    gridX = 0;
    gridY = 0;

    constructor(
        texture: Texture,
        userID: string
    ) {
        this.userID = userID;

        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 0.8);
    }


    placeAt(x: number, y: number) {
        this.gridX = x;
        this.gridY = y;

        this.sprite.x = isoX(x, y);
        this.sprite.y = isoY(x, y);
    }


    updatePosition(x: number, y: number) {
        this.placeAt(x, y);
    }
}