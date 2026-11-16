import type { Vec2 } from './types.js';

export function getDistance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function randomPos(width: number, height: number): Vec2 {
    return {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
    };
}

export function isvaliddirection(direction: unknown) {
    return (
        direction === 'up' ||
        direction === 'down' ||
        direction === 'left' ||
        direction === 'right'
    );
}
