import type { Socket } from 'socket.io';
import type { castle } from './entities/castle.js';

export type Vec2 = {
    x: number;
    y: number;
};

export type Spawn = {
    pos: Vec2;
    playerSlot: number;
};

export type Inventory = {
    iron: number;
    wood: number;
    castleLevel: number;
};

export type boulder = {
    impacttime: number;
    impactlocation: Vec2;
};

declare module 'socket.io' {
    interface Socket {
        user?: {
            id: string;
            username: string;
            email: string;
        };
    }
}

export type Catapult = {
    owner: castle;
    target: castle;
    position: Vec2;
};

export type SocketUser = NonNullable<Socket['user']>;

export type { Socket };
