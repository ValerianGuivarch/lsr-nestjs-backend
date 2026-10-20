(function(){
 const root=document.getElementById('pf2-requests-board'); if(!root)return;
 const api=new mw.Api();let busy=false;
 const states=[['requested','Demandé'],['in_progress','En cours'],['done','Terminé']];
 function el(tag,text,cl){const n=document.createElement(tag);if(text!==null)n.textContent=text;if(cl)n.className=cl;return n}
 async function render(){
  root.textContent='Chargement des requêtes…';
  try {
   const data=await api.get({action:'pf2requests',format:'json'});
   const requests=data.pf2requests||[];
   root.replaceChildren();
   const board=el('div',null,'pf2-requests-board');root.append(board);
   for(const [status,label] of states) {
    const col=el('section',null,'pf2-requests-column');
    col.append(el('h2',label+' ('+requests.filter(r=>r.status===status).length+')'));
    for(const r of requests.filter(r=>r.status===status)){
     const card=el('article',null,'pf2-request-card');
     const link=el('a','#'+r.id+' — '+r.title);link.href='https://discord.com/channels/@me/'+r.thread_id;
     // The guild is fixed for the PF2 request salon.
     link.href='https://discord.com/channels/1531345672639610920/'+r.thread_id;
     link.target='_blank';link.rel='noopener noreferrer';card.append(link);
     for(const [next,nextLabel] of states.filter(([key])=>key!==status)){
      const b=el('button','→ '+nextLabel);b.type='button';b.disabled=busy;
      b.addEventListener('click',async()=>{if(busy)return;busy=true;
       try{await api.postWithToken('csrf',{action:'pf2requestsupdate',id:r.id,status:next,format:'json'});await render()}
       catch(e){mw.notify('Échec de synchronisation Discord : '+e,{type:'error'})}
       finally{busy=false}
      });
      card.append(b)
     }
     col.append(card)
    }
    board.append(col)
   }
  }catch(e){root.textContent='Impossible de charger les requêtes : '+e}
 }
 render()
})();
