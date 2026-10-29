import assert from 'node:assert/strict';
import {moveToolsToMJ, MJ_TOOLS} from '../scripts/mj-scene-controls.js';

globalThis.game = {user: {isGM: true}};
const controls = {
  tokens: {name:'tokens', order:0, tools:{select:{name:'select',order:0}}},
  walls: {name:'walls',order:5,tools:{walls:{name:'walls',order:0}}}
};
const invoked=[];
for (const name of MJ_TOOLS) {
  controls.tokens.tools[name]={name, icon:'fa-solid fa-star', title:name, order:4,
    onChange:()=>invoked.push(name),button:true};
}
moveToolsToMJ(controls);
assert.deepEqual(Object.keys(controls.pf2eValMJ.tools), MJ_TOOLS);
assert.equal(controls.pf2eValMJ.name, 'pf2eValMJ');
assert.equal(controls.pf2eValMJ.order,6);
assert.equal(Object.keys(controls.tokens.tools).length,1);
for(const tool of Object.values(controls.pf2eValMJ.tools)) tool.onChange();
assert.deepEqual(invoked, MJ_TOOLS, 'original toolkit callbacks retained');
const noGM = {tokens:{tools:{...controls.pf2eValMJ.tools}}};
game.user.isGM = false;
moveToolsToMJ(noGM);
assert.equal(noGM.pf2eValMJ, undefined, 'no MJ section for players');
console.log('OK: all four toolkit buttons in MJ section, callbacks and permissions retained');
