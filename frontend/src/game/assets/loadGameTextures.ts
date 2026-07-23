import { Assets, Texture } from "pixi.js";

export type GameTextures = {
    grass: Texture;
    wood: Texture;
    iron: Texture;
    player: Texture;
    castle: Texture;
};

export async function loadGameTextures(): Promise<GameTextures> {
    const [grass, wood, iron, player, castle] = await Promise.all([
        Assets.load("/src/assets/grass.png"),
        Assets.load("/src/assets/wood.png"),
        Assets.load("/src/assets/iron.png"),
        Assets.load("/src/assets/player.png"),
        Assets.load("/src/assets/castle.png"),
    ]);

    return { grass, wood, iron, player, castle };
}