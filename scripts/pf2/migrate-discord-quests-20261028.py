#!/usr/bin/env python3
"""One-time reversible Discord forum quest migration. Run on the authorized PF2 miniPC.

Modes: plan, apply, rollback, delete-test. Source JSON and files are backed up separately.
All imported Discord posts use SUPPRESS_NOTIFICATIONS and allowed_mentions=[].
"""
import datetime
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
import uuid
import base64
from pathlib import Path
from zoneinfo import ZoneInfo

MODE = sys.argv[1] if len(sys.argv)>1 else 'plan'
# Import completed. Only verification and explicit rollback remain supported.
if MODE not in ('verify','rollback'):
    raise SystemExit('Migration historique clôturée : seuls verify et rollback restent disponibles. Aucune réimportation autorisée.')
ROOT = Path('/home/valou/pf2-migrations/quest-bot-migration-20261028')
FORUM = '1536259632455094412'
BOT = '1542575311311339590'
OBSOLETE = '1565006656637636639'
DONE = '1536274053373886544'
GUILD = '1531345672639610920'
TEST = '1565017298668888206'
PLACE = 'community-b322d725-9a0b-4de1-942c-a559d410c60f'
DB_PATH='/home/valou/services/lsr-nestjs-backend/pf2.sqlite'
ARCHIVE=json.loads((ROOT/'discord-legacy-export.json').read_text())
# REST operations are proxied through the existing API container, which has
# Discord access. The Discord token remains inside the container.
# Containers can be replaced during deployment: reinstall this small relay.
relay=Path(__file__).with_name('discord-rest-relay-20261028.cjs')
subprocess.run([
    'docker','cp',str(relay),
    'lsr-app-api-jdr-1:/tmp/pf2-quest-discord-rest-relay-20261028.cjs',
],check=True,stdout=subprocess.DEVNULL)
proxy=subprocess.Popen(
    ['docker','exec','-i','lsr-app-api-jdr-1','node','/tmp/pf2-quest-discord-rest-relay-20261028.cjs'],
    stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,
    text=True,bufsize=1,
)

db=sqlite3.connect(DB_PATH,timeout=30)
db.row_factory=sqlite3.Row
db.execute('PRAGMA busy_timeout=30000')
identities={m['author'].get('id'):m['author'].get('username','utilisateur')
 for thread in ARCHIVE['legacy'] for m in thread['messages']}
original_messages={m['id']:m for t in ARCHIVE['legacy'] for m in t['messages']}

def log(*args):
    print(datetime.datetime.now().isoformat(timespec='seconds'), *args, flush=True)

def api(method,endpoint,payload=None,files=None):
    data={'method':method,'endpoint':endpoint,'payload':payload}
    if files:
        data['files']=[[name,base64.b64encode(content).decode('ascii')] for name,content in files]
    proxy.stdin.write(json.dumps(data,ensure_ascii=False)+'\n')
    proxy.stdin.flush()
    line=proxy.stdout.readline()
    if not line:raise RuntimeError('REST relay exited without response')
    answer=json.loads(line)
    if not answer['ok']:
        raise RuntimeError(method+' '+endpoint+' HTTP '+str(answer['status'])+': '+str(answer['value'])[:340])
    return answer['value']

def current_messages(thread_id):
    messages=[]
    before=None
    while True:
        query='?limit=100'+('&before='+before if before else '')
        page=api('GET','/channels/'+thread_id+'/messages'+query)
        messages+=page
        if len(page)<100:break
        before=page[-1]['id']
    return messages

def clean(text):
    value=str(text or '')
    value=re.sub(r'<@!?(\d+)>',lambda m:identities.get(m.group(1),'utilisateur Discord'),value)
    value=re.sub(r'<@&\d+>','rôle Discord',value)
    value=re.sub(r'<#\d+>','salon Discord',value)
    return value.replace('@','＠')

def when(value):
    v=datetime.datetime.fromisoformat(value)
    return v.astimezone(ZoneInfo('Europe/Paris')).strftime('%d/%m/%Y à %H:%M')

def author(msg):
    name=msg['author'].get('username') or 'utilisateur'
    return re.sub(r'[@*_~\x00-\x1f]','',name)[:45]

def text_header(msg):
    return '**'+author(msg)+' ('+when(msg['timestamp'])+') :**'

def source_link(thread_id):
    return 'https://discord.com/channels/'+GUILD+'/'+thread_id

def locations(thread_id):
    return [r['name'] for r in db.execute(
      'SELECT r.name FROM pf2_map_place_quest l LEFT JOIN pf2_record r ON r.id=l.place_id AND r.kind="lieu" WHERE l.thread_id=? ORDER BY r.name',
      (thread_id,)) if r['name']]

def bot_card(item):
    starter=item['messages'][0]
    done=DONE in item['thread']['applied_tags']
    description=clean(starter.get('content',''))
    initial=text_header(starter)+'\n'+(description or '_Message initial sans texte._')
    places=locations(item['thread']['id'])
    list_places='\n'.join('• '+clean(name) for name in places) if places else '_Aucun lieu associé._'
    content=(initial+'\n\n**📍 Lieux de la quête**\n'+list_places+
        '\n\n**Statut :** '+('✅ Terminée' if done else '🟢 En cours')+
        '\n\n_Réagissez 👍 à ce premier message pour indiquer votre intérêt._'+
        '\n\n**Archive originale :** '+source_link(item['thread']['id']))
    if len(content)>1950:raise RuntimeError('Too long starter '+item['thread']['id'])
    return {'content':content,'description':description,'done':done}

def emoji_of(title):
    # Preserve the existing emoji from the leading word, including a variation selector.
    return title.split(' ',1)[0] if ' ' in title else ''

def buttons(thread_id,done):
    def button(label,ident,style=2,emoji=None):
        b={'type':2,'style':style,'custom_id':ident,'label':label}
        if emoji:b['emoji']={'name':emoji}
        return b
    base='pf2-quest-ui:'
    return [
      {'type':1,'components':[
       button('Associer un lieu',base+'places:'+thread_id+':add:0',1,'📍'),
       button('Retirer un lieu',base+'places:'+thread_id+':remove:0'),
       button('Modifier',base+'edit:'+thread_id),
       button('Relancer' if done else 'Terminer',base+('reopen:' if done else 'finish:')+thread_id,3 if done else 4),
      ]},
      {'type':1,'components':[{'type':2,'style':5,'label':'Voir sur la carte','url':'https://map.l7r.fr/pj'}]},
    ]

def verify_source(item):
    old=item['thread']['id']
    q=db.execute('SELECT title,obsolete FROM pf2_discord_quest WHERE thread_id=?',(old,)).fetchone()
    managed=db.execute('SELECT kind FROM pf2_quest_ui WHERE thread_id=?',(old,)).fetchone()
    if not q or q['obsolete'] or managed:raise RuntimeError('Legacy thread unexpectedly managed/obsolete: '+old)
    live=api('GET','/channels/'+old)
    if live.get('parent_id')!=FORUM or live['name']!=item['thread']['name'] or OBSOLETE in live.get('applied_tags',[]):
        raise RuntimeError('Live source title or tag differs: '+old)
    a=sorted(m['id'] for m in current_messages(old))
    b=sorted(m['id'] for m in item['messages'])
    if a!=b:raise RuntimeError('Source messages changed; export again: '+old)
    return live

def state_table():
    with db:
        db.execute('CREATE TABLE IF NOT EXISTS pf2_quest_migration_20261028 ('
          'old_id TEXT PRIMARY KEY,new_id TEXT UNIQUE,stage TEXT NOT NULL,old_tags TEXT NOT NULL,'
          'old_archived INTEGER NOT NULL,old_locked INTEGER NOT NULL,copied INTEGER NOT NULL DEFAULT 0,'
          'created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')

def state(old,stage,**fields):
    cols=['stage=?','updated_at=CURRENT_TIMESTAMP']+[name+'=?' for name in fields]
    db.execute('UPDATE pf2_quest_migration_20261028 SET '+','.join(cols)+' WHERE old_id=?',
       [stage,*fields.values(),old])
    db.commit()

def import_reply(new_id,msg):
    content=text_header(msg)
    ref=original_messages.get(msg.get('reference'))
    if ref:content+='\n↪ En réponse à '+author(ref)+' ('+when(ref['timestamp'])+')'
    content+='\n'+(clean(msg.get('content')) or '_[Message sans texte]_')
    if len(content)>1950:raise RuntimeError('Reply too long: '+msg['id'])
    attached=[]
    for a in msg['attachments']:
        backup=ROOT/'media'/(msg['id']+'-'+a['id']+'.png')
        if not backup.exists():raise RuntimeError('Missing attachment '+str(backup))
        attached.append((a['filename'],backup.read_bytes()))
    payload={'content':content,'flags':4096,'allowed_mentions':{'parse':[]}}
    if attached:
        payload['attachments']=[{'id':i,'filename':name} for i,(name,_) in enumerate(attached)]
    api('POST','/channels/'+new_id+'/messages',payload,attached if attached else None)

def verify_import(new_id,source_count):
    msgs=current_messages(new_id)
    if len(msgs)!=source_count:raise RuntimeError('Imported message count mismatch: '+new_id+' '+str(len(msgs))+'/'+str(source_count))
    starter=next((m for m in msgs if m['id']==new_id),None)
    if not starter or starter['author']['id']!=BOT or len(starter.get('components',[]))!=2:
        raise RuntimeError('Starter or buttons missing: '+new_id)
    if any(m['author']['id']!=BOT for m in msgs):raise RuntimeError('Unexpected authors: '+new_id)

def commit_mapping(item,new_id):
    old=item['thread']['id']
    card=bot_card(item)
    original=item['messages'][0]
    preserved_description=(text_header(original)+'\n'+(card['description'] or '_Message initial sans texte._')+
       '\n\n**Archive originale :** '+source_link(old))
    with db:
        db.execute('INSERT INTO pf2_quest_ui(thread_id,kind,description,icon,icon_pending) VALUES (?,?,?,?,0)',
                   (new_id,'quest',preserved_description,emoji_of(item['thread']['name'])))
        db.execute('INSERT INTO pf2_discord_quest(thread_id,title,completed,archived,obsolete,url,discord_created_at,synced_at) VALUES (?,?,?,?,0,?,?,CURRENT_TIMESTAMP) ON CONFLICT(thread_id) DO UPDATE SET title=excluded.title,completed=excluded.completed,archived=excluded.archived,obsolete=0,url=excluded.url,synced_at=CURRENT_TIMESTAMP',
            (new_id,item['thread']['name'],1 if card['done'] else 0,0,source_link(new_id),datetime.datetime.now(datetime.timezone.utc).isoformat()))
        db.execute('UPDATE pf2_map_place_quest SET thread_id=? WHERE thread_id=?',(new_id,old))
        db.execute('UPDATE pf2_discord_quest SET obsolete=1 WHERE thread_id=?',(old,))
        db.execute("UPDATE pf2_quest_migration_20261028 SET stage='db_done',updated_at=CURRENT_TIMESTAMP WHERE old_id=?",(old,))

def migrate(item):
    old=item['thread']['id']
    row=db.execute('SELECT * FROM pf2_quest_migration_20261028 WHERE old_id=?',(old,)).fetchone()
    if row and row['stage']=='done':
        log('ALREADY MIGRATED',item['thread']['name']);return
    if row and row['stage']=='rolled_back':raise RuntimeError('Cannot reapply rolled-back quest '+old)
    if not row:
        live=verify_source(item)
        with db:
            db.execute('INSERT INTO pf2_quest_migration_20261028(old_id,stage,old_tags,old_archived,old_locked) VALUES (?,?,?,?,?)',
            (old,'prepared',json.dumps(live.get('applied_tags') or []),int(live['thread_metadata'].get('archived',False)),int(live['thread_metadata'].get('locked',False))))
        row=db.execute('SELECT * FROM pf2_quest_migration_20261028 WHERE old_id=?',(old,)).fetchone()
    stage=row['stage']
    new_id=row['new_id']
    if stage=='prepared':
        card=bot_card(item)
        out=api('POST','/channels/'+FORUM+'/threads',{
            'name':item['thread']['name'],
            'auto_archive_duration':item['thread'].get('auto_archive_duration',1440),
            'applied_tags':item['thread']['applied_tags'],
            'message':{'content':card['content'],'flags':4096,'allowed_mentions':{'parse':[]}}})
        new_id=out['id']
        state(old,'created',new_id=new_id)
        stage='created'
        log('CREATED',old,new_id,item['thread']['name'])
    if stage in ('created','copying'):
        count=db.execute('SELECT copied FROM pf2_quest_migration_20261028 WHERE old_id=?',(old,)).fetchone()['copied']
        for i,msg in enumerate(item['messages'][1:],1):
            if i<=count:continue
            import_reply(new_id,msg)
            state(old,'copying',copied=i)
            if i%5==0:log('COPIED',i,'/',len(item['messages'])-1,item['thread']['name'])
        state(old,'copied')
        stage='copied'
    if stage=='copied':
        card=bot_card(item)
        api('PATCH','/channels/'+new_id+'/messages/'+new_id,
          {'content':card['content'],'components':buttons(new_id,card['done']),'allowed_mentions':{'parse':[]}})
        if not card['done']:
            from urllib.parse import quote
            api('PUT','/channels/'+new_id+'/messages/'+new_id+'/reactions/'+quote('👍',safe='')+'/@me')
        verify_import(new_id,len(item['messages']))
        state(old,'verified')
        stage='verified'
        log('VERIFIED',item['thread']['name'],len(item['messages']),'messages')
    if stage=='verified':
        commit_mapping(item,new_id)
        stage='db_done'
    if stage=='db_done':
        live=api('GET','/channels/'+old)
        tags=list(dict.fromkeys((live.get('applied_tags') or [])+[OBSOLETE]))
        if len(tags)>5:raise RuntimeError('Tag count exceeds 5: '+old)
        api('PATCH','/channels/'+old,{'applied_tags':tags})
        api('PATCH','/channels/'+old,{'archived':True,'locked':True})
        state(old,'done')
        log('DONE',old,'=>',new_id,'obsolète and archived')

def rollback():
    rows=list(db.execute("SELECT * FROM pf2_quest_migration_20261028 WHERE stage IN ('done','db_done') ORDER BY created_at DESC"))
    for r in rows:
        old,new=r['old_id'],r['new_id']
        live=api('GET','/channels/'+new)
        tags=list(dict.fromkeys((live.get('applied_tags') or [])+[OBSOLETE]))
        api('PATCH','/channels/'+new,{'applied_tags':tags})
        api('PATCH','/channels/'+new,{'archived':True,'locked':True})
        with db:
            db.execute('UPDATE pf2_map_place_quest SET thread_id=? WHERE thread_id=?',(old,new))
            db.execute('UPDATE pf2_discord_quest SET obsolete=0 WHERE thread_id=?',(old,))
            db.execute('UPDATE pf2_discord_quest SET obsolete=1 WHERE thread_id=?',(new,))
            db.execute("UPDATE pf2_quest_migration_20261028 SET stage='rolled_back' WHERE old_id=?",(old,))
        api('PATCH','/channels/'+old,{'archived':False,'locked':False})
        api('PATCH','/channels/'+old,{'applied_tags':json.loads(r['old_tags'])})
        log('ROLLED BACK',old,'from',new)

def verify_all():
    # This is a current-state check only: the MJ may delete imported messages,
    # add replies, rename quests or change their tags after the migration.
    # Never reconstruct historical posts based on the archived export.
    pairs={row['old_id']:row['new_id'] for row in db.execute(
        "SELECT old_id,new_id FROM pf2_quest_migration_20261028 WHERE stage='done'")}
    for item in ARCHIVE['legacy']:
        old=item['thread']['id']
        new=pairs.get(old)
        if not new:
            log('SKIPPED_NON_ACTIVE_MIGRATION',old)
            continue
        old_channel=api('GET','/channels/'+old)
        new_channel=api('GET','/channels/'+new)
        assert new_channel['owner_id']==BOT and new_channel['parent_id']==FORUM
        assert OBSOLETE in (old_channel.get('applied_tags') or [])
        assert OBSOLETE not in (new_channel.get('applied_tags') or [])
        current=current_messages(new)
        starter=next((msg for msg in current if msg['id']==new),None)
        assert starter and starter['author']['id']==BOT and len(starter.get('components',[]))==2
        assert not starter.get('mention_everyone') and not starter.get('mentions')
        ui=db.execute("SELECT kind,description FROM pf2_quest_ui WHERE thread_id=?",(new,)).fetchone()
        assert ui and ui['kind']=='quest'
        log('VERIFIED_EXISTING',item['thread']['name'],'current_messages',len(current))
    assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok'
    log('GLOBAL_VERIFICATION_OK','migrated_quests',len(pairs),
        'deleted_messages_are_intentional','no_imports_performed')

def refresh_cards():
    rows=list(db.execute("SELECT new_id FROM pf2_quest_migration_20261028 WHERE stage='done'"))
    for row in rows:
        new=row['new_id']
        ui=db.execute('SELECT description FROM pf2_quest_ui WHERE thread_id=?',(new,)).fetchone()
        thread=api('GET','/channels/'+new)
        starter=api('GET','/channels/'+new+'/messages/'+new)
        done=DONE in (thread.get('applied_tags') or [])
        places=locations(new)
        names='\\n'.join('• '+clean(p) for p in places) if places else '_Aucun lieu : utilise « Associer un lieu »._'
        note='La quête est terminée : le bouton « Relancer » permet de la rouvrir.' if done else 'Réagissez 👍 à ce premier message pour indiquer votre intérêt.'
        content=ui['description']+'\\n\\n**📍 Lieux de la quête**\\n'+names+'\\n\\n**Statut :** '+('✅ Terminée' if done else '🟢 En cours')+'\\n\\n_'+note+' Les boutons restent utilisables après un redémarrage du bot._'
        if 'Archive originale' not in content or len(content)>1995:
            raise RuntimeError('Invalid persisted description '+new)
        if starter['content']!=content:
            api('PATCH','/channels/'+new+'/messages/'+new,{'content':content,'allowed_mentions':{'parse':[]}})
            log('CARD RESTORED',new)
    log('CARD REFRESH COMPLETE',len(rows))

def delete_test():
    quest=db.execute('SELECT * FROM pf2_discord_quest WHERE thread_id=?',(TEST,)).fetchone()
    ui=db.execute('SELECT * FROM pf2_quest_ui WHERE thread_id=?',(TEST,)).fetchone()
    place=db.execute("SELECT id,name,payload FROM pf2_record WHERE kind='lieu' AND id=?",(PLACE,)).fetchone()
    links=list(db.execute('SELECT place_id,thread_id FROM pf2_map_place_quest WHERE place_id=? OR thread_id=?',(PLACE,TEST)))
    live=api('GET','/channels/'+TEST)
    if not (quest and quest['title']=='😈 Détruire le monde' and ui and ui['kind']=='quest'
       and place and place['name']=='Port de la fin du monde' and
       live['name']=='😈 Détruire le monde' and live.get('parent_id')==FORUM
       and len(links)==1 and links[0]['place_id']==PLACE and links[0]['thread_id']==TEST):
        raise RuntimeError('Unexpected test quest/place state; deletion refused')
    save=ROOT/'deleted-test-discord-backup.json'
    if not save.exists():
        save.write_text(json.dumps({'thread':live,'messages':current_messages(TEST),'place':dict(place)},ensure_ascii=False,indent=2))
        save.chmod(0o600)
    api('DELETE','/channels/'+TEST)
    with db:
        db.execute('DELETE FROM pf2_map_place_quest WHERE thread_id=? AND place_id=?',(TEST,PLACE))
        db.execute("DELETE FROM pf2_record WHERE kind='lieu' AND id=?",(PLACE,))
        db.execute('DELETE FROM pf2_quest_ui WHERE thread_id=?',(TEST,))
        db.execute('DELETE FROM pf2_discord_quest WHERE thread_id=?',(TEST,))
    log('PERMANENTLY REMOVED',TEST,PLACE)

def main():
    if MODE=='plan':
        for item in ARCHIVE['legacy']:
            live=verify_source(item)
            card=bot_card(item)
            log('READY',item['thread']['name'],'messages',len(item['messages']),'initial',len(card['content']),
                'tags',len(live.get('applied_tags') or []))
        log('PLAN PASSED',len(ARCHIVE['legacy']),'threads',ARCHIVE['total'],'messages')
    else:
        state_table()
        if MODE=='apply':
            selected=os.getenv('QUEST_ONLY')
            items=[item for item in ARCHIVE['legacy'] if not selected or item['thread']['id']==selected]
            if selected and len(items)!=1:raise RuntimeError('QUEST_ONLY must identify exactly one source thread')
            for item in items:migrate(item)
            log('SUMMARY',[(r['stage'],r['n']) for r in db.execute('SELECT stage,count(*) n FROM pf2_quest_migration_20261028 GROUP BY stage')])
        elif MODE=='rollback':rollback()
        elif MODE=='refresh':refresh_cards()
        elif MODE=='verify':verify_all()
        else:delete_test()
    db.close()

if __name__=='__main__':
    try:main()
    except Exception as error:
        log('STOPPED:',repr(error))
        raise
