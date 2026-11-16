(function () {
 'use strict';
 const months = ['Abadius','Calistril','Pharast','Gozran','Desnus','Sarenith','Erastus','Arodus','Rova','Lamashan','Neth','Kuthona'];
 const realMonths = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
 const days = [31,29,31,30,31,30,31,31,30,31,30,31];
 function node(tag,text,cls) {
  const el=document.createElement(tag);
  if(text!=null)el.textContent=text;
  if(cls)el.className=cls;
  return el;
 }
 window.pf2RenderHoroscopes=function(panel,character) {
  const api=new mw.Api();
  const root=node('div'); panel.append(root);
  root.append(node('h3','Carnet astrologique'),node('p','Une semaine d’étude et un jet d’Occultisme par thème astral. Le résultat conservé sert de jet d’Aide lors des prémonitions liées à ce personnage.'));
  const list=node('div','Chargement…','pf2-player-list'); root.append(list);
  const error=e=>mw.notify(e?.error?.info||e?.message||'Horoscope indisponible.',{type:'error'});
  function render(data) {
   list.textContent='';
   const entries=data.horoscopes||[], candidates=data.candidates||[];
   const add=node('button','+ Ajouter un horoscope','pf2-player-primary'); list.append(add);
   const formHost=node('div'); list.append(formHost);
   function editor(entry) {
    formHost.textContent='';
    const form=node('form',null,'pf2-relations-editor');formHost.append(form);
    function field(label,input) {
     const wrapper=node('label',null,'pf2-relations-field');wrapper.append(node('span',label),input);form.append(wrapper);return input;
    }
    const target=field('Personnage',node('select'));target.required=true;
    target.append(new Option('Choisir un personnage',''));
    candidates.filter(c=>c.npcId===entry?.npcId||!entries.some(h=>h.npcId===c.npcId)).forEach(c=>target.append(new Option(c.name,c.npcId)));
    target.value=entry?.npcId||'';
    const month=field('Mois de naissance',node('select'));months.forEach((m,i)=>month.append(new Option(m+' ('+realMonths[i]+')',String(i+1))));
    month.value=String(entry?.month||1);
    const day=field('Jour',node('input'));day.type='number';day.min=1;day.required=true;day.value=entry?.day||1;
    const preview=node('p'); preview.setAttribute('aria-live','polite');form.append(preview);
    function updateDay(){
     const m=Number(month.value), d=Number(day.value);day.max=days[m-1];
     if(!Number.isInteger(d)||d<1||d>days[m-1]){preview.textContent='Date invalide.';return;}
     const date=m*100+d;
     const sign=date>=1218||date<121?data.zodiac[0]:data.zodiac.slice(1).reverse().find(s=>date>=s.start);
     preview.textContent=d+' '+months[m-1]+' ('+d+' '+realMonths[m-1]+') — '+sign.sign+' ('+sign.themes+')';
    } month.onchange=updateDay;day.oninput=updateDay;updateDay();
    const roll=field('Résultat total du jet d’Occultisme',node('input'));roll.type='number';roll.step=1;roll.required=true;roll.min=-100;roll.max=100;roll.value=entry?.roll??'';
    const interpretation=field('Horoscope personnalisé (facultatif)',node('textarea'));interpretation.rows=4;interpretation.maxLength=5000;interpretation.value=entry?.interpretation||'';
    const save=node('button','Enregistrer','pf2-player-primary');save.type='submit';
    const cancel=node('button','Annuler');cancel.type='button';cancel.onclick=()=>{formHost.textContent='';};form.append(save,cancel);
    form.onsubmit=async e=>{
     e.preventDefault();save.disabled=true;
     try {
      const r=await api.postWithToken('csrf',{action:'pf2horoscopesupdate',format:'json',npcId:character.npcId,operation:'save',id:entry?.id||0,targetNpcId:target.value,month:month.value,day:day.value,roll:roll.value,interpretation:interpretation.value});
      render(r.pf2horoscopesupdate);mw.notify('Horoscope enregistré.',{type:'success'});
     }catch(e){save.disabled=false;error(e);}
    };
   }
   add.onclick=()=>editor(null);
   if(!entries.length)list.append(node('p','Aucun horoscope enregistré.'));
   entries.forEach(entry=>{
    const row=node('article',null,'pf2-relation-row');
    if(entry.portrait){const img=node('img');img.src=mw.util.getUrl('Special:FilePath/'+entry.portrait);img.alt='';img.width=64;img.height=64;img.style.objectFit='cover';row.append(img);}
    const detail=node('div',null,'pf2-relation-details');
    detail.append(node('strong',entry.name),node('p',entry.day+' '+months[entry.month-1]+' ('+entry.day+' '+realMonths[entry.month-1]+')'),node('p',entry.sign+' ('+entry.themes+')'));
    if(entry.interpretation){const note=node('p',entry.interpretation);note.style.whiteSpace='pre-wrap';detail.append(note);}
    const score=node('div',null,'pf2-relation-score');score.append(node('span','Horoscope : '+entry.roll));
    const edit=node('button','Modifier');edit.onclick=()=>editor(entry);
    const remove=node('button','Supprimer');remove.onclick=async()=>{
     if(!confirm('Supprimer l’horoscope de '+entry.name+' ?'))return;
     remove.disabled=true;
     try{const r=await api.postWithToken('csrf',{action:'pf2horoscopesupdate',format:'json',npcId:character.npcId,operation:'delete',id:entry.id});render(r.pf2horoscopesupdate);}
     catch(e){remove.disabled=false;error(e);}
    };
    score.append(edit,remove);row.append(detail,score);list.append(row);
   });
  }
  api.get({action:'pf2horoscopes',format:'json',npcId:character.npcId}).then(r=>render(r.pf2horoscopes)).catch(e=>{list.textContent='Impossible de charger les horoscopes.';error(e);});
 };
}());
