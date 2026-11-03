import assert from 'node:assert/strict';
import test from 'node:test';
import { GameMap, type Resource } from '../srcs/map.js';
import { tryCollectResource } from '../srcs/room/roomMovement.js';
import type { Player } from '../srcs/entities/player.js';

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
    (map as unknown as { resourceSpawns: Resource[] }).resourceSpawns = resources;
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

    assert.deepEqual(tryCollectResource(map, player, { x: 10, y: 10 }), resource);
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