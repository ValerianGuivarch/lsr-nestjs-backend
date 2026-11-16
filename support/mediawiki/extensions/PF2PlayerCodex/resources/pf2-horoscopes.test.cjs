const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="panel"></div>', {runScripts:'outside-only'});
const w = dom.window;
const data = {
 zodiac:[{start:1218,sign:'La Grive',themes:'renouveau'},{start:121,sign:'Le Porteur de lanterne',themes:'guidance'}],
 candidates:[{npcId:'npc1',name:'Ambre'},{npcId:'npc2',name:'Autre'}],
 horoscopes:[{id:1,npcId:'npc1',name:'Ambre',portrait:'ambre.webp',month:1,day:1,sign:'La Grive',themes:'renouveau',roll:15,interpretation:'Texte personnel'}]
};
w.mw={Api:class {get(){return Promise.resolve({pf2horoscopes:data});}},util:{getUrl:v=>v},notify:()=>{}};
w.eval(fs.readFileSync(__dirname+'/pf2-horoscopes.js','utf8'));
w.pf2RenderHoroscopes(w.document.querySelector('#panel'),{npcId:'npc_pj_eryn'});
(async()=>{
 await new Promise(resolve=>setImmediate(resolve));
 const list=w.document.querySelector('.pf2-horoscope-list');
 assert.ok(list);
 assert.equal(w.document.querySelector('.pf2-player-list'),null);
 assert.equal(list.children.length,3,'Distinct toolbar, form and record');
 assert.equal(list.querySelector('.pf2-horoscope-form-host').children.length,0);
 assert.equal(list.querySelector('.pf2-horoscope-details strong').textContent,'Ambre');
 assert.equal(list.querySelector('.pf2-horoscope-score strong').textContent,'Horoscope : 15');
 list.querySelector('.pf2-horoscope-toolbar button').click();
 assert.ok(list.querySelector('.pf2-horoscope-editor'));
 assert.equal(list.querySelector('.pf2-horoscope-row').parentElement,list);
 const day=list.querySelector('input[type=number]');
 day.value=21;day.dispatchEvent(new w.Event('input'));
 assert.match(list.querySelector('[aria-live]').textContent,/Porteur de lanterne/);
 const cancel=[...list.querySelectorAll('.pf2-horoscope-editor button')].find(x=>x.textContent==='Annuler');
 cancel.click();
 assert.equal(list.querySelector('.pf2-horoscope-form-host').children.length,0);
 console.log('OK — horoscope toolbar, editor and entries are separate; live sign preview retained');
})().catch(error=>{console.error(error);process.exitCode=1;});
