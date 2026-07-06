/**
 * Tile Types
 * 
 * Enum-like object defining all possible tile types in the world.
 * Each tile type has an associated texture and resource value.
 */

// Tile type constants
export const TileType = {
    Grass: "grass",  // Common walkable terrain
    Wood: "wood",    // Forest/wood resource
    Iron: "iron",    // Iron ore resource
} as const;

// TypeScript type derived from TileType object
export type TileType = (typeof TileType)[keyof typeof TileType];