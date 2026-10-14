import {
    CASTLE_HEAL_LVL,
    CASTLE_HEAL_RADIUS,
    CASTLE_RADIUS,
    PLAYER_DEFAULT_CASTLE_LEVEL
} from './constants.js';
import type { Vec2 } from './types.js';
import { getDistance } from './util.js';
import { Inventory } from './types.js';

export type upgradecost = {
    wood: number;
    iron: number;
};

function getupgradecost(lvl: number): upgradecost {

    const LVL_2UPGRADE: upgradecost = {
        wood: 50,
        iron: 30
    };

    const LVL_3UPGRADE: upgradecost = {
        wood: 100,
        iron: 60
    };

    const LVL_4UPGRADE: upgradecost = {
        wood: 180,
        iron: 120
    };

    switch (lvl) {
        case 2:
            return LVL_2UPGRADE;

        case 3:
            return LVL_3UPGRADE;

        case 4:
            return LVL_4UPGRADE;
    }
    throw new Error("invalid upgrade lvl");
}
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
    upgrade(): boolean {
        if (this.level >= 4) return false;
        const cost = getupgradecost(this.level + 1);

        if ()
        this.level += 1;
        return true;
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
    canHeal(): boolean {
        return this.level >= CASTLE_HEAL_LVL;
    }
    isnearcastle(playerPosition: Vec2): boolean {
        return getDistance(playerPosition, this.position) <= CASTLE_HEAL_RADIUS;
    }
    toJSON() {
        return {
            playerSlot: this.playerSlot,
            ...this.getposition(),
            radius: this.radius
        };
    }
}
