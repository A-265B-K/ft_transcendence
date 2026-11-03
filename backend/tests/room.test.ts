import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOM_MAX_SIZE } from '../srcs/constants.js';
import type { Resource } from '../srcs/map.js';
import { Room } from '../srcs/room/room.js';
import type { GameMap } from '../srcs/map.js';
import type { Player } from '../srcs/entities/player.js';
import type { Socket, SocketUser, Spawn } from '../srcs/types.js';

type RoomState = {
    name: string;
    hostId: string;
    roomId: string;
    code: string;
    players: Map<string, Player>;
    boulders: [];
    map: GameMap;
    started: boolean;
    finished: boolean;
    timer: null;
};

function makeRoom(started = false): Room {
    const castles = new Map(
        Array.from({ length: ROOM_MAX_SIZE }, (_, index) => {
            const slot = index + 1;
            return [
                slot,
                {
                    playerSlot: slot,
                    setlevel: () => undefined,
                    getlevel: () => 1,
                    getposition: () => ({ x: slot * 10, y: 10 })
                }
            ];
        })
    );
    const map = {
        getSpawnPoint: (slot: number): Spawn => ({
            playerSlot: slot,
            pos: { x: slot * 10, y: 10 }
        }),
        getCastle: (slot: number) => castles.get(slot) ?? null
    } as unknown as GameMap;
    const room = Object.create(Room.prototype) as Room;

    Object.assign(room as unknown as RoomState, {
        name: 'test room',
        hostId: 'user-1',
        roomId: 'room-1',
        code: 'TEST',
        players: new Map<string, Player>(),
        boulders: [],
        map,
        started,
        finished: false,
        timer: null
    });

    return room;
}

function makeUser(id: string): SocketUser {
    return { id, username: id, email: `${id}@example.test` };
}

function makeSocket(id: string): Socket {
    const emit = () => undefined;
    return {
        id: `socket-${id}`,
        join: () => undefined,
        emit,
        to: () => ({ emit }),
        nsp: { to: () => ({ emit }) }
    } as unknown as Socket;
}

test('leaving the room transfers host and reports when the room becomes empty', () => {
    const room = makeRoom();
    const host = makeUser('user-1');
    const nextHost = makeUser('user-2');

    assert.equal(room.join(makeSocket(host.id), host), 'room-1');
    assert.equal(room.join(makeSocket(nextHost.id), nextHost), 'room-1');
    assert.equal(room.leave(makeSocket(host.id), host.id), false);
    assert.equal(room.getRoomInfo().hostId, nextHost.id);
    assert.equal(room.leave(makeSocket(nextHost.id), nextHost.id), true);
    assert.equal(room.getPlayerCount(), 0);
});

test('joining a started room is rejected', () => {
    const room = makeRoom(true);
    const events: string[] = [];
    const socket = {
        ...makeSocket('late'),
        emit: (event: string) => events.push(event)
    } as unknown as Socket;

    assert.equal(room.join(socket, makeUser('late')), null);
    assert.deepEqual(events, ['join_error']);
    assert.equal(room.getPlayerCount(), 0);
});

test('joining beyond the room capacity is rejected', () => {
    const room = makeRoom();
    for (let index = 1; index <= ROOM_MAX_SIZE; index++) {
        const user = makeUser(`user-${index}`);
        assert.equal(room.join(makeSocket(user.id), user), 'room-1');
    }

    const events: string[] = [];
    const socket = {
        ...makeSocket('extra'),
        emit: (event: string) => events.push(event)
    } as unknown as Socket;

    assert.equal(room.join(socket, makeUser('extra')), null);
    assert.deepEqual(events, ['join_error']);
    assert.equal(room.getPlayerCount(), ROOM_MAX_SIZE);
});

test('weapon crafting preserves insufficient resources and deducts recipe cost', () => {
    const room = makeRoom();
    const user = makeUser('user-1');

    room.join(makeSocket(user.id), user);
    const state = room as unknown as RoomState;
    state.started = true;
    const player = state.players.get(user.id);
    assert.ok(player);

    assert.equal(room.craftWeapon(user.id, 'dagger'), null);
    assert.deepEqual(player.getInventory(), { iron: 0, wood: 0, castleLevel: 1 });

    player.addResources({ type: 'wood', amount: 15 } as Resource);
    player.addResources({ type: 'iron', amount: 15 } as Resource);

    assert.deepEqual(room.craftWeapon(user.id, 'dagger'), {
        weapon: 'dagger',
        inventory: { wood: 0, iron: 0 }
    });
});