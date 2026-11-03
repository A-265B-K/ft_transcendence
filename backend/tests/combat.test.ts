import assert from 'node:assert/strict';
import test from 'node:test';
import { istargethit, type Direction } from '../srcs/combat/Detection.js';
import { SWORD_ATTACK } from '../srcs/combat/Weapon.js';
import { CASTLE_MAX_HP, CATAPULT_MAX_HP } from '../srcs/constants.js';
import { castle } from '../srcs/entities/castle.js';
import { catapult } from '../srcs/entities/catapult.js';
import { handleRoomAttack } from '../srcs/room/roomCombat.js';
import type { Player, WeaponType } from '../srcs/entities/player.js';
import type { Socket, Vec2 } from '../srcs/types.js';

const directions: Array<{ direction: Direction; target: Vec2 }> = [
    { direction: 'up', target: { x: 0, y: -2 } },
    { direction: 'down', target: { x: 0, y: 2 } },
    { direction: 'left', target: { x: -2, y: 0 } },
    { direction: 'right', target: { x: 2, y: 0 } }
];

for (const { direction, target } of directions) {
    test(`hit detection accepts an in-range ${direction} target`, () => {
        assert.equal(
            istargethit({ x: 0, y: 0 }, target, SWORD_ATTACK, direction, 0),
            true
        );
    });
}

test('hit detection includes attack boundaries and rejects targets beyond reach', () => {
    assert.equal(
        istargethit(
            { x: 0, y: 0 },
            { x: SWORD_ATTACK.reach, y: 0 },
            SWORD_ATTACK,
            'right',
            0
        ),
        true
    );
    assert.equal(
        istargethit(
            { x: 0, y: 0 },
            { x: SWORD_ATTACK.reach + 0.1, y: 0 },
            SWORD_ATTACK,
            'right',
            0
        ),
        false
    );
});

function makePlayer(options: {
    id: string;
    position: Vec2;
    alive?: boolean;
    canAttack?: boolean;
    catapults?: Array<{
        getpos: () => Vec2;
        takedamage: (damage: number) => void;
    }>;
    takeDamage?: (damage: number) => void;
    attackNow?: (weapon: WeaponType) => void;
}): Player {
    return {
        getUserId: () => options.id,
        getUsername: () => options.id,
        getSocketId: () => `socket-${options.id}`,
        getPosition: () => options.position,
        getcatapults: () => options.catapults ?? [],
        isAlive: () => options.alive ?? true,
        canattack: () => options.canAttack ?? true,
        getEquippedWeapon: () => 'sword',
        takeDamage: options.takeDamage ?? (() => undefined),
        attackNow: options.attackNow ?? (() => undefined)
    } as unknown as Player;
}

function makeSocket(
    events: Array<{ event: string; payload: unknown }>
): Socket {
    return {
        to: () => ({
            emit: (event: string, payload: unknown) => {
                events.push({ event, payload });
            }
        })
    } as unknown as Socket;
}

test('room attack damages only living targets inside the hitbox', () => {
    const damageTaken: number[] = [];
    const attacksStarted: string[] = [];
    const attacker = makePlayer({
        id: 'attacker',
        position: { x: 0, y: 0 },
        attackNow: (weapon) => attacksStarted.push(weapon)
    });
    const target = makePlayer({
        id: 'target',
        position: { x: 2, y: 0 },
        takeDamage: (damage) => damageTaken.push(damage)
    });
    const deadTarget = makePlayer({
        id: 'dead',
        position: { x: 2, y: 0 },
        alive: false,
        takeDamage: (damage) => damageTaken.push(damage)
    });
    const outOfRangeTarget = makePlayer({
        id: 'out-of-range',
        position: { x: 5, y: 0 },
        takeDamage: (damage) => damageTaken.push(damage)
    });
    const events: Array<{ event: string; payload: unknown }> = [];

    const result = handleRoomAttack(
        attacker,
        new Map([
            ['attacker', attacker],
            ['target', target],
            ['dead', deadTarget],
            ['out-of-range', outOfRangeTarget]
        ]),
        'room',
        makeSocket(events),
        { direction: 'right' }
    );

    assert.equal(result, true);
    assert.deepEqual(damageTaken, [10]);
    assert.deepEqual(attacksStarted, ['sword']);
    assert.deepEqual(events, [
        {
            event: 'player_attacked',
            payload: { socketId: 'socket-attacker', direction: 'right' }
        }
    ]);
});

test('room attack can hit a catapult by its larger collision radius', () => {
    const damageTaken: number[] = [];
    const attacker = makePlayer({
        id: 'attacker',
        position: { x: 0, y: 0 }
    });
    const catapultOwner = makePlayer({
        id: 'owner',
        position: { x: 20, y: 20 },
        catapults: [
            {
                getpos: () => ({ x: 4, y: 0 }),
                takedamage: (damage) => damageTaken.push(damage)
            }
        ]
    });

    handleRoomAttack(
        attacker,
        new Map([
            ['attacker', attacker],
            ['owner', catapultOwner]
        ]),
        'room',
        makeSocket([]),
        { direction: 'right' }
    );

    assert.deepEqual(damageTaken, [10]);
});

test('room attack rejects invalid directions and active cooldowns', () => {
    const attacksStarted: string[] = [];
    const events: Array<{ event: string; payload: unknown }> = [];
    const attacker = makePlayer({
        id: 'attacker',
        position: { x: 0, y: 0 },
        attackNow: (weapon) => attacksStarted.push(weapon)
    });

    assert.equal(
        handleRoomAttack(
            attacker,
            new Map([['attacker', attacker]]),
            'room',
            makeSocket(events),
            { direction: 'north' }
        ),
        false
    );

    const coolingAttacker = makePlayer({
        id: 'cooling',
        position: { x: 0, y: 0 },
        canAttack: false,
        attackNow: (weapon) => attacksStarted.push(weapon)
    });
    assert.equal(
        handleRoomAttack(
            coolingAttacker,
            new Map([['cooling', coolingAttacker]]),
            'room',
            makeSocket(events),
            { direction: 'right' }
        ),
        false
    );
    assert.deepEqual(attacksStarted, []);
    assert.deepEqual(events, []);
});

test('castle damage reduces health and never drops below zero', () => {
    const target = new castle(2, { x: 10, y: 10 });

    assert.equal(target.gethealth(), CASTLE_MAX_HP);
    assert.equal(target.takedamage(30), CASTLE_MAX_HP - 30);
    assert.equal(target.takedamage(CASTLE_MAX_HP), 0);
    assert.equal(target.takedamage(10), 0);
    assert.equal(target.isDestroyed(), true);
});

test('castle damage drops a level and restores health before destruction', () => {
    const target = new castle(2, { x: 10, y: 10 });

    assert.equal(target.upgrade(), true);
    assert.equal(target.getlevel(), 2);
    assert.equal(target.takedamage(CASTLE_MAX_HP), CASTLE_MAX_HP);
    assert.equal(target.getlevel(), 1);
    assert.equal(target.isDestroyed(), false);

    assert.equal(target.takedamage(CASTLE_MAX_HP), 0);
    assert.equal(target.isDestroyed(), true);
});

test('catapult fires and damages its target castle when in range', () => {
    const events: Array<{ event: string; payload: unknown }> = [];
    const target = new castle(2, { x: 2, y: 0 });
    const origin = new castle(1, { x: 0, y: 0 });
    const siegeEngine = new catapult(
        origin,
        {
            to: () => ({
                emit: (event: string, payload: unknown) => {
                    events.push({ event, payload });
                }
            })
        } as unknown as Socket['nsp'],
        'room',
        () => undefined,
        {
            getSpawnPoint: () => ({ pos: { x: 0, y: 0 } }),
            reserveCatapultPosition: (_id: string, position: Vec2) => position,
            findCatapultPath: () => [],
            updateCatapultPosition: () => true,
            canCatapultMoveTo: () => true,
            removeCatapultPosition: () => undefined
        } as never,
        target
    );

    siegeEngine.loop();
    siegeEngine.loop();

    assert.equal(target.gethealth(), CASTLE_MAX_HP - 20);
    assert.deepEqual(
        events.map(({ event }) => event),
        ['catapult_attack', 'castle_damaged']
    );
});

test('catapult takes damage and is destroyed only once at zero health', () => {
    const events: Array<{ event: string; payload: unknown }> = [];
    const destroyed: string[] = [];
    const siegeEngine = new catapult(
        new castle(1, { x: 0, y: 0 }),
        {
            to: () => ({
                emit: (event: string, payload: unknown) => {
                    events.push({ event, payload });
                }
            })
        } as unknown as Socket['nsp'],
        'room',
        (catapultId) => destroyed.push(catapultId),
        {
            getSpawnPoint: () => ({ pos: { x: 0, y: 0 } }),
            reserveCatapultPosition: (_id: string, position: Vec2) => position,
            findCatapultPath: () => [],
            updateCatapultPosition: () => true,
            canCatapultMoveTo: () => true,
            removeCatapultPosition: () => undefined
        } as never
    );

    assert.equal(siegeEngine.gethealth(), CATAPULT_MAX_HP);
    assert.equal(siegeEngine.takedamage(25), CATAPULT_MAX_HP - 25);
    assert.equal(siegeEngine.takedamage(CATAPULT_MAX_HP), 0);
    assert.equal(siegeEngine.takedamage(10), 0);
    assert.deepEqual(destroyed, [siegeEngine.id]);
    assert.deepEqual(
        events.map(({ event }) => event),
        ['catapult_damaged', 'catapult_damaged', 'catapult_broken']
    );
});
