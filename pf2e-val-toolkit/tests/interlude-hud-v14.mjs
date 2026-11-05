import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initPf2eHudIntegration } from '../scripts/pf2e-hud-integration.js';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><section id="pf2e-hud-sidebar"></section></body></html>');
globalThis.document = dom.window.document;
globalThis.window = dom.window;
const hooks = new Map();
const frames = [];
globalThis.requestAnimationFrame = callback => frames.push(callback);
globalThis.Hooks = {on:(name,fn) => hooks.set(name,fn)};
const pepin = {
  name: 'Pépin (Eric)', type:'character', uuid:'Actor.nfP4ECNY8uzXvtLD', isOwner:true,
  items:[{name:'Animal social (Hobnobber)',system:{slug:'hobnobber'}}]
};
const stranger = {name:'Autre personnage',type:'character',uuid:'Actor.stranger',isOwner:true,items:[]};
globalThis.game={user:{isGM:false,character:null},modules:{get:id=>id==='pf2e-hud'?{active:true}:null}};
globalThis.canvas={tokens:{controlled:[]}};
initPf2eHudIntegration();
assert.equal(hooks.has('renderApplicationV2'),true,'Must listen to V14 rendering');
assert.equal(hooks.has('renderApplication'),false,'Legacy-only rendering hook should not be used');
while(frames.length)frames.shift()();
const parent = document.querySelector('#pf2e-hud-sidebar');
const pending = document.createElement('div');
pending.className='inner';pending.dataset.sidebar='extras';
// It must be able to decorate the pending HTML even before it reaches the DOM.
hooks.get('renderApplicationV2')({id:'pf2e-hud-sidebar',name:'extras',actor:pepin},pending);
assert.equal(pending.querySelectorAll('.pf2e-val-interlude-button').length,3);
assert.match(pending.textContent,/Créer un contact/);
assert.match(pending.textContent,/Entretenir une relation/);
assert.match(pending.textContent,/Rendre service à une communauté/);
assert.equal(pending.querySelector('.pf2e-val-interlude-shortcuts').dataset.actorUuid,pepin.uuid);
parent.replaceChildren(pending);
while(frames.length)frames.shift()();
assert.equal(parent.querySelectorAll('.pf2e-val-interlude-button').length,3,'Raf refresh must not remove buttons');
const pendingOther=document.createElement('div');pendingOther.className='inner';pendingOther.dataset.sidebar='extras';
hooks.get('renderApplicationV2')({id:'pf2e-hud-sidebar',name:'extras',actor:stranger},pendingOther);
assert.equal(pendingOther.querySelectorAll('.pf2e-val-interlude-button').length,0,'No Hobnobber -> no shortcuts');
parent.replaceChildren(pendingOther);
while(frames.length)frames.shift()();
assert.equal(parent.querySelectorAll('.pf2e-val-interlude-button').length,0,'No leftover shortcuts after actor switch');
console.log('OK — PF2e HUD V14 render hook shows 3 activities for Pépin, hides them for other actors');
