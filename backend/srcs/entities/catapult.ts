import { castle } from './castle.js';
import type { Vec2 } from '../types.js';
import { getDistance } from '../util.js';

export class catapult {
    private _target: castle;
    private _origin: castle;
    private pos: Vec2;
    private nextpos: Vec2;
    private lastmovement = 0;

    constructor(
        readonly target: castle,
        readonly origin: castle
    ) {
        this._target = target;
        this._origin = origin;
        this.pos = this.origin.getposition();
        this.nextpos = this.pos;
    }

    private isnearpos() {
        return getDistance(this.pos, this.target.getposition()) <= 3;
    }

    private moveToTarget() {
        //pathfinding algoritm
    }
    private attack() {
        // return this.target.takedamage(20)
    }

    loop() {
        if (this.isnearpos()) {
            this.attack();
        } else {
            this.moveToTarget();
        }
    }
}
