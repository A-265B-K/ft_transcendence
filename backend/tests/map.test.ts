import assert from 'node:assert/strict';
import test from 'node:test';
import { CATAPULT_RADIUS } from '../srcs/constants.js';
import { Castle } from '../srcs/entities/castle.js';
import { GameMap, type Resource } from '../srcs/map.js';
import { tryCollectResource } from '../srcs/room/roomMovement.js';
import type { Player } from '../srcs/entities/player.js';
import { getDistance } from '../srcs/util.js';

const resource: Resource = {
    id: 'wood_1',
    type: 'wood',
    x: 10,
    y: 10,
    amount: 10,
    respawnTime: 30,
    radius: 1,
    blocksMovement: false
};

function makeMap(resources: Resource[] = []): GameMap {
    const map = Object.create(GameMap.prototype) as GameMap;
    Object.assign(map, {
        resourceSpawns: resources,
        width: 100,
        height: 100,
        castleZones: [],
        obstacles: [],
        catapultPositions: new Map()
    });
    return map;
}

test('map bounds include edge coordinates and reject coordinates beyond them', () => {
    const map = makeMap();

    assert.equal(map.isOutOfBounds({ x: 0, y: 0 }), false);
    assert.equal(map.isOutOfBounds({ x: 100, y: 100 }), false);
    assert.equal(map.isOutOfBounds({ x: -0.1, y: 50 }), true);
    assert.equal(map.isOutOfBounds({ x: 50, y: 100.1 }), true);
});

test('resource collection requires overlap and removes the resource once', () => {
    const map = makeMap([{ ...resource }]);

    assert.equal(map.collectResource({ x: 12, y: 10 }), null);
    assert.deepEqual(map.collectResource({ x: 10, y: 10 }), resource);
    assert.equal(map.collectResource({ x: 10, y: 10 }), null);
});

test('living players receive collected resources', () => {
    const map = makeMap([{ ...resource }]);
    const collected: Resource[] = [];
    const player = {
        isAlive: () => true,
        addResources: (value: Resource) => collected.push(value)
    } as unknown as Player;

    assert.deepEqual(
        tryCollectResource(map, player, { x: 10, y: 10 }),
        resource
    );
    assert.deepEqual(collected, [resource]);
});

test('dead players cannot collect resources', () => {
    const map = makeMap([{ ...resource }]);
    const player = {
        isAlive: () => false,
        addResources: () => assert.fail('dead player received a resource')
    } as unknown as Player;

    assert.equal(tryCollectResource(map, player, { x: 10, y: 10 }), undefined);
    assert.deepEqual(map.collectResource({ x: 10, y: 10 }), resource);
});

test('catapult spawn reservations and movement keep catapults separated', () => {
    const map = makeMap();
    const origin = new Castle(1, { x: 10, y: 10 });
    const preferredPosition = { x: 50, y: 50 };
    const first = map.reserveCatapultPosition(
        'first',
        preferredPosition,
        origin
    );
    const second = map.reserveCatapultPosition(
        'second',
        preferredPosition,
        origin
    );

    assert.ok(first);
    assert.ok(second);
    assert.ok(getDistance(first, second) >= CATAPULT_RADIUS * 2);
    assert.equal(map.canCatapultMoveTo('second', first), false);
    assert.equal(map.updateCatapultPosition('second', first), false);

    map.removeCatapultPosition('first');
    assert.equal(map.canCatapultMoveTo('second', first), true);
});

test('catapult pathfinding routes around other catapults', () => {
    const map = makeMap();
    const origin = new Castle(1, { x: 10, y: 10 });
    const target = new Castle(2, { x: 90, y: 90 });
    const blocker = map.reserveCatapultPosition(
        'blocker',
        { x: 50, y: 50 },
        origin
    );

    assert.ok(blocker);
    const path = map.findCatapultPath(
        { x: 40, y: 50 },
        { x: 70, y: 50 },
        origin,
        target,
        'moving'
    );

    assert.ok(path.length > 0);
    assert.ok(
        path.every(
            (position) => getDistance(position, blocker) >= CATAPULT_RADIUS * 2
        )
    );
});
