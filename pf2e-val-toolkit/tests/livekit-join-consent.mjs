import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/livekit-mj-controls.js', import.meta.url), 'utf8');
const tests = [
  {name:'Audio-only accepts microphone', mode:1, choice:'audio', actions:['users.player.muted:false'], labels:['Activer le micro','Refuser']},
  {name:'AV allows just microphone', mode:3, choice:'audio', actions:['users.player.muted:false'], labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'AV accepts both sources', mode:3, choice:'both', actions:['users.player.muted:false','users.player.hidden:false'], labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'Audio-only refuse', mode:1, choice:'decline', actions:[], labels:['Activer le micro','Refuser']},
  {name:'AV refuse', mode:3, choice:'decline', actions:[], labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'AV close without action', mode:3, choice:null, actions:[], labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'Audio OFF offers nothing', mode:0, choice:'audio', actions:[], labels:[]},
  {name:'AV connecting offers nothing', mode:3, roomState:'connecting', choice:'both', actions:[], labels:[]},
  {name:'AV with already open microphone offers nothing', mode:3, muted:false, choice:'both', actions:[], labels:[]},
  {name:'MJ switches to audio while dialog is open',mode:3,choice:'both',switchTo:1, actions:['users.player.muted:false'],labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'MJ switches OFF while dialog is open',mode:3,choice:'both',switchTo:0, actions:[],labels:['Activer le micro','Activer micro et caméra','Refuser']},
  {name:'AV becomes available after page opened while OFF',mode:0,activateTo:3,choice:'audio',actions:['users.player.muted:false'],labels:['Activer le micro','Activer micro et caméra','Refuser']}
];

for (let i=0; i<tests.length; i++) {
  const t=tests[i];
  const settings = {'core.rtcWorldSettings':{mode:t.mode},'pf2e-val-toolkit.avControlInitialized':true};
  const calls=[];
  let shown=0;
  let dialogTitles=[];
  globalThis.foundry={
    utils: {},
    applications:{api:{DialogV2:{
      async wait({window,buttons,render}) {
        shown++;
        dialogTitles.push(window.title);
        calls.push(['dialog',buttons.map(b=>b.label)]);
        if (t.switchTo!==undefined) settings['core.rtcWorldSettings'].mode=t.switchTo;
        render?.(null,{close:()=>Promise.resolve()});
        return t.choice;
      }
    }}}
  };
  globalThis.game={ready:true,userId:'player',user:{isGM:false},settings:{get:(ns,key)=>settings[`${ns}.${key}`]},
    webrtc:{
      client:{_liveKitClient:{liveKitRoom:{state:t.roomState??'connected'}}},
      settings:{
        getUser:()=>({muted:t.muted??true,hidden:true}),
        set:(scope,path,value)=>calls.push(['set',path,value])
      },
      canUserBroadcastAudio:()=>true,canUserBroadcastVideo:()=>true
    }
  };
  globalThis.ui={webrtc:{render:async()=>calls.push(['render'])},notifications:{error:msg=>{throw Error(msg)}}};
  const module=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#test${i}`);
  if (t.activateTo!==undefined) {
    const first=await module.offerLocalAVActivation();
    assert.equal(first,false,`${t.name}: initial inactive mode must not prompt`);
    settings['core.rtcWorldSettings'].mode=t.activateTo;
  }
  const result=await module.offerLocalAVActivation();
  assert.equal(result,t.labels.length>0,`${t.name}: should offer only when AV active and a valid connection exists`);
  const actions=calls.filter(call=>call[0]==='set').map(call=>`${call[1]}:${call[2]}`);
  assert.deepEqual(actions,t.actions,t.name);
  assert.deepEqual(calls.find(call=>call[0]==='dialog')?.[1]??[],t.labels,`${t.name}: available choices`);
  assert.equal(shown,t.labels.length>0?1:0,`${t.name}: dialog count`);
  if (t.labels.length) {
    assert.match(dialogTitles[0],/Activer le micro/);
    const again=await module.offerLocalAVActivation();
    assert.equal(again,false,`${t.name}: no second prompt in same page load`);
    assert.equal(shown,1,`${t.name}: no repeated prompt after refusal or choice`);
  }
  console.log(`OK: ${t.name}`);
}
