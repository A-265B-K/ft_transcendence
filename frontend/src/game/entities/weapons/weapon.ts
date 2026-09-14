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

export abstract class Weapon
{
    readonly sprite: Sprite;
    readonly type: string;
    readonly textures: WeaponTextures
    private static textureCatalogue: WeaponTextureCatalogue
    protected attacking = false;
    protected attacktime = 0;

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
        this.sprite.zIndex = -1;
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

    // these methods will be specific to each weapon type, because the animations will be different.
    // They are defined in the subclasses

    abstract update(deltaSeconds: number): void;
    abstract attack(direction: "up" | "down" | "left" | "right"): void;
    abstract updateweaponpos(frame: number, direction : "up" | "down" | "left" | "right") : void;
}




