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
    readonly textures: Texture
    private static textureCatalogue?: WeaponTextureCatalogue

    constructor(type: WeaponType)
    {
        const textures = Weapon.textureCatalogue?.[type]
        this.type = type;
        this.textures = textures;
        this.sprite = new Sprite(this.textures[0]);
        this.sprite.anchor.set(0.5, 0.8);
        this.sprite.scale.set(0.1);
    }
       
    setPosition(x: number, y: number): void
    {
        this.sprite.position.set(x, y);
    }

    setTexture(texture: Texture): void
    {
        this.sprite.texture = texture;
    }

    static configureWeaponTextures(catalogue: WeaponTextureCatalogue): void
    {
        Weapon.textureCatalogue = catalogue;
    }
}

