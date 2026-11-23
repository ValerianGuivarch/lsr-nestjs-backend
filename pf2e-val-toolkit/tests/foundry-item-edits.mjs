import assert from 'node:assert/strict';
import { processItemEdit, activeGM } from '../scripts/foundry-item-edits.js';
const id='Actor.1234567890abcdef.Item.abcdef1234567890';
const job={id:'93e12d5f-3e15-49cb-acb8-5bc0e14e930e',itemUuid:id,expectedName:'Ancienne statuette',expectedDescription:'Ancienne description',name:'Statuette ancienne',description:'Description corrigée',status:'pending'};
function setup(itemName='Ancienne statuette') {
  let changes=0, status='pending', token='bda49c8d-8129-4283-974e-bc6f0be85a09';
  const item={uuid:id,type:'treasure',name:itemName,system:{description:{value:'Ancienne description'}}};
  const actor={uuid:'Actor.1234567890abcdef',type:'loot',items:{get:()=>item},updateEmbeddedDocuments:async(type,edits)=>{
    assert.equal(type,'Item');assert.equal(edits[0]._id,'abcdef1234567890');changes++;
    if(edits[0].name)item.name=edits[0].name;
    if(edits[0]['system.description.value'])item.system.description.value=edits[0]['system.description.value'];
  }};
  const api=async(action,body)=>{if(action==='claim'){if(status!=='pending')return null;status='applying';return {...job,token};}
    assert.equal(body.token,token);status=body.status;return {saved:true}};
  return {actor,api,item,state:()=>status,changes:()=>changes,token};
}
{
 const x=setup();assert.equal(await processItemEdit(job,x.actor,x.api),'applied');assert.equal(x.changes(),1);
 assert.equal(x.state(),'applied');assert.equal(x.item.name,'Statuette ancienne');
}
{
 const x=setup('Valeur modifiée ailleurs');assert.equal(await processItemEdit(job,x.actor,x.api),'review');assert.equal(x.changes(),0);
 assert.equal(x.state(),'review');
}
{
 const x=setup(); x.item.name=job.name; x.item.system.description.value=job.description;
 assert.equal(await processItemEdit({...job,status:'applying',token:x.token},x.actor,x.api),'reconciled');
 assert.equal(x.changes(),0);assert.equal(x.state(),'applied');
}
console.log('Foundry embedded Item edits: update, conflict and ACK recovery OK');

{
 globalThis.game={world:{id:'test-pf2'},user:{id:'GM-B',isGM:true},users:{contents:[{id:'GM-B',active:true,isGM:true}]}};
 assert.equal(activeGM(),true,'only online GM may edit, even without game.users.activeGM');
 game.users.contents.unshift({id:'GM-A',active:true,isGM:true});
 assert.equal(activeGM(),false,'only deterministic first active GM may poll');
 game.user.id='GM-A';assert.equal(activeGM(),true);
 game.user.isGM=false;assert.equal(activeGM(),false);
}
