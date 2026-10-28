import { Container, Sprite, type Texture } from 'pixi.js';
import type { Vec2 } from '../../types/game';
import { isoX, isoY } from '../world/iso';

export class Catapult {
    readonly id: string;
    readonly sprite: Sprite;
    position: Vec2;

    constructor(id: string, texture: Texture, position: Vec2) {
        this.id = id;
        this.position = { ...position };
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.5);
        this.update(position);
    }

    spawn(world: Container) {
        world.addChild(this.sprite);
    }

    update(position: Vec2) {
        this.position = { ...position };
        const { x, y } = this.position;
        this.sprite.position.set(isoX(x, y), isoY(x, y));
        this.sprite.zIndex = x + y + 1;
    }
}
