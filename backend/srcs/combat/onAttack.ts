import { getattackstats } from './Attackstats.js';
import { istargethit } from './Detection.js';
import type { Socket, SocketUser } from '../types.js';
import type { Player } from '../player.js';
import type { Room } from '../room.js';

export function isvaliddirection(direction: unknown) {
    return (
        direction === 'up' ||
        direction === 'down' ||
        direction === 'left' ||
        direction === 'right'
    );
}

