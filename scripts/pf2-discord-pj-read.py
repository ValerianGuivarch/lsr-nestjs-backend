#!/usr/bin/env python3
"""Read-only Discord messages for PF2 player channels mapped in local SQLite.

Runs Discord REST inside the existing api-jdr container so the bot token never
leaves the container. No HTTP endpoint is exposed and no Discord writes occur.
"""
import argparse
import json
import sqlite3
import subprocess
import sys

DATABASE = "/home/valou/services/lsr-nestjs-backend/pf2.sqlite"
CONTAINER = "lsr-app-api-jdr-1"
NODE = r"""
const id=process.argv[1], count=Number(process.argv[2]);
const token=process.env.DISCORD_BOT_TOKEN;
if(!token) { console.error('Discord bot is not configured'); process.exit(2); }
(async()=>{
 let before='', out=[];
 while(out.length<count){
  const url=new URL('https://discord.com/api/v10/channels/'+id+'/messages');
  url.searchParams.set('limit',String(Math.min(100,count-out.length)));
  if(before) url.searchParams.set('before',before);
  const r=await fetch(url,{headers:{Authorization:'Bot '+token}});
  if(!r.ok){console.error('Discord API error '+r.status);process.exit(3);}
  const page=await r.json();
  if(!Array.isArray(page)) throw new Error('Invalid Discord API response');
  for(const m of page)out.push({id:m.id,created_at:m.timestamp,author:m.author?.global_name||m.author?.username||'?',author_id:m.author?.id,content:m.content,reply_to:m.message_reference?.message_id||null});
  if(page.length===0||page.length<Math.min(100,count-out.length+page.length))break;
  before=page[page.length-1].id;
 }
 process.stdout.write(JSON.stringify({channel_id:id,messages:out},null,2));
})().catch(e=>{console.error('Read failed: '+e.message);process.exit(4)});
"""

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("character",help="PJ's name, e.g. Eryn")
    parser.add_argument("--limit",type=int,default=100,help="1–500 recent messages")
    args=parser.parse_args()
    if not 1<=args.limit<=500: parser.error("--limit must be 1..500")
    con=sqlite3.connect("file:"+DATABASE+"?mode=ro",uri=True)
    rows=con.execute("""
        SELECT c.channel_id, p.display_name FROM pf2_player_discord_channel c
        JOIN pf2_player_character_profile p ON p.npc_id=c.npc_id
        WHERE p.is_player=1 AND LOWER(p.display_name)=LOWER(?)
    """,(args.character,)).fetchall()
    if len(rows)!=1:
        parser.error("PJ not found or ambiguous; only mapped player channels are allowed")
    channel,name=rows[0]
    command=["docker","exec",CONTAINER,"node","-e",NODE,channel,str(args.limit)]
    result=subprocess.run(command,capture_output=True,text=True,timeout=50,check=False)
    if result.returncode:
        print(result.stderr.strip() or "Discord read failed",file=sys.stderr)
        return 1
    try:
        response=json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Invalid output",file=sys.stderr);return 1
    response["character"]=name
    print(json.dumps(response,ensure_ascii=False,indent=2))
    return 0

if __name__=="__main__":sys.exit(main())
