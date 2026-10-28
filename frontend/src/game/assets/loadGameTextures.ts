import { Assets, Texture } from 'pixi.js';
import castle1Url from '../../assets/castle1.png';
import castle2Url from '../../assets/castle2.png';
import castle3Url from '../../assets/castle3.png';
import castle4Url from '../../assets/castle4.png';
import down1Url from '../../assets/down1.png';
import down2Url from '../../assets/down2.png';
import grassUrl from '../../assets/grass.png';
import forestBackgroundUrl from '../../assets/forest-background.webp';
import ironUrl from '../../assets/iron.png';
import left1Url from '../../assets/left1.png';
import left2Url from '../../assets/left2.png';
import right1Url from '../../assets/right1.png';
import right2Url from '../../assets/right2.png';
import standUrl from '../../assets/stand.png';
import up1Url from '../../assets/up1.png';
import up2Url from '../../assets/up2.png';
import woodUrl from '../../assets/wood.png';
import sword1Url from '../../assets/weapons/sword/sword1.png';
import sword2Url from '../../assets/weapons/sword/sword2.png';
import sword3Url from '../../assets/weapons/sword/sword3.png';
import sword4Url from '../../assets/weapons/sword/sword4.png';

import axe1Url from '../../assets/weapons/axe/axe1.png';
import axe2Url from '../../assets/weapons/axe/axe2.png';
import axe3Url from '../../assets/weapons/axe/axe3.png';
import axe4Url from '../../assets/weapons/axe/axe4.png';

import dagger1Url from '../../assets/weapons/dagger/dagger1.png';
import dagger2Url from '../../assets/weapons/dagger/dagger2.png';
import dagger3Url from '../../assets/weapons/dagger/dagger3.png';
import dagger4Url from '../../assets/weapons/dagger/dagger4.png';

import spear1Url from '../../assets/weapons/spear/spear1.png';
import spear2Url from '../../assets/weapons/spear/spear2.png';
import spear3Url from '../../assets/weapons/spear/spear3.png';
import spear4Url from '../../assets/weapons/spear/spear4.png';

export type GameTextures = {
    grass: Texture;
    forestBackground: Texture;
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

    sword1: Texture;
    sword2: Texture;
    sword3: Texture;
    sword4: Texture;

    axe1: Texture;
    axe2: Texture;
    axe3: Texture;
    axe4: Texture;

    dagger1: Texture;
    dagger2: Texture;
    dagger3: Texture;
    dagger4: Texture;

    spear1: Texture;
    spear2: Texture;
    spear3: Texture;
    spear4: Texture;
};

export async function loadGameTextures(): Promise<GameTextures> {
    const [
        grass,
        forestBackground,
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
        sword1,
        sword2,
        sword3,
        sword4,

        axe1,
        axe2,
        axe3,
        axe4,

        dagger1,
        dagger2,
        dagger3,
        dagger4,

        spear1,
        spear2,
        spear3,
        spear4
    ] = await Promise.all([
        Assets.load(grassUrl),
        Assets.load<Texture>(forestBackgroundUrl),
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

        Assets.load(standUrl),

        Assets.load<Texture>(sword1Url),
        Assets.load<Texture>(sword2Url),
        Assets.load<Texture>(sword3Url),
        Assets.load<Texture>(sword4Url),

        Assets.load<Texture>(axe1Url),
        Assets.load<Texture>(axe2Url),
        Assets.load<Texture>(axe3Url),
        Assets.load<Texture>(axe4Url),

        Assets.load<Texture>(dagger1Url),
        Assets.load<Texture>(dagger2Url),
        Assets.load<Texture>(dagger3Url),
        Assets.load<Texture>(dagger4Url),

        Assets.load<Texture>(spear1Url),
        Assets.load<Texture>(spear2Url),
        Assets.load<Texture>(spear3Url),
        Assets.load<Texture>(spear4Url)
    ]);

    return {
        grass,
        forestBackground,
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
        sword1,
        sword2,
        sword3,
        sword4,

        axe1,
        axe2,
        axe3,
        axe4,

        dagger1,
        dagger2,
        dagger3,
        dagger4,

        spear1,
        spear2,
        spear3,
        spear4
    };
}
