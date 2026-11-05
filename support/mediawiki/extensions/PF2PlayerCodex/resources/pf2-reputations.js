(function () {
 'use strict';
 const root=document.getElementById('pf2-reputations');if(!root)return;
 const api=new mw.Api();let groups=[],characters=[],canEdit=false,busy=false,selected='group';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;return n};
 const button=(label,fn,cls)=>{const b=el('button',label,cls||'pf2-rep-button');b.type='button';b.onclick=fn;return b};
 const label=(v)=>v>=30?'Révéré':v>=15?'Admiré':v>=5?'Apprécié':v<=-30?'Pourchassé':v<=-15?'Détesté':v<=-5?'Méprisé':'Neutre';
 const clamp=v=>Math.max(-50,Math.min(50,v));
 const signed=v=>(v>0?'+':'')+v;
 function scoreOf(r){return selected==='group'?r.score:clamp(r.score+(Number(r.modifiers?.[selected])||0))}
 function currentCharacter(){return characters.find(c=>c.npcId===selected)}
 async function refresh(){
  root.textContent='Chargement des réputations…';
  try {
   const data=await api.get({action:'pf2reputations',format:'json'});
   groups=(data.pf2reputations?.groups||[]).map(g=>({...g,entries:(g.entries||[]).map(r=>({...r,score:Number(r.score)}))}));
   characters=data.pf2reputations?.characters||[];
   canEdit=Boolean(data.pf2reputations?.canEdit);
   if(selected!=='group'&&!characters.some(c=>c.npcId===selected))selected='group';
   render();
  }catch(e){root.textContent='Impossible de charger les réputations.';mw.notify(String(e),{type:'error'})}
 }
 async function action(payload){
  if(busy)return;busy=true;
  try{await api.postWithToken('csrf',{action:'pf2reputationsupdate',format:'json',...payload});await refresh()}
  catch(e){mw.notify('Modification impossible : '+e,{type:'error'})}
  finally{busy=false}
 }
 function parseScore(raw){
  if(raw===null)return null;
  const trimmed=raw.trim();
  const value=Number(trimmed);
  if(trimmed===''||!Number.isInteger(value)||value< -50||value>50){
   mw.notify('Entier de −50 à +50 attendu.',{type:'error'});
   return null;
  }
  return value;
 }
 function editGroupScore(r){
  const raw=prompt('Réputation du groupe pour '+r.name+' (−50 à +50)',String(r.score));
  const score=parseScore(raw);
  if(score!==null && score!==r.score)void action({operation:'score',id:r.id,score});
 }
 function editPersonalScore(r){
  const character=currentCharacter();
  if(!character)return;
  const value=scoreOf(r);
  const raw=prompt('Réputation de '+character.displayName+' pour '+r.name+
   ' (−50 à +50)\nGroupe : '+signed(r.score)+' · Réputation actuelle : '+signed(value),
   String(value));
  const target=parseScore(raw);
  if(target===null)return;
  // The API stores the deviation from the group score, never a second
  // absolute score. Use the requested displayed score to derive that delta.
  const modifier=target-r.score;
  if(modifier< -50||modifier>50){
   mw.notify('Cette valeur dépasse la limite des écarts personnels (−50 à +50).'+
    ' Pour ce groupe, la réputation personnelle doit rester entre '+
    signed(Math.max(-50,r.score-50))+' et '+signed(Math.min(50,r.score+50))+'.',
    {type:'error'});
   return;
  }
  if(modifier!==(Number(r.modifiers?.[selected])||0))
   void action({operation:'modifier',id:r.id,character:selected,modifier});
 }
 function shift(r,delta){
  if(selected==='group'){
   const score=clamp(r.score+delta);
   if(score!==r.score)action({operation:'score',id:r.id,score});
  }else{
   const current=Number(r.modifiers?.[selected])||0;
   const modifier=clamp(current+delta);
   if(modifier!==current)action({operation:'modifier',id:r.id,character:selected,modifier});
  }
 }
 function move(r){const options=groups.map(g=>g.id+' : '+g.name).join('\n');
  const raw=prompt('Déplacer '+r.name+' vers quel groupe ?\n'+options,String(r.group_id));
  if(raw===null)return;const id=Number(raw);
  if(!groups.some(g=>g.id===id)){mw.notify('Groupe invalide',{type:'error'});return}
  action({operation:'move',id:r.id,groupid:id});
 }
 function toggleVisibility(type,item){action({operation:'visibility',id:item.id,target:type,visible:item.visible?0:1})}
 function addGroup(){const name=prompt('Nom du nouveau groupe');if(name?.trim())action({operation:'group',name:name.trim()})}
 function addEntry(g){const name=prompt('Nom de la nouvelle réputation dans « '+g.name+' »');if(name?.trim())action({operation:'create',groupid:g.id,name:name.trim()})}
 function render(){
  root.replaceChildren();root.className='pf2-reputation-board';
  const head=el('div',null,'pf2-reputation-heading');
  head.append(el('h2','Réputations des aventuriers'));
  head.append(el('p','Réputation collective et écarts personnels (−50 à +50). Les valeurs personnelles ne modifient pas la réputation du groupe.'));
  const controls=el('div',null,'pf2-rep-viewer');
  const viewerLabel=el('label','Afficher la réputation de : ');const select=el('select');
  [{npcId:'group',displayName:'Groupe'},...characters].forEach(c=>{const opt=el('option',c.displayName);opt.value=c.npcId;select.append(opt)});
  select.value=selected;select.onchange=()=>{selected=select.value;render()};
  viewerLabel.append(select);controls.append(viewerLabel);
  if(canEdit)controls.append(button('+ Créer un groupe',addGroup,'pf2-rep-button pf2-rep-primary'));
  head.append(controls);
  const legend=el('p','● Position du groupe · ★ Position individuelle (si différente)','pf2-rep-legend');head.append(legend);
  root.append(head);
  for(const g of groups){
   if(!canEdit&&!g.visible)continue;
   const section=el('section',null,'pf2-rep-group');
   const title=el('div',null,'pf2-rep-group-title');
   title.append(el('h3',g.name));
   if(canEdit)title.append(button(g.visible?'Visible':'Masqué',()=>toggleVisibility('group',g),'pf2-rep-button pf2-rep-visibility'+(g.visible?'':' pf2-rep-hidden')));
   title.append(el('span',g.entries.length+' factions','pf2-rep-count'));
   if(canEdit)title.append(button('+ Réputation',()=>addEntry(g)));
   section.append(title);
   const list=el('div',null,'pf2-rep-list');
   for(const r of g.entries){
    if(!canEdit&&!r.visible)continue;
    const score=scoreOf(r);const card=el('article',null,'pf2-rep-card'+(r.visible?'':' pf2-rep-concealed'));
    const row=el('div',null,'pf2-rep-line');row.append(el('strong',r.name));
    if(canEdit)row.append(button(r.visible?'Visible':'Masquée',()=>toggleVisibility('reputation',r),'pf2-rep-button pf2-rep-visibility'+(r.visible?'':' pf2-rep-hidden')));
    row.append(el('span',signed(score),'pf2-rep-score '+(score>=5?'positive':score<=-5?'negative':'neutral')));card.append(row);
    const meter=el('div',null,'pf2-rep-track');
    meter.append(el('span',null,'pf2-rep-center'));
    const base=el('span',null,'pf2-rep-fill '+(r.score<0?'negative':'positive'));
    base.style.left=(r.score<0?50+r.score:50)+'%';base.style.width=Math.abs(r.score)+'%';meter.append(base);
    if(score!==r.score){
     const delta=el('span',null,'pf2-rep-delta');
     delta.style.left=(50+Math.min(r.score,score))+'%';
     delta.style.width=Math.abs(score-r.score)+'%';meter.append(delta);
    }
    const marker=el('span',null,'pf2-rep-marker pf2-rep-group-marker');
    marker.style.left=(50+r.score)+'%';marker.title='Groupe : '+signed(r.score);meter.append(marker);
    if(selected!=='group'&&score!==r.score){
     const star=el('span','★','pf2-rep-personal-marker');
     star.style.left=(50+score)+'%';star.title=currentCharacter().displayName+' : '+signed(score);
     meter.append(star);
    }
    card.append(meter);
    const foot=el('div',null,'pf2-rep-footer');
    foot.append(el('small',label(score)+(selected==='group'?'':' · Groupe '+signed(r.score)+' · Écart '+signed(Number(r.modifiers?.[selected])||0))));
    if(canEdit){const tools=el('div',null,'pf2-rep-actions');
     tools.append(button('−5',()=>shift(r,-5)),button('−1',()=>shift(r,-1)),button('+1',()=>shift(r,1)),button('+5',()=>shift(r,5)));
     tools.append(button('Modifier le groupe',()=>editGroupScore(r),'pf2-rep-button pf2-rep-edit'));
     if(selected!=='group')tools.append(button('Modifier '+currentCharacter().displayName,()=>editPersonalScore(r),'pf2-rep-button pf2-rep-edit pf2-rep-edit-personal'));
     if(selected==='group')tools.append(button('Déplacer',()=>move(r)));
     foot.append(tools)}
    card.append(foot);list.append(card);
   }
   section.append(list);root.append(section);
  }
 }
 void refresh();
})();