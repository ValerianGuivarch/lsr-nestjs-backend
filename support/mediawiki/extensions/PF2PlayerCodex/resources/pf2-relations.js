(function () {
 'use strict';
 const label = function(score) {
  return score>=30?'Révéré':score>=15?'Admiré':score>=5?'Apprécié':score<=-30?'Pourchassé':score<=-15?'Détesté':score<=-5?'Méprisé':'Neutre';
 };
 const node = function(tag, text, cls) {
  const result=document.createElement(tag);
  if(text!==undefined && text!==null)result.textContent=text;
  if(cls)result.className=cls;
  return result;
 };
 window.pf2RenderRelations = function(panel,character,isMjAdmin) {
  const api=new mw.Api();
  const title=node('h3','Carnet de relations');
  const note=node('p','Personnes rencontrées en voyage. Leur valeur utilise les mêmes paliers que les réputations.','pf2-relations-note');
  const heading=node('div',null,'pf2-relations-heading');
  heading.append(title,note); panel.append(heading);
  const body=node('div','Chargement des relations…','pf2-relations-list');panel.append(body);
  let entries=[];
  const error=function(e){mw.notify('Relations : '+(e?.error?.info||e?.message||e),{type:'error'});};
  function editor(entry) {
   const form=node('form',null,'pf2-relations-editor');
   function field(labelText,input) {
    const group=node('label',null,'pf2-relations-field');
    group.append(node('span',labelText),input);
    form.append(group);
    return input;
   }
   const name=field('Nom',node('input'));name.required=true;name.maxLength=120;name.value=entry?.name||'';
   const desc=field('Description courte',node('textarea'));desc.maxLength=500;desc.rows=2;desc.value=entry?.description||'';
   const score=field('Valeur de relation (−50 à +50)',node('input'));score.type='number';score.min=-50;score.max=50;score.step=1;score.required=true;score.value=entry?.score??0;
   const npc=field('Fiche PNJ associée (facultatif)',node('select'));
   npc.append(node('option','Aucune fiche'));npc.firstChild.value='';
   (character.contacts||[]).forEach(function(c){
    const opt=node('option',c.displayName);opt.value=c.npcId;npc.append(opt);
   });
   npc.value=entry?.linkedNpcId||'';
   const buttons=node('div',null,'pf2-player-background-actions');
   const save=node('button','Enregistrer','pf2-player-primary');save.type='submit';
   const cancel=node('button','Annuler');cancel.type='button';cancel.onclick=()=>form.remove();
   buttons.append(save,cancel);form.append(buttons);
   form.onsubmit=async function(ev){
    ev.preventDefault();
    const n=Number(score.value);
    if(!Number.isInteger(n)||n< -50||n>50){error(new Error('Valeur invalide.'));return;}
    save.disabled=true;
    try {
     await api.postWithToken('csrf',{
      action:'pf2relationsupdate',format:'json',npcId:character.npcId,
      operation:entry?'update':'create',id:entry?.id||0,name:name.value,
      description:desc.value,score:n,linkedNpcId:npc.value
     });
     await reload();form.remove();
    } catch(e){error(e);save.disabled=false;}
   };
   body.prepend(form);name.focus();
  }
  async function remove(entry) {
   if(!confirm('Supprimer la relation avec '+entry.name+' ?'))return;
   try {
    await api.postWithToken('csrf',{action:'pf2relationsupdate',format:'json',
      npcId:character.npcId,operation:'delete',id:entry.id});
    await reload();
   }catch(e){error(e);}
  }
  function render(){
   body.replaceChildren();
   if(isMjAdmin){
    const create=node('button','+ Ajouter une relation','pf2-player-primary');
    create.onclick=()=>editor(null);body.append(create);
   }
   if(!entries.length){body.append(node('p','Aucune relation enregistrée pour le moment.','pf2-player-empty'));return;}
   entries.forEach(function(entry){
    const row=node('article',null,'pf2-relation-row');
    const details=node('div',null,'pf2-relation-details');
    details.append(node('strong',entry.name));
    if(entry.description)details.append(node('p',entry.description));
    if(entry.linkedNpcId && entry.linkedWikiPageTitle){
     const link=node('a','Voir la fiche');
     const isPrivateContact=(character.contacts||[]).some(c=>c.npcId===entry.linkedNpcId);
     link.href=isPrivateContact ? mw.util.getUrl('Special:MesPersonnages/'+character.npcId,{contact:entry.linkedNpcId}) : mw.util.getUrl(entry.linkedWikiPageTitle);
     details.append(link);
    }
    const aside=node('div',null,'pf2-relation-score');
    const number=node('strong',(entry.score>0?'+':'')+entry.score);
    aside.append(number,node('small',label(entry.score)));
    if(isMjAdmin){
     const edit=node('button','Modifier');edit.onclick=()=>editor(entry);
     const del=node('button','Supprimer');del.onclick=()=>remove(entry);
     const actions=node('div',null,'pf2-relation-actions');actions.append(edit,del);aside.append(actions);
    }
    row.append(details,aside);body.append(row);
   });
  }
  async function reload(){
   try{
    const result=await api.get({action:'pf2relations',format:'json',npcId:character.npcId});
    entries=result.pf2relations?.relations||[];
    render();
   }catch(e){body.textContent='Impossible de charger les relations.';error(e);}
  }
  void reload();
 };
})();