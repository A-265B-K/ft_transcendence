import {
    PLAYER_DEFAULT_HP,
    PLAYER_DEFAULT_IRON,
    PLAYER_DEFAULT_WOOD,
    PLAYER_DEFAULT_CASTLE_LEVEL,
    MOVE_TOLERANCE_SECONDS,
    PLAYER_MAX_SPEED,
    MOVE_MAX_ELAPSED_SECONDS
} from './constants.js';
import type { Cost } from './room.js';
import type { Socket, SocketUser, Spawn, Vec2 } from './types.js';
import { getDistance } from './util.js';
import { type Resource } from './map.js';
import { getattackstats, type WeaponType } from './combat/Weapon.js';

export class Player {
    private readonly userId: string;
    private readonly socketId: string;
    private readonly username: string;
    private readonly slot: number;

    private hp: number;
    private isDead: boolean;
    private x: number;
    private y: number;

    private inventory: {
        iron: number;
        wood: number;
        castleLevel: number;
    };

    private lastMoveAt: number;
    private equippedWeapon: WeaponType;
    private nextAttack: number;

    constructor(socket: Socket, user: SocketUser, slot: number, spawn: Spawn) {
        this.userId = user.id;
        this.socketId = socket.id;
        this.username = user.username;

        this.slot = slot;
        this.hp = PLAYER_DEFAULT_HP;
        this.isDead = false;

        this.x = spawn.pos.x;
        this.y = spawn.pos.y;

        this.inventory = {
            iron: PLAYER_DEFAULT_IRON,
            wood: PLAYER_DEFAULT_WOOD,
            castleLevel: PLAYER_DEFAULT_CASTLE_LEVEL
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

    getIsDead(): boolean {
        return this.isDead;
    }

    getPosition(): { x: number; y: number } {
        return {
            x: this.x,
            y: this.y
        };
    }

    getInventory() {
        return { ...this.inventory };
    }

    getLastMoveAt(): number {
        return this.lastMoveAt;
    }

    getEquippedWeapon(): WeaponType {
        return this.equippedWeapon;
    }

    getNextAttack(): number {
        return this.nextAttack;
    }
    attackNow(weapon: WeaponType): void {
        this.nextAttack =
            Date.now() + (getattackstats(weapon)?.cooldown ?? 0) * 1000;
    }

    canattack(): boolean {
        return Date.now() >= this.nextAttack;
    }
    cooldowncheck() {}
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.lastMoveAt = Date.now();
    }

    setHp(hp: number): void {
        this.hp = Math.max(0, hp);

        if (this.hp === 0) {
            this.isDead = true;
        }
    }

    equipWeapon(weapon: WeaponType): void {
        this.equippedWeapon = weapon;
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

    // Anti-teleport: rejects a move if it implies a speed higher than the
    // player could actually reach, given how much time passed since their
    // last move. Also advances player.lastMoveAt as a side effect, so time
    // keeps flowing even while movement is being rejected.
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

    hasHp(): boolean {
        if (this.hp > 0) {
            return true;
        }
        return false;
    }

    isAlive(): boolean {
        return !this.isDead;
    }

    takeDamage(damage: number): boolean {
        this.hp = Math.max(0, this.hp - damage);

        if (this.hp === 0) {
            this.isDead = true;
            return true;
        }
        return false;
    }

    craftWeapon(cost: Cost, weapon: WeaponType) {
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
}
