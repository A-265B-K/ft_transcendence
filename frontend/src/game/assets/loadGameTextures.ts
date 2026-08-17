import { Assets, Texture } from "pixi.js";

export type GameTextures = {
    grass: Texture;
    wood: Texture;
    iron: Texture;
    castle1: Texture;
    castle2: Texture;
    castle3: Texture;
    castle4: Texture;

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

export async function loadGameTextures(): Promise<GameTextures> {
    const [
        grass,
        wood,
        iron,
        castle1,
        castle2,
        castle3,
        castle4,

        playerDown1,
        playerDown2,

        playerUp1,
        playerUp2,

        playerLeft1,
        playerLeft2,

        playerRight1,
        playerRight2,

        playerStand,
    ] = await Promise.all([
        Assets.load("/src/assets/grass.png"),
        Assets.load("/src/assets/wood.png"),
        Assets.load("/src/assets/iron.png"),

        Assets.load("/src/assets/castle1.png"),
        Assets.load("/src/assets/castle2.png"),
        Assets.load("/src/assets/castle3.png"),
        Assets.load("/src/assets/castle4.png"),

        Assets.load("/src/assets/down1.png"),
        Assets.load("/src/assets/down2.png"),

        Assets.load("/src/assets/up1.png"),
        Assets.load("/src/assets/up2.png"),

        Assets.load("/src/assets/left1.png"),
        Assets.load("/src/assets/left2.png"),

        Assets.load("/src/assets/right1.png"),
        Assets.load("/src/assets/right2.png"),

        Assets.load("/src/assets/stand.png")
    ]);

    return {
        grass,
        wood,
        iron,
        castle1,
        castle2,
        castle3,
        castle4,

        playerDown1,
        playerDown2,   

        playerUp1,
        playerUp2,

        playerLeft1,
        playerLeft2,

        playerRight1,
        playerRight2,

        playerStand,
    };
}