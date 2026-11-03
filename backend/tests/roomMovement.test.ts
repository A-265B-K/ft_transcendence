import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isPositionOccupied,
    isSlotOccupied,
    movePlayer,
    positionIsAllowed
} from '../srcs/room/roomMovement.js';
import type { GameMap } from '../srcs/map.js';
import type { Player } from '../srcs/entities/player.js';
import type { Socket, SocketUser, Vec2 } from '../srcs/types.js';

function makePlayer(
    id: string,
    slot: number,
    alive: boolean,
    position: Vec2
): Player {
    return {
        getUserId: () => id,
        getSlot: () => slot,
        isAlive: () => alive,
        getPosition: () => position
    } as unknown as Player;
}

function makeMap(): GameMap {
    return {
        isOutOfBounds: (position: Vec2) =>
            position.x < 0 || position.x > 100 ||
            position.y < 0 || position.y > 100,
        getCastleZones: () => [],
        collectResource: () => null
    } as unknown as GameMap;
}

const user: SocketUser = {
    id: 'self',
    username: 'self',
    email: 'self@example.test'
};

test('position occupancy ignores the same player and dead players', () => {
    const self = makePlayer('self', 1, true, { x: 10, y: 10 });
    const dead = makePlayer('dead', 2, false, { x: 10, y: 10 });

    assert.equal(
        isPositionOccupied(new Map([['self', self], ['dead', dead]]), 'self', {
            x: 10,
            y: 10
        }, 2),
        false
    );
});

test('position occupancy detects another live player within the radius', () => {
    const other = makePlayer('other', 2, true, { x: 11, y: 10 });

    assert.equal(
        isPositionOccupied(new Map([['other', other]]), 'self', {
            x: 10,
            y: 10
        }, 2),
        true
    );
});

test('slot occupancy counts living players but not dead players', () => {
    const alive = makePlayer('alive', 1, true, { x: 0, y: 0 });
    const dead = makePlayer('dead', 2, false, { x: 0, y: 0 });

    assert.equal(isSlotOccupied(new Map([['alive', alive]]), 1), true);
    assert.equal(isSlotOccupied(new Map([['dead', dead]]), 2), false);
});

test('position validation rejects out-of-bounds and occupied positions', () => {
    const self = makePlayer('self', 1, true, { x: 10, y: 10 });
    const other = makePlayer('other', 2, true, { x: 11, y: 10 });
    const players = new Map<string, Player>([['self', self], ['other', other]]);

    assert.equal(
        positionIsAllowed(makeMap(), players, self, user, { x: 101, y: 10 }),
        false
    );
    assert.equal(
        positionIsAllowed(makeMap(), players, self, user, { x: 10, y: 10 }),
        false
    );
});

test('position validation blocks an occupied castle zone', () => {
    const occupant = makePlayer('occupant', 1, true, { x: 0, y: 0 });
    const player = makePlayer('self', 2, true, { x: 30, y: 30 });
    const map = {
        ...makeMap(),
        getCastleZones: () => [
            {
                playerSlot: 1,
                radius: 8,
                getposition: () => ({ x: 20, y: 20 })
            }
        ]
    } as unknown as GameMap;

    assert.equal(
        positionIsAllowed(
            map,
            new Map([['occupant', occupant]]),
            player,
            user,
            { x: 20, y: 20 }
        ),
        false
    );
});

test('speed-rejected movement emits the authoritative current position', () => {
    let currentPosition = { x: 10, y: 10 };
    const player = {
        getUserId: () => 'self',
        isAlive: () => true,
        getPosition: () => currentPosition,
        setPosition: (x: number, y: number) => {
            currentPosition = { x, y };
        },
        isMovingTooFast: () => true
    } as unknown as Player;
    const emitted: Array<{ event: string; payload: unknown }> = [];
    const socket = {
        id: 'socket-self',
        emit: (event: string, payload: unknown) => {
            emitted.push({ event, payload });
        },
        to: () => ({ emit: () => undefined })
    } as unknown as Socket;

    movePlayer(
        { map: makeMap(), players: new Map(), roomId: 'room' },
        socket,
        user,
        player,
        { x: 11, y: 10 },
        true
    );

    assert.deepEqual(currentPosition, { x: 10, y: 10 });
    assert.deepEqual(emitted, [
        { event: 'player_move', payload: { socketId: 'socket-self', x: 10, y: 10 } }
    ]);
});