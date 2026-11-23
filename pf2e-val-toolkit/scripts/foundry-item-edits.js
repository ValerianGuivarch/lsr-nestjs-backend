import { pf2MjApiUrl } from './career-xp/index.js';

const MODULE = 'pf2e-val-toolkit';
const WORLD = 'test-pf2';
const UUID = /^Actor\.([A-Za-z0-9]{16})\.Item\.([A-Za-z0-9]{16})$/;
let initialized = false;
let running = false;
const warned = new Set();
const activeGM = () => game.world?.id === WORLD && game.user?.isGM && game.users?.activeGM?.id === game.user.id;

async function request(key,action,body) {
  const path = pf2MjApiUrl()+'/player-codex/foundry-item-edits';
  const response = await fetch(path+(action?'/'+action:'?world='+WORLD),{
    method:action?'POST':'GET',
    headers:{'Accept':'application/json','Content-Type':'application/json','x-pf2-foundry-sync-key':key},
    ...(action?{body:JSON.stringify({...body,world:WORLD})}:{}),
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok) throw new Error('Correction Item HTTP '+response.status);
  return response.json();
}

/** A queued edit is checked against the exact Item and its original content.
 * Never automatically repeat an ambiguous native write. The post-write value
 * allows safe reconciliation if the acknowledgment was lost. */
export async function processItemEdit(job,actor,api) {
  const match=typeof job?.itemUuid==='string'?UUID.exec(job.itemUuid):null;
  if (!match || typeof job.id!=='string' || typeof job.expectedName!=='string' || typeof job.expectedDescription!=='string') return 'review';
  if(!actor || actor.uuid!=='Actor.'+match[1] || typeof actor.updateEmbeddedDocuments!=='function') return 'missing';
  const item=actor.items?.get(match[2]);
  if(!item || item.uuid!==job.itemUuid || item.type!=='treasure') return 'missing';
  const hasName=typeof job.name==='string', hasDescription=typeof job.description==='string';
  if(!hasName&&!hasDescription) return 'review';
  const matchesNew=(!hasName||item.name===job.name)&&(!hasDescription||item.system?.description?.value===job.description);
  const matchesOld=item.name===job.expectedName && item.system?.description?.value===job.expectedDescription;
  if(job.status==='applying' || job.status==='review') {
    if(matchesNew && job.status==='applying' && typeof job.token==='string') {
      await api('finish',{token:job.token,status:'applied'});
      return 'reconciled';
    }
    return 'review';
  }
  if(job.status!=='pending') return 'ignored';
  const claim=await api('claim',{id:job.id});
  if(!claim) return 'busy';
  if(claim.id!==job.id || claim.itemUuid!==job.itemUuid || typeof claim.token!=='string') throw Error('Correction invalide après réservation.');
  if(matchesNew) {
    await api('finish',{token:claim.token,status:'applied'});
    return 'applied';
  }
  if(!matchesOld) {
    await api('finish',{token:claim.token,status:'review',error:'Valeurs originales divergentes.'});
    return 'review';
  }
  const patch={_id:match[2]};
  if(hasName)patch.name=job.name;
  if(hasDescription)patch['system.description.value']=job.description;
  try {
    await actor.updateEmbeddedDocuments('Item',[patch]);
    const updated=actor.items.get(match[2]);
    if ((hasName&&updated?.name!==job.name)||(hasDescription&&updated?.system?.description?.value!==job.description)) throw Error('La relecture de l’Item ne confirme pas la modification.');
  } catch(error) {
    await api('finish',{token:claim.token,status:'review',error:String(error.message||error).slice(0,500)}).catch(()=>{});
    throw error;
  }
  await api('finish',{token:claim.token,status:'applied'});
  return 'applied';
}

export async function syncFoundryItemEdits() {
  if(!activeGM()||running)return;
  const key=game.settings.get(MODULE,'discordCharacterChatKey');
  if(!key)return;
  running=true;
  try {
    const jobs=await request(key,'');
    if(!Array.isArray(jobs))return;
    for(const job of jobs) {
      if(!activeGM()) break;
      const match=UUID.exec(job.itemUuid||'');
      const actor=match?game.actors.get(match[1]):null;
      try {
        const result=await processItemEdit(job,actor,(action,body)=>request(key,action,body));
        if(result==='reconciled') {
          ui.notifications.info('Correction d’objet confirmée après reconnexion : '+job.itemUuid);
          continue;
        }
        if(result==='applied') ui.notifications.info('Objet Foundry corrigé : '+(job.name||job.itemUuid));
        else if(['review','missing'].includes(result)&&!warned.has(job.id)) {
          warned.add(job.id); ui.notifications.warn('Correction d’objet à vérifier : '+job.itemUuid);
        }
      } catch(error) {
        if(!warned.has(job.id)){warned.add(job.id);ui.notifications.warn('Correction Foundry à vérifier : '+job.itemUuid);}
        console.warn(MODULE+' | correction Item :',error);
      }
    }
  } catch(error) { console.warn(MODULE+' | synchronisation corrections Item :',error); }
  finally { running=false; }
}
export function initFoundryItemEdits() {
  if(initialized||!game.user?.isGM||game.world?.id!==WORLD)return;
  initialized=true;
  void syncFoundryItemEdits();
  window.setInterval(()=>void syncFoundryItemEdits(),15000);
}
