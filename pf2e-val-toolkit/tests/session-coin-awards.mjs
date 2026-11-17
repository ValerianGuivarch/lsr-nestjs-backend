import assert from "node:assert/strict";
import { processCoinAward } from "../scripts/session-coin-awards.js";
const sessionId="5efb95f7-5ef8-438c-a984-9a4bdff0c273", token="ca908198-af8c-4983-b749-180742721812";
const job={sessionId,actorUuid:"Actor.hero",coins:{gp:7,sp:3,cp:2},status:"pending"};

function setup({failWrite=false,failAck=false,legacy=false}={}) {
  const flags=legacy?{[sessionId]:job.coins}:{};
  let status="pending", credits=0;
  const actor={
    uuid:job.actorUuid,type:"character",hasPlayerOwner:true,
    getFlag:()=>flags,
    update:async value=>{const marker=Object.values(value)[0];flags[sessionId]=marker;},
    inventory:{addCoins:async coins=>{assert.deepEqual(coins,job.coins);credits++;if(failWrite)throw Error("native write ambiguous");}}
  };
  const request=async(action,body)=>{
    if(action==="claim"){
      if(status!=="pending")return null;
      status="applying";
      return {...job,token};
    }
    assert.equal(body.token,token);
    if(failAck && body.status==="applied"){failAck=false;throw Error("network");}
    status=body.status;
  };
  return {actor,request,flags,state:()=>status,credits:()=>credits};
}

{
  const a=setup();
  const results=await Promise.all([processCoinAward(job,a.actor,a.request),processCoinAward(job,a.actor,a.request)]);
  assert.ok(results.includes("applied"));
  assert.equal(a.credits(),1);
  assert.equal(a.state(),"applied");
  await processCoinAward(job,a.actor,a.request);
  assert.equal(a.credits(),1);
}
{
  const a=setup({failAck:true});
  await assert.rejects(processCoinAward(job,a.actor,a.request),/network/);
  assert.equal(a.state(),"applying");
  assert.equal(await processCoinAward({...job,status:"applying"},a.actor,a.request),"reconciled");
  assert.equal(a.credits(),1);
  assert.equal(a.state(),"applied");
}
{
  const a=setup({failWrite:true});
  await assert.rejects(processCoinAward(job,a.actor,a.request),/ambiguous/);
  assert.equal(a.state(),"review");
  assert.equal(await processCoinAward({...job,status:"review"},a.actor,a.request),"review");
  assert.equal(a.credits(),1);
}
{
  const a=setup({legacy:true});
  assert.equal(await processCoinAward(job,a.actor,a.request),"review");
  assert.equal(a.credits(),0);
  assert.equal(await processCoinAward(job,null,a.request),"missing");
}
console.log("Session coins: concurrency, ACK recovery, ambiguous failure and legacy guard OK");
