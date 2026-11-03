import assert from 'node:assert/strict';
import test from 'node:test';
import { getDistance, isvaliddirection } from '../srcs/util.js';

test('getDistance returns the Euclidean distance', () => {
    assert.equal(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    assert.equal(getDistance({ x: 2, y: 3 }, { x: 2, y: 3 }), 0);
});

test('isvaliddirection accepts only the four supported directions', () => {
    for (const direction of ['up', 'down', 'left', 'right']) {
        assert.equal(isvaliddirection(direction), true);
    }

    for (const direction of ['north', '', null, 1, undefined]) {
        assert.equal(isvaliddirection(direction), false);
    }
});