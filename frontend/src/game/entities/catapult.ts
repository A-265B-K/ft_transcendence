import { Container, Sprite, type Texture } from 'pixi.js';
import type { Vec2 } from '../../types/game';
import { isoX, isoY } from '../world/iso';

export class Catapult {
    readonly id: string;
    readonly sprite: Sprite;
    position: Vec2;
    private segmentStart: Vec2;
    private targetPosition: Vec2;
    private interpolationElapsed = 0;
    private readonly interpolationDurationSeconds = 0.25;

    constructor(id: string, texture: Texture, position: Vec2) {
        this.id = id;
        this.position = { ...position };
        this.segmentStart = { ...position };
        this.targetPosition = { ...position };
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.5);
        this.renderPosition();
    }

    spawn(world: Container) {
        world.addChild(this.sprite);
    }

    setTargetPosition(position: Vec2) {
        this.segmentStart = { ...this.position };
        this.targetPosition = { ...position };
        this.interpolationElapsed = 0;
    }

    update(deltaSeconds: number) {
        if (this.interpolationElapsed >= this.interpolationDurationSeconds)
            return;

        this.interpolationElapsed = Math.min(
            this.interpolationElapsed + deltaSeconds,
            this.interpolationDurationSeconds
        );
        const progress =
            this.interpolationElapsed / this.interpolationDurationSeconds;
        this.position = {
            x:
                this.segmentStart.x +
                (this.targetPosition.x - this.segmentStart.x) * progress,
            y:
                this.segmentStart.y +
                (this.targetPosition.y - this.segmentStart.y) * progress
        };
        this.renderPosition();
    }

    private renderPosition() {
        const { x, y } = this.position;
        this.sprite.position.set(isoX(x, y), isoY(x, y));
        this.sprite.zIndex = x + y + 1;
    }
}
