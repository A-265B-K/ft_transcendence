import { CASTLE_RADIUS, PLAYER_DEFAULT_CASTLE_LEVEL } from './constants.js';
import type { Vec2 } from './types.js';

export class castle {
    private level = PLAYER_DEFAULT_CASTLE_LEVEL;
    private readonly position: Vec2;

    constructor(
        readonly playerSlot: number,
        position: Vec2,
        readonly radius = CASTLE_RADIUS
    ) {
        this.position = { ...position };
    }

    getposition(): Vec2 {
        return { ...this.position };
    }

    getlevel(): number {
        return this.level;
    }

    setlevel(newlevel: number) {
        this.level = newlevel;
    }

    toJSON() {
        return {
            playerSlot: this.playerSlot,
            ...this.getposition(),
            radius: this.radius
        };
    }
}
