import {
    CASTLE_HEAL,
    CASTLE_HEAL_INTERVAL,
    CASTLE_RADIUS,
    PLAYER_DEFAULT_CASTLE_LEVEL,
    PLAYER_MAX_HP
} from './constants.js';
import type { Player } from './player.js';
import type { Vec2 } from './types.js';

export type upgradecost = {
    wood: number;
    iron: number;
};

export class castle {
    private level = PLAYER_DEFAULT_CASTLE_LEVEL;
    private readonly position: Vec2;
    private nextcastleheal = 0;
    private boulderlandtime = 0;

    constructor(
        readonly playerSlot: number,
        position: Vec2,
        readonly radius = CASTLE_RADIUS
    ) {
        this.position = { ...position };
    }
    upgrade(): boolean {
        if (this.level >= 4) return false;

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
    canHeal(Player: Player): boolean {
        return Player.isnearcastle() && this.level >= 2;
    }
    canAddarmor(): boolean {
        return this.level >= 3;
    }
    canAttack(): boolean {
        return this.level == 4 && Date.now() >= this.boulderlandtime;
    }
    resetHealingCooldown(): void {
        this.nextcastleheal = 0;
    }
    castleheal(player: Player): boolean {
        if (player.getHp() < PLAYER_MAX_HP) {
            const now = Date.now();
            if (this.nextcastleheal) {
                if (now >= this.nextcastleheal) {
                    this.nextcastleheal = now + CASTLE_HEAL_INTERVAL * 1000;
                    return player.heal(CASTLE_HEAL);
                } else return false;
            } else {
                this.nextcastleheal = now + CASTLE_HEAL_INTERVAL * 1000;
                return false;
            }
        } else {
            this.resetHealingCooldown();
            return false;
        }
    }

    castleattack(player: Player) {
        if (this.canAttack()) {
            this.boulderlandtime = Date.now() + 1500;
            return {
                start: this.getposition(),
                target: player.getPosition()
            };
        } else return null;
    }

    toJSON() {
        return {
            playerSlot: this.playerSlot,
            ...this.getposition(),
            radius: this.radius
        };
    }
    getupgradecost(lvl: number): upgradecost {
        const LVL_2UPGRADE: upgradecost = {
            wood: 50,
            iron: 30
        };

        const LVL_3UPGRADE: upgradecost = {
            wood: 100,
            iron: 60
        };

        const LVL_4UPGRADE: upgradecost = {
            wood: 100,
            iron: 60
        };

        switch (lvl) {
            case 2:
                return LVL_2UPGRADE;

            case 3:
                return LVL_3UPGRADE;

            case 4:
                return LVL_4UPGRADE;
            default:
                throw new Error('invalid upgrade lvl');
        }
    }
}
