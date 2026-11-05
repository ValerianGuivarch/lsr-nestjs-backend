import assert from "node:assert/strict";
import fs from "node:fs/promises";
const source=await fs.readFile(new URL("../scripts/map-maintenance-once.js", import.meta.url),"utf8");
const module=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const dict=JSON.parse(await fs.readFile(new URL("../scripts/map-maintenance-translations.json", import.meta.url),"utf8"));
let worldSettings=null, saved=[], deletes=[], updates=[];
globalThis.saveDataToFile=(data,mime,name)=>{saved.push({data,mime,name});};
const folder={id:"f1",type:"Scene",name:"Age of Ashes",async update(x){updates.push(["folder",x]);this.name=x.name}};
let id=0;
function scene(name,slug,content={}){
  let self={id:"s"+ ++id,name,folder,
    width:2000,height:2000,grid:{size:100,type:1,distance:5},
    active:false,navigation:false,
    tokens: Array.from({length:content.tokens||0},()=>({})),
    walls: Array.from({length:content.walls||1},()=>({})),
    notes:[],drawings:[],lights:[],tiles:[],sounds:[],regions:[],
    levels:[],_stats:{createdTime:id},
    getFlag(ns,key){const info={mapSlug:slug,sceneFile:name+".json",resolvedVariant:"classic",
      scenesFingerprint:"abcd",assetsFingerprint:"abcd"};return info[key];},
    toObject(){return {name:this.name,_id:this.id,original:true};},
    async delete(){deletes.push(this.id);game.scenes.delete(this.id);},
    async update(data){updates.push([this.id,data]);this.name=data.name}
  };return self;
}
const old=scene("Tipsy Tengu","aoe-tipsy-tengu",{tokens:0});
const enriched=scene("Tipsy Tengu","aoe-tipsy-tengu",{tokens:3});
const another=scene("Reth's Shack","sot-reths-shack",{tokens:0});
const created=[old,enriched,another];
const scenes=new Map(created.map(x=>[x.id,x]));
scenes[Symbol.iterator]=function*(){yield* this.values()};
globalThis.game={
  world:{id:"test-pf2"},user:{id:"gm",isGM:true},
  users:{activeGM:{id:"gm"}},scenes,
  folders:{[Symbol.iterator]:function*(){yield folder},get:id=>id===folder.id?folder:null},
  settings:{
    register(module,name,config){worldSettings=structuredClone(config.default)},
    get(){return worldSettings},
    async set(module,name,value){worldSettings=value;return value}
  }
};
globalThis.fetch=async()=>({ok:true,async json(){return dict;}});
globalThis.ui={notifications:{info:()=>{},warn:()=>{},error:()=>{}}};
module.registerOneTimeMapCleanup();
module.startOneTimeMapCleanup();
for(let i=0;i<100&&!worldSettings?.finished;i++)await new Promise(resolve=>setTimeout(resolve,5));
assert.equal(worldSettings.finished,true);
assert.equal(deletes.length,1);
assert.deepEqual(deletes,[old.id]);
assert.equal(game.scenes.has(enriched.id),true);
assert.equal(enriched.name,"Tengu éméché");
assert.equal(another.name,"Cabane de Reth");
assert.equal(folder.name,"L’Âge des cendres");
assert.equal(saved.length,2);
const report=worldSettings.report;
assert.equal(report.deleted.length,1);
assert.equal(report.errors.length,0);
assert.equal(report.renamed.length,2);
module.startOneTimeMapCleanup();
assert.equal(deletes.length,1,"must not rerun");
console.log("OK: preserved enriched scene, removed exact duplicate, translated scenes/folder, saved backup/report and executed once.");