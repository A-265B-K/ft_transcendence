import { randomUUID } from 'crypto';
import type { castle } from './castle.js';
import type { Socket, Vec2 } from '../types.js';
import { getDistance } from '../util.js';

export class catapult {
    readonly id = randomUUID();
    private position: Vec2;
    private health: number = 100;
    private lastmovement = 0;

    constructor(
        readonly origin: castle,
        private readonly namespace: Socket['nsp'],
        private readonly roomId: string,
        readonly target?: castle
    ) {
        this.position = origin.getposition();
    }

    spawn() {
        this.namespace.to(this.roomId).emit('catapult_spawn', {
            catapultId: this.id,
            position: this.position
        });
    }

    update(position: Vec2) {
        this.position = { ...position };
        this.namespace.to(this.roomId).emit('catapult_move', {
            catapultId: this.id,
            position: this.position
        });
    }

    private isnearpos() {
        return (
            this.target !== undefined &&
            getDistance(this.position, this.target.getposition()) <= 3
        );
    }

    private pathfinder() {
        return this.position;
    }

    private moveToTarget() {
        if (Date.now() >= this.lastmovement) {
            const newlocation = this.pathfinder();
            if (newlocation != this.position) {
                this.update(newlocation);
            }
            this.lastmovement = Date.now() + 500;
        }
    }
    private attack() {
        // return this.target.takedamage(20)
    }

    loop() {
        if (!this.target) {
            this.health = 0;
            return;
        }

        if (this.isnearpos()) {
            this.attack();
        } else {
            this.moveToTarget();
        }
    }
}
