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
        this.sprite.visible = false;
    }
    makevisible(): void
    {
        this.sprite.visible = true;
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

}

