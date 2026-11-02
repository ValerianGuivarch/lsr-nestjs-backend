/* One-time Corvan character creation, executed by a GM in the running world.
 * Uses Foundry Document API, never modifies its open LevelDB files.
 * Based on the PF2 narrative bible and existing PF2e compendiums.
 */
const MOD='pf2e-val-toolkit';
const SOURCES={ancestry:'pf2e.ancestries',background:'pf2e.backgrounds',class:'pf2e.classes',
  feature:'pf2e.classfeatures',feat:'pf2e.feats-srd',spell:'pf2e.spells-srd',
  familiar:'pf2e.familiar-abilities',equipment:'pf2e.equipment-srd'};
const BIO={
  appearance:'<p>Elfe vétéran, porteur d’un ancien poignard enchanté : son familier prend la forme de cette lame volante.</p>',
  backstory:'<h2>Corvan — Veilleurs de la Côte Perdue</h2><p>Héros de Pointesable, ancien compagnon des Veilleurs de la Côte Perdue et mentor de la Société des Éclaireurs. Son groupe a sauvé Pointesable et vaincu Karzoug à Xin-Shalast. Il a ensuite affronté les trahisons internes de la Société, notamment autour des Yeux des Dix.</p><p>Lors du retour de Tar-Baphon en 4719 AR, les quatre autres Veilleurs sont morts. Corvan est le seul survivant.</p><p>Son patron est <strong>Echo of Lost Divinity</strong>, serviteur spectral de Pharasma ressemblant à Aroden. Le thème de Witch retenu est <strong>Spinner of Threads</strong> (destin, magie occulte). L’éventuelle identité divine véritable du patron n’est pas confirmée.</p><p>Hypothèse d’histoire encore provisoire : Corvan serait âgé d’environ 250 ans en 4720 AR et aurait été prêtre d’Aroden avant 4606 AR.</p>',
  organizations:'<p>Société des Éclaireurs, Veilleurs de la Côte Perdue.</p>',
  allies:'<p>Pointesable ; Abstalar Zantus ; Kendra Déverin ; Audrahni ; ses jeunes protégés.</p>',
  enemies:'<p>Tar-Baphon, les morts-vivants et les traîtres infiltrés.</p>',
  campaignNotes:'<h3>Combat (MJ)</h3><p>Le poignard est un seul et même objet dans l’inventaire et comme familier. Il peut voler, parler et guider les sorts. Le familier n’effectue pas de Strike autonome gratuit : <strong>Spiritual Armament</strong> représente ses frappes volantes ; <strong>Telekinetic Projectile</strong> et <strong>Force Barrage</strong> ses assauts magiques. <strong>Ceremonial Knife</strong> fait du poignard un foyer magique capable de contenir un sort. <strong>Nudge Fate</strong>, <strong>Synesthesia</strong>, <strong>Slow</strong> et <strong>Quandary</strong> servent à contrôler le combat. <strong>Spirit Blast</strong> et <strong>Spirit Song</strong> contre les morts-vivants.</p>'
};

async function getDoc(kind,id){
  const uuid='Compendium.'+SOURCES[kind]+'.Item.'+id;
  const doc=await fromUuid(uuid);
  if(!doc)throw Error('Compendium absent : '+uuid);
  const data=doc.toObject();delete data._id;
  data.flags??={};data.flags.core??={};data.flags.core.sourceId=uuid;
  return data;
}
async function item(actor,key,factory){
  let old=actor.items.find(i=>i.getFlag(MOD,'seedKey')===key);
  if(old)return old;
  const data=await factory();data.flags??={};data.flags[MOD]={...(data.flags[MOD]??{}),seedKey:key};
  const created=await actor.createEmbeddedDocuments('Item',[data],{render:false});
  if(!created?.[0])throw Error('Impossible d’ajouter : '+key);
  return created[0];
}
async function feat(actor,group,level,info){
  return item(actor,group+'-'+level,async()=>{
    const data=await getDoc('feat',info.id);
    data.system.location=group+'-'+level;
    data.system.level??={};data.system.level.taken=Number(level);
    return data;
  });
}
function emptySlots(prepared=true){
  return Object.fromEntries(Array.from({length:11},(_,n)=>{
    const max=prepared?(n===0?5:n===10?1:3):0;
    return ['slot'+n,{value:max,max,prepared:[]}];
  }));
}
async function makeItems(actor,m){
  await item(actor,'ancestry',async()=>{
    const d=await getDoc('ancestry',m.ancestry);d.system.boosts['2'].selected='con';return d;
  });
  await item(actor,'background',async()=>{
    const d=await getDoc('background',m.background);
    d.system.boosts['0'].selected='int';d.system.boosts['1'].selected='wis';return d;
  });
  await item(actor,'class',async()=>{
    const d=await getDoc('class',m.class);
    // Manually add the class features below; no interactive patron ChoiceSet.
    d.system.items={};d.system.keyAbility.selected='int';return d;
  });
  for(const f of m.classFeatures){
    await item(actor,'feature-'+f.id,async()=>{
      const d=await getDoc('feature',f.id);d.system.location='class-'+f.level;
      if(f.name==='Patron'){
        d.system.rules=[];
        d.system.description.value+='<p>Patron : Echo of Lost Divinity ; thème de sorcière : Spinner of Threads.</p>';
      }
      return d;
    });
  }
  await item(actor,'patron',async()=>{
    const d=await getDoc('feature',m.patron);d.system.location='class-1';return d;
  });
  for(const [lvl,info] of Object.entries(m.classFeatLevels))await feat(actor,'class',lvl,info);
  for(const [group,levels] of Object.entries(m.otherFeats))
    for(const [lvl,info] of Object.entries(levels))await feat(actor,group,lvl,info);

  const slots=emptySlots();
  const entry=await item(actor,'occult-entry',async()=>({
    name:'Corvan — Witch (occultisme)',type:'spellcastingEntry',
    system:{ability:{value:'int'},tradition:{value:'occult'},
      prepared:{value:'prepared',flexible:false},proficiency:{value:4},
      slots:emptySlots(),showSlotlessLevels:{value:false}}
  }));
  for(const [rank,list] of Object.entries(m.spellRanks)){
    for(const [ix,sp] of list.entries()){
      const doc=await item(actor,'spell-'+rank+'-'+ix,async()=>{
        const d=await getDoc('spell',sp.id);
        d.system.location??={};d.system.location.value=entry.id;
        if(Number(rank)>0&&Number(rank)>Number(d.system.level.value))
          d.system.location.heightenedLevel=Number(rank);
        return d;
      });
      slots['slot'+rank].prepared.push({id:doc.id});
    }
  }
  await entry.update({'system.slots':slots},{render:false});
  for(const [ix,sp] of m.extraCantrips.entries()){
    await item(actor,'known-cantrip-'+ix,async()=>{
      const d=await getDoc('spell',sp.id);
      d.system.location??={};d.system.location.value=entry.id;
      return d;
    });
  }
  const focus=await item(actor,'focus-entry',async()=>({
    name:'Corvan — Hexes du patron',type:'spellcastingEntry',
    system:{ability:{value:'int'},tradition:{value:'occult'},
      prepared:{value:'focus'},proficiency:{value:4},slots:emptySlots(false)}
  }));
  for(const [ix,sp] of m.focusSpells.entries()){
    await item(actor,'focus-'+ix,async()=>{
      const d=await getDoc('spell',sp.id);
      d.system.location??={};d.system.location.value=focus.id;return d;
    });
  }
  await item(actor,'dagger',async()=>{
    const d=await getDoc('equipment','rQWaJhI5Bko5x14Z');
    d.name='Poignard de Corvan (familier et lame cérémonielle)';
    d.img=m.familiarPortrait;
    d.system.runes={potency:3,striking:3,property:['animated','ghostTouch']};
    d.system.equipped={carryType:'worn'};
    d.system.description.value+='<p>Ce poignard et le familier représentent le même objet. Les frappes volantes se résolvent par les sorts de Corvan et non comme une attaque gratuite du familier.</p>';
    return d;
  });
  await item(actor,'clothing',async()=>{
    const d=await getDoc('equipment','dDIPA1WE9ESF67EB');
    d.name='Tenue de Corvan (+3, résilience supérieure)';
    d.system.runes={potency:3,resilient:2,property:[]};
    d.system.equipped={carryType:'worn'};
    return d;
  });
}
async function makeFamiliar(master,m,folder){
  let f=game.actors.find(a=>a.type==='familiar'&&a.getFlag(MOD,'corvanMaster')===master.id);
  if(!f){
    f=await Actor.create({name:'Poignard de Corvan (familier)',type:'familiar',
      folder:folder.id,img:m.familiarPortrait,ownership:{default:0},
      flags:{[MOD]:{corvanMaster:master.id}},
      system:{master:{id:master.id,ability:'int'},details:{creature:{value:'Poignard animé'}}},
      prototypeToken:{name:'Poignard de Corvan',actorLink:true,disposition:1,texture:{src:m.familiarPortrait}}
    },{render:false});
  }
  for(const ab of m.familiarAbilities)
    await item(f,'familiar-'+ab.id,()=>getDoc('familiar',ab.id));
  return f;
}
function findFolder(m){
  const f=game.folders.get(m.folderId);
  if(f?.type==='Actor'&&f.name==='Divers'&&f.folder?.name==='MJ')return f;
  return game.folders.find(f=>f.type==='Actor'&&f.name==='Divers'&&f.folder?.name==='MJ');
}

/** Restore original Corvan's level-20 progression without modifying any PJ. */
export async function repairCorvanProgression(actor,familiar=null){
  if (!game.user?.isGM || actor?.type!=='character' || actor.name!=='Corvan' ||
      actor.getFlag(MOD,'corvanSeed')!==true) return false;
  const witch=actor.items.find(i=>i.type==='class' && i.getFlag(MOD,'seedKey')==='class');
  if(!witch) throw Error('Corvan : sa classe Witch est introuvable.');
  if(witch.system.keyAbility?.selected!=='int')await witch.update({'system.keyAbility.selected':'int'});
  // 356000 is the established level-20 threshold in Career XP. The
  // historical XPC importer now excludes GM-only scripted Corvan.
  const changes={};
  if(Number(actor.getFlag(MOD,'xpc'))!==356000)changes['flags.'+MOD+'.xpc']=356000;
  if(Number(actor.system.details?.level?.value)!==20)changes['system.details.level.value']=20;
  if(actor.system.details?.keyability?.value!=='int')changes['system.details.keyability.value']='int';
  if(Number(actor.system.details?.xp?.value)!==1000)changes['system.details.xp.value']=1000;
  if(Object.keys(changes).length)await actor.update(changes);
  if(Number(actor.system.details?.level?.value)!==20)
    throw Error('La correction de Corvan au niveau 20 n’a pas persisté.');
  // The remaster renamed the Dancing rune to Animated. Repair the imported
  // blade too; the familiar itself still cannot perform Strikes.
  const blade=actor.items.find(i=>i.getFlag(MOD,'seedKey')==='dagger');
  const properties=blade?.system.runes?.property;
  if(Array.isArray(properties) && properties.includes('dancing')){
    await blade.update({'system.runes.property':properties.map(x=>x==='dancing'?'animated':x)});
  }
  const hpMax=Number(actor.system.attributes?.hp?.max);
  if(hpMax>0&&Number.isFinite(hpMax) && Number(actor.system.attributes.hp.value)!==hpMax)
    await actor.update({'system.attributes.hp.value':hpMax});
  if(familiar){
    const familiarMax=Number(familiar.system.attributes?.hp?.max);
    if(familiarMax>0&&Number.isFinite(familiarMax) &&
        Number(familiar.system.attributes.hp.value)!==familiarMax)
      await familiar.update({'system.attributes.hp.value':familiarMax});
  }
  if(Object.keys(changes).length)console.info('PF2e Val Toolkit | Corvan restauré niveau 20',actor.uuid);
  return true;
}
export async function createCorvan(){
  if(!game.user?.isGM||game.system?.id!=='pf2e')return;
  if(game.users?.activeGM?.id&&game.users.activeGM.id!==game.user.id)return;
  const r=await fetch('modules/'+MOD+'/assets/corvan/manifest.json');
  if(!r.ok)throw Error('Manifeste Corvan : '+r.status);
  const m=await r.json();
  const folder=findFolder(m);
  if(!folder)throw Error('Dossier Actor MJ → Divers introuvable.');
  let actor=game.actors.find(a=>a.name==='Corvan'&&a.folder?.id===folder.id);
  if(actor&&!actor.getFlag(MOD,'corvanSeed')){
    console.warn('Corvan préexistant non créé par le toolkit : import annulé.');
    return;
  }
  if(actor?.getFlag(MOD,'corvanComplete')){
    const familiar=game.actors.find(a=>a.type==='familiar'&&a.getFlag(MOD,'corvanMaster')===actor.id);
    await repairCorvanProgression(actor,familiar);
    return;
  }
  if(!actor){
    actor=await Actor.create({name:'Corvan',type:'character',folder:folder.id,
      img:m.portrait,ownership:{default:0},
      flags:{[MOD]:{corvanSeed:true,corvanComplete:false,xpc:356000}},
      system:{details:{level:{value:20},keyability:{value:'int'},xp:{value:1000},biography:BIO},
        build:{attributes:{boosts:{1:['int','dex','con','wis'],5:['int','dex','con','wis'],
          10:['int','dex','con','wis'],15:['int','dex','con','wis'],20:['int','dex','con','wis']}}},
        skills:{occultism:{rank:4},arcana:{rank:3},religion:{rank:3},medicine:{rank:2},
          society:{rank:2},deception:{rank:2},stealth:{rank:2},diplomacy:{rank:2}},
        resources:{focus:{value:3,max:3}}},
      prototypeToken:{name:'Corvan',actorLink:true,disposition:1,displayName:20,
        texture:{src:m.portrait},width:1,height:1}
    },{render:false});
  }
  await actor.update({'system.details.level.value':20});
  await makeItems(actor,m);
  const familiar=await makeFamiliar(actor,m,folder);
  await repairCorvanProgression(actor,familiar);
  const spellCount=actor.items.filter(i=>i.type==='spell').length;
  if(spellCount<41||actor.items.filter(i=>i.getFlag(MOD,'seedKey')?.startsWith('class-')).length<10
    ||familiar.items.size<m.familiarAbilities.length)throw Error('Import Corvan incomplet : dons ou sorts manquants.');
  await actor.setFlag(MOD,'corvanComplete',true);
  console.info('PF2e Val Toolkit : Corvan crée :',actor.uuid,'familier :',familiar.uuid);
  ui.notifications?.info?.('Corvan niveau 20 et son familier ont été créés dans Actors → MJ → Divers.');
}
export function scheduleCorvanImport(){
  if(!game.user?.isGM)return;
  void createCorvan().catch(e=>{
    console.error('PF2e Val Toolkit | Corvan :',e);
    ui.notifications?.error?.('Import Corvan incomplet : '+e.message);
  });
}
