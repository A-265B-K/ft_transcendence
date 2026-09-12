import { Sprite, type Texture } from "pixi.js";

export type WeaponType =
    | "sword"
    | "axe"
    | "bow"
    | "dagger"
    | "spear"
    | "staff";

export type WeaponTextures = [
    Texture,
    Texture,
    Texture,
    Texture,
];
export type WeaponTextureCatalogue =
    Record<WeaponType, WeaponTextures>;

export class Weapon
{
    readonly sprite: Sprite;
    readonly type: string;
    readonly textures: WeaponTextures
    private static textureCatalogue: WeaponTextureCatalogue
    private attacking = false;
    private attacktime = 0;
    private attackangle = 0;

    constructor(type: WeaponType)
    {
        const textures = Weapon.textureCatalogue?.[type]
        this.type = type;
        this.textures = textures;
        this.sprite = new Sprite(this.textures[0]);
        this.sprite.anchor.set(0.5, 0.8);
        this.sprite.scale.set(0.2);
    }
       
    setPosition(x: number, y: number): void
    {
        this.sprite.position.set(x, y);
    }
    makeinvisible(): void
    {
        this.sprite.zIndex = 0;
    }
    makevisible(): void
    {
        this.sprite.zIndex = 1;
    }

    setTexture(texture: Texture): void
    {
        this.sprite.texture = texture;
    }
    setframe(frame : number): void
    {
        this.sprite.texture = this.textures[frame]
    }

    static configureWeaponTextures(catalogue: WeaponTextureCatalogue): void
    {
        Weapon.textureCatalogue = catalogue;
    }
    attack(direction : "up" | "down" | "left" | "right")
    {
        const directions = {
        up:    { x:  2, y: -1 },
        down:  { x: -2, y:  1 },
        left:  { x: -2, y: -1 },
        right: { x:  2, y:  1 },
    };
        const { x, y } = directions[direction];

        this.attackangle = Math.atan2(x, -y);

        if (direction === "down" && this.attackangle < 0)
            this.attackangle += Math.PI * 2;
        else if (direction === "up" && this.attackangle > 0)
            this.attackangle = -Math.PI / 3;

        this.attacking = true;
        this.attacktime = 0;
    }

    update(deltaSeconds: number): void {
        if (!this.attacking)
            return;

        this.attacktime += deltaSeconds;
        let progress = Math.min(this.attacktime / 0.3, 1);
        this.sprite.rotation = Math.sin(progress * Math.PI) * this.attackangle;;

        if (progress === 1) {
            this.sprite.rotation = 0;
            this.attacking = false;
        }
    }
}

