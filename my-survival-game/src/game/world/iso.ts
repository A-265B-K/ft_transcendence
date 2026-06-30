export const tileWidth = 64;
export const tileHeight = 32;

export function isoX(x: number, y: number) {
    return (x - y) * (tileWidth / 2);
}

export function isoY(x: number, y: number) {
    return (x + y) * (tileHeight / 2);
}