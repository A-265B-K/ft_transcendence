import { castle } from './srcs/castle.js';
import type { Vec2 } from './srcs/types.js';
import { getDistance } from './srcs/util.js';

export class catapult {
    private _target: castle;
    private _origin: castle;
    private pos: Vec2;
    private nextpos: Vec2;
    private lasmovement: number;

    constructor(
        readonly target: castle,
        readonly origin: castle
    ) {
        this._target = target;
        this._origin = origin;
        this.pos = this.origin.getposition();
    }

    private isnearpos() {
        return getDistance(this.pos, this.target.getposition()) <= 3;
    }

    private moveToTarget() {
        //pathfinding algoritm
    }
    private attack() {}

    loop() {
        if (this.isnearpos()) {
            this.attack();
        } else {
            this.moveToTarget();
        }
    }
}
