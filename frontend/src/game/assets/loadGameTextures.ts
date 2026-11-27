import { Assets, Texture } from 'pixi.js';
import { assetUrl } from './assetUrls';
import type { CatapultTextures } from '../entities/catapult';

export type GameTextures = {
    grass: Texture;
    forestBackground: Texture;
    wood: Texture;
    iron: Texture;
    castle1: Texture;
    castle2: Texture;
    castle3: Texture;
    castle4: Texture;
    destroyedCastle: Texture;

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

    boulder: Texture;
    catapult: CatapultTextures;

    tree: Texture;
    rock: Texture;
};

async function loadTexture(path: string): Promise<Texture> {
    const url = assetUrl(path);
    return url ? Assets.load<Texture>(url) : Texture.WHITE;
}

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
        destroyedCastle,

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
        spear4,
        boulder,
        catapultDown,
        catapultUp,
        catapultLeft,
        catapultRight,
        catapultDownFire,
        catapultUpFire,
        catapultLeftFire,
        catapultRightFire,
        catapultDestroyed,

        tree,
        rock
    ] = await Promise.all([
        loadTexture('grass.png'),
        loadTexture('forest-background.webp'),
        loadTexture('wood.png'),
        loadTexture('iron.png'),

        loadTexture('castle1.png'),
        loadTexture('castle2.png'),
        loadTexture('castle3.png'),
        loadTexture('castle4.png'),
        loadTexture('castle0.png'),

        loadTexture('down1.png'),
        loadTexture('down2.png'),

        loadTexture('up1.png'),
        loadTexture('up2.png'),

        loadTexture('left1.png'),
        loadTexture('left2.png'),

        loadTexture('right1.png'),
        loadTexture('right2.png'),

        loadTexture('stand.png'),

        loadTexture('weapons/sword/sword1.png'),
        loadTexture('weapons/sword/sword2.png'),
        loadTexture('weapons/sword/sword3.png'),
        loadTexture('weapons/sword/sword4.png'),

        loadTexture('weapons/axe/axe1.png'),
        loadTexture('weapons/axe/axe2.png'),
        loadTexture('weapons/axe/axe3.png'),
        loadTexture('weapons/axe/axe4.png'),

        loadTexture('weapons/dagger/dagger1.png'),
        loadTexture('weapons/dagger/dagger2.png'),
        loadTexture('weapons/dagger/dagger3.png'),
        loadTexture('weapons/dagger/dagger4.png'),

        loadTexture('weapons/spear/spear1.png'),
        loadTexture('weapons/spear/spear2.png'),
        loadTexture('weapons/spear/spear3.png'),
        loadTexture('weapons/spear/spear4.png'),
        loadTexture('boulder.png'),
        loadTexture('catapult/down.png'),
        loadTexture('catapult/up.png'),
        loadTexture('catapult/left.png'),
        loadTexture('catapult/right.png'),
        loadTexture('catapult/down-fire.png'),
        loadTexture('catapult/up-fire.png'),
        loadTexture('catapult/left-fire.png'),
        loadTexture('catapult/right-fire.png'),
        loadTexture('catapult/destroyed.png'),
        loadTexture('obstacles/tree.png'),
        loadTexture('obstacles/rock.png')
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
        destroyedCastle,

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
        spear4,

        boulder,
        catapult: {
            idle: catapultDown,
            moving: {
                up: catapultUp,
                down: catapultDown,
                left: catapultLeft,
                right: catapultRight
            },
            firing: {
                up: catapultUpFire,
                down: catapultDownFire,
                left: catapultLeftFire,
                right: catapultRightFire
            },
            broken: catapultDestroyed
        },
        tree,
        rock
    };
}
