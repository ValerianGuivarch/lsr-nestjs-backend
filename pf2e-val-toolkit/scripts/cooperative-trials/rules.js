export const COLORS=["rouge","bleu","jaune","blanc","noir"];
export const DEFAULT_CONDUITS=["rouge","bleu","jaune","bleu","blanc"];
export const CONDUIT_RULES={
 1:[["Un seul conduit : isolez-le.",()=>true,()=>0]],
 2:[["Deux conduits de même couleur : isolez le second.",c=>c[0]===c[1],()=>1],["Si un conduit est noir, isolez le noir.",c=>c.includes("noir"),c=>c.indexOf("noir")],["Sinon, isolez le premier.",()=>true,()=>0]],
 3:[["S’il n’y a aucun rouge, isolez le deuxième.",c=>!c.includes("rouge"),()=>1],["Si le dernier est blanc, isolez-le.",c=>c.at(-1)==="blanc",c=>c.length-1],["Si deux conduits ou davantage sont bleus, isolez le dernier bleu.",c=>count(c,"bleu")>=2,c=>c.lastIndexOf("bleu")],["Sinon, isolez le premier rouge.",()=>true,c=>c.indexOf("rouge")]],
 4:[["Si un seul conduit est jaune, isolez-le.",c=>count(c,"jaune")===1,c=>c.indexOf("jaune")],["S’il n’y a aucun noir, isolez le troisième.",c=>!c.includes("noir"),()=>2],["Si les deux extrémités sont de même couleur, isolez le dernier.",c=>c[0]===c.at(-1),c=>c.length-1],["Sinon, isolez le premier noir.",()=>true,c=>c.indexOf("noir")]],
 5:[["Si deux conduits exactement sont bleus, isolez le dernier bleu.",c=>count(c,"bleu")===2,c=>c.lastIndexOf("bleu")],["Si un seul conduit est blanc, isolez-le.",c=>count(c,"blanc")===1,c=>c.indexOf("blanc")],["S’il n’y a aucun rouge, isolez le quatrième.",c=>!c.includes("rouge"),()=>3],["Sinon, isolez le premier.",()=>true,()=>0]],
 6:[["Si trois conduits ou davantage ont la même couleur, isolez le dernier de cette couleur (en cas d’égalité, celle rencontrée en premier).",c=>c.some(x=>count(c,x)>=3),c=>c.lastIndexOf(c.find(x=>count(c,x)>=3))],["Si aucun jaune n’apparaît, isolez le cinquième.",c=>!c.includes("jaune"),()=>4],["Si le dernier est rouge, isolez le premier blanc s’il existe, sinon le deuxième.",c=>c.at(-1)==="rouge",c=>c.includes("blanc")?c.indexOf("blanc"):1],["Sinon, isolez le dernier jaune.",()=>true,c=>c.lastIndexOf("jaune")]]
};
const count=(c,x)=>c.filter(v=>v===x).length;
export function correctConduit(c){const rule=CONDUIT_RULES[c.length]?.find(([,test])=>test(c));if(!rule)throw Error("Nombre de conduits invalide");return rule[2](c);}
export const RUNE_ROWS=[["☾","Ψ","♜","◇","✦","≈"],["☉","♜","△","Ψ","♧","⚡"],["◇","✦","☉","≈","♧","∞"],["△","☾","⚡","♜","⊕","☍"],["Ψ","∞","✦","⊕","♧","☽"],["≈","☍","☉","☽","△","☾"],["♜","◇","∞","⚡","☽","⊕"],["♧","☍","Ψ","≈","⚡","✦"],["☉","⊕","☾","♧","◇","△"],["☽","♜","≈","✦","☍","∞"]];
const combinations=(row)=>row.flatMap((a,i)=>row.slice(i+1).flatMap((b,j)=>row.slice(i+j+2).flatMap((c,k)=>row.slice(i+j+k+3).map(d=>[a,b,c,d]))));
export const RUNE_CANDIDATES=RUNE_ROWS.flatMap(row=>combinations(row).filter(keys=>RUNE_ROWS.filter(r=>keys.every(k=>r.includes(k))).length===1));
export const DEFAULT_RUNE_ANSWERS=[["☾","Ψ","♜","◇"],["☉","♜","△","♧"],["◇","✦","≈","∞"]];
export const DEFAULT_RUNE_KEYS=[["♜","☾","◇","Ψ"],["♧","△","☉","♜"],["✦","∞","◇","≈"]];
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makePuzzleConfig(random=Math.random){
 const conduits=Array.from({length:3+Math.floor(random()*4)},()=>COLORS[Math.floor(random()*COLORS.length)]);
 const candidates=shuffle(RUNE_CANDIDATES,random),runeAnswers=[],runeKeys=[];
 let prior="";
 for(const answer of candidates){
  if(runeAnswers.some(a=>a.join("")===answer.join("")))continue;
  let keys=shuffle(answer,random),order=answer.map(x=>keys.indexOf(x)).join("");
  if(order===prior||order==="0123"){for(let i=0;i<4&&(order===prior||order==="0123");i++){keys=[...keys.slice(1),keys[0]];order=answer.map(x=>keys.indexOf(x)).join("");}}
  if(order===prior||order==="0123")continue;
  runeAnswers.push(answer);runeKeys.push(keys);prior=order;if(runeAnswers.length===3)break;
 }
 if(runeAnswers.length!==3)throw Error("Clavier runique incomplet");
 return {conduits,runeAnswers,runeKeys,dialIndex:Math.floor(random()*DIALS.length)};
}
export const DIALS=[{lights:[0,2,4,6,7,9,11],answer:1},{lights:[1,3,5,6,8,10],answer:3},{lights:[0,1,5,7,8,11],answer:0},{lights:[0,3,4,7,9,10],answer:2}];
