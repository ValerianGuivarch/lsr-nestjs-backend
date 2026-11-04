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

const calculateTreasure = sandbox.window.PF2SessionXpCalculator.summarizeTreasure

test('adds cash and convertible valuables in gp, sp, cp and pp with French notation', () => {
  const result = calculateTreasure('Bandits 12po, 5pa, 20pc\nBijoux 2 pp\nCoffre 1 000 po\nGain 12,5PO')
  assert.equal(result.cashGp, 1045.2)
  assert.equal(result.equipmentGp, 0)
  assert.equal(result.combinedGp, 1045.2)
  assert.equal(result.amountCount, 6)
})

test('tracks priced items separately instead of counting their price as spendable cash', () => {
  const notes = 'Bandits : 12po\nObjet : potion de soins (4po)\nOBJETS - parchemin 5 pa\nPotion de soins : objet trouvé'
  const result = calculateTreasure(notes)
  assert.equal(result.cashGp, 12)
  assert.equal(result.equipmentGp, 4.5)
  assert.equal(result.combinedGp, 16.5)
  assert.equal(result.itemLines, 3)
  assert.equal(result.unvaluedItemLines, 1)
})

test('ignores XP, stray numbers and XPC while handling corrected coin awards', () => {
  const result = calculateTreasure('Séance 16, chef vaincu 2000 XP, bonus 30XPC\nOr 50PO\nRetrait -10po')
  assert.equal(result.cashGp, 40)
  assert.equal(result.equipmentGp, 0)
})

test('works without any mentioned money and keeps XP logic unchanged', () => {
  assert.equal(calculateTreasure('Gnome libéré 30XP\nObjet : potion sans prix').cashGp, 0)
  assert.equal(calculateTreasure('Gnome libéré 30XP\nObjet : potion sans prix').unvaluedItemLines, 1)
  assert.equal(calculate('Gnome libéré 30XP\nObjet : potion (4po)').total, 30)
})
