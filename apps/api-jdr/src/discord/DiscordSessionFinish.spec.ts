import { DiscordCommandsService } from './DiscordCommandsService'

const ADMIN_PERMISSIONS = { has: jest.fn().mockReturnValue(true) }
const FACTIONS = [
  { id: 1, name: 'Pointesable', entries: [
    { id: 11, name: 'Garde de la ville', score: 1 },
    { id: 12, name: 'Citadins', score: 0 },
  ] },
  { id: 2, name: 'Absalom', entries: [
    { id: 21, name: 'Habitants d’Absalom', score: 2 },
  ] },
]

function wizard(mock: boolean) {
  const send = jest.fn().mockResolvedValue({ id: 'posted' })
  const channel = { name: mock ? 'mj' : 'discussion', isTextBased: () => true, send }
  const session = { id: '5efb95f7-5ef8-438c-a984-9a4bdff0c273', sessionNumber: 7, inGameStartDate: '4720-01-01', date: '',
    participants: ['Actor.hero','Actor.other'], sessionXp: 0 }
  const persistence = {
    activeSessionForDiscordChannel: jest.fn().mockResolvedValue(session),
    listSessions: jest.fn().mockResolvedValue([session]),
    updateSession: jest.fn().mockResolvedValue(session),
    saveSessionFinishReport: jest.fn().mockResolvedValue(undefined),
    sessionFinishReport: jest.fn().mockResolvedValue(null),
    closeSessionDiscordChannel: jest.fn().mockResolvedValue(undefined),
    hasActiveSessionDiscordChannel: jest.fn().mockResolvedValue(false),
  }
  const foundry = {
    checkSessionCoins: jest.fn().mockResolvedValue(undefined),
    awardSessionCoins: jest.fn().mockResolvedValue([{actorId:'hero',already:false},{actorId:'other',already:false}]),
    listPlayers: jest.fn(), listActors: jest.fn(),
  }
  const reputations = { list: jest.fn().mockResolvedValue(FACTIONS), applySessionDeltas: jest.fn().mockResolvedValue(undefined) }
  const codex = { setFoundrySessionActive: jest.fn() }
  const service = new DiscordCommandsService(persistence as never, foundry as never, codex as never, undefined, undefined, undefined, undefined, undefined, reputations as never)
  const modal = (step: string, fields: Record<string,string>) => ({
    customId: 'pf2-finish:modal:'+step+':cmd', user:{id:'admin'}, channelId:'channel',
    memberPermissions: ADMIN_PERMISSIONS,
    fields:{getTextInputValue:(id:string) => fields[id] ?? ''},
    reply:jest.fn().mockResolvedValue(undefined),
    deferReply:jest.fn().mockResolvedValue(undefined),
    editReply:jest.fn().mockResolvedValue(undefined),
    followUp:jest.fn().mockResolvedValue(undefined),
  })
  const button = (step: string) => ({
    customId:'pf2-finish:button:'+step+':cmd',user:{id:'admin'},channelId:'channel',
    memberPermissions:ADMIN_PERMISSIONS,channel, guildId:'guild',
    reply:jest.fn().mockResolvedValue(undefined),
    update:jest.fn().mockResolvedValue(undefined),
    deferReply:jest.fn().mockResolvedValue(undefined),
    editReply:jest.fn().mockResolvedValue(undefined),
    showModal:jest.fn().mockResolvedValue(undefined),
  })
  const start = {
    commandName:'fin-seance', id:'cmd',user:{id:'admin'},channelId:'channel',guildId:'guild',
    memberPermissions:ADMIN_PERMISSIONS, channel, showModal:jest.fn().mockResolvedValue(undefined),
    reply:jest.fn().mockResolvedValue(undefined),
  }
  return { service,persistence,foundry,reputations,codex,channel,send,modal,button,start,session }
}

async function complete(w: ReturnType<typeof wizard>) {
  await w.service.handle(w.start as never)
  const initial = w.start.showModal.mock.calls[0][0].toJSON()
  expect(initial.components).toHaveLength(5)
  expect(initial.components[0].components[0].value).toBe('7')
  await w.service.handleModal(w.modal('general', {
    number:'7',days:'2',total:'1240','per-pj':'310',activities:'Gnome sauvé 30XP\nChef 1200 XP',
  }) as never)
  await w.service.handleButton(w.button('loot') as never)
  await w.service.handleModal(w.modal('loot', {
    gold:'7',silver:'3',copper:'2',loot:'Potion de soins\nAnneau magique',
  }) as never)
  const repButton = w.button('reputation')
  await w.service.handleButton(repButton as never)
  const repModal = repButton.showModal.mock.calls[0][0].toJSON()
  expect(repModal.components).toHaveLength(2)
  expect(repModal.components[0].components[0].value).toContain('Garde de la ville: 0')
  const preview = w.modal('reputation', {
    'group-1':'Garde de la ville: +3\nCitadins: -2',
    'group-2':'Habitants d’Absalom: +1',
  })
  await w.service.handleModal(preview as never)
  const text = [...preview.editReply.mock.calls,...preview.followUp.mock.calls].map(([arg])=>arg.content).join('\n')
  expect(text).toContain('**Total : 1240 XP, soit 310 XP par PJ.**')
  expect(text).toContain('7 pièces d’or, 3 pièces d’argent, 2 pièces de cuivre')
  expect(text.indexOf('Garde de la ville : +3')).toBeLessThan(text.indexOf('Habitants d’Absalom : +1'))
  expect(text.indexOf('Habitants d’Absalom : +1')).toBeLessThan(text.indexOf('Citadins : -2'))
  return {preview,text}
}

describe('/fin-seance admin wizard', () => {
  it('in #mj publishes only the simulation and never touches sessions, coins or reputations', async () => {
    const w=wizard(true)
    const {text}=await complete(w)
    expect(text).toContain('SIMULATION MJ')
    expect(w.persistence.activeSessionForDiscordChannel).not.toHaveBeenCalled()
    const confirm=w.button('confirm')
    await w.service.handleButton(confirm as never)
    expect(w.send).toHaveBeenCalledTimes(1)
    expect(w.send.mock.calls[0][0].content).toContain('SIMULATION MJ')
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    expect(w.persistence.closeSessionDiscordChannel).not.toHaveBeenCalled()
    expect(w.persistence.saveSessionFinishReport).not.toHaveBeenCalled()
    expect(w.foundry.checkSessionCoins).not.toHaveBeenCalled()
    expect(w.foundry.awardSessionCoins).not.toHaveBeenCalled()
    expect(w.reputations.applySessionDeltas).not.toHaveBeenCalled()
    expect(w.codex.setFoundrySessionActive).not.toHaveBeenCalled()
    await w.service.handleButton(confirm as never)
    expect(w.send).toHaveBeenCalledTimes(1)
  })

  it('in a real session credits each PJ, increments global reputation once, closes and publishes', async () => {
    const w=wizard(false)
    const {text}=await complete(w)
    expect(text).not.toContain('SIMULATION MJ')
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    await w.service.handleButton(w.button('confirm') as never)
    expect(w.foundry.checkSessionCoins).toHaveBeenCalledWith(w.session.participants,{gp:7,sp:3,cp:2},w.session.id)
    expect(w.foundry.awardSessionCoins).toHaveBeenCalledWith(w.session.participants,{gp:7,sp:3,cp:2},w.session.id)
    expect(w.reputations.applySessionDeltas).toHaveBeenCalledWith([
      {id:11,delta:3},{id:12,delta:-2},{id:21,delta:1},
    ],w.session.id)
    expect(w.persistence.updateSession).toHaveBeenCalledWith(w.session.id,
      expect.objectContaining({inGameEndDate:'4720-01-03',sessionXp:310}))
    expect(w.persistence.saveSessionFinishReport).toHaveBeenCalledWith(w.session.id,1240,expect.stringContaining('Total : 1240 XP'))
    expect(w.persistence.closeSessionDiscordChannel).toHaveBeenCalledWith(w.session.id)
    expect(w.send).toHaveBeenCalledTimes(1)
    expect(w.send.mock.calls[0][0].content).not.toContain('SIMULATION MJ')
    expect(w.send.mock.calls[0][0].allowedMentions).toEqual({parse:[]})
  })

  it('does not apply any reward if the channel session no longer matches', async () => {
    const w=wizard(false)
    await complete(w)
    w.persistence.activeSessionForDiscordChannel.mockResolvedValueOnce(null)
    const confirm=w.button('confirm')
    await w.service.handleButton(confirm as never)
    expect(w.foundry.awardSessionCoins).not.toHaveBeenCalled()
    expect(w.reputations.applySessionDeltas).not.toHaveBeenCalled()
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    expect(w.send).not.toHaveBeenCalled()
    expect(confirm.editReply.mock.calls[0][0].content).toContain('incomplète')
  })

  it('refuses a real confirmation when Foundry coinage is unavailable', async () => {
    const w=wizard(false)
    await complete(w)
    w.foundry.checkSessionCoins.mockRejectedValueOnce(new Error('execute-js disabled'))
    const confirm=w.button('confirm')
    await w.service.handleButton(confirm as never)
    expect(w.persistence.updateSession).not.toHaveBeenCalled()
    expect(w.reputations.applySessionDeltas).not.toHaveBeenCalled()
    expect(w.send).not.toHaveBeenCalled()
    expect(confirm.editReply.mock.calls[0][0].content).toContain('execute-js disabled')
  })
})
