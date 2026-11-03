const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const sandbox = { window: {} }
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, 'pf2-session-xp-calc.js'), 'utf8'),
  sandbox,
)
const calculate = sandbox.window.PF2SessionXpCalculator.summarize

test('accepts upper/lower case XP with and without spaces', () => {
  assert.equal(calculate('Gnome libéré 30XP, chef vaincu 2000 XP, énigme 150xp').total, 2180)
  assert.equal(calculate('Gnome libéré 30XP, chef vaincu 2000 XP, énigme 150xp').count, 3)
})

test('accepts French grouping and decimal separators', () => {
  assert.equal(calculate('3 000 XP, 2\u00a0000xp et 12,5Xp').total, 5012.5)
})

test('ignores unlabelled numbers and XPC markers', () => {
  assert.equal(calculate('Séance 16, niveau 4, 900 XPC ; gain 20xp').total, 20)
  assert.equal(calculate('Aucun XP encore').total, 0)
})

test('can represent an explicit deduction', () => {
  assert.equal(calculate('Victoire 100 XP. Correction -20 XP').total, 80)
})
