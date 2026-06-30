export const TileType = {
    Grass: "grass",
    Wood: "wood",
    Iron: "iron",
} as const;

export type TileType = (typeof TileType)[keyof typeof TileType];