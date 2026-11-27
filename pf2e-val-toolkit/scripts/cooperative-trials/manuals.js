import {RUNE_ROWS,DIALS,MAZE_EDGES} from "./engine.js";
export const MANUALS = {
  conduits:{name:"Manuel — Conduits",text:"<p>Compter les conduits du haut vers le bas. S'il existe exactement deux conduits bleus, isoler le dernier bleu. Sinon, s'il existe un unique conduit blanc, isoler le blanc. Sinon isoler le premier. Un seul conduit doit être isolé. Rétablir un conduit est toujours sans danger. Ne jamais isoler un second conduit avant d'avoir rétabli le premier.</p>"},
  runes:{name:"Manuel — Clavier runique",text:"<p>Identifier la rangée contenant les quatre runes présentes sur le clavier. Les activer de gauche à droite. Trois séries successives sont nécessaires ; toute erreur recommence la série en cours.</p><table>"+RUNE_ROWS.map((r,i)=>"<tr><th>"+(i+1)+"</th>"+r.map(x=>"<td style='font-size:32px;text-align:center'>"+x+"</td>").join("")+"</tr>").join("")+"</table>"},
  simon:{name:"Manuel — Pulsations",text:"<p>Regarder les quatre lampes. La série commence avec quatre couleurs et se répète après dix secondes d’attente. Double-cliquer sur la première couleur pour interrompre la diffusion et commencer la saisie, puis reproduire exactement le même ordre. Chaque double-clic exige un jeton sélectionné à proximité (1,5 case). Une faute fait clignoter les quatre lampes pendant trois secondes, puis les éteint une seconde avant rediffusion. Dix secondes sans réponse relancent la séquence sans pénalité. À chaque série correcte, une couleur est ajoutée, jusqu’à douze. Les quatre lampes restent allumées après réussite.</p>"},
  maze:{name:"Manuel — Circuit planaire",text:"<p>Guider le flux de A1 à E5 en suivant les passages ouverts. Le pilote ne voit ni les murs ni sa position. L’expert suit les déplacements acceptés sur le plan. Un obstacle ne déplace pas le flux. Le bouton Réinitialiser renvoie à A1 sans pénalité ; repartez de cette case.</p><p><img src='modules/pf2e-val-toolkit/icons/cooperative/maze-manual.svg' alt='Plan du circuit planaire, A1 vers E5' width='400'></p><details><summary>Passages (texte de secours)</summary><table><tr><th>Case</th><th>Passages ouverts</th></tr>"+Array.from({length:25},(_,i)=>"<tr><td>"+String.fromCharCode(65+i%5)+(1+Math.floor(i/5))+"</td><td>"+MAZE_EDGES.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]).map(j=>({1:"droite","-1":"gauche",5:"bas","-5":"haut"}[j-i])).join(", ")+"</td></tr>").join("")+"</table></details>"},
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
