import {MAZE_EDGES} from "./engine.js";
import {RUNE_ROWS,DIALS,CONDUIT_RULES} from "./rules.js";
const signature='<p style="font-style:italic;text-align:right;margin:5px 0 10px">Wakeiwa Atikak — Notes d’atelier du Ratisseur</p>';
const notice=text=>signature+text;
const lamps=d=>'<span style="display:inline-grid;grid-template-columns:repeat(6,19px);gap:3px;vertical-align:middle">'+Array.from({length:12},(_,i)=>'<span style="display:inline-block;width:18px;height:18px;border:1px solid #74613e;border-radius:50%;text-align:center;font-size:10px;line-height:16px;background:'+(d.lights.includes(i)?'#73bc65;color:#162312':'#ded7c3;color:#524a3a')+'">'+(i+1)+'</span>').join("")+'</span>';
export const MANUALS={
 conduits:{name:"Conduits de quintessence",text:notice('<p>Comptez les conduits de haut en bas. Appliquez la première règle valable pour leur nombre. Isolez un seul conduit ; rétablir un conduit ne présente aucun danger.</p>'+Object.entries(CONDUIT_RULES).map(([n,r])=>'<h4>'+n+' conduit'+(n==="1"?"":"s")+'</h4><ol>'+r.map(([t])=>'<li>'+t+'</li>').join("")+'</ol>').join(""))},
 runes:{name:"Sceaux du couplage",text:notice('<p>Quatre sceaux apparaissent sur le pupitre. Repérez l’unique ligne qui les contient tous ; éveillez-les dans l’ordre de cette ligne, de gauche à droite. Les sceaux étrangers à la série doivent rester intacts.</p><table style="width:100%;table-layout:fixed">'+RUNE_ROWS.map((r,i)=>'<tr><th style="width:28px">'+(i+1)+'</th>'+r.map(x=>'<td style="font-size:24px;text-align:center;padding:4px">'+x+'</td>').join("")+'</tr>').join("")+'</table>')},
 simon:{name:"Pulsations du Maelström",text:notice('<p>Le cœur chante en quatre lueurs. Répondez à son chant dans le même ordre. À chaque accord juste, il ajoute une pulsation. Douze pulsations accordées maintiennent les quatre lueurs.</p><p>Un accord rompu fait vaciller le cœur ; laissez-le reprendre son chant.</p>')},
 maze:{name:"Circuit planaire",text:notice('<p>Conduisez le flux de A1 jusqu’à E5 sans heurter les cloisons. Gardez trace de chaque passage ; une entrave n’altère pas sa position. Le rappel ramène le flux à A1.</p><img src="modules/pf2e-val-toolkit/icons/cooperative/maze-manual.svg" alt="Plan du circuit planaire" style="width:100%;max-width:330px;height:auto;display:block;margin:8px auto"><details><summary>Passages gravés</summary><table>'+Array.from({length:25},(_,i)=>'<tr><td>'+String.fromCharCode(65+i%5)+(1+Math.floor(i/5))+'</td><td>'+MAZE_EDGES.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]).map(j=>({1:"est","-1":"ouest",5:"sud","-5":"nord"}[j-i])).join(", ")+'</td></tr>').join("")+'</table></details>')},
 dial:{name:"Rose des plans",text:notice('<p>Observez les douze gemmes du pupitre. Retrouvez leur constellation ci-dessous, puis orientez la rose vers le plan indiqué et scellez l’accord. Répétez pour cinq constellations successives. Un accord erroné ne change pas la constellation.</p><table style="width:100%"><tr><th>Constellation</th><th>Direction</th></tr>'+DIALS.map(d=>'<tr><td>'+lamps(d)+'</td><td><b>'+["Nord","Est","Sud","Ouest"][d.answer]+'</b></td></tr>').join("")+'</table>')},
 pressure:{name:"Soupape de quintessence",text:notice('<p>Libérez le trop-plein du couplage par la soupape : la pression décroît de dix points. Attendez une minute que les conduits se réamorcent avant de purger de nouveau.</p>')}
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
