import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { isoX, isoY } from '../world/iso';

export type CastleTextures = {
    castle1: Texture;
    castle2: Texture;
    castle3: Texture;
    castle4: Texture;
    destroyedCastle: Texture;
};

export class Castle {
    readonly container: Container;
    readonly sprite: Sprite;
    readonly levelLabel: Text;
    private readonly healthBar: Graphics;

    gridX = 0;
    gridY = 0;
    level = 1;
    private health = 100;

    private readonly textures: CastleTextures;
    private readonly mapWidth: number;
    private readonly mapHeight: number;

    constructor(textures: CastleTextures, mapWidth: number, mapHeight: number) {
        this.textures = textures;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        this.container = new Container();
        this.sprite = new Sprite(textures.castle1);
        this.sprite.anchor.set(0.5, 0.6);
        this.sprite.scale.set(0.84, 0.6);
        this.levelLabel = new Text({
            text: 'Lv. 1',
            style: new TextStyle({
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                fontWeight: '700',
                fill: '#f4f7fb',
                stroke: {
                    color: '#081016',
                    width: 4
                },
                align: 'center'
            })
        });

        this.levelLabel.anchor.set(0.5, 2);
        this.levelLabel.y = -76;
        this.healthBar = new Graphics();
        this.healthBar.position.set(-24, -98);
        this.container.addChild(this.sprite);
        this.container.addChild(this.healthBar);
        this.container.addChild(this.levelLabel);
        this.setHealth(100);
        this.refreshLabel();
    }

    placeAt(gridX: number, gridY: number) {
        this.gridX = Math.max(0, Math.min(this.mapWidth - 2, gridX));

        this.gridY = Math.max(0, Math.min(this.mapHeight - 2, gridY));

        this.syncPosition();
    }

    setLevel(level: number) {
        if (level < 1 || level > 4) return;

        this.level = level;

        this.updateTexture();
        this.refreshLabel();
    }

    setHealth(health: number) {
        const width = 48;
        this.health = Math.max(0, Math.min(100, health));
        const ratio = Math.max(0, Math.min(1, health / 100));
        this.healthBar.clear();
        this.healthBar.rect(0, 0, width, 5).fill('#222b33');
        this.healthBar.rect(0, 0, width * ratio, 5).fill('#e65b47');
        this.updateTexture();
        this.refreshLabel();
    }

    private updateTexture() {
        if (this.health <= 0) {
            this.sprite.texture = this.textures.destroyedCastle;
            return;
        }

        const textures: Record<number, Texture> = {
            1: this.textures.castle1,
            2: this.textures.castle2,
            3: this.textures.castle3,
            4: this.textures.castle4
        };

        this.sprite.texture = textures[this.level];
    }

    private refreshLabel() {
        if (this.health <= 0) {
            this.levelLabel.text = 'Destroyed';
            return;
        }

        if (this.level >= 4) {
            this.levelLabel.text = `Lv. ${this.level}\nMax level`;
            return;
        }

        this.levelLabel.text = `Lv. ${this.level}`;
    }

    private syncPosition() {
        this.container.x = isoX(this.gridX, this.gridY);
        this.container.y = isoY(this.gridX, this.gridY);
        this.container.zIndex = this.gridX + this.gridY;
    }
}
