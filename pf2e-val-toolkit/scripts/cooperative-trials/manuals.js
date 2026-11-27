import {RUNE_ROWS,DIALS,MAZE_EDGES} from "./engine.js";
export const MANUALS = {
  conduits:{name:"Manuel — Conduits",text:"<p>Compter les conduits du haut vers le bas. S'il existe exactement deux conduits bleus, isoler le dernier bleu. Sinon, s'il existe un unique conduit blanc, isoler le blanc. Sinon isoler le premier. Un seul conduit doit être isolé. Rétablir un conduit est toujours sans danger. Ne jamais isoler un second conduit avant d'avoir rétabli le premier.</p>"},
  runes:{name:"Manuel — Clavier runique",text:"<p>Identifier la rangée contenant les quatre runes présentes sur le clavier. Les activer de gauche à droite. Trois séries successives sont nécessaires ; toute erreur recommence la série en cours.</p><table>"+RUNE_ROWS.map((r,i)=>"<tr><th>"+(i+1)+"</th>"+r.map(x=>"<td style='font-size:32px;text-align:center'>"+x+"</td>").join("")+"</tr>").join("")+"</table>"},
  simon:{name:"Manuel — Pulsations",text:"<p>Double-cliquer sur Rejouer pour émettre une séquence lumineuse. Le mécanisme attend ensuite une réponse. Ne pas répéter la couleur observée : utiliser la correspondance suivante. Chaque série ajoute une pulsation. Le repère « Rejouer » permet de revoir la série en cours sans pénalité ; attendre la fin du clignotement avant de répondre.</p><table><tr><th>Observée</th><th>À activer</th></tr><tr><td>Bleu</td><td>Jaune</td></tr><tr><td>Rouge</td><td>Vert</td></tr><tr><td>Jaune</td><td>Bleu</td></tr><tr><td>Vert</td><td>Rouge</td></tr></table>"},
  maze:{name:"Manuel — Circuit planaire",text:"<p>Le flux part de A1. La sortie est E5. Les colonnes A–E vont de gauche à droite, les lignes 1–5 du haut vers le bas. Seuls les passages suivants sont ouverts ; toute autre direction rencontre une paroi. Guider l'opérateur case par case.</p><table><tr><th>Case</th><th>Passages ouverts</th></tr>"+Array.from({length:25},(_,i)=>"<tr><td>"+String.fromCharCode(65+i%5)+(1+Math.floor(i/5))+"</td><td>"+MAZE_EDGES.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]).map(j=>({1:"droite","-1":"gauche",5:"bas","-5":"haut"}[j-i])).join(", ")+"</td></tr>").join("")+"</table>"},
  dial:{name:"Manuel — Molette",text:"<p>Les douze voyants sont numérotés 1–6 en haut, 7–12 en bas, de gauche à droite. Identifier la configuration et orienter la molette vers la direction correspondante. Valider seulement après orientation. Une nouvelle configuration apparaît périodiquement.</p><table><tr><th>Voyants allumés</th><th>Direction</th></tr>"+DIALS.map(d=>"<tr><td>"+d.lights.map(x=>x+1).join(", ")+"</td><td>"+["Nord","Est","Sud","Ouest"][d.answer]+"</td></tr>").join("")+"</table>"},
  pressure:{name:"Manuel — Régulateur",text:"<p>Dans le bureau, maintenir le bouton de purge pendant au moins trois secondes, puis relâcher avant dix secondes. La pression baisse de 10 points. Le régulateur se recharge pendant 60 secondes. Une première purge est nécessaire pour stabiliser le couplage ; les suivantes aident le groupe jusqu'à la fin.</p>"}
};
export const STATIONS = [
  {id:"conduits",x:2300,y:200,label:"Conduits",icon:"conduits"},
  {id:"runes",x:2300,y:450,label:"Runes",icon:"runes"},
  {id:"maze",x:2300,y:700,label:"Circuit",icon:"maze"},
  {id:"dial",x:2300,y:950,label:"Molette",icon:"dial"},
  {id:"simon-show",x:2300,y:1200,label:"Rejouer la séquence",icon:"simon"},
  {id:"simon-R",x:2200,y:1400,label:"Rouge",icon:"lamp-R"},
  {id:"simon-B",x:2400,y:1400,label:"Bleu",icon:"lamp-B"},
  {id:"simon-J",x:2200,y:1600,label:"Jaune",icon:"lamp-J"},
  {id:"simon-V",x:2400,y:1600,label:"Vert",icon:"lamp-V"},
  {id:"pressure",x:1500,y:1250,label:"Régulateur",icon:"pressure"}
];
export const MANUAL_POSITIONS = [[300,250],[850,250],[1400,250],[300,800],[850,800],[1400,800]];
