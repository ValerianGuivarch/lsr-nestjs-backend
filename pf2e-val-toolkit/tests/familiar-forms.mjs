import assert from 'node:assert/strict';
import { HUNT_FORMS, presetSelection, presetSource, hasHuntForms, huntFavorites } from '../scripts/familiar-selector.js';

const all = new Set(Object.values(HUNT_FORMS).flatMap(form => [...form.fixed, ...form.suggested]));
assert.equal(Object.keys(HUNT_FORMS).length, 9);
assert.deepEqual(HUNT_FORMS.genet.fixed, []);
assert.deepEqual(HUNT_FORMS.genet.suggested, ['climber','darkvision']);
assert.deepEqual(Object.keys(HUNT_FORMS).filter(id=>HUNT_FORMS[id].fixed.length), ['falcon','otter','raven']);
assert.deepEqual(HUNT_FORMS.wildcat.suggested, ['touch-telepathy','ambassador']);
assert.equal(hasHuntForms({type:'familiar',name:'Prism'}),true);
assert.equal(hasHuntForms({type:'familiar',name:'Prisme'}),true);
assert.equal(hasHuntForms({type:'familiar',name:'prism'}),false);
assert.equal(hasHuntForms({type:'character',name:'Prism'}),false);
assert.equal(hasHuntForms({type:'familiar',name:'Autre'}),false);
assert.deepEqual(new Set(huntFavorites(['custom-favorite','skilled'])), new Set(['custom-favorite',...all]));
assert.equal(huntFavorites(['skilled']).filter(slug=>slug==='skilled').length,1);
for (const [id, form] of Object.entries(HUNT_FORMS)) {
  const preset = presetSelection(id, [], 2, [], all);
  assert.deepEqual([...preset.selected], [...form.fixed, ...form.suggested]);
  assert.deepEqual([...preset.fixed], form.fixed);
  assert.equal(preset.selected.size, 2);
  assert.equal(presetSelection(id, [], 4, [], all).selected.size, 2);
}
assert.deepEqual([...presetSelection('ermine', [], 2, [], all).fixed], []);
assert.deepEqual([...presetSelection('falcon', ['patron'], 2, [], new Set([...all, 'patron'])).selected], ['flier']);
assert.equal(presetSelection('falcon', [], 1, ['custom'], all), null);
assert.equal(presetSelection('falcon', [], 2, [], new Set(['fast-movement'])), null);
assert.equal(presetSelection('invalid', [], 2, [], all), null);
assert.deepEqual(presetSelection('hound', [], 2, [], all).choices.skilled, { skill: 'survival' });
assert.deepEqual(presetSelection('wolf', [], 2, [], all).choices.skilled, { skill: 'intimidation' });
assert.deepEqual(presetSelection('fox', [], 2, [], all).choices.skilled, { skill: 'deception' });
const source = { system: { rules: [{ key: 'ChoiceSet', flag: 'skill', choices: [{ value: 'survival' }, { value: 'deception' }] }] } };
const doc = { toObject: () => structuredClone(source) };
assert.equal(presetSource(doc, { skill: 'survival' }).system.rules[0].selection, 'survival');
assert.equal(presetSource(doc, { skill: 'invalid' }).system.rules[0].selection, undefined);
assert.equal(source.system.rules[0].selection, undefined);
console.log('Nine familiar forms: presets, reserved slots and native choices passed.');
