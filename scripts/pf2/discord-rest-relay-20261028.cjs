'use strict'
/** Minimal JSON-lines REST relay, run only inside the authorized API container.
 * Token is read from the container environment, never sent to caller.
 */
const rl=require('readline').createInterface({input:process.stdin,crlfDelay:Infinity})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
async function call(cmd){
 const url='https://discord.com/api/v10'+cmd.endpoint
 for(let i=0;i<15;i++){
  const init={method:cmd.method,headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN}}
  if(cmd.files?.length){
   const f=new FormData()
   f.append('payload_json',JSON.stringify(cmd.payload))
   cmd.files.forEach((entry,j)=>f.append('files['+j+']',
     new Blob([Buffer.from(entry[1],'base64')],{type:'image/png'}),entry[0]))
   init.body=f
  }else if(cmd.payload!==null&&cmd.payload!==undefined){
   init.headers['Content-Type']='application/json'
   init.body=JSON.stringify(cmd.payload)
  }
  const response=await fetch(url,init)
  const raw=await response.text()
  let value=raw
  try {value=raw?JSON.parse(raw):null}catch{}
  if(response.status===429){await sleep(Math.min(20000,Math.ceil(Number(value?.retry_after||1)*1000)+120));continue}
  if(response.status>=500&&i<7){await sleep(Math.min(10000,500*2**i));continue}
  return {ok:response.ok,status:response.status,value}
 }
 return {ok:false,status:429,value:'exceeded retries'}
}
;(async()=>{
 for await(const line of rl){
  try{const r=await call(JSON.parse(line));process.stdout.write(JSON.stringify(r)+'\n')}
  catch(error){process.stdout.write(JSON.stringify({ok:false,status:0,value:String(error)})+'\n')}
 }
})().catch(e=>{process.stderr.write(String(e)+'\n');process.exitCode=1})
