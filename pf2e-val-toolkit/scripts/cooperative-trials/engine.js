// Pure game engine. No Foundry globals; time and actions are injected.
export const MODULES = ["conduits","runes","simon","maze","dial","pressure"];
export const LABELS = {conduits:"Conduits",runes:"Clavier runique",simon:"Pulsations",maze:"Circuit planaire",dial:"Molette",pressure:"Régulateur"};
export const COLORS = ["rouge","bleu","jaune","bleu","blanc"];
export const CORRECT_CONDUIT = 3;
export const RUNE_ROWS = [["☾","Ψ","♜","◇"],["♜","✦","☉","≈"],["◇","△","Ψ","✦"]];
export const RUNE_KEYS = [["♜","☾","◇","Ψ"],["☉","♜","≈","✦"],["✦","Ψ","△","◇"]];
export const SIGNALS = ["B","R","J","V"];
export const RESPONSES = {B:"J",R:"V",J:"B",V:"R"};
export const DIALS = [{lights:[0,2,4,6,7,9,11],answer:1},{lights:[1,3,5,6,8,10],answer:3},{lights:[0,1,5,7,8,11],answer:0}];
export const MAZE_PATH = [0,1,6,7,8,13,12,17,18,19,24];
export const MAZE_EDGES = [...MAZE_PATH.slice(1).map((p,i)=>[MAZE_PATH[i],p]),[1,2],[2,3],[3,4],[4,9],[6,5],[5,10],[10,15],[15,20],[20,21],[13,14],[14,9],[17,16],[19,23],[23,22],[22,21]].filter(([a,b])=> Math.abs(a-b)===5 || (Math.abs(a-b)===1&&Math.floor(a/5)===Math.floor(b/5)));
const clamp = (v)=>Math.max(0,Math.min(100,v));
export function initialState(now, {duration=600, interval=30, increment=5, operatorId="",sceneId="",sessionId=""}={}) {
  return {status:"running",sceneId,sessionId,operatorId,started:now,deadline:now+duration*1000,nextTick:now+interval*1000,interval,increment,pressure:7,errors:0,
    solved:Object.fromEntries(MODULES.map(m=>[m,false])),rewarded:{},isolated:[false,false,false,false,false],runeRound:0,runeStep:0,simonRound:0,simonStep:0,simonShow:now,
    mazePos:0,dialIndex:0,dialAngle:0,dialDue:now+90000,purgeReady:now,purgeStart:null,events:[]};
}
function change(s,delta,label,now,error=false) {
  s.pressure=clamp(s.pressure+delta);
  if(error)s.errors++;
  s.events.push({label,delta,pressure:s.pressure,error,at:now});
}
function reward(s,module,now) {
  s.solved[module]=true;
  if(!s.rewarded[module]){s.rewarded[module]=true;change(s,-10,LABELS[module]+" : stabilisé",now);}
}
function finish(s,now) {
  if(s.pressure>=100||now>=s.deadline){s.status="failed";s.events.push({label:"Seuil critique — arrêt d'urgence nécessaire",delta:0,pressure:s.pressure,at:now});}
  else if(MODULES.every(m=>s.solved[m])){s.status="success";s.events.push({label:"Couplage stabilisé",delta:0,pressure:s.pressure,at:now});}
}
export function tick(state,now) {
  const s=structuredClone(state);s.events=[];
  if(s.status!=="running")return s;
  while(now>=s.nextTick && s.nextTick<=s.deadline && s.pressure<100) {
    change(s,s.increment,"Montée de pression",s.nextTick);s.nextTick+=s.interval*1000;
  }
  if(s.purgeStart!==null&&now-s.purgeStart>10000)s.purgeStart=null;
  if(s.pressure<100&&now<s.deadline&&now>=s.dialDue){s.dialIndex=(s.dialIndex+1)%DIALS.length;s.dialDue=now+90000;s.solved.dial=false;change(s,5,"Molette : réajustement requis",now,true);}
  finish(s,now);return s;
}
export function apply(state,action,now) {
  const s=tick(state,now);if(s.status!=="running")return s;
  const {module,value}=action;
  const error=(label)=>change(s,5,label,now,true);
  if(module==="conduits"&&Number.isInteger(value)&&value>=0&&value<COLORS.length){
    const was=s.isolated[value];s.isolated[value]=!was;
    if(!was&&(value!==CORRECT_CONDUIT||s.isolated.filter(Boolean).length!==1))error("Erreur critique de quintessence — conduit");
    s.solved.conduits=s.isolated[CORRECT_CONDUIT]&&s.isolated.filter(Boolean).length===1;
    if(s.solved.conduits)reward(s,"conduits",now);
  }else if(module==="runes"&&!s.solved.runes&&RUNE_KEYS[s.runeRound]?.includes(value)){
    if(value===RUNE_ROWS[s.runeRound][s.runeStep]){
      s.runeStep++;if(s.runeStep===4){s.runeRound++;s.runeStep=0;if(s.runeRound===RUNE_ROWS.length)reward(s,"runes",now);}
    }else {s.runeStep=0;error("Erreur critique de quintessence — rune");}
  }else if(module==="simon"&&!s.solved.simon){
    if(value==="show"){s.simonShow=now;s.simonStep=0;}
    else if(Object.hasOwn(RESPONSES,value)&&now>=s.simonShow+(s.simonRound+1)*850+300){
      if(value===RESPONSES[SIGNALS[s.simonStep]]){
        s.simonStep++;if(s.simonStep===s.simonRound+1){s.simonRound++;s.simonStep=0;if(s.simonRound===SIGNALS.length)reward(s,"simon",now);else s.simonShow=now;}
      }else{s.simonStep=0;s.simonShow=now;error("Erreur critique de quintessence — pulsation");}
    }
  }else if(module==="maze"&&!s.solved.maze&&["U","D","L","R"].includes(value)){
    const a=s.mazePos,b=a+({U:-5,D:5,L:-1,R:1}[value]);
    if(MAZE_EDGES.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a))) {s.mazePos=b;if(b===24)reward(s,"maze",now);}
    else error("Erreur critique de quintessence — paroi du circuit");
  }else if(module==="dial"){
    if(value==="turn"){s.dialAngle=(s.dialAngle+1)%4;s.solved.dial=false;}
    if(value==="check"){
      if(s.dialAngle===DIALS[s.dialIndex].answer){reward(s,"dial",now);s.dialDue=now+90000;}
      else error("Erreur critique de quintessence — orientation");
    }
  }else if(module==="pressure"){
    if(value==="begin"&&now>=s.purgeReady&&s.purgeStart===null)s.purgeStart=now;
    if(value==="release"&&s.purgeStart!==null){
      if(now-s.purgeStart>=3000&&now-s.purgeStart<=10000){
        const first=!s.rewarded.pressure;reward(s,"pressure",now);
        if(!first)change(s,-10,"Purge de quintessence",now);
        s.purgeReady=now+60000;
      }
      s.purgeStart=null;
    }
  }
  if(s.purgeStart!==null&&now-s.purgeStart>10000)s.purgeStart=null;
  finish(s,now);return s;
}
export function adjust(state,delta,now){
 const s=tick(state,now);if(s.status!=="running"||![5,-5,10,-10].includes(delta))return s;
 change(s,delta,"Ajustement MJ",now);finish(s,now);return s;
}
export function publicState(s) {
  if(!s)return null;
  const {status,sceneId,sessionId,operatorId,deadline,pressure,errors,solved,pausedAt}=s;
  return {status,sceneId,sessionId,operatorId,deadline,pressure,errors,solved,pausedAt};
}
export function playerState(s,operator) {
  const v=publicState(s);
  if(!v)return null;
  if(operator)Object.assign(v,{isolated:s.isolated,runeRound:s.runeRound,runeStep:s.runeStep,simonRound:s.simonRound,simonStep:s.simonStep,simonShow:s.simonShow,mazePos:s.mazePos,dialIndex:s.dialIndex,dialAngle:s.dialAngle,dialDue:s.dialDue});
  else Object.assign(v,{purgeReady:s.purgeReady,purgeStart:s.purgeStart});
  return v;
}
