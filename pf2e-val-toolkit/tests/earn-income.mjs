import assert from 'node:assert/strict';
import {parseEarnIncomeCoins} from '../scripts/earn-income/index.js';
assert.deepEqual(parseEarnIncomeCoins('2 po 3 pa'),{gp:2,sp:3});
assert.deepEqual(parseEarnIncomeCoins('1 gp, 5 sp (per day)'),{gp:1,sp:5});
assert.deepEqual(parseEarnIncomeCoins('0 pc'),{cp:0});
assert.equal(parseEarnIncomeCoins('non applicable'),null);
console.log('Earn income currency parser OK');
