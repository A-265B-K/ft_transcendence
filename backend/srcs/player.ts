import {
    PLAYER_MAX_HP,
    PLAYER_DEFAULT_IRON,
    PLAYER_DEFAULT_WOOD,
    PLAYER_DEFAULT_CASTLE_LEVEL,
    MOVE_TOLERANCE_SECONDS,
    PLAYER_MAX_SPEED,
    MOVE_MAX_ELAPSED_SECONDS,
    CASTLE_HEAL_INTERVAL,
    CASTLE_HEAL,
    CASTLE_HEAL_RADIUS
} from './constants.js';
import type { Cost } from './room.js';
import type { Socket, SocketUser, Spawn, Vec2 } from './types.js';
import { getDistance } from './util.js';
import { type Resource } from './map.js';
import type { castle as Castle } from './castle.js';

import { getattackstats, type WeaponType } from './combat/Weapon.js';

export type { WeaponType } from './combat/Weapon.js';
import type { upgradecost } from './castle.js';

export class Player {
    private readonly userId: string;
    private readonly socketId: string;
    private readonly namespace: Socket['nsp'];
    private readonly roomId: string;
    private readonly username: string;
    private readonly slot: number;

    private hp: number;
    private alive: boolean;
    private x: number;
    private y: number;

    private inventory: {
        iron: number;
        wood: number;
    };
    private readonly castle: Castle;
    private nextcastleheal = 0;

    private lastMoveAt: number;
    private equippedWeapon: WeaponType;
    private nextAttack: number;

    constructor(
        socket: Socket,
        user: SocketUser,
        slot: number,
        spawn: Spawn,
        castle: Castle,
        roomId: string
    ) {
        this.userId = user.id;
        this.socketId = socket.id;
        this.namespace = socket.nsp;
        this.roomId = roomId;
        this.username = user.username;

        this.slot = slot;
        this.castle = castle;
        this.castle.setlevel(PLAYER_DEFAULT_CASTLE_LEVEL);
        this.hp = PLAYER_MAX_HP;
        this.alive = true;

        this.x = spawn.pos.x;
        this.y = spawn.pos.y;

        this.inventory = {
            iron: PLAYER_DEFAULT_IRON,
            wood: PLAYER_DEFAULT_WOOD
        };

        this.lastMoveAt = Date.now();
        this.equippedWeapon = 'sword';
        this.nextAttack = 0;
    }

    getUserId(): string {
        return this.userId;
    }

    getSocketId(): string {
        return this.socketId;
    }

    getUsername(): string {
        return this.username;
    }

    getSlot(): number {
        return this.slot;
    }

    getHp(): number {
        return this.hp;
    }

    getPosition(): { x: number; y: number } {
        return {
            x: this.x,
            y: this.y
        };
    }

    getInventory() {
        return { ...this.inventory, castleLevel: this.castle.getlevel() };
    }

    toJSON() {
        return {
            userId: this.userId,
            socketId: this.socketId,
            username: this.username,
            slot: this.slot,
            hp: this.hp,
            isDead: !this.alive,
            x: this.x,
            y: this.y,
            inventory: this.getInventory(),
            lastMoveAt: this.lastMoveAt,
            equippedWeapon: this.equippedWeapon,
            nextAttack: this.nextAttack
        };
    }

    getEquippedWeapon(): WeaponType {
        return this.equippedWeapon;
    }

    attackNow(weapon: WeaponType): void {
        this.nextAttack =
            Date.now() + (getattackstats(weapon)?.cooldown ?? 0) * 1000;
    }

    canattack(): boolean {
        return Date.now() >= this.nextAttack;
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.lastMoveAt = Date.now();
        if (
            getDistance(this.getPosition(), this.castle.getposition()) >=
            CASTLE_HEAL_RADIUS
        )
            this.nextcastleheal = 0;
    }

    private setHp(hp: number): boolean {
        const previousHp = this.hp;
        const newHp = Math.min(PLAYER_MAX_HP, Math.max(0, hp));
        if (newHp === previousHp) return false;

        this.hp = newHp;
        this.alive = this.hp > 0;
        this.namespace.to(this.roomId).emit('player_hp', {
            socketId: this.socketId,
            hp: this.hp,
            reason: this.hp > previousHp ? 'heal' : 'damage'
        });
        return true;
    }

    castleheal(): boolean {
        if (
            this.castle.canHeal() &&
            this.alive &&
            this.hp < PLAYER_MAX_HP &&
            this.castle.isnearcastle(this.getPosition())
        ) {
            const now = Date.now();
            if (this.nextcastleheal) {
                if (now >= this.nextcastleheal) {
                    this.nextcastleheal = now + CASTLE_HEAL_INTERVAL * 1000;
                    return this.heal(CASTLE_HEAL);
                } else return false;
            } else {
                this.nextcastleheal = now + CASTLE_HEAL_INTERVAL * 1000;
                return false;
            }
        } else {
            this.nextcastleheal = 0;
            return false;
        }
    }
    heal(healamount: number): boolean {
        if (this.alive && healamount > 0 && this.hp < PLAYER_MAX_HP) {
            return this.setHp(this.hp + healamount);
        }
        return false;
    }

    addResources(resource: Resource): void {
        if (resource) {
            if (resource.type === 'wood') {
                this.inventory.wood += resource.amount;
            } else if (resource.type === 'iron') {
                this.inventory.iron += resource.amount;
            }
        }
    }

    isMovingTooFast(pos: Vec2): boolean {
        const now = Date.now();
        const elapsedSeconds = Math.min(
            (now - this.lastMoveAt) / 1000,
            MOVE_MAX_ELAPSED_SECONDS
        );

        this.lastMoveAt = now;

        const maxDistance =
            PLAYER_MAX_SPEED * (elapsedSeconds + MOVE_TOLERANCE_SECONDS);

        return getDistance({ x: this.x, y: this.y }, pos) > maxDistance;
    }

    isAlive(): boolean {
        return this.alive;
    }

    takeDamage(damage: number): boolean {
        this.setHp(this.hp - damage);

        return this.alive === false;
    }

    craftWeapon(cost: Cost, weapon: WeaponType) {
        if (
            !this.alive ||
            getDistance(this.getPosition(), this.castle.getposition()) > 7
        )
            return null;
        if (
            this.inventory.wood < cost.wood ||
            this.inventory.iron < cost.iron
        ) {
            return null;
        }
        this.inventory.wood -= cost.wood;
        this.inventory.iron -= cost.iron;
        this.equippedWeapon = weapon;
        return {
            weapon,
            inventory: { wood: this.inventory.wood, iron: this.inventory.iron }
        };
    }
    upgradecastle(): boolean {
        if (
            !this.alive ||
            getDistance(this.getPosition(), this.castle.getposition()) > 7 ||
            this.castle.getlevel() >= 4
        )
            return false;
        const cost = this.castle.getupgradecost(this.castle.getlevel() + 1);
        if (
            this.inventory.wood < cost.wood ||
            this.inventory.iron < cost.iron
        ) {
            return false;
        }
        if (this.castle.upgrade()) {
            this.inventory.wood -= cost.wood;
            this.inventory.iron -= cost.iron;
            return true;
        } else return false;
    }
}
