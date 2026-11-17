import { pf2MjApiUrl } from "./career-xp/index.js";

const MODULE = "pf2e-val-toolkit";
const FLAG = "sessionCoinAwards";
const WORLD = "test-pf2";
const validId = id => typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id);
const validActor = id => typeof id === "string" && /^Actor\.[A-Za-z0-9]+$/.test(id);
const validCoins = coins => coins && ["gp","sp","cp"].every(k => Number.isSafeInteger(coins[k]) && coins[k]>=0 && coins[k]<=1000000) && Object.values(coins).some(n=>n>0);
const equalCoins = (a,b) => ["gp","sp","cp"].every(k => a?.[k] === b?.[k]);
let running = false;
let initialized = false;
const warned = new Set();

const markerFor = (actor,id) => actor?.getFlag(MODULE,FLAG)?.[id];
const writeMarker = (actor,id,record) => actor.update({[`flags.${MODULE}.${FLAG}.${id}`]:record});

/** Never issue a second native inventory write for a previously claimed job.
 * A durable Actor marker allows safe acknowledgment after a network failure.
 * An ambiguous operation requires GM review instead of automatic replay. */
export async function processCoinAward(job, actor, request) {
  if (!validId(job?.sessionId) || !validActor(job?.actorUuid) || !validCoins(job?.coins)) return "review";
  if (!actor || actor.uuid !== job.actorUuid || actor.type !== "character" || actor.hasPlayerOwner === false || typeof actor.inventory?.addCoins !== "function") return "missing";
  const marker = markerFor(actor,job.sessionId);
  if (job.status === "applying" || job.status === "review") {
    if (marker?.status === "applied" && validId(marker.token) && equalCoins(marker.coins,job.coins)) {
      await request("finish",{token:marker.token,status:"applied"});
      return "reconciled";
    }
    // A crashed client may have applied coins before writing its final marker.
    // Do not auto-reclaim or clear the marker, even after a long timeout.
    return job.status === "review" ? "review" : "applying";
  }
  if (job.status !== "pending") return "ignored";
  const claim = await request("claim",{sessionId:job.sessionId,actorUuid:job.actorUuid});
  if (!claim) return "busy";
  if (!validId(claim.token) || claim.sessionId !== job.sessionId || claim.actorUuid !== job.actorUuid || !equalCoins(claim.coins,job.coins)) throw new Error("Récompense incohérente.");
  const record = {token:claim.token,coins:claim.coins,status:"applying"};
  try {
    // Also preserve legacy markers left by the retired execute-js path.
    if (markerFor(actor,job.sessionId)) {
      await request("finish",{token:claim.token,status:"review"});
      return "review";
    }
    await writeMarker(actor,job.sessionId,record);
    await actor.inventory.addCoins(claim.coins);
    await writeMarker(actor,job.sessionId,{...record,status:"applied"});
  } catch(error) {
    // Never clear the marker or return the claim to the pending queue.
    // PF2e may have applied part/all of the native write before throwing.
    await request("finish",{token:claim.token,status:"review"}).catch(()=>{});
    throw error;
  }
  // If the ACK is lost, the next poll reconciles the durable applied marker.
  await request("finish",{token:claim.token,status:"applied"});
  return "applied";
}

function isActiveGM() {
  return game.world?.id === WORLD && game.user?.isGM && game.users?.activeGM?.id === game.user.id;
}
function warnOnce(job,message) {
  const id = job.sessionId+":"+job.actorUuid+":"+message;
  if (warned.has(id)) return;
  warned.add(id);
  ui.notifications.warn(message);
}
async function api(key,action,body) {
  const base = pf2MjApiUrl()+"/player-codex/foundry-session-coins";
  const response = await fetch(action ? base+"/"+action : base+"?world="+WORLD, {
    method:action?"POST":"GET",
    headers:{"Accept":"application/json","Content-Type":"application/json","x-pf2-foundry-sync-key":key},
    ...(action?{body:JSON.stringify({...body,world:WORLD})}:{}),
    signal:AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("Récompenses de séance : HTTP "+response.status);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function syncSessionCoins() {
  if (!isActiveGM() || running) return;
  const key = game.settings.get(MODULE,"discordCharacterChatKey");
  if (!key) return;
  running = true;
  try {
    const jobs = await api(key,"");
    if (!Array.isArray(jobs)) return;
    for (const job of jobs) {
      if (!isActiveGM()) break;
      const actor = validActor(job.actorUuid)?game.actors.get(job.actorUuid.slice(6)):null;
      try {
        const status = await processCoinAward(job,actor,(action,body)=>api(key,action,body));
        if (status === "applied") {
          ui.notifications.info("Récompense de séance créditée à "+actor.name+" : "+job.coins.gp+" po, "+job.coins.sp+" pa, "+job.coins.cp+" pc.");
        } else if (status === "review" || status === "missing" || (status === "applying" && Date.now()-Date.parse(job.updatedAt.replace(" ","T")+"Z")>120000)) {
          warnOnce(job,"Versement de séance à vérifier pour "+(actor?.name??job.actorUuid)+" (aucune nouvelle tentative automatique).");
        }
      } catch(error) {
        warnOnce(job,"Versement de séance à vérifier pour "+(actor?.name??job.actorUuid)+".");
        console.warn(MODULE+" | Récompense de séance :",error);
      }
    }
  } catch(error) { console.warn(MODULE+" | Synchronisation des récompenses :",error); }
  finally { running = false; }
}

export function initSessionCoinAwards() {
  if (initialized || !game.user?.isGM || game.world?.id !== WORLD) return;
  initialized = true;
  void syncSessionCoins();
  window.setInterval(()=>void syncSessionCoins(),30000);
}
