import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initPf2eHudIntegration, registerPf2eHudIntegrationSettings } from '../scripts/pf2e-hud-integration.js';

const dom = new JSDOM('<!doctype html><html><head></head><body><section id="pf2e-hud-sidebar"></section></body></html>');
globalThis.document = dom.window.document;
globalThis.window = dom.window;
const hooks = new Map();
const settings = new Map();
globalThis.Hooks = {on:(name, handler) => hooks.set(name, handler)};
globalThis.game = {
  modules: {get:id=>id==='pf2e-hud'?{active:true}:null},
  settings: {register:(_id,name,data)=>settings.set(name,data)}
};
registerPf2eHudIntegrationSettings();
assert.equal(settings.get('pf2eHud.localizedActionSort')?.config, false);
assert.equal(settings.get('pf2eHud.groupRecallKnowledge')?.config, false);

initPf2eHudIntegration();
assert.ok(hooks.has('renderApplicationV2'));
const pending = document.createElement('div');
pending.id = 'pf2e-hud-sidebar';
pending.dataset.sidebar = 'extras';
pending.innerHTML = '<header data-filter-value="athletics">Athlétisme</header><button data-action="roll-statistic-action" id="native-action">Frapper</button><div class="pf2e-val-interlude-shortcuts"><button>Créer un contact</button></div><button data-action="use-macro" id="native-macro">Macro de joueur</button>';
const native = pending.querySelector('#native-action');
const macro = pending.querySelector('#native-macro');
const header = pending.querySelector('header');
let clicks = 0;
macro.addEventListener('click', () => clicks++);
const original = [header, native, macro];
hooks.get('renderApplicationV2')({id:'pf2e-hud-sidebar', name:'extras', actor:{name:'Pépin'}}, pending);
assert.equal(pending.querySelector('.pf2e-val-interlude-shortcuts'), null, 'Legacy overlapping buttons removed');
assert.deepEqual([...pending.children], original, 'Native HUD nodes must not be reparented');
macro.click();
assert.equal(clicks, 1, 'Native macro event listeners remain active');
const skills = document.createElement('div');
skills.dataset.sidebar = 'skills';
skills.innerHTML = '<header data-filter-value="perception">Perception</header><div class="statistic-wrapper">Se souvenir</div><header data-filter-value="acrobatics">Acrobaties</header><div class="statistic-wrapper">Un saut</div>';
const skillNodes = [...skills.children];
hooks.get('renderApplicationV2')({id:'pf2e-hud-sidebar',name:'skills'},skills);
assert.deepEqual([...skills.children], skillNodes, 'No HTML reordering');
assert.ok(skillNodes.every(node => node.style.display !== 'none'), 'No hiding of native actions');
assert.equal(skills.querySelectorAll('.pf2e-val-interlude-button').length, 0);
console.log('OK — V14 overlay removed, native character menus, macros and skills DOM untouched');
