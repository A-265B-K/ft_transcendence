import { MAP_HEIGHT, MAP_WIDTH } from './constants.js';
import type { Vec2 } from './types.js';

export function getDistance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function randomPos() {
    return {
        x: Math.floor(Math.random() * MAP_WIDTH),
        y: Math.floor(Math.random() * MAP_HEIGHT)
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
