import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root="/home/valou/services/foundry/data/Data/modules/racooze-map-library/scripts/";
const original=readFileSync(root+"main.js","utf8");
assert(original.includes("const uploaded = await foundry.applications.apps.FilePicker.upload("));
assert(original.includes("await this.localFileStatus(localPath, entry.sha256)"));
assert(original.includes("installRacoozeRepair({"));

// Exercise Foundry's false-return behavior on the actual patched uploader.
const method=original.match(/static async uploadBlob\(fullPath, blob\) \{([\s\S]*?)\n  \}\n\}/);
assert(method,"uploadBlob implementation");
globalThis.File=class {constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options?.type;}};
let response=false;
globalThis.foundry={
  applications:{
    apps:{
      FilePicker:{upload:async()=>response}
    },
    api:{DialogV2:{confirm:async()=>true}}
  },
  utils:{getRoute:x=>x}
};
const uploader=new Function("fullPath","blob","foundry","File",
  "return (async()=>{"+method[1]+"\n})();");
await assert.rejects(uploader("assets/racooze-map-assets/sot-reths-shack/classic/reths-shack.webp",
  {type:"image/webp"},foundry,File),/Upload refusé/);
response={path:"assets/racooze-map-assets/sot-reths-shack/classic/reths-shack.webp"};
assert.equal(await uploader(response.path,{type:"image/webp"},foundry,File),response.path);
console.log("OK: failed FilePicker.upload response is rejected, success is accepted");

const scene={name:"Reth's Shack",thumb:"assets/racooze-map-assets/sot-reths-shack/classic/_scene-thumbnails/test.webp",
  getFlag:()=> "sot-reths-shack"};
let callback=null, node=null, downloads=0, uploadCalls=0, thumbs=0;
class HTMLElement {}
globalThis.HTMLElement=HTMLElement;
const row={
  querySelector:()=>null,
  append(button){node=button;}
};
const el=new HTMLElement();
el.querySelector=selector=>selector==="[data-racooze-map-library-row]"?row:null;
globalThis.document={createElement:()=>({
  classList:{add:()=>{}},dataset:{},
  addEventListener(event,fn){if(event==="click")callback=fn}
})};
globalThis.Hooks={on:(key,fn)=>{
  assert.equal(key,"renderSceneDirectory");
  globalThis.testHook=fn;
}};
globalThis.game={scenes:[scene]};
globalThis.fetch=async()=>({ok:false,status:404});
let lastResult;
const fileStatus=new Set();
const deps={
  MODULE_ID:"racooze-map-library",
  ASSET_ROOT:"assets/racooze-map-assets",
  RacoozeUserAccess:{
    isFullGameMaster:()=>true,
    notify:()=>{}
  },
  RacoozeInstallationState:{
    entries:()=>[{slug:"sot-reths-shack",variant:"classic",value:{
      assets:{"reths-shack.webp":{sha256:"a".repeat(64)}}
    }}]
  },
  RacoozeDownloader:{
    localFileStatus:async(path)=>fileStatus.has(path)?"same":"missing",
    ensureDirectory:async()=>{},
    uploadBlob:async(path)=>{uploadCalls++;fileStatus.add(path);},
    generateSceneThumbnail:async()=>{thumbs++;return true;}
  },
  RacoozeApi:{asset:async()=>{downloads++;return {size:375758};}},
  RacoozeDownloadQueue:{
    enqueue({run}){
      const ctrl={update:()=>{},waitIfPaused:async()=>{},isCancelRequested:()=>false};
      const promise=run(ctrl).then(result=>{lastResult=result;return result;});
      return {completion:promise};
    }
  },
  openLibrary:async()=>{}
};
const source=readFileSync(root+"repair.js","utf8");
const {installRacoozeRepair}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
installRacoozeRepair(deps);
testHook(null,el);
assert(node && callback,"The GM repair button is exposed");
await callback({preventDefault(){},stopPropagation(){}});
assert.equal(lastResult.queueStatus,"completed");
assert.equal(downloads,1);
assert.equal(uploadCalls,1);
assert.equal(thumbs,1);
assert.equal(lastResult.completed,1);
assert.equal(lastResult.changed,1);
// A second run must not download anything already hashed and present.
await callback({preventDefault(){},stopPropagation(){}});
assert.equal(downloads,1);
console.log("OK: one missing image recovered, existing scenes preserved, thumbnail regenerated, idempotent");

[executed on device: minipc (0f1786de-8721-4294-b517-165961157741)]