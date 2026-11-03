import { Container, Sprite, type Texture } from 'pixi.js';
import type { Vec2 } from '../../types/game';
import { isoX, isoY } from '../world/iso';

export type CatapultDirection = 'up' | 'down' | 'left' | 'right';

export type CatapultTextures = {
    idle: Texture;
    moving: Record<CatapultDirection, Texture>;
    firing: Record<CatapultDirection, Texture>;
    broken: Texture;
};

export class Catapult {
    readonly id: string;
    readonly sprite: Sprite;
    position: Vec2;
    private readonly textures: CatapultTextures;
    private segmentStart: Vec2;
    private targetPosition: Vec2;
    private interpolationElapsed = 0;
    private readonly interpolationDurationSeconds = 0.25;
    private direction: CatapultDirection = 'down';
    private firingElapsed = 0;
    private brokenElapsed: number | null = null;
    private readonly firingDurationSeconds = 0.45;
    private readonly brokenDurationSeconds = 0.7;

    constructor(
        id: string,
        textures: CatapultTextures,
        position: Vec2
    ) {
        this.id = id;
        this.textures = textures;
        this.position = { ...position };
        this.segmentStart = { ...position };
        this.targetPosition = { ...position };
        this.sprite = new Sprite(textures.idle);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.5);
        this.renderPosition();
    }

    spawn(world: Container) {
        world.addChild(this.sprite);
    }

    setTargetPosition(position: Vec2) {
        if (this.brokenElapsed !== null) return;

        this.segmentStart = { ...this.position };
        this.targetPosition = { ...position };
        this.interpolationElapsed = 0;
        const deltaX = position.x - this.position.x;
        const deltaY = position.y - this.position.y;
        if (deltaX === 0 && deltaY === 0) return;

        this.direction = this.getDirection(deltaX, deltaY);
        this.updateTexture();
    }

    fire(direction: CatapultDirection) {
        if (this.brokenElapsed !== null) return;
        this.direction = direction;
        this.firingElapsed = this.firingDurationSeconds;
        this.updateTexture();
    }

    break() {
        if (this.brokenElapsed !== null) return;
        this.brokenElapsed = 0;
        this.sprite.tint = 0x999999;
        this.sprite.texture = this.textures.broken;
    }

    update(deltaSeconds: number): boolean {
        if (this.brokenElapsed !== null) {
            this.brokenElapsed += deltaSeconds;
            this.sprite.alpha = Math.max(
                0,
                1 - this.brokenElapsed / this.brokenDurationSeconds
            );
            return this.brokenElapsed >= this.brokenDurationSeconds;
        }

        if (this.firingElapsed > 0) {
            this.firingElapsed = Math.max(0, this.firingElapsed - deltaSeconds);
            if (this.firingElapsed === 0) this.updateTexture();
        }

        if (this.interpolationElapsed < this.interpolationDurationSeconds) {
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
            if (this.interpolationElapsed === this.interpolationDurationSeconds) {
                this.updateTexture();
            }
        }

        return false;
    }

    private getDirection(deltaX: number, deltaY: number): CatapultDirection {
        const screenDeltaX = deltaX - deltaY;
        const screenDeltaY = deltaY + deltaX;

        return Math.abs(screenDeltaX) > Math.abs(screenDeltaY)
            ? screenDeltaX < 0
                ? 'left'
                : 'right'
            : screenDeltaY < 0
              ? 'up'
              : 'down';
    }

    private updateTexture() {
        if (this.brokenElapsed !== null) return;
                this.sprite.texture = this.firingElapsed > 0
                        ? this.textures.firing[this.direction]
                        : this.interpolationElapsed < this.interpolationDurationSeconds
                            ? this.textures.moving[this.direction]
                            : this.textures.idle;
        this.sprite.tint = this.firingElapsed > 0 ? 0xffd27a : 0xffffff;
    }

    private renderPosition() {
        const { x, y } = this.position;
        this.sprite.position.set(isoX(x, y), isoY(x, y));
        this.sprite.zIndex = x + y + 1;
    }
}
