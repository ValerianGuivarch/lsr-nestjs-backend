import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  isPrivateRoll,
  privateRollCharacterName,
  privateRollActionLabel,
  replaceGenericPrivateRollNotice,
  initPrivateRollCharacterNames,
} from '../scripts/private-roll-names.js';

const actors = new Map([['pj1', {name:'Pen-Pen (Arcady)'}]]);
const users = new Map([['arcady', {character:{name:'Pen-Pen (Arcady)'}}]]);
const flavor = '<h4 class="action"><span class="pf2-icon">A</span><strong> Se Souvenir </strong></h4><p>DC 24, résultat : Succès critique</p>';
const blind = {
  isRoll:true,
  blind:true,
  whisper:['gm'],
  rolls:[{total:18}],
  speaker:{actor:'pj1',alias:'Pen-Pen (Arcady)'},
  author:{id:'arcady'},
  flavor,
};

assert.equal(isPrivateRoll(blind),true);
assert.equal(privateRollCharacterName(blind,actors,users),'Pen-Pen');
assert.equal(privateRollActionLabel(blind),'Se Souvenir');
assert.equal(privateRollCharacterName({...blind,speaker:{}},actors,users),'Pen-Pen');
assert.equal(privateRollCharacterName({...blind,speaker:{actor:null,alias:'Pen-Pen (Arcady)'},author:null},actors,new Map()),'Pen-Pen');
assert.equal(privateRollCharacterName({...blind,blind:false,whisper:[],rollMode:'publicroll'},actors,users),null);
assert.equal(privateRollCharacterName({...blind,isRoll:false,rolls:[]},actors,users),null);
assert.equal(privateRollActionLabel({...blind,flavor:'<div>DC 24, succès critique</div>'}),null);
assert.equal(replaceGenericPrivateRollNotice('Arcady a effectué un jet de dés privé','Pen-Pen'), 'Pen-Pen a effectué un jet de dés privé');
assert.equal(replaceGenericPrivateRollNotice('Arcady a effectué un jet de dés privé',null), 'Arcady a effectué un jet de dés privé');

const {window}=new JSDOM('<article class="chat-message"><header><span class="message-sender">Arcady</span></header><div class="message-content"><p>Arcady a effectué un jet de dés privé</p><div class="dice-roll"><div>???</div><div>?</div></div></div></article>');
globalThis.HTMLElement = window.HTMLElement;
globalThis.NodeFilter = window.NodeFilter;
globalThis.document = window.document;
globalThis.game = {actors, users};
let callback;
globalThis.Hooks = {on(name, fn) { assert.equal(name,'renderChatMessageHTML'); callback=fn; }};
initPrivateRollCharacterNames();
const root=window.document.querySelector('.chat-message');
callback(blind, root);
assert.equal(root.querySelector('.message-sender').textContent,'Pen-Pen');
assert.match(root.querySelector('.message-content').textContent,/Pen-Pen a effectué un jet de dés privé/);
assert.equal(root.querySelector('.pf2e-val-private-roll-purpose').textContent,'Jet : Se Souvenir');
assert.match(root.querySelector('.dice-roll').textContent,/\?\?\?/);
assert.doesNotMatch(root.textContent,/DC 24|Succès critique|18/);
callback(blind,root);
assert.equal(root.querySelectorAll('.pf2e-val-private-roll-purpose').length,1);

console.log('Private roll character and safe action labels OK');
