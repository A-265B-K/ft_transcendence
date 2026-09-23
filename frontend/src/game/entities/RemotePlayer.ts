import { AnimatedSprite, Texture, Container } from "pixi.js";
import { isoX, isoY } from "../world/iso";
import { Weapon, type WeaponType } from "./weapons/weapon";
import { Sword } from "./weapons/sword";
import { dagger } from "./weapons/dagger";
import { axe } from "./weapons/axe";
import { spear } from "./weapons/spear";

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
    readonly container = new Container();
    weapon?: Weapon;

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
        this.sprite.onFrameChange = (frame: number) => 
        {
            this.weapon?.updateweaponpos(frame, this.direction)
        }

        this.sprite.anchor.set(0.5, 1);
        this.container.scale.set(0.5);
        this.container.sortableChildren = true;
        this.container.addChild(this.sprite);

        this.sprite.animationSpeed = 0.12;
        this.sprite.loop = true;
        this.sprite.stop();

        this.sprite.texture = textures.playerStand;
    }

    placeAt(x: number, y: number) {
        this.gridX = x;
        this.gridY = y;

        this.container.x = isoX(x, y);
        this.container.y = isoY(x, y);
        this.container.zIndex = x + y + 1;
    }

    updatePosition(x: number, y: number, moving: boolean) {
        const deltaX = x - this.gridX;
        const deltaY = y - this.gridY;

        if (!moving)
        {
            this.stopWalking();
            this.placeAt(x, y);
        }
        else
        {
            this.updateDirection(deltaX, deltaY);
            this.startWalking();
            this.placeAt(x, y);
        }
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
        this.sprite.texture = this.textures.playerStand;

        if (this.weapon && !this.weapon.isAttacking)
        {
            this.weapon.makevisible();
            this.weapon.setPosition(-44, -84);
            this.weapon.setframe(0);
        }
    }
        equipWeapon(type: WeaponType)
        {
            if (this.weapon)
            {
                this.container.removeChild(this.weapon.sprite)
                this.weapon.sprite.destroy();
            }
            switch (type)
            {
                case ("sword"):
                    this.weapon = new Sword();
                    break ;
                case "dagger":
                    this.weapon = new dagger();
                    break;
                case "axe":
                    this.weapon = new axe();
                    break;
                case "spear":
                    this.weapon = new spear();
                    break ;
            }
            if (this.weapon)
            {
                this.weapon.setPosition(-44, -84)
                this.container.addChild(this.weapon.sprite)
    
            }
        }
    
        attackanimation(direction: Direction): boolean
        {
            if (!this.weapon)
                return false;
            this.weapon?.attack(direction)
            return true;
        }
}