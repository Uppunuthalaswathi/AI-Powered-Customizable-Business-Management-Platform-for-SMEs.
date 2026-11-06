import test from 'node:test';
import assert from 'node:assert/strict';
import { getStockStatus } from '../src/utils/stockStatus.js';

test('quantity zero is out of stock', () => assert.equal(getStockStatus(0, 5), 'OUT_OF_STOCK'));
test('quantity below threshold is low stock', () => assert.equal(getStockStatus(2, 5), 'LOW_STOCK'));
test('quantity equal to threshold is low stock', () => assert.equal(getStockStatus(5, 5), 'LOW_STOCK'));
test('quantity above threshold is in stock', () => assert.equal(getStockStatus(6, 5), 'IN_STOCK'));
test('zero threshold with positive quantity is in stock', () => assert.equal(getStockStatus(1, 0), 'IN_STOCK'));
test('negative and non-integer inputs are rejected', () => {
  for (const values of [[-1, 5], [1, -1], [1.5, 5], [1, 2.5]]) assert.throws(() => getStockStatus(...values), TypeError);
});
