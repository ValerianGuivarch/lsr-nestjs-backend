import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Lightweight Foundry 14 contract test; no real-world settings are changed.
const settingsData = {
  'core.rtcWorldSettings': {mode:0, turn:{type:'server',url:'',username:'',password:''}},
  'core.rtcClientSettings': {users:{gm:{muted:false, hidden:false}}, audioSrc:'default',videoSrc:'default',voice:{mode:'always'}},
  'pf2e-val-toolkit.avControlInitialized': true,
  'pf2e-val-toolkit.avHideVideoPanels': false
};
const hooks = new Map();
const registered = new Map();
const calls = [];
const clone = value => structuredClone(value);
const getProp = (obj, path) => path.split('.').reduce((value,key) => value?.[key],obj);

globalThis.foundry = {
  utils: {deepClone: clone, getProperty: getProp},
  av: {}
};
class AVMaster {
  constructor() {
    this.settings = {world:clone(settingsData['core.rtcWorldSettings']),client:clone(settingsData['core.rtcClientSettings'])};
    const lk = { audioTrack:null, videoTrack:null };
    this.client = {_liveKitClient:lk};
    this.connected = false;
  }
  async connect() {
    calls.push(['connect',this.settings.world.mode]);
    if (this.settings.world.mode === 0) return false;
    this.connected=true;
    this.client._liveKitClient.audioTrack ??= {stop(){calls.push(['stopAudio']);}};
    this.client._liveKitClient.videoTrack ??= this.settings.world.mode === 3 ? {stop(){calls.push(['stopVideo']);}} : null;
    return true;
  }
  async disconnect() {this.connected=false;calls.push(['disconnect']);return true;}
}
foundry.av.AVMaster=AVMaster;
globalThis.Hooks={on(name, callback){const arr=hooks.get(name) ?? [];arr.push(callback);hooks.set(name,arr);}};
globalThis.game={
  ready:true,userId:'gm',user:{id:'gm',isGM:true},modules:new Map([['avclient-livekit',{active:true}]]),
  settings:{
    get(namespace,key){return clone(settingsData[`${namespace}.${key}`]);},
    async set(namespace,key,value){settingsData[`${namespace}.${key}`]=clone(value);return value;},
    register(namespace,key,definition){registered.set(`${namespace}.${key}`,definition);}
  },
  i18n:{has(){return false;}},
  pf2eValToolkit:{}
};
globalThis.document={body:{classList:{toggle(){}}},querySelectorAll(){return [];}};
globalThis.window={setTimeout(callback){ /* tooltip initialization is browser-only */ return 0;}};
globalThis.ui={notifications:{info(){},error(){},warn(){}},controls:{render(){}},webrtc:{render(){}}};
globalThis.console=console;
game.webrtc=new AVMaster();

const src=readFileSync(new URL('../scripts/livekit-mj-controls.js', import.meta.url),'utf8');
const mod=await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
mod.registerAVControlSettings();
mod.initAVControl();
assert.equal(registered.size,2);
assert.equal(game.pf2eValToolkit.avControl.getMode(),0);

await game.pf2eValToolkit.avControl.setMode(1);
assert.equal(game.webrtc.connected,true,'Audio mode connects the client');
assert.equal(settingsData['core.rtcClientSettings'].users.gm.muted,true,'Microphone stays muted');
assert.equal(settingsData['core.rtcClientSettings'].users.gm.hidden,true,'Camera stays hidden');
assert.ok(calls.some(([kind,mode]) => kind==='connect' && mode===1),'AVMaster saw the new world mode');

// User deliberately opens their microphone. Switching to AV keeps that choice
// but still leaves their camera private.
settingsData['core.rtcClientSettings'].users.gm.muted=false;
game.webrtc.settings.client.users.gm.muted=false;
await game.pf2eValToolkit.avControl.setMode(3);
assert.equal(game.webrtc.connected,true);
assert.equal(settingsData['core.rtcClientSettings'].users.gm.muted,false);
assert.equal(settingsData['core.rtcClientSettings'].users.gm.hidden,true);

await game.pf2eValToolkit.avControl.setMode(0);
assert.equal(game.webrtc.connected,false,'Global stop disconnects');
assert.equal(game.webrtc.client._liveKitClient.audioTrack,null,'Audio device released');
assert.equal(game.webrtc.client._liveKitClient.videoTrack,null,'Video device released');
assert.equal(settingsData['core.rtcClientSettings'].users.gm.muted,true,'Audio remains off after stop');
assert.equal(settingsData['core.rtcClientSettings'].users.gm.hidden,true,'Video remains off after stop');

await game.pf2eValToolkit.avControl.setPanelsHidden(true);
assert.equal(settingsData['pf2e-val-toolkit.avHideVideoPanels'],true);
game.user.isGM=false;
await assert.rejects(game.pf2eValToolkit.avControl.setMode(3),/MJ/);
await assert.rejects(game.pf2eValToolkit.avControl.setPanelsHidden(false),/MJ/);
console.log('OK: 3 modes, privacy, media stop, panel setting and GM access');
