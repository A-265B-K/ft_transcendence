import { Assets, Texture } from "pixi.js";
import castle1Url from "../../assets/castle1.png";
import castle2Url from "../../assets/castle2.png";
import castle3Url from "../../assets/castle3.png";
import castle4Url from "../../assets/castle4.png";
import down1Url from "../../assets/down1.png";
import down2Url from "../../assets/down2.png";
import grassUrl from "../../assets/grass.png";
import ironUrl from "../../assets/iron.png";
import left1Url from "../../assets/left1.png";
import left2Url from "../../assets/left2.png";
import right1Url from "../../assets/right1.png";
import right2Url from "../../assets/right2.png";
import standUrl from "../../assets/stand.png";
import up1Url from "../../assets/up1.png";
import up2Url from "../../assets/up2.png";
import woodUrl from "../../assets/wood.png";

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
        Assets.load(grassUrl),
        Assets.load(woodUrl),
        Assets.load(ironUrl),

        Assets.load(castle1Url),
        Assets.load(castle2Url),
        Assets.load(castle3Url),
        Assets.load(castle4Url),

        Assets.load(down1Url),
        Assets.load(down2Url),

        Assets.load(up1Url),
        Assets.load(up2Url),

        Assets.load(left1Url),
        Assets.load(left2Url),

        Assets.load(right1Url),
        Assets.load(right2Url),

        Assets.load(standUrl)
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
