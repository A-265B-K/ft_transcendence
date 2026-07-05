/**
 * Isometric Projection Utilities
 * 
 * Converts between grid coordinates and isometric screen coordinates.
 * Uses standard isometric projection with 64x32 tile dimensions.
 */

// Tile dimensions in pixels
export const tileWidth = 64;   // Width of each tile
export const tileHeight = 32;  // Height of each tile

/**
 * Convert grid coordinates to isometric screen X coordinate
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns Screen X position
 */
export function isoX(x: number, y: number) {
    return (x - y) * (tileWidth / 2);
}

/**
 * Convert grid coordinates to isometric screen Y coordinate
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns Screen Y position
 */
export function isoY(x: number, y: number) {
    return (x + y) * (tileHeight / 2);
}