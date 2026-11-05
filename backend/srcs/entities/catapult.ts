import { randomUUID } from 'crypto';
import type { castle } from './castle.js';
import type { Socket, Vec2 } from '../types.js';
import { getDistance } from '../util.js';
import type { GameMap } from '../map.js';
import {
    CATAPULT_ATTACK_DAMAGE,
    CATAPULT_ATTACK_INTERVAL,
    CATAPULT_ATTACK_RANGE,
    CATAPULT_MAX_HP,
    CATAPULT_MOVE_SPEED
} from '../constants.js';

export class catapult {
    readonly id = randomUUID();
    private position: Vec2;
    private health = CATAPULT_MAX_HP;
    private lastmovement = Date.now();
    private path: Vec2[];
    private nextWaypoint: Vec2 | null = null;
    private pathExhaustedLogged = false;
    private nextAttackAt = 0;
    private hasSpawnPosition: boolean;

    constructor(
        readonly origin: castle,
        private readonly namespace: Socket['nsp'],
        private readonly roomId: string,
        private readonly onDestroyed: (catapultId: string) => void,
        private readonly map: GameMap,
        readonly target?: castle
    ) {
        const preferredPosition =
            map.getSpawnPoint(origin.playerSlot)?.pos ?? origin.getposition();
        const reservedPosition = map.reserveCatapultPosition(
            this.id,
            preferredPosition,
            origin
        );
        this.hasSpawnPosition = reservedPosition !== null;
        this.position = reservedPosition ?? preferredPosition;
        this.path =
            target && reservedPosition
                ? map.findCatapultPath(
                      this.position,
                      target.getposition(),
                      origin,
                      target,
                      this.id
                  )
                : [];
    }

    canSpawn(): boolean {
        return this.hasSpawnPosition;
    }

    spawn() {
        if (!this.hasSpawnPosition) return;
        this.namespace.to(this.roomId).emit('catapult_spawn', {
            catapultId: this.id,
            position: this.position
        });
    }

    update(position: Vec2) {
        if (this.health <= 0) return;
        if (!this.map.updateCatapultPosition(this.id, position)) return;

        this.position = { ...position };
        this.namespace.to(this.roomId).emit('catapult_move', {
            catapultId: this.id,
            position: this.position
        });
    }

    private isnearpos() {
        return (
            this.target !== undefined &&
            getDistance(this.position, this.target.getposition()) <=
                CATAPULT_ATTACK_RANGE
        );
    }

    private pathfinder() {
        const nextPosition = this.path.shift();
        if (!nextPosition) {
            if (!this.pathExhaustedLogged) {
                console.info(`[catapult ${this.id}] no waypoint available`, {
                    position: this.position,
                    target: this.target?.getposition()
                });
                this.pathExhaustedLogged = true;
            }
            return null;
        }

        // console.info(`[catapult ${this.id}] moving`, {
        //     from: this.position,
        //     to: nextPosition
        // });
        return nextPosition;
    }

    private replanPath() {
        if (!this.target) return;

        this.path = this.map.findCatapultPath(
            this.position,
            this.target.getposition(),
            this.origin,
            this.target,
            this.id
        );
        this.nextWaypoint = null;
    }

    private moveToTarget() {
        const now = Date.now();
        const elapsedSeconds = Math.min((now - this.lastmovement) / 1000, 0.25);
        this.lastmovement = now;

        let movementRemaining = CATAPULT_MOVE_SPEED * elapsedSeconds;
        const startingPosition = { ...this.position };

        while (movementRemaining > 0) {
            if (!this.nextWaypoint) {
                this.nextWaypoint = this.pathfinder();
            }
            if (!this.nextWaypoint) break;

            const distance = getDistance(this.position, this.nextWaypoint);
            if (distance <= movementRemaining) {
                if (!this.map.canCatapultMoveTo(this.id, this.nextWaypoint)) {
                    this.replanPath();
                    break;
                }
                this.position = { ...this.nextWaypoint };
                movementRemaining -= distance;
                this.nextWaypoint = null;
                continue;
            }

            const progress = movementRemaining / distance;
            const nextPosition = {
                x:
                    this.position.x +
                    (this.nextWaypoint.x - this.position.x) * progress,
                y:
                    this.position.y +
                    (this.nextWaypoint.y - this.position.y) * progress
            };
            if (!this.map.canCatapultMoveTo(this.id, nextPosition)) {
                this.replanPath();
                break;
            }
            this.position = nextPosition;
            movementRemaining = 0;
        }

        if (
            this.position.x !== startingPosition.x ||
            this.position.y !== startingPosition.y
        ) {
            this.update(this.position);
        }
    }
    private attack() {
        if (!this.target || Date.now() < this.nextAttackAt) return;
        if (this.target.isDestroyed()) return;

        this.nextAttackAt = Date.now() + CATAPULT_ATTACK_INTERVAL;
        this.namespace.to(this.roomId).emit('catapult_attack', {
            catapultId: this.id,
            start: this.position,
            target: this.target.getposition(),
            durationMs: 600
        });
        const health = this.target.takedamage(CATAPULT_ATTACK_DAMAGE);
        this.namespace.to(this.roomId).emit('castle_damaged', {
            playerSlot: this.target.playerSlot,
            health,
            level: this.target.getlevel()
        });
        console.info(`[catapult ${this.id}] hit castle`, {
            playerSlot: this.target.playerSlot,
            position: this.target.getposition(),
            damage: CATAPULT_ATTACK_DAMAGE,
            health
        });
    }

    loop() {
        if (this.health <= 0) return;
        if (!this.target) {
            this.takedamage(this.health);
            return;
        }
        if (this.isnearpos()) {
            this.attack();
        } else {
            this.moveToTarget();
        }
    }
    takedamage(damage: number): number {
        if (this.health <= 0 || !Number.isFinite(damage) || damage <= 0) {
            return this.health;
        }

        this.health = Math.max(0, this.health - damage);
        this.namespace.to(this.roomId).emit('catapult_damaged', {
            catapultId: this.id,
            health: this.health,
            maxHealth: CATAPULT_MAX_HP
        });
        console.info(`[catapult ${this.id}] took damage`, {
            damage,
            health: this.health,
            maxHealth: CATAPULT_MAX_HP
        });

        if (this.health <= 0) {
            this.map.removeCatapultPosition(this.id);
            this.onDestroyed(this.id);
            this.namespace.to(this.roomId).emit('catapult_broken', {
                catapultId: this.id
            });
        }
        return this.health;
    }

    gethealth() {
        return this.health;
    }
    getpos() {
        return this.position;
    }
}
