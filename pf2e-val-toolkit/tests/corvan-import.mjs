import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../assets/corvan/manifest.json',import.meta.url),'utf8'));
const created=[];
let nextId=0;
const randomId=()=>String(++nextId).padStart(16,'0');
class MockItem {
  constructor(d){Object.assign(this,d);this.id=d._id??randomId();}
  getFlag(namespace,key){return this.flags?.[namespace]?.[key];}
  async update(data){
    if(data['system.slots'])this.system.slots=data['system.slots'];
    if(data['system.keyAbility.selected'])this.system.keyAbility.selected=data['system.keyAbility.selected'];
  }
}
class MockActor{
  constructor(d){
    Object.assign(this,d);this.id=randomId();this.uuid='Actor.'+this.id;
    this.items=[];this.folder=folders[0];
    this.system.attributes={hp:{max:234,value:0}};
  }
  getFlag(ns,key){return this.flags?.[ns]?.[key];}
  async setFlag(ns,key,value){this.flags[ns]??={};this.flags[ns][key]=value;}
  async update(data){
    if(data['system.attributes.hp.value']!==undefined)this.system.attributes.hp.value=data['system.attributes.hp.value'];
    if(data['system.details.level.value']!==undefined)this.system.details.level.value=data['system.details.level.value'];
    if(data['system.details.keyability.value']!==undefined)this.system.details.keyability.value=data['system.details.keyability.value'];
    if(data['system.details.xp.value']!==undefined)this.system.details.xp.value=data['system.details.xp.value'];
    if(data['flags.pf2e-val-toolkit.xpc']!==undefined)this.flags['pf2e-val-toolkit'].xpc=data['flags.pf2e-val-toolkit.xpc'];
  }
  async createEmbeddedDocuments(what,docs){
    assert.equal(what,'Item');
    const result=docs.map(d=>new MockItem({...structuredClone(d),_id:randomId()}));
    this.items.push(...result);this.items.size=this.items.length;
    return result;
  }
}
const folders=[{id:manifest.folderId,name:'Divers',type:'Actor',folder:{name:'MJ'}}];
globalThis.game={
  user:{isGM:true,id:'gm'},users:{activeGM:{id:'gm'}},system:{id:'pf2e'},
  folders:{get:id=>folders.find(f=>f.id===id),find:fn=>folders.find(fn)},
  actors:{find:fn=>created.find(fn)}
};
globalThis.Actor={async create(data){const a=new MockActor(data);created.push(a);return a;}};
globalThis.ui={notifications:{info(){}},console};
globalThis.fetch=async()=>({ok:true,json:async()=>manifest});
globalThis.fromUuid=async uuid=>({
  toObject(){
    const type=uuid.includes('.classes.')?'class':uuid.includes('.ancestries.')?'ancestry':
      uuid.includes('.backgrounds.')?'background':uuid.includes('.spells-srd.')?'spell':
      uuid.includes('.familiar-abilities.')?'action':uuid.includes('.equipment-srd.')?'weapon':'feat';
    return {name:uuid,type,
      system:{boosts:{'0':{},'1':{},'2':{}},description:{value:''},level:{value:1},keyAbility:{selected:null},items:{},rules:[]},
      flags:{}};
  }
});
const src=readFileSync(new URL('../scripts/corvan-import.js',import.meta.url),'utf8');
const {createCorvan}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
await createCorvan();
assert.equal(created.length,2,'Exactly character and familiar');
const [corvan,knife]=created;
assert.equal(corvan.type,'character');
assert.equal(corvan.system.details.level.value,20);
assert.equal(corvan.img,manifest.portrait);
assert.equal(corvan.folder.id,manifest.folderId);
assert.equal(knife.system.master.id,corvan.id);
assert.equal(knife.img,manifest.familiarPortrait);
assert.equal(corvan.getFlag('pf2e-val-toolkit','corvanComplete'),true);
const spells=corvan.items.filter(i=>i.type==='spell');
assert.equal(spells.length,41,'33 prepared spells, 5 additional known cantrips, 3 focus hexes');
const feats=corvan.items.filter(i=>i.getFlag('pf2e-val-toolkit','seedKey')?.startsWith('class-'));
assert.equal(feats.length,10,'10 Witch class feats');
assert.equal(knife.items.filter(i=>i.type==='action').length,7,'7 familiar abilities');
const entry=corvan.items.find(i=>i.getFlag('pf2e-val-toolkit','seedKey')==='occult-entry');
assert.equal(entry.system.slots.slot0.prepared.length,5);
for(let rank=1;rank<=9;rank++)assert.equal(entry.system.slots['slot'+rank].prepared.length,3);
assert.equal(entry.system.slots.slot10.prepared.length,1);
assert.equal(corvan.system.attributes.hp.value,234,'HP filled to calculated max');
assert.equal(corvan.getFlag('pf2e-val-toolkit','xpc'),356000);
assert.equal(corvan.system.details.keyability.value,'int');
const witch=corvan.items.find(i=>i.getFlag('pf2e-val-toolkit','seedKey')==='class');
assert.equal(witch.system.keyAbility.selected,'int');
await createCorvan();
assert.equal(created.length,2,'No duplicate on next reload');
// Reproduce the live v0.44.7 regression: Corvan was mistakenly synced as a
// participant in campaign XP and dropped to level 1 / 14 HP.
corvan.flags['pf2e-val-toolkit'].xpc=0;
corvan.system.details.level.value=1;
corvan.system.details.keyability.value='str';
corvan.system.details.xp.value=0;
corvan.system.attributes.hp.value=14;
witch.system.keyAbility.selected=null;
knife.system.attributes.hp={max:100,value:5};
await createCorvan();
assert.equal(corvan.system.details.level.value,20,'Level must be restored on GM reload');
assert.equal(corvan.system.details.keyability.value,'int');
assert.equal(corvan.system.details.xp.value,1000);
assert.equal(corvan.getFlag('pf2e-val-toolkit','xpc'),356000);
assert.equal(witch.system.keyAbility.selected,'int');
assert.equal(corvan.system.attributes.hp.value,234,'Corvan HP refilled after level fix');
assert.equal(knife.system.attributes.hp.value,100,'Familiar HP restored after level fix');
assert.equal(created.length,2,'No duplicate actors during repair');
game.user.isGM=false;
await createCorvan();
assert.equal(created.length,2,'No creation for player');
console.log('OK: Corvan level 20, 10 class feats, full spell slots, familiar, portrait, idempotency, GM restriction');
