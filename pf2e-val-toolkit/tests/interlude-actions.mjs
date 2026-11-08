import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../scripts/interlude-actions.js', import.meta.url), 'utf8');
const module = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
const rolls=[];
const messages=[];
const dialogResults=[];
const stats={
 diplomacy:{label:'Diplomatie',roll:async options=>rolls.push(['diplomacy',options])},
 nature:{label:'Nature',roll:async options=>rolls.push(['nature',options])}
};
const actor={type:'character',name:'Pépin',uuid:'Actor.pepin',isOwner:true,
 items:[{slug:'hobnobber'}],getStatistic:id=>stats[id]};
globalThis.game={user:{isGM:false,character:actor,targets:{first:()=>null}},modules:{get:id=>id==='pf2e-hud'?{active:true}:null}};
globalThis.canvas={tokens:{controlled:[]}};
const warnings=[];
globalThis.ui={notifications:{warn:message=>warnings.push(message),error:message=>{throw Error(message)}}};
globalThis.foundry={utils:{escapeHTML:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')},applications:{api:{DialogV2:{wait:async config=>{assert.ok(!config.content.includes('<form'), 'DialogV2 must not contain nested form');return dialogResults.shift()}}}}};
globalThis.ChatMessage={getSpeaker:()=>({actor:'pepin'}),create:async m=>messages.push(m)};
globalThis.fetch=async()=>({ok:true,json:async()=>[{id:1,name:'Aberton',group:'Localités'}]});
dialogResults.push({target:'Marins',dc:15,skill:'diplomacy'});
await module.openInterludeActivity(actor,'create');
assert.equal(rolls[0][0],'diplomacy');
assert.equal(rolls[0][1].rollMode,'blindroll', 'Gather Information is a secret check');
assert.equal(rolls[0][1].dc.value,15);
assert.ok(!messages[0].content.includes('DD 15'), 'A secret DC is not announced publicly');
dialogResults.push({target:'Neria',dc:23,skill:'diplomacy'});
await module.openInterludeActivity(actor,'maintain');
assert.equal(rolls[1][0],'diplomacy');
assert.equal(rolls[1][1].dc.value,23);
assert.equal(rolls[1][1].rollMode,undefined);
dialogResults.push({target:'Aberton',dc:20,skill:'nature'});
await module.openInterludeActivity(actor,'community');
assert.equal(rolls[2][0],'nature');
assert.equal(rolls[2][1].dc.value,20);
assert.equal(messages.length,3);
assert.ok(messages.every(m=>m.content.includes('validation et saisie par le MJ')));
const withoutFeat={...actor,items:[]};
await module.openInterludeActivity(withoutFeat,'create');
await module.openInterludeActivity(withoutFeat,'maintain');
assert.equal(warnings.length,2);
assert.equal(rolls.length,3);
console.log('OK — three interlude flows, feat permissions, blind roll and manual MJ validation');
