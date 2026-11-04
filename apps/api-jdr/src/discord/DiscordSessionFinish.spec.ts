import { DiscordCommandsService } from './DiscordCommandsService'

const ADMIN_PERMISSIONS = { has: jest.fn().mockReturnValue(true) }
const FACTIONS = [
  { id:1,name:'Pointesable',entries:[
    { id:11,name:'Garde de la ville',score:1 },{id:12,name:'Citadins',score:0},
  ]},
  { id:2,name:'Société des Éclaireurs',entries:[{id:18,name:'Alliance',score:2}] },
  { id:3,name:'Absalom',entries:[{id:21,name:'Habitants d’Absalom',score:2}] },
  { id:4,name:'Autres factions',entries:[{id:23,name:'Kobolds',score:0}] },
  { id:5,name:'Brechmur',entries:[{id:34,name:'Garde de Brechmur',score:0}] },
  { id:6,name:'Abberton',entries:[
    {id:20,name:'Cirque des Merveilles Vagabondes',score:13},
    {id:24,name:'Ermitage de la Foudre Bénie',score:-7},
    {id:25,name:'Cirque de Lady Dusklight',score:-6},
    {id:36,name:'Villageois d’Abberton',score:1},
  ]},
]

const payload = (groups: typeof FACTIONS) => ({
  number:7,days:2,xpTotal:1240,xpPerPlayer:310,
  actions:'Gnome sauvé : 30XP\nChef : 1200XP',
  gp:7,sp:3,cp:2,loot:'Potion de soins\nAnneau magique',
  reputations:groups.flatMap(group=>group.entries.map(entry=>({
    id:entry.id,delta:entry.id===11?3:entry.id===21?1:entry.id===12?-2:entry.id===20?2:0,
  }))),
})

function wizard(mock:boolean) {
  const send=jest.fn().mockResolvedValue({id:'posted'})
  const channel={name:mock?'mj':'discussion',isTextBased:()=>true,send}
  const session={id:'5efb95f7-5ef8-438c-a984-9a4bdff0c273',sessionNumber:7,inGameStartDate:'4720-01-01',date:'',
    participants:['Actor.hero','Actor.other'],sessionXp:0}
  const persistence={
    activeSessionForDiscordChannel:jest.fn().mockResolvedValue(session),
    listSessions:jest.fn().mockResolvedValue([session]),
    updateSession:jest.fn().mockResolvedValue(session),
    saveSessionFinishReport:jest.fn().mockResolvedValue(undefined),
    sessionFinishReport:jest.fn().mockResolvedValue(null),
    closeSessionDiscordChannel:jest.fn().mockResolvedValue(undefined),
    hasActiveSessionDiscordChannel:jest.fn().mockResolvedValue(false),
  }
  const foundry={
    checkSessionCoins:jest.fn().mockResolvedValue(undefined),
    awardSessionCoins:jest.fn().mockResolvedValue([{actorId:'hero',already:false},{actorId:'other',already:false}]),
  }
  const reputations={list:jest.fn().mockResolvedValue(FACTIONS),applySessionDeltas:jest.fn().mockResolvedValue(undefined)}
  const codex={setFoundrySessionActive:jest.fn()}
  const fetchChannel=jest.fn().mockResolvedValue(channel)
  const discord={requestClient:()=>({channels:{fetch:fetchChannel}})}
  const service=new DiscordCommandsService(persistence as never,foundry as never,codex as never,
    undefined,discord as never,undefined,undefined,undefined,reputations as never)
  const reply=jest.fn().mockResolvedValue(undefined)
  const start={
    commandName:'fin-seance',id:'cmd',user:{id:'admin'},channelId:'channel',guildId:'guild',
    memberPermissions:ADMIN_PERMISSIONS,channel,reply,
  }
  return {service,persistence,foundry,reputations,codex,discord,fetchChannel,start,reply,send,channel,session}
}

async function prepare(w:ReturnType<typeof wizard>) {
  await w.service.handle(w.start as never)
  expect(w.reply).toHaveBeenCalledTimes(1)
  const msg=w.reply.mock.calls[0][0]
  expect(msg.ephemeral).toBe(true)
  expect(msg.content).toMatch(/formulaire|seule page/)
  const button=msg.components[0].components[0].toJSON()
  expect(button.style).toBe(5) // Discord Link button, not a modal.
  const url=new URL(button.url)
  expect(url.hostname).toBe('l7r.fr')
  expect(url.pathname).toContain('/apil7r/pf2-mj/discord/fin-seance/')
  const token=url.pathname.split('/').at(-1)!
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
  const state=w.service.sessionFinishWebState(token)
  expect(state.number).toBe(7)
  expect(state.groups).toHaveLength(6)
  const groups=state.groups as typeof FACTIONS
  expect(groups.map(group=>group.name)).toContain('Abberton')
  expect(groups.find(group=>group.name==='Abberton')?.entries.map(item=>item.name)).toEqual([
    'Cirque des Merveilles Vagabondes','Ermitage de la Foudre Bénie',
    'Cirque de Lady Dusklight','Villageois d’Abberton',
  ])
  expect(w.service.sessionFinishWebPreview(token,payload(groups)).parts.join('\n')).toContain(
    'Total : 1240 XP, soit 310 XP par PJ.')
  return { token,groups }
}

describe('/fin-seance external single-page form',()=>{
  it('opens a single secure short-lived link with every faction, even Abberton',async()=>{
    const w=wizard(true)
    const {token}=await prepare(w)
    expect(w.reputations.list).toHaveBeenCalledWith(true)
    expect(w.persistence.activeSessionForDiscordChannel).not.toHaveBeenCalled()
    expect(w.foundry.checkSessionCoins).not.toHaveBeenCalled()
    expect(w.service.sessionFinishWebState(token).step).toBe('review')
  })

  it('in #mj publishes a simulation with zero SQLite, reputation and Foundry changes',async()=>{
    const w=wizard(true)
    const {token}=await prepare(w)
    const result=await w.service.sessionFinishWebConfirm(token)
    expect(result.message).toContain('Simulation publiée')
    expect(w.send).toHaveBeenCalledTimes(1)
    const report=w.send.mock.calls[0][0].content
    expect(report).toContain('SIMULATION MJ')
    expect(report).toContain('• Gnome sauvé : 30XP')
    expect(report).toContain('7 pièces d’or, 3 pièces d’argent, 2 pièces de cuivre')
    expect(report).toContain('Cirque des Merveilles Vagabondes : +2')
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    expect(w.persistence.closeSessionDiscordChannel).not.toHaveBeenCalled()
    expect(w.persistence.saveSessionFinishReport).not.toHaveBeenCalled()
    expect(w.foundry.checkSessionCoins).not.toHaveBeenCalled()
    expect(w.foundry.awardSessionCoins).not.toHaveBeenCalled()
    expect(w.reputations.applySessionDeltas).not.toHaveBeenCalled()
    expect(w.codex.setFoundrySessionActive).not.toHaveBeenCalled()
    expect(()=>w.service.sessionFinishWebState(token)).toThrow(/expiré|déjà utilisé/)
    await expect(w.service.sessionFinishWebConfirm(token)).rejects.toThrow()
    expect(w.send).toHaveBeenCalledTimes(1)
  })

  it('in a live session credits each PJ, changes global reputation and publishes once',async()=>{
    const w=wizard(false)
    const {token}=await prepare(w)
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    await w.service.sessionFinishWebConfirm(token)
    expect(w.foundry.checkSessionCoins).toHaveBeenCalledWith(w.session.participants,{gp:7,sp:3,cp:2},w.session.id)
    expect(w.foundry.awardSessionCoins).toHaveBeenCalledWith(w.session.participants,{gp:7,sp:3,cp:2},w.session.id)
    expect(w.reputations.applySessionDeltas).toHaveBeenCalledWith([
      {id:11,delta:3},{id:20,delta:2},{id:21,delta:1},{id:12,delta:-2},
    ],w.session.id)
    expect(w.persistence.updateSession).toHaveBeenCalledWith(w.session.id,
      expect.objectContaining({inGameEndDate:'4720-01-03',sessionXp:310}))
    expect(w.persistence.saveSessionFinishReport).toHaveBeenCalledWith(w.session.id,1240,
      expect.stringContaining('Total : 1240 XP'))
    expect(w.persistence.closeSessionDiscordChannel).toHaveBeenCalledWith(w.session.id)
    expect(w.send).toHaveBeenCalledTimes(1)
    expect(w.send.mock.calls[0][0].allowedMentions).toEqual({parse:[]})
  })

  it('refuses invalid or missing factions without changing data',async()=>{
    const w=wizard(true)
    const {token,groups}=await prepare(w)
    const bad=payload(groups)
    bad.reputations=bad.reputations.slice(0,-1)
    expect(()=>w.service.sessionFinishWebPreview(token,bad)).toThrow(/incomplète/)
    const other=payload(groups)
    other.reputations[0].delta=51
    expect(()=>w.service.sessionFinishWebPreview(token,other)).toThrow(/variation/)
    const foreign=payload(groups)
    foreign.reputations[0].id=999
    expect(()=>w.service.sessionFinishWebPreview(token,foreign)).toThrow(/inconnue/)
    expect(w.send).not.toHaveBeenCalled()
  })

  it('refuses a real confirmation when there is no longer an active session or Foundry is offline',async()=>{
    const w=wizard(false)
    const {token}=await prepare(w)
    w.persistence.activeSessionForDiscordChannel.mockResolvedValueOnce(null)
    await expect(w.service.sessionFinishWebConfirm(token)).rejects.toThrow(/Aucune séance active/)
    expect(w.foundry.awardSessionCoins).not.toHaveBeenCalled()
    w.foundry.checkSessionCoins.mockRejectedValueOnce(new Error('execute-js disabled'))
    await expect(w.service.sessionFinishWebConfirm(token)).rejects.toThrow(/execute-js disabled/)
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    expect(w.reputations.applySessionDeltas).not.toHaveBeenCalled()
    expect(w.send).not.toHaveBeenCalled()
  })

  it('expires private links and blocks attempts to confirm without a preview',async()=>{
    const w=wizard(true)
    await w.service.handle(w.start as never)
    const url=new URL(w.reply.mock.calls[0][0].components[0].components[0].toJSON().url)
    const token=url.pathname.split('/').at(-1)!
    await expect(w.service.sessionFinishWebConfirm(token)).rejects.toThrow(/Prévisualise/)
    const pending=(w.service as unknown as {pendingSessionFinishes:Map<string,{createdAt:number}>}).pendingSessionFinishes
    pending.get(token)!.createdAt=Date.now()-31*60*1000
    expect(()=>w.service.sessionFinishWebState(token)).toThrow(/expiré/)
  })
})
