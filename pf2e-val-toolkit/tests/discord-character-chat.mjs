import assert from 'node:assert/strict';
import { characterPresentationId } from '../scripts/discord-character-chat.js';

const id = 'c9012a36-6128-4c53-af2e-4c34c85bdd65';
const flagged = { getFlag: (module, key) =>
  module === 'pf2e-val-toolkit' && key === 'discordCharacterPresentation' ? { id } : null };
assert.equal(characterPresentationId(flagged), id);
assert.equal(characterPresentationId({
  content: '<div class="pf2e-val-character-presentation" data-pf2-character-presentation-id="' + id + '">Hello</div>',
}), id);
assert.equal(characterPresentationId({ content: '<p>Ordinary Foundry chat</p>' }), null);
assert.equal(characterPresentationId({ content: '<div data-pf2-character-presentation-id="not-an-id"></div>' }), null);
console.log('Foundry client recognizes both historical toolkit flags and server chat markers');
