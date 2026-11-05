import { ChannelType, Collection } from 'discord.js'
import { DiscordCommandsService } from './DiscordCommandsService'

describe('DiscordCommandsService', () => {
  const recapThread = (members: string[], authors: string[] = []) => ({
    isThread: () => true, isTextBased: () => true,
    members: { fetch: jest.fn().mockResolvedValue(new Map(members.map(id => [id, { id }]))) },
    messages: { fetch: jest.fn().mockResolvedValue(new Map(authors.map((id, i) =>
      [String(i), { author: { id, bot: false } }]))) },
  })

  it('registers the current command surface and keeps hidden commands unpublished', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions().map(command => command.name)
    expect(definitions).toEqual(expect.arrayContaining([
      'help', 'help-admin', 'nouvelle-quete', 'changer-icone-quete', 'choix-quete', 'terminer-quete', 'relancer-quete', 'random-perso', 'tirage-sort-joueur', 'recap-pjs', 'recap-seance',
      'debut-seance', 'fin-seance', 'personnage', 'faction', 'nouvelle-faction', 'associer-faction', 'afficher-personnage', 'afficher-faction', 'rechercher', 'wiki', 'wiki-admin',
      'proposer-date-seance', 'modifier-date-seance', 'relancer-date-seance', 'analyse-date-seance', 'valider-date-seance', 'modifier-groupe-seance',
    ]))
    expect(definitions).not.toEqual(expect.arrayContaining([
      'ping', 'export-full', 'resume', 'recap', 'new-game', 'finish-game',
      'planification', 'modifier-planification', 'programmer-seance', 'modifier-groupe-seance',
    ]))
  })

  it('registers an emoji argument and routes the icon-changing slash command to the quest service', async () => {
    const pilot = { changeQuestIconCommand: jest.fn().mockResolvedValue(undefined) }
    const service = new DiscordCommandsService({} as never, {} as never, undefined, undefined, undefined, undefined, undefined, pilot as never)
    const definition = service.definitions().find(command => command.name === 'changer-icone-quete') as any
    expect(definition.options).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'icone', required: true }),
    ]))
    const interaction = { commandName: 'changer-icone-quete' }
    expect(await service.handle(interaction as never)).toBe(true)
    expect(pilot.changeQuestIconCommand).toHaveBeenCalledWith(interaction)
  })

  it('shows /help privately and protects /help-admin', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const helpReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({ commandName: 'help', reply: helpReply } as never)
    expect(helpReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('/recap-pjs'),
      ephemeral: true,
    }))
    const helpContent = helpReply.mock.calls[0][0].content
    expect(helpContent).toContain('/choix-quete')
    expect(helpContent).toContain('/afficher-personnage')
    expect(helpContent).toContain('/afficher-faction')
    expect(helpContent).not.toContain('/personnage`')
    expect(helpContent).not.toContain('/debut-seance')

    const denied = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'help-admin', reply: denied, user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
    } as never)
    expect(denied).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('réservée aux administrateurs'), ephemeral: true,
    }))
  })

  const questChoiceTest = () => {
    const eric = { id: 'eric-123', username: 'helluin_', bot: false }
    const guilhem = { id: 'guilhem-123', username: 'guilhem_m', bot: false }
    const outsider = { id: 'absent-123', username: 'other', bot: false }
    const bot = { id: 'bot', username: 'PF2-Bot', bot: true }
    const people = [eric, guilhem, outsider, bot]
    const quest = (id: string, name: string, thumbs: string[], locks: string[], tags: string[] = []) => {
      const reactions = [
        { emoji: { name: '👍' }, users: { fetch: jest.fn().mockResolvedValue(new Map(people.filter(p => thumbs.includes(p.id)).map(p => [p.id, p]))) } },
        { emoji: { name: '🔒' }, users: { fetch: jest.fn().mockResolvedValue(new Map(people.filter(p => locks.includes(p.id)).map(p => [p.id, p]))) } },
      ]
      return {
        id, name, createdTimestamp: 1, appliedTags: tags,
        archived: tags.includes('done') || tags.includes('obsolete'),
        locked: tags.includes('done') || tags.includes('obsolete'),
        fetchStarterMessage: jest.fn().mockResolvedValue({ reactions: { cache: { find: (predicate: any) => reactions.find(predicate) } } }),
      }
    }
    const questMap = new Map<string, any>()
    const forum = {
      availableTags: [{ id: 'done', name: 'Terminée' }, { id: 'obsolete', name: 'obsolète' }],
      threads: {
        fetchActive: jest.fn(async () => ({ threads: questMap })),
        fetchArchived: jest.fn(async () => ({ threads: Object.assign(new Map(), { last: () => undefined }), hasMore: false })),
      },
    }
    const missionStarter = {
      author: { id: 'bot' },
      content: [
        '**Séance du Lundi 12 octobre 2099**',
        'Avec <@eric-123>, <@guilhem-123>, <@arthur-123>, <@mana-123>',
        '',
        'Source : https://discord.com/channels/guild/planning/confirmed',
      ].join('\n'),
    }
    // The production parser requires numeric Discord IDs.
    missionStarter.content = missionStarter.content
      .replace('eric-123', '399621722158137346').replace('guilhem-123', '448500183186145291')
      .replace('arthur-123', '557907871212503050').replace('mana-123', '404629333534179338')
    eric.id = '399621722158137346'
    guilhem.id = '448500183186145291'
    outsider.id = '688860103629340690'
    const nameMap = new Map([[eric.id, 'Éric'], [guilhem.id, 'Guilhem'], [outsider.id, 'Nico']])
    const recapParts: any[] = []
    const votesInSqlite = new Map<string, { threadId: string; userId: string; emoji: '👍' | '🔒' }>()
    const voteKey = (vote: {threadId: string; userId: string; emoji: '👍' | '🔒'}) =>
      [vote.threadId, vote.userId, vote.emoji].join(':')
    const persistence = {
      listDiscordQuestVotes: jest.fn(async () => [...votesInSqlite.values()]),
      setDiscordQuestVote: jest.fn(async (threadId: string, userId: string, emoji: '👍' | '🔒', added: boolean) => {
        const vote = { threadId, userId, emoji }, key = voteKey(vote)
        const existed = votesInSqlite.has(key)
        if (added) votesInSqlite.set(key, vote)
        else votesInSqlite.delete(key)
        return existed !== added
      }),
      reconcileDiscordQuestVotes: jest.fn(async (entries: Array<{threadId: string;userId: string;emoji: '👍' | '🔒'}>) => {
        const incoming = new Map(entries.map(vote => [voteKey(vote), vote]))
        const added = [...incoming.keys()].filter(key => !votesInSqlite.has(key)).length
        const removed = [...votesInSqlite.keys()].filter(key => !incoming.has(key)).length
        votesInSqlite.clear()
        for (const [key, vote] of incoming) votesInSqlite.set(key, vote)
        return { added, removed, unchanged: incoming.size - added }
      }),
      questRecapParts: jest.fn(async (_threadId: string) => recapParts.slice()),
      upcomingQuestRecapSessions: jest.fn(async (_date: string) => [] as Array<{threadId:string;guildId:string;sessionDate:string}>),
      saveQuestRecapPart: jest.fn(async (part: any) => {
        recapParts[part.partIndex] = part
      }),
      replaceQuestRecapParts: jest.fn(async (threadId: string, expected: string[], next: any[]) => {
        const existing = recapParts.filter(Boolean).map(part => part.messageId)
        if (existing.join(',') !== expected.join(',')) throw new Error('IDs modifiés')
        if (next.some(part => part.threadId !== threadId)) throw new Error('Mauvais fil')
        recapParts.splice(0, recapParts.length, ...next)
      }),
      listPlayerIdentities: jest.fn().mockResolvedValue([...nameMap.entries()].map(([discordUserId, playerName]) => ({ discordUserId, playerName }))) }
    const fetch = jest.fn(async (id: string) => id === 'mission-parent'
      ? { name: 'objectif-prochaine-mission' }
      : forum)
    const client = { user: { id: 'bot' }, channels: { fetch } }
    const posted = new Map<string, any>()
    let postedSequence = 0
    const send = jest.fn(async (options: {content: string; allowedMentions?: unknown}) => {
      const id = 'posted-' + (++postedSequence)
      const message = {
        id, author: { id: 'bot' }, content: options.content, createdTimestamp: postedSequence,
        reactions: { cache: new Map(), removeAll: jest.fn() },
        edit: jest.fn(async (update: {content: string}) => { message.content = update.content }),
        delete: jest.fn(async () => { posted.delete(id) }),
      }
      posted.set(id, message)
      return message
    })
    const channel = {
      id: 'mission-thread', guildId: 'guild',
      name: 'Séance 12/10', parentId: 'mission-parent', isThread: () => true,
      fetchStarterMessage: jest.fn().mockResolvedValue(missionStarter),
      messages: { fetch: jest.fn(async (argument: any) => typeof argument === 'string' ? posted.get(argument) : posted) },
      send,
    }
    const editReply = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const run = () => service.handle({ commandName: 'choix-quete', id: 'cmd-quest', guildId: 'guild',
      user: { id: 'mj' }, channelId: 'mission-thread', channel, client,
      deferReply, editReply, followUp } as never)
    return { eric, guilhem, outsider, bot, quest, questMap, forum, channel, posted, persistence, votesInSqlite, client, editReply, followUp, deferReply, service, run }
  }

  it('limits parallel Discord quest reads to four workers without changing their order', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const releases: Array<() => void> = []
    let inFlight = 0
    let maxInFlight = 0
    const entries = Array.from({ length: 13 }, (_, i) => i)
    const job = (service as any).readQuestsConcurrently(entries, async (index: number) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise<void>(resolve => { releases.push(resolve) })
      inFlight--
      return index * 2
    })
    await Promise.resolve()
    expect(releases).toHaveLength(4)
    expect(maxInFlight).toBe(4)
    for (let i = 0; i < entries.length; i++) {
      expect(releases[i]).toBeDefined()
      releases[i]()
      await Promise.resolve()
      await Promise.resolve()
    }
    expect(await job).toEqual(entries.map(i => i * 2))
    expect(maxInFlight).toBe(4)
    expect(inFlight).toBe(0)
  })

  it('uses cached votes for a new 👍 and its removal without refetching Discord', async () => {
    const t = questChoiceTest()
    const quest = t.quest('cache-quest', '👻 Quête en cache', [], [])
    t.questMap.set('cache-quest', quest)
    await t.run() // /choix-quete forces authoritative Discord read.
    const originalReads = quest.fetchStarterMessage.mock.calls.length
    const fetch = t.client.channels.fetch as jest.Mock
    fetch.mockImplementation(async (id: string) =>
      id === 'cache-quest' ? { isThread: () => true, parentId: '1536259632455094412', id } :
      id === 'mission-parent' ? { name: 'objectif-prochaine-mission' } : t.forum)
    const reaction: any = {
      emoji: { name: '👍' },
      message: { id: 'cache-quest', channelId: 'cache-quest', client: t.client },
    }
    jest.useFakeTimers()
    try {
      await t.service.handleQuestRecapReaction(reaction, t.eric, true)
      const add = await (t.service as any).buildQuestChoiceLines(t.client, 'guild', new Set([t.eric.id]))
      expect(add.join('\n')).toContain('<#cache-quest> (intéresse **Éric**)')
      expect(await t.persistence.listDiscordQuestVotes()).toContainEqual({
        threadId: 'cache-quest', userId: t.eric.id, emoji: '👍',
      })
      await t.service.handleQuestRecapReaction(reaction, t.eric, false)
      const remove = await (t.service as any).buildQuestChoiceLines(t.client, 'guild', new Set([t.eric.id]))
      expect(remove.join('\n')).toContain('- <#cache-quest>')
      expect(remove.join('\n')).not.toContain('intéresse Éric')
      expect(await t.persistence.listDiscordQuestVotes()).not.toContainEqual({
        threadId: 'cache-quest', userId: t.eric.id, emoji: '👍',
      })
      expect(quest.fetchStarterMessage).toHaveBeenCalledTimes(originalReads)
    } finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })

  it('replays votes received during a full Discord snapshot instead of losing them', async () => {
    const t = questChoiceTest()
    let release: (() => void) | undefined
    const original = t.quest('racing-quest', '🔮 Quête lente', [], [])
    const starter = await original.fetchStarterMessage()
    original.fetchStarterMessage = jest.fn(async () => new Promise<any>(resolve => {
      release = () => resolve(starter)
    }))
    t.questMap.set('racing-quest', original)
    const snapshot = (t.service as any).questVotes(t.client, true)
    for (let i = 0; i < 15 && !release; i++) await Promise.resolve()
    expect(release).toBeDefined()
    ;(t.service as any).recordQuestVoteEvent('racing-quest', t.eric.id, '👍', true)
    release!()
    const cache = await snapshot
    expect(cache.get('racing-quest').interested.has(t.eric.id)).toBe(true)
    expect(original.fetchStarterMessage).toHaveBeenCalledTimes(1)
  })

  it('keeps gateway add/remove order even if channel fetches finish out of order', async () => {
    const t = questChoiceTest()
    t.questMap.set('ordering-quest', t.quest('ordering-quest', 'Chronologie', [], []))
    await t.run()
    const fetch = t.client.channels.fetch as jest.Mock
    const channel = { id: 'ordering-quest', parentId: '1536259632455094412', isThread: () => true }
    const resolves: Array<(value: unknown) => void> = []
    fetch.mockImplementation((id: string) => id === 'ordering-quest'
      ? new Promise(resolve => { resolves.push(resolve) })
      : Promise.resolve(t.forum))
    const reaction: any = { emoji: { name: '👍' }, message: {
      id: 'ordering-quest', channelId: 'ordering-quest', client: t.client,
    } }
    jest.useFakeTimers()
    try {
      const add = t.service.handleQuestRecapReaction(reaction, t.eric, true)
      const remove = t.service.handleQuestRecapReaction(reaction, t.eric, false)
      expect(resolves).toHaveLength(2)
      resolves[1](channel)
      await remove
      resolves[0](channel)
      await add
      const lines = await (t.service as any).buildQuestChoiceLines(t.client, 'guild', new Set([t.eric.id]))
      expect(lines.join('\n')).not.toContain('intéresse Éric')
      expect(lines.join('\n')).toContain('- <#ordering-quest>')
    } finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })

  it('allows /choix-quete on the session day but refuses the following day', async () => {
    const t = questChoiceTest()
    ;(t.service as any).parisToday = () => '2099-10-12'
    await t.run()
    expect(t.editReply.mock.calls[0][0].components).toHaveLength(1)
    expect(t.channel.send).not.toHaveBeenCalled()

    ;(t.service as any).parisToday = () => '2099-10-13'
    await t.run()
    expect(t.editReply.mock.calls[1][0].content).toContain('Cette séance est passée')
  })

  it('shows a private confirmation preview and ranks locks, present thumbs, others, then absent locks', async () => {
    const t = questChoiceTest()
    t.questMap.set('other', t.quest('other', '📜 Sans intérêt', [], []))
    t.questMap.set('many', t.quest('many', '🧂 Plusieurs pouces', [t.eric.id, t.guilhem.id], []))
    t.questMap.set('one', t.quest('one', '👻 Un pouce', [t.eric.id], []))
    t.questMap.set('reserved', t.quest('reserved', '👑 Réservée aux présents', [], [t.guilhem.id]))
    t.questMap.set('absent', t.quest('absent', '🗝️ Réservée par absent', [t.eric.id], [t.outsider.id]))
    t.questMap.set('done', t.quest('done', '🧟 Terminée', [t.eric.id], [], ['done']))
    t.questMap.set('obsolete', t.quest('obsolete', '🕳️ Obsolète', [t.eric.id], [], ['obsolete']))
    await t.run()
    const preview = t.editReply.mock.calls[0][0]
    expect(t.deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(preview.content).toContain('**Choix de quête**')
    expect(preview.components).toHaveLength(1)
    expect(t.followUp).not.toHaveBeenCalled() // Fits in a single private message.
    const allText = [preview.content, ...t.followUp.mock.calls.map(args => args[0].content)].join('\n')
    const index = (text: string) => allText.indexOf(text)
    expect(index('<#reserved>')).toBeLessThan(index('<#one>'))
    expect(index('<#one>')).toBeLessThan(index('<#many>'))
    expect(index('<#many>')).toBeLessThan(index('<#other>'))
    expect(index('<#other>')).toBeLessThan(index('<#absent>'))
    expect(allText).toContain('<#reserved> (réservé par **Guilhem**)')
    expect(allText).toContain('- <#other>')
    expect(allText).not.toContain('<#other> (')
    expect(allText).not.toContain('réservé par personne')
    expect(allText).not.toContain('intéresse personne')
    expect(allText).not.toContain('https://discord.com/channels/')
    expect(allText).toContain('👍 **Intérêt des présents**')
    expect(allText).toContain('📋 **Autres**')
    expect(allText).toContain('🚫 **Réservées par les absents**')
    expect(allText).not.toContain('🔒 **Prioritaires**')
    expect((allText.match(/👍 \*\*Intérêt des présents\*\*/g) ?? [])).toHaveLength(1)
    expect(allText.indexOf('👍 **Intérêt des présents**')).toBeLessThan(index('<#reserved>'))
    expect(index('<#reserved>')).toBeLessThan(index('<#one>'))
    expect(allText.indexOf('👍 **Intérêt des présents**')).toBeLessThan(allText.indexOf('📋 **Autres**'))
    expect(allText.indexOf('📋 **Autres**')).toBeLessThan(allText.indexOf('🚫 **Réservées par les absents**'))
    expect(allText).not.toContain('\\n\\n')
    expect(allText).not.toContain('Choix de quête — suite')
    expect(allText).toContain('<#absent> (réservé par Nico, intéresse **Éric**)')
    expect(allText).not.toContain('réservé par **Nico**')
    expect(allText).not.toContain('<#done>')
    expect(allText).not.toContain('<#obsolete>')
    expect(allText).not.toContain('<@')
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('splits only when necessary, with buttons exclusively on the last preview message and no suite titles', async () => {
    const t = questChoiceTest()
    for (let i = 0; i < 72; i++) {
      const id = '1000000000000000000' + String(i).padStart(3, '0')
      t.questMap.set(id, t.quest(id, 'Quête ' + i, [t.eric.id], []))
    }
    await t.run()

    const firstPreview = t.editReply.mock.calls[0][0]
    const furtherPreviews = t.followUp.mock.calls.map(call => call[0])
    expect(t.deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(furtherPreviews.length).toBeGreaterThanOrEqual(1)
    expect(firstPreview.components).toEqual([])
    expect(furtherPreviews.at(-1).components).toHaveLength(1)
    for (const intermediate of furtherPreviews.slice(0, -1)) expect(intermediate.components).toEqual([])
    expect(furtherPreviews[0].ephemeral).toBe(true)
    expect(firstPreview.content).toContain('**Choix de quête**')
    for (const part of [firstPreview, ...furtherPreviews]) {
      expect(part.content.length).toBeLessThanOrEqual(2_000)
      expect(part.content).not.toContain('suite')
      expect(part.content).not.toContain('Prioritaires pour le groupe')
      expect(part.content).not.toContain('Choix de quête — suite')
    }
    expect(t.channel.send).not.toHaveBeenCalled()
    expect(t.persistence.saveQuestRecapPart).not.toHaveBeenCalled()

    await t.service.handleButton({
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    } as never)
    expect(t.channel.send).toHaveBeenCalledTimes(furtherPreviews.length + 1)
    expect(t.persistence.saveQuestRecapPart).toHaveBeenCalledTimes(furtherPreviews.length + 1)
    const publishedParts = t.channel.send.mock.calls.map(call => call[0].content)
    expect(publishedParts).toEqual([firstPreview.content, ...furtherPreviews.map(part => part.content)])
  })

  it('uses only the native Discord quest link, so renaming a quest never duplicates its title', async () => {
    const t = questChoiceTest()
    const title = '⚒️ La disparition de la machine du quartier des Précipices'
    t.questMap.set('long-title', t.quest('long-title', title, [t.eric.id], []))
    await t.run()
    const preview = t.editReply.mock.calls[0][0]
    expect(preview.content).toContain('- <#long-title> (intéresse **Éric**)')
    expect(preview.content).not.toContain(title)
    expect(preview.content).not.toContain('🔗')
    expect(preview.content).not.toContain('https://discord.com/channels/')
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('shows only nonempty category headings in a single short recap', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', '👑 Le Roi Kobold', [], [t.guilhem.id]))
    await t.run()
    const preview = t.editReply.mock.calls[0][0]
    expect(preview.content).toBe('**Choix de quête**\n👍 **Intérêt des présents**\n- <#one> (réservé par **Guilhem**)')
    expect(preview.components).toHaveLength(1)
    expect(t.followUp).not.toHaveBeenCalled()
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('requires validation before publishing, without mentions or duplicate publication', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', '👑 Le Roi Kobold', [t.eric.id], [t.guilhem.id]))
    await t.run()
    const send = t.channel.send
    expect(send).not.toHaveBeenCalled()
    const editReply = jest.fn().mockResolvedValue(undefined)
    const buttons = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined), editReply, reply: jest.fn(),
    }
    await t.service.handleButton(buttons as never)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].content).toContain('<#one>')
    expect(send.mock.calls[0][0].content).toContain('réservé par **Guilhem**, intéresse **Éric**')
    expect(send.mock.calls[0][0].allowedMentions).toEqual({ parse: [] })
    await t.service.handleButton(buttons as never)
    expect(send).toHaveBeenCalledTimes(1)
    expect(buttons.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }))
  })

  it('offers Actualiser and Republier for an existing public recap, without duplicate updates', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', '👑 Le Roi Kobold', [t.eric.id], []))
    await t.run()
    const firstPublish = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.service.handleButton(firstPublish as never)
    expect(t.channel.send).toHaveBeenCalledTimes(1)
    const publicUrl = 'https://discord.com/channels/guild/mission-thread/posted-1'
    expect(firstPublish.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining(publicUrl),
      components: [expect.anything()],
    }))

    // A later preview remains private; publishing again must reuse the same
    // public message rather than creating a duplicate.
    await t.run()
    const preview = t.editReply.mock.calls.at(-1)![0]
    const row = preview.components[0]
    const labels = row.components.map((button: any) => button.data.label)
    expect(labels).toEqual(['Actualiser les choix', 'Republier les choix', 'Annuler', 'Voir les choix publiés'])
    expect(t.channel.send).toHaveBeenCalledTimes(1)
    const refresh = {
      ...firstPublish, customId: 'pf2-quest-choice:refresh:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined),
    }
    await t.service.handleButton(refresh as never)
    expect(t.channel.send).toHaveBeenCalledTimes(1)
    expect(refresh.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('actualisés sans être déplacés'),
      components: [expect.anything()],
    }))
    expect(refresh.editReply.mock.calls[0][0].components[0].components[0].data.url).toBe(publicUrl)
  })

  it('reports a missing published message instead of silently claiming publication', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', 'Quête A', [], []))
    await t.run()
    const button = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.service.handleButton(button as never)
    t.posted.delete('posted-1')

    await t.run()
    const preview = t.editReply.mock.calls.at(-1)![0]
    expect(preview.components[0].components.map((b: any) => b.data.label)).toEqual([
      'Actualiser les choix', 'Republier les choix', 'Annuler',
    ])
    const refresh = { ...button, customId: 'pf2-quest-choice:refresh:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined) }
    await t.service.handleButton(refresh as never)
    expect(t.channel.send).toHaveBeenCalledTimes(1)
    expect(refresh.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('message public enregistré est introuvable'),
      components: [],
    }))
  })

  it('reposts at the bottom, replaces tracked IDs and deletes the old bot recap', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', 'Quête A', [t.eric.id], []))
    await t.run()
    const button = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.service.handleButton(button as never)
    const former = t.posted.get('posted-1')
    expect(former).toBeDefined()
    await t.run()
    const preview = t.editReply.mock.calls.at(-1)![0]
    expect(preview.components[0].components.map((b: any) => b.data.label)).toEqual([
      'Actualiser les choix', 'Republier les choix', 'Annuler', 'Voir les choix publiés',
    ])
    const republish = { ...button, customId: 'pf2-quest-choice:repost:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined) }
    await t.service.handleButton(republish as never)
    expect(t.channel.send).toHaveBeenCalledTimes(2)
    expect(former.delete).toHaveBeenCalledTimes(1)
    expect(t.posted.has('posted-1')).toBe(false)
    expect(t.posted.has('posted-2')).toBe(true)
    expect(t.persistence.replaceQuestRecapParts).toHaveBeenCalledTimes(1)
    expect(t.persistence.replaceQuestRecapParts.mock.calls[0][1]).toEqual(['posted-1'])
    expect((await t.persistence.questRecapParts('mission-thread')).map(p => p.messageId))
      .toEqual(['posted-2'])
    expect(republish.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('republiés en bas du fil'),
    }))
    expect(republish.editReply.mock.calls[0][0].components[0].components[0].data.url)
      .toBe('https://discord.com/channels/guild/mission-thread/posted-2')
    // Next update edits only the new public recap.
    await t.run()
    expect(t.editReply.mock.calls.at(-1)![0].components[0].components.at(-1).data.url)
      .toBe('https://discord.com/channels/guild/mission-thread/posted-2')
  })

  it('reposts every chunk and removes every old chunk when the recap is split', async () => {
    const t = questChoiceTest()
    for (let i = 0; i < 72; i++) {
      const id = '1000000000000000000' + String(i).padStart(3, '0')
      t.questMap.set(id, t.quest(id, 'Quête ' + i, [t.eric.id], []))
    }
    const button = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.run()
    await t.service.handleButton(button as never)
    const oldIds = (await t.persistence.questRecapParts('mission-thread')).map(p => p.messageId)
    expect(oldIds.length).toBeGreaterThan(1)
    const oldMessages = oldIds.map(id => t.posted.get(id))
    await t.run()
    await t.service.handleButton({
      ...button, customId: 'pf2-quest-choice:repost:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined),
    } as never)
    const updatedIds = (await t.persistence.questRecapParts('mission-thread')).map(p => p.messageId)
    expect(updatedIds).toHaveLength(oldIds.length)
    for (const id of oldIds) expect(updatedIds).not.toContain(id)
    for (const old of oldMessages) {
      expect(old.delete).toHaveBeenCalledTimes(1)
      expect(t.posted.has(old.id)).toBe(false)
    }
    expect(t.posted.size).toBe(updatedIds.length)
  })

  it('preserves the original public recap when reposting fails before the tracking swap', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', 'Quête A', [], []))
    await t.run()
    const button = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.service.handleButton(button as never)
    const former = t.posted.get('posted-1')
    await t.run()
    t.persistence.replaceQuestRecapParts.mockRejectedValueOnce(new Error('SQLite inaccessible'))
    const republish = { ...button, customId: 'pf2-quest-choice:repost:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined) }
    await t.service.handleButton(republish as never)
    expect(former.delete).not.toHaveBeenCalled()
    expect(t.posted.has('posted-1')).toBe(true)
    expect(t.posted.has('posted-2')).toBe(false) // Newly sent message was cleaned up.
    expect((await t.persistence.questRecapParts('mission-thread')).map(p => p.messageId))
      .toEqual(['posted-1'])
    expect(republish.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('SQLite inaccessible'),
      components: [],
    }))
  })

  it('warns explicitly when an obsolete recap could not be deleted after reposting', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', 'Quête A', [], []))
    await t.run()
    const button = {
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client: t.client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    }
    await t.service.handleButton(button as never)
    const former = t.posted.get('posted-1')
    former.delete.mockRejectedValueOnce(new Error('Discord interdit suppression'))
    await t.run()
    const republish = { ...button, customId: 'pf2-quest-choice:repost:cmd-quest',
      editReply: jest.fn().mockResolvedValue(undefined) }
    await t.service.handleButton(republish as never)
    expect((await t.persistence.questRecapParts('mission-thread')).map(p => p.messageId))
      .toEqual(['posted-2'])
    expect(t.posted.has('posted-1')).toBe(true)
    expect(republish.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('ancien(s) message(s) n’ont pas pu être supprimés'),
    }))
  })

  it('allows cancellation without any publication', async () => {
    const t = questChoiceTest()
    t.questMap.set('one', t.quest('one', '👑 Le Roi Kobold', [], []))
    await t.run()
    await t.service.handleButton({
      customId: 'pf2-quest-choice:cancel:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel,
      update: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    } as never)
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('refuses to rank present voters when not launched from the bot mission thread', async () => {
    const t = questChoiceTest()
    const invalid = t.channel as any
    invalid.name = 'Salon libre'
    await t.run()
    expect(t.editReply.mock.calls[0][0].content).toContain('Lance /choix-quete depuis un fil')
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('ignores old recaps and tracks only a newly confirmed publication, updated until midnight', async () => {
    const t = questChoiceTest()
    const questId = 'quest-a'
    t.questMap.set(questId, t.quest(questId, '👑 Le Roi Kobold', [], []))
    const legacy = {
      id: 'legacy-recap', author: { id: 'bot' }, createdTimestamp: 1,
      content: '**[👑 Le Roi Kobold](https://discord.com/channels/guild/quest-a)** : Libre',
      edit: jest.fn(), reactions: { cache: new Map(), removeAll: jest.fn() },
    }
    t.posted.set(legacy.id, legacy)
    const client = t.client as any
    client.isReady = () => true
    const fetch = client.channels.fetch as jest.Mock
    fetch.mockImplementation(async (id: string) => id === 'mission-thread' ? t.channel
      : id === 'mission-parent' ? { name: 'objectif-prochaine-mission' } : t.forum)
    t.persistence.upcomingQuestRecapSessions = jest.fn(async (_date: string) => {
      const parts = await t.persistence.questRecapParts('mission-thread')
      return parts.length ? [{ threadId: t.channel.id, guildId: 'guild', sessionDate: '2099-10-12' }] : []
    })

    // The old recap is left intact: nothing is auto-adopted or edited without a new publication.
    await t.service.reconcileQuestRecaps(client)
    expect(legacy.edit).not.toHaveBeenCalled()
    expect(t.persistence.saveQuestRecapPart).not.toHaveBeenCalled()
    expect(t.channel.send).not.toHaveBeenCalled()

    await t.run()
    expect(t.channel.send).not.toHaveBeenCalled()
    await t.service.handleButton({
      customId: 'pf2-quest-choice:publish:cmd-quest', user: { id: 'mj' },
      channelId: 'mission-thread', channel: t.channel, client, guildId: 'guild',
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined), reply: jest.fn(),
    } as never)
    expect(t.channel.send).toHaveBeenCalledTimes(1)
    expect(t.persistence.saveQuestRecapPart).toHaveBeenCalledTimes(1)
    const published = [...t.posted.values()].find(m => m.id !== legacy.id)
    expect(published.content).toContain('- <#quest-a>')

    // The source of truth is the *current* Discord reactions, not a stored list.
    t.questMap.set(questId, t.quest(questId, '👑 Le Roi Kobold', [t.eric.id], [t.guilhem.id]))
    await t.service.reconcileQuestRecaps(client, true) // Five-minute authoritative refresh.
    expect(published.content).toContain('réservé par **Guilhem**, intéresse **Éric**')
    expect(published.edit).toHaveBeenCalledTimes(1)
    expect(legacy.edit).not.toHaveBeenCalled()
    expect(t.channel.send).toHaveBeenCalledTimes(1)

    // The session date itself remains editable until midnight in Paris.
    ;(t.service as any).parisToday = () => '2099-10-12'
    t.questMap.set(questId, t.quest(questId, '👑 Le Roi Kobold', [], []))
    await t.service.reconcileQuestRecaps(client, true)
    expect(published.edit).toHaveBeenCalledTimes(2)

    // Freeze only from the following calendar day.
    ;(t.service as any).parisToday = () => '2099-10-13'
    t.questMap.set(questId, t.quest(questId, '👑 Le Roi Kobold', [t.eric.id], []))
    await t.service.reconcileQuestRecaps(client, true)
    expect(published.edit).toHaveBeenCalledTimes(2)
    expect(t.channel.send).toHaveBeenCalledTimes(1)
  })

  it('updates the second published session even when the first session is waiting on Discord', async () => {
    const t = questChoiceTest()
    const sessions = [
      { threadId: 'session-03', guildId: 'guild', sessionDate: '2099-11-03' },
      { threadId: 'session-05', guildId: 'guild', sessionDate: '2099-11-05' },
    ]
    t.persistence.upcomingQuestRecapSessions = jest.fn(async (_date: string) => sessions)
    ;(t.service as any).questVoteCache = new Map()
    const first = { id: 'session-03', guildId: 'guild', isThread: () => true }
    const second = { id: 'session-05', guildId: 'guild', isThread: () => true }
    const fetch = t.client.channels.fetch as jest.Mock
    fetch.mockImplementation(async (id: string) => id === first.id ? first : id === second.id ? second : null)
    let release!: () => void
    const slow = new Promise<void>(resolve => { release = resolve })
    jest.spyOn(t.service as any, 'missionThreadDetails').mockImplementation(async (_client: any, thread: any) => {
      if (thread.id === first.id) await slow
      return { sessionDate: thread.id === first.id ? '2099-11-03' : '2099-11-05',
        userIds: new Set() }
    })
    jest.spyOn(t.service as any, 'buildQuestChoiceLines').mockResolvedValue(['**Choix de quête**'])
    const edit = jest.spyOn(t.service as any, 'updatePublishedQuestRecap').mockResolvedValue(undefined)
    const client = { ...t.client, isReady: () => true }
    const running = t.service.reconcileQuestRecaps(client)
    for (let n = 0; n < 20 && edit.mock.calls.length < 1; n++) await Promise.resolve()
    expect(edit).toHaveBeenCalledWith(client, second, '2099-11-05', ['**Choix de quête**'])
    expect(edit).not.toHaveBeenCalledWith(client, first, '2099-11-03', ['**Choix de quête**'])
    release()
    await running
    expect(edit).toHaveBeenCalledTimes(2)
    expect(t.channel.send).not.toHaveBeenCalled()
  })

  it('warns a player in their linked private channel after a second lock, without warning for thumbs', async () => {
    const t = questChoiceTest()
    const locked = (id: string) => {
      const reaction = { emoji: { name: '🔒' }, users: { fetch: jest.fn().mockResolvedValue(
        new Map([[t.eric.id, { id: t.eric.id, bot: false }]])) } }
      return {
        id, archived: false, locked: false, parentId: '1536259632455094412',
        fetchStarterMessage: jest.fn().mockResolvedValue({
          reactions: { fetch: jest.fn().mockResolvedValue({ find: (fn: any) => fn(reaction) ? reaction : undefined }) },
        }),
      }
    }
    const first = locked('quest-one'), second = locked('quest-two')
    const forum = {
      threads: {
        fetchActive: jest.fn().mockResolvedValue({ threads: new Map([[first.id, first], [second.id, second]]) }),
        fetchArchived: jest.fn().mockResolvedValue({ threads: Object.assign(new Map(), { last: () => undefined }), hasMore: false }),
      },
    }
    const send = jest.fn().mockResolvedValue({ id: 'sent-notice' })
    const privateChannel = { send }
    const fetch = jest.fn(async (id: string) => id === second.id ? { ...second, isThread: () => true }
      : id === '1536259632455094412' ? forum
      : id === 'private-chan' ? privateChannel : null)
    const client: any = { channels: { fetch } }
    const service = new DiscordCommandsService({
      playerPrivateDiscordChannel: jest.fn(async (id: string) => id === t.eric.id ? 'private-chan' : null),
      listDiscordQuestVotes: jest.fn(async () => [
        { threadId: first.id, userId: t.eric.id, emoji: '🔒' },
        { threadId: second.id, userId: t.eric.id, emoji: '🔒' },
      ]),
    } as never, {} as never)
    const reaction: any = { emoji: { name: '🔒' }, message: { id: second.id, channelId: second.id, client } }

    await service.handleQuestLockAdd(reaction, { id: t.eric.id, bot: false })
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].content).toContain('<@' + t.eric.id + '>')
    expect(send.mock.calls[0][0].content).toContain('maximum')
    expect(send.mock.calls[0][0].allowedMentions).toEqual({ parse: [], users: [t.eric.id] })
    await service.handleQuestLockAdd(reaction, { id: t.eric.id, bot: false })
    expect(send).toHaveBeenCalledTimes(1) // gateway duplicate is deduplicated
    reaction.emoji.name = '👍'
    await service.handleQuestLockAdd(reaction, { id: t.eric.id, bot: false })
    expect(send).toHaveBeenCalledTimes(1)
    reaction.emoji.name = '🔒'
    await service.handleQuestLockAdd(reaction, { id: 'valou', bot: false })
    expect(send).toHaveBeenCalledTimes(1) // valou has no private channel
  })

  it('notifies lock holders on quest completion, skipping players without a private channel', async () => {
    const send = jest.fn().mockResolvedValue({ id: 'private-alert' })
    const service = new DiscordCommandsService({
      playerPrivateDiscordChannel: jest.fn(async (id: string) => id === 'player-1' ? 'linked-private' : null),
    } as never, {} as never)
    const client = { channels: { fetch: jest.fn(async (id: string) => id === 'linked-private' ? { send } : null) } }
    const sent = await (service as any).notifyQuestLockHoldersCompleted(
      client, { name: '👑 Le Roi Kobold' }, [{ id: 'player-1' }, { id: 'valou' }],
    )
    expect(sent).toBe(1)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].content).toContain('👑 Le Roi Kobold')
    expect(send.mock.calls[0][0].content).toContain('terminée')
    expect(send.mock.calls[0][0].allowedMentions).toEqual({ parse: [], users: ['player-1'] })
  })

  it('flags duplicated locks but never duplicated thumbs in a choice recap', async () => {
    const t = questChoiceTest()
    t.questMap.set('a', t.quest('a', 'Quête A', [t.eric.id], [t.guilhem.id]))
    t.questMap.set('b', t.quest('b', 'Quête B', [t.eric.id], [t.guilhem.id]))
    await t.run()
    const text = [t.editReply.mock.calls[0][0].content,
      ...t.followUp.mock.calls.map(call => call[0].content)].join('\\n')
    expect(text).toContain('Plusieurs cadenas')
    expect(text).toContain('Guilhem (2 🔒)')
    expect(text).not.toContain('Éric (2')
    expect(text).toContain('<#a> (réservé par **Guilhem**, intéresse **Éric**)')
  })

  it('coalesces 👍/🔒 additions and removals, ignoring bot reactions and other messages', async () => {
    const t = questChoiceTest()
    const service = t.service
    const reconcile = jest.spyOn(service, 'reconcileQuestRecaps').mockResolvedValue(undefined)
    const channel = { isThread: () => true, parentId: '1536259632455094412' }
    const fetch = t.client.channels.fetch as jest.Mock
    fetch.mockImplementation(async (id: string) => id === 'quest-thread' ? channel : null)
    const reaction: any = { emoji: { name: '👍' }, message: { id: 'quest-thread', channelId: 'quest-thread', client: t.client } }
    jest.useFakeTimers()
    try {
      await service.handleQuestRecapReaction(reaction, { bot: false })
      reaction.emoji.name = '🔒'
      await service.handleQuestRecapReaction(reaction, { bot: false })
      await service.handleQuestRecapReaction(reaction, { bot: true })
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      expect(reconcile).toHaveBeenCalledTimes(1)
      reconcile.mockClear()
      await service.handleQuestRecapReaction(reaction, { bot: false }) // removal uses same handler
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      expect(reconcile).toHaveBeenCalledTimes(1)
      reconcile.mockClear()
      reaction.message.id = 'reply-not-starter'
      await service.handleQuestRecapReaction(reaction, { bot: false })
      jest.advanceTimersByTime(2000)
      expect(reconcile).not.toHaveBeenCalled()
    } finally { jest.useRealTimers() }
  })

  it('finishes a quest with a written report, clears player thumbs and can reopen it', async () => {
    const remove = jest.fn().mockResolvedValue(undefined)
    const users = new Map([
      ['player-1', { id: 'player-1', bot: false }],
      ['bot', { id: 'bot', bot: true }],
    ])
    const thumbs = { emoji: { name: '👍' }, users: { fetch: jest.fn().mockResolvedValue(users), remove } }
    const starter = { reactions: { cache: { find: () => thumbs } }, react: jest.fn().mockResolvedValue(undefined) }
    const thread: any = {
      id: 'quest-1', name: '🏛️ Les ruines', parentId: '1536259632455094412', appliedTags: [],
      archived: false, locked: false,
      isThread: () => true, fetchStarterMessage: jest.fn().mockResolvedValue(starter),
      setLocked: jest.fn(async (locked: boolean) => { thread.locked = locked }),
      setArchived: jest.fn(async (archived: boolean) => { thread.archived = archived }),
      send: jest.fn().mockResolvedValue(undefined),
    }
    const forum = { availableTags: [{ id: 'done', name: 'Terminée' }] }
    const fetch = jest.fn().mockResolvedValue(forum)
    const showModal = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({} as never, {} as never)

    await service.handle({
      commandName: 'terminer-quete', id: 'cmd-1', user: { id: 'player-1' }, channel: thread,
      client: { channels: { fetch } }, showModal, reply: jest.fn(),
    } as never)

    expect(showModal).toHaveBeenCalledTimes(1)
    const modal = showModal.mock.calls[0][0]
    expect(modal.data.title).toBe('Terminer la quête')
    expect(modal.components[0].components[0].data.label).toBe('Compte rendu')
    expect(modal.components[0].components[0].data.max_length).toBe(1500)

    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleModal({
      customId: 'pf2-quest-finish:cmd-1',
      user: { id: 'player-1' },
      channelId: 'quest-1',
      channel: thread,
      client: { channels: { fetch } },
      fields: { getTextInputValue: jest.fn().mockReturnValue('Le tueur était le tavernier.') },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
      reply: jest.fn(),
    } as never)

    expect(thread.setLocked).toHaveBeenCalledWith(true, expect.stringContaining('/terminer-quete'))
    expect(thread.setArchived).toHaveBeenCalledWith(true, expect.stringContaining('/terminer-quete'))
    expect(remove).toHaveBeenCalledWith('player-1')
    expect(remove).not.toHaveBeenCalledWith('bot')
    expect(thread.send).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('**Compte rendu :**\nLe tueur était le tavernier.'),
    }))
    expect(thread.send).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('/relancer-quete'),
    }))
    expect(editReply).toHaveBeenCalledWith({ content: 'Quête terminée : discussion fermée, sans tag.' })

    const reopenReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'relancer-quete', user: { id: 'player-1' }, channel: thread,
      client: { channels: { fetch } },
      deferReply: jest.fn().mockResolvedValue(undefined), editReply: reopenReply,
    } as never)
    expect(thread.setLocked).toHaveBeenLastCalledWith(false, expect.stringContaining('/relancer-quete'))
    expect(thread.setArchived).toHaveBeenLastCalledWith(false, expect.stringContaining('/relancer-quete'))
    expect(starter.react).toHaveBeenCalledWith('👍')
    expect(reopenReply).toHaveBeenCalledWith({ content: 'Quête relancée.' })
  })

  it('registers /random-perso and returns an admin-only random PF2 concept', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const random = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.009)
    const service = new DiscordCommandsService({} as never, {} as never)

    expect(service.definitions().map(command => command.name)).toContain('random-perso')
    await expect(service.handle({
      commandName: 'random-perso',
      reply,
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
    } as never)).resolves.toBe(true)

    expect(reply).toHaveBeenCalledWith({
      content: ['🎲 **Personnage aléatoire**', 'Ascendance : **Androïde**', 'Classe : **Alchimiste**', 'Genre : **Non binaire**'].join('\n'),
      ephemeral: true,
    })
    random.mockRestore()
  })

  it('refuses /random-perso to non-admin users', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({} as never, {} as never)
    await expect(service.handle({
      commandName: 'random-perso',
      reply,
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
    } as never)).resolves.toBe(true)
    expect(reply).toHaveBeenCalledWith({ content: 'Cette commande est réservée aux administrateurs du serveur.', ephemeral: true })
  })

  it('selects Discord users, draws the requested number, and previews before publishing', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)

    await expect(service.handle({
      commandName: 'tirage-sort-joueur',
      id: 'draw-command',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      reply,
    } as never)).resolves.toBe(true)

    const commandPayload = reply.mock.calls[0][0]
    expect(commandPayload.ephemeral).toBe(true)
    expect(commandPayload.components).toHaveLength(1)
    const selectJson = commandPayload.components[0].toJSON().components[0]
    expect(selectJson.custom_id).toBe('pf2-player-draw:players:draw-command')
    expect(selectJson.min_values).toBe(1)
    expect(selectJson.max_values).toBe(25)

    const showModal = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleUserSelect({
      customId: 'pf2-player-draw:players:draw-command',
      id: 'user-select',
      user: { id: 'admin' },
      values: ['134346709487714304', '344733584441081857', '308566148931387393'],
      members: new Map(),
      users: new Map([
        ['tom', { username: 'Tom', globalName: null }],
        ['arcady', { username: 'Arcady', globalName: null }],
        ['juby', { username: 'Juby', globalName: null }],
      ]),
      showModal,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)

    const modal = showModal.mock.calls[0][0].toJSON()
    expect(modal.custom_id).toBe('pf2-player-draw:count:user-select')
    expect(modal.components[0].components[0].label).toBe('Nombre à tirer (1-3)')

    const random = jest.spyOn(Math, 'random').mockReturnValue(0)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleModal({
      customId: 'pf2-player-draw:count:user-select',
      id: 'draw-modal',
      user: { id: 'admin' },
      fields: { getTextInputValue: jest.fn().mockReturnValue('2') },
      deferReply,
      editReply,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)
    random.mockRestore()

    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const preview = editReply.mock.calls[0][0]
    expect(preview.content).toBe([
      '🎲 **Tirage au sort joueur**',
      'Parmi : <@134346709487714304>, <@344733584441081857>, <@308566148931387393>',
      '',
      '**Liste des tirages au sort :**',
      '- <@134346709487714304>',
      '- <@344733584441081857>',
    ].join('\n'))
    expect(preview.components[0].toJSON().components[0].label).toBe('Publier')
  })

  it('refuses /tirage-sort-joueur to non-admin users', async () => {
    const reply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({} as never, {} as never)

    await expect(service.handle({
      commandName: 'tirage-sort-joueur',
      id: 'draw-command',
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
      reply,
    } as never)).resolves.toBe(true)

    expect(reply).toHaveBeenCalledWith({
      content: 'Cette commande est réservée aux administrateurs du serveur.',
      ephemeral: true,
    })
  })

  it('previews /recap-pjs by player and character, without zero-session characters', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, date: '2026-09-01', published: true, participants: ['Actor.eos', 'Actor.pepin'] },
        { sessionNumber: 2, date: '2026-09-08', published: true, participants: ['Actor.eos', 'Actor.yaz'] },
        { sessionNumber: 3, date: '2026-09-15', published: false, participants: ['Actor.nora'] },
      ]),
      saveFoundryActorCache: jest.fn(), readFoundryActorCache: jest.fn(),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map()), saveFoundryPlayerLevels: jest.fn().mockResolvedValue(undefined),
    }
    const service = new DiscordCommandsService(persistence as never, {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
        { uuid: 'Actor.nora', name: 'Nora (Tom)' },
      ]),
      listPlayers: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)', level: 3, foundryLevel: 2, xp: 0, xpc: 900 },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
        { uuid: 'Actor.nora', name: 'Nora (Tom)', level: 1, foundryLevel: 1, xp: 0, xpc: 0 },
      ]),
    } as never)

    const channel = recapThread(['688742453276180560', '399621722158137346'])
    await expect(service.handle({ commandName: 'recap-pjs', channel, deferReply, editReply, user: { id: '688742453276180560' }, id: 'interaction-1' } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const payload = editReply.mock.calls[0][0]
    const result = payload.content
    expect(payload.components).toHaveLength(1)
    expect(payload.components[0].toJSON().components[0].label).toBe('Publier')
    expect(result).toContain('**David — 2 séances**')
    expect(result).toContain('dernière séance : 08/09/2026')
    expect(result).toContain('Éos — niveau réel 2 · théorique 3 — ⚠️ 1 niveau à faire ! — 2 séances')
    expect(result).toContain('Pépin — niveau réel 2 · théorique 2 — 1 séance')
    expect(result).not.toContain('Nora')
    expect(result).not.toContain('Yaz Lorok')
    expect(result).not.toContain('Augustin')
    expect(result).not.toMatch(/<@!?\d+>/)
    expect(channel.members.fetch).toHaveBeenCalledTimes(1)
    expect(channel.messages.fetch).toHaveBeenCalledWith({ limit: 100 })
    expect(result).not.toContain('Séances communes')

    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-preview:publish:interaction-1',
      user: { id: '688742453276180560' }, update, followUp,
    } as never)
    expect(followUp).toHaveBeenCalledWith(expect.objectContaining({
      content: result, ephemeral: false, allowedMentions: { parse: [] },
    }))
  })

  it('falls back to the raw Foundry actor level when progression lookup fails', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, date: '2026-10-01', published: true, participants: ['Actor.pepin'] },
      ]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      saveFoundryActorCache: jest.fn(),
      readFoundryActorCache: jest.fn(),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map()), saveFoundryPlayerLevels: jest.fn().mockResolvedValue(undefined),
    } as never, {
      listActors: jest.fn().mockResolvedValue([{ uuid: 'Actor.pepin', name: 'Pépin (Eric)' }]),
      listPlayers: jest.fn().mockRejectedValue(new Error('XPC indisponible')),
      getNpcSummary: jest.fn().mockResolvedValue({ uuid: 'Actor.pepin', name: 'Pépin (Eric)', type: 'character', level: 4, hp: 50, img: null }),
    } as never)

    await service.handle({ commandName: 'recap-pjs', channel: recapThread(['399621722158137346']), deferReply, editReply, user: { id: '399621722158137346' }, id: 'interaction-level-fallback' } as never)
    const result = editReply.mock.calls[0][0].content as string
    expect(result).toContain('Pépin — niveau réel 4 · théorique ? — 1 séance')
    expect(result).toContain('⚠️ Certains niveaux ne sont pas disponibles')
    expect(result).not.toContain('niveau réel ?')
    expect(result).toContain('dernière séance : 01/10/2026')
  })

  it('shows saved real and theoretical levels with Foundry offline, including level-ups due', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const cached = new Map([
      ['Actor.pepin', { foundryLevel: 4, theoreticalLevel: 5 }],
      ['Actor.eryn', { foundryLevel: 6, theoreticalLevel: 6 }],
    ])
    const getNpcSummary = jest.fn()
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, date: '2026-10-17', published: true, participants: ['Actor.pepin', 'Actor.eryn'] },
      ]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.eryn', name: 'Eryn (Tom)' },
      ]),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(cached),
      saveFoundryActorCache: jest.fn(), saveFoundryPlayerLevels: jest.fn(),
    } as never, {
      listActors: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      listPlayers: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      getNpcSummary,
    } as never)

    await service.handle({ commandName: 'recap-pjs', channel: recapThread(['399621722158137346', '134346709487714304']), deferReply, editReply, user: { id: '399621722158137346' }, id: 'cached-levels' } as never)
    const result = editReply.mock.calls[0][0].content as string
    expect(result).toContain('Pépin — niveau réel 4 · théorique 5 — ⚠️ 1 niveau à faire !')
    expect(result).toContain('Eryn — niveau réel 6 · théorique 6')
    expect(result).not.toContain('niveau réel ?')
    expect(getNpcSummary).not.toHaveBeenCalled()
  })

  it('uses the bot announcement roster for Séance 05/11 even if Sameh never joined or wrote in the thread', async () => {
    const editReply = jest.fn().mockResolvedValue(undefined)
    const ids = {
      julien: '308566148931387393', sameh: '688791427253403679',
      eric: '399621722158137346', marinella: '404629333534179338',
      tom: '134346709487714304',
    }
    const members = { fetch: jest.fn().mockResolvedValue(new Map([
      [ids.julien, { id: ids.julien }],
      [ids.eric, { id: ids.eric }],
      [ids.marinella, { id: ids.marinella }],
    ])) }
    const messages = { fetch: jest.fn().mockResolvedValue(new Map([
      ['m1', { author: { id: ids.tom, bot: false } }],
      ['m2', { author: { id: ids.eric, bot: false } }],
    ])) }
    const starter = {
      author: { id: 'bot-1' },
      content: [
        '**Séance du Jeudi 5 novembre**',
        `**Groupe proposé :** <@${ids.julien}>, <@${ids.sameh}>, <@${ids.eric}>, <@${ids.marinella}>`,
        '[PF2-SESSION:2026-11-05]',
      ].join('\n'),
    }
    const fetchStarterMessage = jest.fn().mockResolvedValue(starter)
    const channel = {
      isThread: () => true, isTextBased: () => true,
      name: 'Séance 05/11', parentId: 'parent-1',
      members, messages, fetchStarterMessage,
    }
    const client = {
      user: { id: 'bot-1' },
      channels: { fetch: jest.fn().mockResolvedValue({ name: 'objectif-prochaine-mission' }) },
    }
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, date: '2026-10-17', published: true,
          participants: ['Actor.jilkra', 'Actor.neyla', 'Actor.pepin', 'Actor.sashka', 'Actor.eryn'] },
      ]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.jilkra', name: 'Jilkra (Julien)' },
        { uuid: 'Actor.neyla', name: 'Neyla (Sameh)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.sashka', name: 'Sashka (Marinella)' },
        { uuid: 'Actor.eryn', name: 'Eryn (Tom)' },
      ]),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map([
        ['Actor.jilkra', { foundryLevel: 3, theoreticalLevel: 3 }],
        ['Actor.neyla', { foundryLevel: 4, theoreticalLevel: 4 }],
        ['Actor.pepin', { foundryLevel: 2, theoreticalLevel: 2 }],
        ['Actor.sashka', { foundryLevel: 3, theoreticalLevel: 3 }],
        ['Actor.eryn', { foundryLevel: 4, theoreticalLevel: 4 }],
      ])),
    } as never, {
      listActors: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      listPlayers: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
    } as never)

    await service.handle({
      commandName: 'recap-pjs', client, channel,
      user: { id: '492387405760823297' }, // The GM is not in the proposed group
      id: 'november-session-recap',
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
    } as never)
    const payload = editReply.mock.calls[0][0]
    const content = payload.content as string
    expect(content).toContain('Jilkra — niveau réel 3')
    expect(content).toContain('Neyla — niveau réel 4')
    expect(content).toContain('Pépin — niveau réel 2')
    expect(content).toContain('Sashka — niveau réel 3')
    expect(content).not.toContain('Eryn')
    expect(content).not.toContain('Tom')
    expect(content).not.toMatch(/<@!?\d+>/)
    expect(payload.components).toHaveLength(1)
    expect(client.channels.fetch).toHaveBeenCalledWith('parent-1')
    expect(fetchStarterMessage).toHaveBeenCalledWith({ force: true })
    expect(members.fetch).not.toHaveBeenCalled()
    expect(messages.fetch).not.toHaveBeenCalled()
  })

  it('supports a manually extended group of five on an official session thread', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const ids = ['308566148931387393', '688791427253403679', '399621722158137346', '404629333534179338', '134346709487714304']
    const channel = {
      isThread: () => true, name: 'Séance 05/11', parentId: 'parent-1',
      fetchStarterMessage: jest.fn().mockResolvedValue({
        author: { id: 'bot-1' },
        content: `**Groupe proposé :** ${ids.map(id => `<@${id}>`).join(', ')}\n[PF2-SESSION:2026-11-05]`,
      }),
    }
    const result = await (service as unknown as { recapPlannedSessionUserIds: (interaction: unknown) => Promise<Set<string> | null> })
      .recapPlannedSessionUserIds({
        channel,
        client: { user: { id: 'bot-1' }, channels: { fetch: jest.fn().mockResolvedValue({ name: 'objectif-prochaine-mission' }) } },
      })
    expect(result).toEqual(new Set(ids))
  })

  it('filters a text-channel recap to recent authors and the requester, not all viewers', async () => {
    const editReply = jest.fn().mockResolvedValue(undefined)
    const channel = {
      isThread: () => false, isTextBased: () => true,
      permissionsFor: jest.fn().mockReturnValue({ has: () => true }),
      messages: { fetch: jest.fn().mockResolvedValue(new Map([
        ['message-1', { author: { id: '399621722158137346', bot: false } }],
        ['message-2', { author: { id: '000000000000000001', bot: true } }],
      ])) },
    }
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([{
        sessionNumber: 1, published: true,
        participants: ['Actor.eos', 'Actor.pepin', 'Actor.eryn'],
      }]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.eryn', name: 'Eryn (Tom)' },
      ]),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map([
        ['Actor.eos', { foundryLevel: 4, theoreticalLevel: 4 }],
        ['Actor.pepin', { foundryLevel: 4, theoreticalLevel: 4 }],
        ['Actor.eryn', { foundryLevel: 4, theoreticalLevel: 4 }],
      ])),
    } as never, {
      listActors: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      listPlayers: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
    } as never)
    await service.handle({
      commandName: 'recap-pjs', user: { id: '688742453276180560' },
      id: 'scoped-text-channel', channel,
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    const content = editReply.mock.calls[0][0].content as string
    expect(content).toContain('Éos — niveau réel 4')
    expect(content).toContain('Pépin — niveau réel 4')
    expect(content).not.toContain('Eryn')
    expect(content).not.toContain('Tom')
    expect(content).not.toMatch(/<@!?\d+>/)
    expect(channel.permissionsFor).not.toHaveBeenCalled()
  })

  it('keeps /recap-pjs limited to the requester when discussion members are unreadable', async () => {
    const editReply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([{
        sessionNumber: 1, published: true, participants: ['Actor.eos', 'Actor.pepin'],
      }]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      ]),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      listActors: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      listPlayers: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
    } as never)
    const channel = {
      isThread: () => true, isTextBased: () => true,
      members: { fetch: jest.fn().mockRejectedValue(new Error('missing permission')) },
      messages: { fetch: jest.fn().mockRejectedValue(new Error('missing permission')) },
    }
    await service.handle({
      commandName: 'recap-pjs', user: { id: '688742453276180560' },
      id: 'scoped-fallback', channel,
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    const content = editReply.mock.calls[0][0].content as string
    expect(content).toContain('Éos')
    expect(content).not.toContain('Pépin')
    expect(content).not.toMatch(/<@!?\d+>/)
  })

  it('returns no publish button when no player with played sessions belongs to the discussion', async () => {
    const editReply = jest.fn().mockResolvedValue(undefined)
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([{
        sessionNumber: 1, published: true, participants: ['Actor.pepin'],
      }]),
      listPlayerIdentities: jest.fn().mockResolvedValue([]),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      ]),
      readFoundryPlayerLevels: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      listActors: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
      listPlayers: jest.fn().mockRejectedValue(new Error('No Foundry world online')),
    } as never)
    await service.handle({
      commandName: 'recap-pjs', user: { id: '688742453276180560' },
      id: 'no-matching-players', channel: recapThread([]),
      deferReply: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('Aucun joueur de cette discussion')
    expect(response.components).toBeUndefined()
  })

  it('never invents theoretical levels when no Foundry world or cached level is available', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const levels = new Map()
    expect((service as any).levelLabel('Actor.unknown', levels)).toBe('niveau réel ? · théorique ?')
    levels.set('Actor.test', { foundryLevel: 7, theoreticalLevel: null })
    expect((service as any).levelLabel('Actor.test', levels)).toBe('niveau réel 7 · théorique ?')
    levels.set('Actor.over', { foundryLevel: 8, theoreticalLevel: 6 })
    expect((service as any).levelLabel('Actor.over', levels)).toContain('niveau réel supérieur au théorique')
  })

  it('builds /recap-seance from local data when Foundry is offline, without levels', async () => {
    const editReply = jest.fn().mockResolvedValue(undefined)
    const listActors = jest.fn().mockRejectedValue(new Error('relay offline'))
    const listPlayers = jest.fn().mockRejectedValue(new Error('relay offline'))
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 4, published: false, participants: ['Actor.pepin'], inGameStartDate: '4720-03-22', title: '' },
      ]),
      readFoundryActorCache: jest.fn().mockResolvedValue([{ uuid: 'Actor.pepin', name: 'Pépin (Eric)' }]),
      saveFoundryActorCache: jest.fn(),
    } as never, { listActors, listPlayers } as never)

    await service.handle({
      commandName: 'recap-seance',
      id: 'recap-session-offline',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: { getString: jest.fn().mockReturnValue('4') },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
    } as never)

    const content = editReply.mock.calls.at(-1)?.[0].content as string
    expect(content).toContain('Séance prévue — Résumé n°4')
    expect(content).toContain('**Pépin** : **0 lancer à faire**')
    expect(content).not.toContain('niveau')
    expect(listActors).not.toHaveBeenCalled()
    expect(listPlayers).not.toHaveBeenCalled()
  })

  it('rebuilds a planned-session message with historical progression rolls', async () => {
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const sessions = [
      { sessionNumber: 1, published: true, participants: ['Actor.eos'], inGameStartDate: '4720-03-01', inGameEndDate: '4720-03-01', title: '' },
      { sessionNumber: 2, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-08', inGameEndDate: '4720-03-08', title: '' },
      { sessionNumber: 3, published: false, participants: ['Actor.eos', 'Actor.pepin'], inGameStartDate: '4720-03-15', inGameEndDate: '', title: '' },
    ]
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue(sessions),
      saveFoundryActorCache: jest.fn(),
      readFoundryActorCache: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      ]),
    } as never, {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
      ]),
      listPlayers: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eos', name: 'Éos (David)', level: 3, foundryLevel: 2, xp: 0, xpc: 900 },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)', level: 2, foundryLevel: 2, xp: 0, xpc: 300 },
      ]),
    } as never)

    await expect(service.handle({
      commandName: 'recap-seance', deferReply, editReply, user: { id: 'admin' }, id: 'interaction-2',
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: { getString: jest.fn().mockReturnValue('3') },
    } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const preview = editReply.mock.calls[0][0]
    const result = preview.content
    expect(preview.components[0].toJSON().components[0].label).toBe('Publier')
    expect(result).toContain('Séance prévue — Résumé n°3')
    expect(result).toContain('Éos** : **1 lancer à faire**')
    expect(result).toContain('Pépin** : **0 lancer à faire**')
    expect(result).not.toContain('niveau')
    expect(result).toContain('15 Pharast 4720 AR')
  })

  it('/debut-seance can create its draft with Foundry offline and never adds levels to the announcement', async () => {
    const listActors = jest.fn().mockRejectedValue(new Error('relay offline'))
    const listPlayers = jest.fn().mockRejectedValue(new Error('relay offline'))
    const createSession = jest.fn().mockResolvedValue({ id: 'session-12', sessionNumber: 12 })
    const service = new DiscordCommandsService({
      listSessions: jest.fn().mockResolvedValue([]),
      createSession,
      rememberSessionDiscordChannel: jest.fn().mockResolvedValue(undefined),
    } as never, { listActors, listPlayers } as never)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await expect((service as unknown as {
      finishGameModal: (
        interaction: unknown,
        pending: { selected: Array<{ uuid: string; name: string; userId: string }> },
        date: string,
        plan: { progressionRolls: string[]; rollCounts: Map<string, number> },
      ) => Promise<void>
    }).finishGameModal(
      { editReply, channelId: 'test-channel', guildId: 'test-guild' } as never,
      { selected: [{ uuid: 'Actor.pepin', name: 'Pépin (Eric)', userId: '399621722158137346' }] },
      '4720-04-08',
      { progressionRolls: ['**Jets de progression** — 1 jet correspond à 7 jours d’activité.'], rollCounts: new Map([['Actor.pepin', 1]]) },
    )).resolves.toBeUndefined()

    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ participants: ['Actor.pepin'], published: false }))
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Brouillon créé : résumé n°12') }))
    expect(listActors).not.toHaveBeenCalled()
    expect(listPlayers).not.toHaveBeenCalled()
    const pending = (service as unknown as { pendingAnnouncements: Map<string, { content: string }> }).pendingAnnouncements
    const announcement = [...pending.values()][0]?.content ?? ''
    expect(announcement).toContain('**Pépin** : **1 lancer à faire**')
    expect(announcement).not.toContain('niveau')
  })

  it('/fin-seance offers a private web form link without applying XP or consulting Foundry', async () => {
    const foundry = { listActors: jest.fn(), listPlayers: jest.fn(), awardSessionCoins: jest.fn() }
    const persistence = {
      activeSessionForDiscordChannel: jest.fn().mockResolvedValue({ id: 'session-12', sessionNumber: 12 }),
      listSessions: jest.fn().mockResolvedValue([{ id: 'session-12', sessionNumber: 12 }]),
      updateSession: jest.fn(), closeSessionDiscordChannel: jest.fn(),
    }
    const reply = jest.fn().mockResolvedValue(undefined)
    const reputations = { list: jest.fn().mockResolvedValue([{ id: 1, name: 'Absalom', entries: [{ id: 11, name: 'Habitants', score: 0 }] }]) }
    const service = new DiscordCommandsService(persistence as never, foundry as never, undefined, undefined, undefined, undefined, undefined, undefined, reputations as never)
    await service.handle({
      commandName: 'fin-seance', id: 'cmd-12', user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channelId: 'session-channel', guildId: 'guild', channel: { name: 'discussion' }, reply,
    } as never)
    expect(reply).toHaveBeenCalledTimes(1)
    const result = reply.mock.calls[0][0]
    expect(result.ephemeral).toBe(true)
    const button = result.components[0].components[0].toJSON()
    expect(button.style).toBe(5)
    expect(button.url).toContain('/apil7r/pf2-mj/discord/fin-seance/')
    expect(persistence.updateSession).not.toHaveBeenCalled()
    expect(foundry.listActors).not.toHaveBeenCalled()
    expect(foundry.listPlayers).not.toHaveBeenCalled()
    expect(foundry.awardSessionCoins).not.toHaveBeenCalled()
  })

  it('turns missed published sessions into seven-day progression rolls', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.eos'], inGameStartDate: '4720-03-01', inGameEndDate: '4720-03-01' },
        { sessionNumber: 2, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-08', inGameEndDate: '4720-03-08' },
        { sessionNumber: 3, published: true, participants: ['Actor.pepin'], inGameStartDate: '4720-03-15', inGameEndDate: '4720-03-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as { plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ progressionRolls: string[] }> }).plan([
      { uuid: 'Actor.eos', name: 'Éos (David)' }, { uuid: 'Actor.pepin', name: 'Pépin (Eric)' }
    ])
    expect(plan.progressionRolls).toEqual(expect.arrayContaining([
      expect.stringContaining('Éos (David) : **2 jets de progression** (14 jours).'),
      expect.stringContaining('Pépin (Eric) : **0 jet de progression** (0 jour).'),
    ]))
  })

  it('offers the group availability and the day after the latest global mission', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.hero'], inGameStartDate: '4720-03-20', inGameEndDate: '4720-03-31' },
        { sessionNumber: 2, published: true, participants: ['Actor.other'], inGameStartDate: '4720-04-01', inGameEndDate: '4720-04-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as {
      plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ earliest: string; current: string }>
      addDays: (date: string, days: number) => string
    }).plan([{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }])

    expect(plan.earliest).toBe('4720-04-01')
    expect(plan.current).toBe('4720-04-16')
    expect((service as unknown as { addDays: (date: string, days: number) => string }).addDays(plan.earliest, 5)).toBe('4720-04-06')
    expect((service as unknown as { addDays: (date: string, days: number) => string }).addDays(plan.current, 5)).toBe('4720-04-21')
  })

  it('does not let a participant without session history delay a parallel mission', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, participants: ['Actor.hero'], inGameStartDate: '4720-03-20', inGameEndDate: '4720-03-31' },
        { sessionNumber: 2, published: true, participants: ['Actor.other'], inGameStartDate: '4720-04-01', inGameEndDate: '4720-04-15' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never)
    const plan = await (service as unknown as {
      plan: (actors: Array<{ uuid: string; name: string }>) => Promise<{ earliest: string; current: string }>
    }).plan([
      { uuid: 'Actor.hero', name: 'Héros (Joueur)' },
      { uuid: 'Actor.new', name: 'Nouveau (Joueur)' },
    ])

    expect(plan.earliest).toBe('4720-04-01')
    expect(plan.current).toBe('4720-04-16')
  })

  it('uses the previous real-world day before 05:00 Europe/Paris for finish-game', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const realDate = (value: string) => (service as unknown as { realDate: (date: Date) => string }).realDate(new Date(value))
    expect(realDate('2026-09-11T22:00:00.000Z')).toBe('2026-09-11') // 00:00 Paris : veille
    expect(realDate('2026-09-12T02:59:00.000Z')).toBe('2026-09-11') // 04:59 Paris
    expect(realDate('2026-09-12T03:00:00.000Z')).toBe('2026-09-12') // 05:00 Paris
    expect(realDate('2026-09-12T21:59:00.000Z')).toBe('2026-09-12') // 23:59 Paris
  })

  it('offers Voir la fiche + Publier after /resume save and publishes from the button', async () => {
    const session = {
      id: 'session-42',
      sessionNumber: 42,
      date: '2026-09-15',
      inGameStartDate: '',
      inGameEndDate: '',
      title: 'Test',
      participants: ['Actor.hero'],
      longSummaryAuthor: null,
      shortSummaryAuthor: 'Actor.hero',
      sessionXp: 100,
      longSummaryXp: 0,
      shortSummaryXp: 30,
      shortSummary: 'Avant',
      discordMessageId: null,
      published: false,
      content: [],
      createdAt: '',
      updatedAt: '',
    }
    const persistence = {
      getSession: jest.fn().mockResolvedValue(session),
      listSessions: jest.fn().mockResolvedValue([session]),
      updateSession: jest.fn().mockImplementation(async (_id: string, input: Record<string, unknown>) => ({ ...session, ...input })),
      saveSessionDiscordMessageId: jest.fn(),
    }
    const discord = {
      resumeMessageLength: jest.fn().mockResolvedValue(200),
      synchronizeResumeShortSummary: jest.fn(),
      setResumePublication: jest.fn().mockResolvedValue({
        resume: { ...session, published: true },
        discord: { status: 'created', messageId: 'message-42' },
      }),
    }
    const mediaWiki = {
      enabled: () => true,
      sessionsPageUrl: (number: number) => `https://wiki.l7r.fr/index.php?title=Seances#pf2-session-${number}`,
    }
    const service = new DiscordCommandsService(
      persistence as never,
      {} as never,
      undefined,
      mediaWiki as never,
      discord as never,
    )
    const saveEditReply = jest.fn().mockResolvedValue(undefined)

    await (service as unknown as {
      saveShortSummary: (
        interaction: unknown,
        pending: unknown,
        author: string,
        values: { title: string; date: string; summary: string },
      ) => Promise<boolean>
    }).saveShortSummary(
      { user: { id: 'user-1' }, editReply: saveEditReply },
      {
        sessionId: 'session-42',
        sessionNumber: 42,
        requesterId: 'user-1',
        selectedAuthor: 'Actor.hero',
        allowedAuthors: [{ uuid: 'Actor.hero', name: 'Héros (Joueur)' }],
      },
      'Actor.hero',
      { title: 'Test', date: '2026-09-15', summary: 'Résumé' },
    )

    const response = saveEditReply.mock.calls[0][0]
    const row = response.components[0].toJSON()
    expect(row.components.map((button: { label?: string }) => button.label)).toEqual(['Voir la fiche', 'Publier'])
    const publishButton = row.components.find((button: { label?: string }) => button.label === 'Publier') as { custom_id: string }

    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: publishButton.custom_id,
      user: { id: 'user-1' },
      deferReply,
      editReply,
      reply: jest.fn(),
    } as never)

    expect(discord.setResumePublication).toHaveBeenCalledWith('session-42', true)
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('publiée') }))
  })


  it('restricts session administration and /personnage to admins', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    for (const commandName of ['debut-seance', 'recap-seance', 'fin-seance', 'personnage']) {
      const reply = jest.fn().mockResolvedValue(undefined)
      await service.handle({
        commandName,
        reply,
        user: { id: 'player' },
        memberPermissions: { has: jest.fn().mockReturnValue(false) },
        options: {
          getString: jest.fn(),
          getInteger: jest.fn(),
          getAttachment: jest.fn(),
          getBoolean: jest.fn(),
        },
      } as never)
      expect(reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('réservée aux administrateurs'),
        ephemeral: true,
      }))
    }
  })

  it('marks admin commands with Discord Manage Server permissions', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions()
    for (const name of [
      'random-perso', 'tirage-sort-joueur', 'help-admin', 'recap-seance', 'journaux', 'debut-seance', 'fin-seance',
      'personnage', 'faction', 'associer-faction', 'wiki-admin', 'proposer-date-seance', 'modifier-date-seance', 'relancer-date-seance', 'analyse-date-seance', 'valider-date-seance', 'modifier-groupe-seance',
    ]) {
      const command = definitions.find(item => item.name === name)
      expect(command?.default_member_permissions).toBeDefined()
    }
    for (const name of ['help', 'choix-quete', 'recap-pjs', 'afficher-personnage', 'afficher-faction', 'nouvelle-faction', 'rechercher', 'wiki']) {
      const command = definitions.find(item => item.name === name)
      expect(command?.default_member_permissions ?? null).toBeNull()
    }
  })

  it('shows a published character privately and offers sharing with its portrait', async () => {
    const playerCodex = {
      character: jest.fn().mockResolvedValue({
        displayName: 'Sheila Heidmarch',
        shortDescription: 'Responsable de la Loge de Magnimar.',
        wikiPageTitle: 'Personnage:Sheila Heidmarch',
        wikiPortraitFilename: 'Sheila.webp',
        published: true,
      }),
      characterCandidate: jest.fn().mockResolvedValue({ id: 'sheila', name: 'Sheila Heidmarch', portrait: null }),
    }
    const mediaWiki = {
      pageUrl: jest.fn().mockReturnValue('https://wiki.example/Sheila'),
      fileUrl: jest.fn().mockReturnValue('https://wiki.example/Special:Redirect/file/Sheila.webp'),
    }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'afficher-personnage',
      id: 'display-character-1',
      user: { id: 'player' },
      deferReply,
      editReply,
      options: { getString: jest.fn().mockReturnValue('sheila') },
    } as never)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('**Sheila Heidmarch**')
    expect(response.content).toContain('https://wiki.example/Sheila')
    expect(response.files).toEqual(['https://wiki.example/Special:Redirect/file/Sheila.webp'])
    expect(response.components[0].toJSON().components[0].label).toBe('Partager')
  })

  it('searches published characters and factions with one public command', async () => {
    const playerCodex = {
      profileCandidates: jest.fn().mockResolvedValue([{ id: 'sheila', name: 'Sheila Heidmarch', isPlayer: false }]),
      playerFactionCandidates: jest.fn().mockResolvedValue([{ id: 'watch', name: 'Veilleurs', path: 'Veilleurs' }]),
      character: jest.fn().mockResolvedValue({
        displayName: 'Sheila Heidmarch',
        shortDescription: 'Responsable de la Loge de Magnimar.',
        wikiPageTitle: 'Personnage:Sheila Heidmarch',
        wikiPortraitFilename: null,
        published: true,
      }),
      characterCandidate: jest.fn().mockResolvedValue({ id: 'sheila', name: 'Sheila Heidmarch', portrait: null }),
      playerFaction: jest.fn().mockResolvedValue({
        id: 'watch', name: 'Veilleurs', description: 'Une faction connue.', parentFactionId: null,
        wikiPageTitle: 'Faction:Veilleurs', published: true,
      }),
    }
    const mediaWiki = {
      pageUrl: jest.fn((title: string) => 'https://wiki.example/' + encodeURIComponent(title)),
      fileUrl: jest.fn(),
    }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)

    const respond = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleAutocomplete({
      commandName: 'rechercher',
      options: { getFocused: jest.fn().mockReturnValue('veil') },
      respond,
    } as never)).resolves.toBe(true)
    expect(respond.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Faction — Veilleurs', value: 'faction:watch' }),
    ]))

    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handle({
      commandName: 'rechercher',
      id: 'search-one',
      user: { id: 'player' },
      deferReply,
      editReply,
      options: { getString: jest.fn().mockReturnValue('personnage:sheila') },
    } as never)).resolves.toBe(true)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(editReply.mock.calls[0][0].content).toContain('**Sheila Heidmarch**')
    expect(editReply.mock.calls[0][0].components[0].toJSON().components[0].label).toBe('Partager')
  })
  it('shows only a published faction privately and offers sharing', async () => {
    const playerCodex = {
      playerFaction: jest.fn().mockResolvedValue({
        id: 'watch', name: 'Veilleurs', description: 'Une faction connue.', parentFactionId: null,
        wikiPageTitle: 'Faction:Veilleurs', published: true,
      }),
    }
    const mediaWiki = { pageUrl: jest.fn().mockReturnValue('https://wiki.example/Veilleurs') }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'afficher-faction',
      id: 'display-faction-1',
      user: { id: 'player' },
      deferReply,
      editReply,
      options: { getString: jest.fn().mockReturnValue('watch') },
    } as never)
    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('**Veilleurs**')
    expect(response.components[0].toJSON().components[0].label).toBe('Partager')
  })


  it('lets a player create and publish an independent player faction', async () => {
    const playerCodex = {
      createPlayerFaction: jest.fn().mockResolvedValue({
        id: 'player-faction-new',
        name: 'Les Amis du Port',
        description: 'Une faction connue des joueurs.',
        parentFactionId: null,
        wikiPageTitle: 'Faction:Les Amis du Port',
      }),
      markPlayerFactionPublished: jest.fn().mockResolvedValue(undefined),
    }
    const mediaWiki = { pageUrl: jest.fn().mockReturnValue('https://wiki.example/Faction:Les_Amis_du_Port') }
    const discord = { publishFaction: jest.fn().mockResolvedValue({ status: 'sent' }) }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never, discord as never)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await expect(service.handle({
      commandName: 'nouvelle-faction',
      user: { id: 'player' },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
      options: {
        getString: jest.fn((name: string) => name === 'nom' ? 'Les Amis du Port' : name === 'description' ? 'Une faction connue des joueurs.' : null),
      },
    } as never)).resolves.toBe(true)

    expect(playerCodex.createPlayerFaction).toHaveBeenCalledWith({
      name: 'Les Amis du Port',
      description: 'Une faction connue des joueurs.',
      parentFactionId: null,
      published: false,
    })
    expect(discord.publishFaction).toHaveBeenCalled()
    expect(playerCodex.markPlayerFactionPublished).toHaveBeenCalledWith('player-faction-new')
    expect(editReply.mock.calls.at(-1)?.[0].content).toContain('Faction créée')
  })

  it('previews then confirms an admin association without changing player-facing faction data', async () => {
    const playerCodex = {
      playerFaction: jest.fn().mockResolvedValue({ name: 'Nom joueur', sourceMjFactionId: null, wikiPageTitle: 'Faction:Nom joueur' }),
      factionCandidates: jest.fn().mockResolvedValue([{ id: 'mj-secret', name: 'Nom MJ', path: 'Nom MJ', associatedPlayerFactionId: null }]),
      associateFaction: jest.fn().mockResolvedValue({ name: 'Nom joueur', wikiPageTitle: 'Faction:Nom joueur' }),
    }
    const mediaWiki = { pageUrl: jest.fn().mockReturnValue('https://wiki.example/Faction:Nom_joueur') }
    const service = new DiscordCommandsService({} as never, {} as never, playerCodex as never, mediaWiki as never)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await expect(service.handle({
      commandName: 'associer-faction',
      id: 'associate-command',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
      options: { getString: jest.fn((name: string) => name === 'faction_joueur' ? 'player-known' : 'mj-secret') },
    } as never)).resolves.toBe(true)

    const preview = editReply.mock.calls[0][0]
    expect(preview.content).toContain('ne seront pas modifiés')
    const customId = preview.components[0].toJSON().components[0].custom_id
    const buttonEditReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleButton({
      customId,
      user: { id: 'admin' },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: buttonEditReply,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)

    expect(playerCodex.associateFaction).toHaveBeenCalledWith('player-known', 'mj-secret')
    expect(buttonEditReply.mock.calls[0][0].content).toContain('Association enregistrée')
  })

  it('registers /wiki and /wiki-admin with the expected admin subcommands', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions()
    const wiki = definitions.find(command => command.name === 'wiki')
    const admin = definitions.find(command => command.name === 'wiki-admin')
    expect(wiki).toBeDefined()
    expect(admin).toBeDefined()
    expect((admin?.options ?? []).map((option: { name: string }) => option.name)).toEqual([
      'help',
      'connexion',
      'associer',
      'liste',
      'supprimer',
      'associer-personnage',
      'dissocier-personnage',
      'liste-personnages',
    ])
  })

  it('creates a private one-use wiki login link for the caller', async () => {
    const persistence = {
      wikiAccountLink: jest.fn().mockResolvedValue({
        discordUserId: '123456789012345678',
        wikiUsername: 'Valou',
      }),
      createWikiLoginGrant: jest.fn().mockResolvedValue('grant-test'),
    }
    const mediaWiki = {
      wikiLoginUrl: jest.fn().mockReturnValue(
        'https://wiki.l7r.fr/index.php?title=Special%3APF2DiscordLogin&grant=grant-test',
      ),
    }
    const service = new DiscordCommandsService(
      persistence as never,
      {} as never,
      undefined,
      mediaWiki as never,
    )
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await service.handle({
      commandName: 'wiki',
      user: { id: '123456789012345678' },
      deferReply,
      editReply,
    } as never)

    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(persistence.createWikiLoginGrant).toHaveBeenCalledWith('123456789012345678', 180)
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('Valou')
    expect(response.components[0].toJSON().components[0].url).toContain('Special%3APF2DiscordLogin')
  })

  it('creates an admin-only one-use wiki login link for another Discord member', async () => {
    const persistence = {
      wikiAccountLink: jest.fn().mockResolvedValue({
        discordUserId: '222222222222222222',
        wikiUsername: 'TomWiki',
      }),
      createWikiLoginGrant: jest.fn().mockResolvedValue('grant-admin-test'),
    }
    const mediaWiki = {
      wikiLoginUrl: jest.fn().mockReturnValue(
        'https://wiki.l7r.fr/index.php?title=Special%3APF2DiscordLogin&grant=grant-admin-test',
      ),
    }
    const service = new DiscordCommandsService(persistence as never, {} as never, undefined, mediaWiki as never)
    const deferReply = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await service.handle({
      commandName: 'wiki-admin',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: {
        getSubcommand: jest.fn().mockReturnValue('connexion'),
        getUser: jest.fn().mockReturnValue({ id: '222222222222222222', username: 'Tom' }),
      },
      deferReply,
      editReply,
    } as never)

    expect(deferReply).toHaveBeenCalledWith({ ephemeral: true })
    expect(persistence.createWikiLoginGrant).toHaveBeenCalledWith('222222222222222222', 180)
    const response = editReply.mock.calls[0][0]
    expect(response.content).toContain('TomWiki')
    expect(response.components[0].toJSON().components[0].url).toContain('grant-admin-test')
  })

  it('shows /wiki-admin help only to administrators', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)

    const adminReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'wiki-admin',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      options: { getSubcommand: jest.fn().mockReturnValue('help') },
      reply: adminReply,
    } as never)
    expect(adminReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('/wiki-admin associer'),
      ephemeral: true,
    }))

    const playerReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'wiki-admin',
      user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) },
      options: { getSubcommand: jest.fn() },
      reply: playerReply,
    } as never)
    expect(playerReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('réservée aux administrateurs'),
      ephemeral: true,
    }))
  })

  it('uses non-pinging Discord mentions rather than account names in schedule group analysis', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    jest.spyOn(service as never, 'discordSessionCounts' as never).mockResolvedValue(new Map() as never)
    const planning = (service as unknown as { planningMessage: (monday: string, days: number[]) => string })
      .planningMessage('2026-10-12', [0])
    const accounts = Array.from({ length: 4 }, (_, index) => ({
      id: `10000000000000000${index}`,
      username: `account-${index}`,
      globalName: `Account ${index}`,
      bot: false,
    }))
    const starter = {
      content: planning,
      url: 'https://discord.com/planning',
      reactions: { cache: new Map([['monday', {
        emoji: { name: '🇱' },
        users: { fetch: jest.fn().mockResolvedValue(new Collection(accounts.map(user => [user.id, user]))) },
      }]]) },
    }
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'analyse-date-seance',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: {
        isTextBased: () => true, isThread: () => true,
        messages: { fetch: jest.fn() },
        fetchStarterMessage: jest.fn().mockResolvedValue(starter),
      },
      guild: {
        members: { fetch: jest.fn(async (id: string) => ({
          displayName: `Pseudo de serveur ${accounts.findIndex(account => account.id === id)}`,
        })) },
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
    } as never)
    const output = editReply.mock.calls[0][0].content as string
    expect(output).toContain('Analyse des disponibilités — groupes et priorités')
    expect(output).toContain('<@100000000000000000> : 0 séance(s)')
    expect(output).toContain('Meilleure répartition globale')
    expect(editReply.mock.calls[0][0].components[0].toJSON().components[0].custom_id).toContain('pf2-schedule:dates:')
    expect(editReply.mock.calls[0][0].allowedMentions).toEqual({ parse: [] })
    expect(output).not.toContain('Account 0')
    expect(output).not.toContain('account-0')
  })

  it('keeps global optimal tie choices visible until the MJ explicitly chooses one', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const p = (id: string) => ({ id, name: id, played: 0 })
    const ids = Array.from({ length: 8 }, (_, i) => `10000000000000000${i}`)
    const availability = new Map([
      ['0', ids.slice(0, 5).map(p)],
      ['3', ids.slice(3).map(p)],
    ])
    ;(service as any).pendingSchedulePublications.set('analysis-1', {
      requesterId: 'admin', channelId: 'thread', planningMessageId: 'starter',
      planningContent: 'Planning', dates: [{ key: '0', label: 'Lundi 19 octobre' }, { key: '3', label: 'Jeudi 22 octobre' }],
      availability, reactions: '0:',
    })
    const deferUpdate = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleComponent({
      customId: 'pf2-schedule:dates:analysis-1', user: { id: 'admin' },
      channelId: 'thread', values: ['0', '3'], deferUpdate, editReply,
    } as never)).resolves.toBe(true)
    expect(deferUpdate).toHaveBeenCalledTimes(1)
    expect((service as any).pendingSessionValidations.has('analysis-1')).toBe(false)
    const payload = editReply.mock.calls[0][0]
    expect(payload.content).toContain('Proposition 1')
    expect(payload.content).toContain('Proposition 2')
    expect(payload.content).toContain('aucun tirage n’est effectué automatiquement')
    expect(payload.allowedMentions).toEqual({ parse: [] })

    await service.handleComponent({
      customId: 'pf2-schedule:solution:analysis-1', user: { id: 'admin' },
      channelId: 'thread', values: ['solution:0'], deferUpdate, editReply,
    } as never)
    const validation = (service as any).pendingSessionValidations.get('analysis-1')
    expect(validation).toBeDefined()
    expect(validation.userIds).toHaveLength(8)
    expect(new Set(validation.userIds).size).toBe(8)
    expect(editReply.mock.calls[1][0].content).toContain('choisie manuellement')
    expect(editReply.mock.calls[1][0].allowedMentions).toEqual({ parse: [] })
  })
  it('rejects non-admin group modifications and leaves the message unchanged', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'modifier-groupe-seance', user: { id: 'player' },
      memberPermissions: { has: jest.fn().mockReturnValue(false) }, reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('réservée'), ephemeral: true,
    }))
  })

  it('registers the planning commands and computes the strictly next Monday', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const definitions = service.definitions().map(command => command.name)
    expect(definitions).toEqual(expect.arrayContaining(['proposer-date-seance', 'analyse-date-seance', 'valider-date-seance', 'modifier-groupe-seance', 'modifier-date-seance', 'relancer-date-seance']))
    expect(definitions).not.toContain('resume')
    const planning = service as unknown as {
      nextPlanningMonday: (date: Date) => string
      planningMessage: (monday: string, selectedDays: number[]) => string
      parsePlanningMessage: (content: string) => { monday: string; selectedDays: number[] } | null
    }
    expect(planning.nextPlanningMonday(new Date('2026-10-02T15:00:00.000Z'))).toBe('2026-10-05')
    expect(planning.nextPlanningMonday(new Date('2026-10-05T15:00:00.000Z'))).toBe('2026-10-12')
    const message = planning.planningMessage('2026-10-05', [0, 2, 6])
    expect(message).toContain('@everyone **Nouvelle séance ! La semaine du lundi 5 octobre 2026**')
    expect(message).toContain('🇱 Lundi 5 octobre')
    expect(message).toContain('🇹 Tercredi 7 octobre')
    expect(message).toContain('🇩 Dimanche 11 octobre')
    expect(message).toContain('❌ Pas dispo')
    expect(message).toContain('❓ Ne sais pas encore')
    expect(planning.parsePlanningMessage(message)).toEqual({ monday: '2026-10-05', selectedDays: [0, 2, 6] })
  })

  it('creates a single mission announcement with only affected users mentioned', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const ids = ['100000000000000001', '100000000000000002', '100000000000000003', '100000000000000004']
    ;(service as any).pendingSessionValidations.set('manual-1', {
      requesterId: 'admin', channelId: 'planning-thread', userIds: ids,
      content: ['✅ **Séances validées — validation manuelle**', '',
        '**Lundi 19 octobre 2026**', ...ids.map(id => `- <@${id}>`)].join('\n'),
    })
    const thread = { url: 'https://discord.com/channels/guild/thread-1',
      messages: { fetch: jest.fn().mockResolvedValue(new Map()) },
      send: jest.fn().mockResolvedValue(undefined) }
    const announcement = { content: '', thread: null,
      react: jest.fn().mockResolvedValue(undefined),
      startThread: jest.fn().mockResolvedValue(thread) }
    const target = {
      type: 0, name: 'objectif-prochaine-mission',
      messages: { fetch: jest.fn().mockResolvedValue(new Map()) },
      send: jest.fn().mockResolvedValue(announcement),
    }
    const deferUpdate = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleButton({
      customId: 'pf2-date-confirm:publish:manual-1', user: { id: 'admin' },
      channelId: 'planning-thread',
      guild: { channels: { fetch: jest.fn().mockResolvedValue(new Map([['target', target]])) } },
      client: { user: { id: 'bot' } },
      deferUpdate, editReply,
    } as never)).resolves.toBe(true)
    expect(target.send).toHaveBeenCalledTimes(1)
    expect(target.send.mock.calls[0][0].allowedMentions).toEqual({ parse: [], users: ids })
    expect(target.send.mock.calls[0][0].content).toContain('Merci de confirmer votre présence')
    expect(thread.send).toHaveBeenCalledTimes(1)
    expect(deferUpdate).toHaveBeenCalledTimes(1)
    expect(editReply.mock.calls.at(-1)[0].content).toContain('Séances créées')
  })

  it('accepts a valid custom date label for a manual session', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const helper = service as unknown as {
      fullPlanningDateLabel: (iso: string) => string | null
      isoDateFromFullPlanningLabel: (label: string) => string | null
    }
    expect(helper.fullPlanningDateLabel('2026-10-21')).toBe('Tercredi 21 octobre 2026')
    expect(helper.isoDateFromFullPlanningLabel('Tercredi 21 octobre 2026')).toBe('2026-10-21')
    expect(helper.isoDateFromFullPlanningLabel('Jeudi 21 octobre 2026')).toBeNull()
  })

  it('refuses an outdated planning snapshot before creating announcements', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    ;(service as any).pendingSessionValidations.set('old', {
      requesterId: 'admin', channelId: 'planning-thread',
      content: '✅ **Séances validées — proposition 1**', userIds: [],
      planningMessageId: 'starter', planningContent: 'Old planning',
      planningDates: ['0'], reactions: '0:player',
    })
    const deferUpdate = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)
    const targetSend = jest.fn()
    await service.handleButton({
      customId: 'pf2-date-confirm:publish:old', user: { id: 'admin' },
      channelId: 'planning-thread',
      channel: { isThread: () => true, messages: {},
        fetchStarterMessage: jest.fn().mockResolvedValue({ id: 'starter', content: 'Changed planning' }) },
      guild: { channels: { fetch: jest.fn().mockResolvedValue(new Map([
        ['target', { type: 0, name: 'objectif-prochaine-mission', send: targetSend }],
      ])) } },
      deferUpdate, editReply, reply: jest.fn(),
    } as never)
    expect(deferUpdate).toHaveBeenCalledTimes(1)
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('dates ont changé') }))
    expect(targetSend).not.toHaveBeenCalled()
  })

  it('cancels date validation without a public message or notification', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const pending = (service as unknown as {
      pendingSessionValidations: Map<string, { requesterId: string; channelId: string; content: string; userIds: string[] }>
    }).pendingSessionValidations
    pending.set('test-cancel', { requesterId: 'admin', channelId: 'thread-1', content: '- <@123>', userIds: ['123'] })
    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn()
    await service.handleButton({
      customId: 'pf2-date-confirm:cancel:test-cancel',
      user: { id: 'admin' }, channelId: 'thread-1', update, followUp,
    } as never)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Validation annulée'), components: [], allowedMentions: { parse: [] } }))
    expect(followUp).not.toHaveBeenCalled()
    expect(pending.has('test-cancel')).toBe(false)
  })

  it('does not announce an invalid proposal number or incomplete compact analysis', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const parser = service as unknown as {
      parsePublishedSessionProposals: (content: string) => unknown
      planningMessage: (monday: string, days: number[]) => string
    }
    expect(parser.parsePublishedSessionProposals([
      '**Groupes possibles pour la prochaine semaine**',
      '**Lundi 12 octobre**',
      '- playest — 3 séances jouées',
      '- **Choisir 3/5** : Arthur (4), Mana (4), Guilhem (5)',
    ].join('\n'))).toBeNull()

    const report = [
      '**Groupes possibles pour la prochaine semaine**',
      '**Lundi 12 octobre**',
      '- Arcady — 3 séances jouées',
      '- Arthur — 4 séances jouées',
      '- Éric — 4 séances jouées',
      '- Tom — 5 séances jouées',
    ].join('\n')
    const send = jest.fn()
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'valider-date-seance',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      client: { user: { id: 'bot' } },
      options: { getInteger: jest.fn().mockReturnValue(2) },
      channel: {
        isThread: () => true,
        fetchStarterMessage: jest.fn().mockResolvedValue({ content: parser.planningMessage('2026-10-12', [0]) }),
        messages: { fetch: jest.fn().mockResolvedValue(new Map([['analysis', {
          author: { id: 'bot' }, content: report, createdTimestamp: 1, url: 'https://discord.com/source',
        }]])) },
        send,
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
    } as never)
    expect(send).not.toHaveBeenCalled()
    expect(editReply).toHaveBeenCalledWith({ content: 'Proposition 2 introuvable. Choisis un numéro entre 1 et 1.' })
  })

  it('does not publish or ping when a player cannot be reliably matched to a planning reaction', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const planning = (service as unknown as { planningMessage: (monday: string, days: number[]) => string })
      .planningMessage('2026-10-12', [0])
    const report = [
      '**Groupes possibles pour la prochaine semaine**',
      '**Lundi 12 octobre**',
      '- playest — 3 séances jouées',
      '- Arthur — 4 séances jouées',
      '- Helluin — 4 séances jouées',
      '- nyu — 5 séances jouées',
    ].join('\n')
    const users = ['playest', 'Arthur', 'Helluin']
      .map((username, index) => ({ id: `10000000000000000${index}`, username, globalName: username, bot: false }))
    const send = jest.fn()
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'valider-date-seance',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      client: { user: { id: 'bot' } },
      options: { getInteger: jest.fn().mockReturnValue(1) },
      channel: {
        isThread: () => true,
        fetchStarterMessage: jest.fn().mockResolvedValue({
          content: planning,
          reactions: { cache: new Map([['monday', {
            emoji: { name: '🇱' },
            users: { fetch: jest.fn().mockResolvedValue(new Map(users.map(user => [user.id, user]))) },
          }]]) },
        }),
        messages: { fetch: jest.fn().mockResolvedValue(new Map([['analysis', {
          author: { id: 'bot' }, content: report, createdTimestamp: 1, url: 'https://discord.com/source',
        }]])) },
        send,
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
    } as never)
    expect(send).not.toHaveBeenCalled()
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('Impossible d’identifier de façon sûre « nyu »'),
    }))
  })

  it('rejects validation outside a planning thread', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'valider-date-seance',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => false },
      reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('dans le fil'), ephemeral: true }))
  })

  it('publishes a planning message with reactions and a thread after the day selection', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const react = jest.fn().mockResolvedValue(undefined)
    const startThread = jest.fn().mockResolvedValue({ id: 'thread-1' })
    const send = jest.fn().mockResolvedValue({ id: 'message-1', react, startThread })
    const deferUpdate = jest.fn().mockResolvedValue(undefined)
    const editReply = jest.fn().mockResolvedValue(undefined)

    await service.handleComponent({
      customId: 'pf2-planification:create:2026-10-05',
      values: ['1', '2', '4'],
      channel: { isSendable: () => true, send },
      deferUpdate,
      editReply,
      reply: jest.fn(),
    } as never)

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('🇹 Tercredi 7 octobre'),
      allowedMentions: { parse: ['everyone'] },
    }))
    expect(react.mock.calls.map(call => call[0])).toEqual(['🇲', '🇹', '🇻', '❌', '❓'])
    expect(startThread).toHaveBeenCalledWith({ name: 'Planification — semaine du 5 octobre' })
    expect(editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Planification publiée') }))
  })

  it('previews and publishes a reminder separating missing players from players still uncertain', async () => {
    const persistence = {
      saveFoundryActorCache: jest.fn().mockResolvedValue(undefined),
      readFoundryActorCache: jest.fn().mockResolvedValue([]),
    }
    const foundry = {
      listActors: jest.fn().mockResolvedValue([
        { uuid: 'Actor.eryn', name: 'Eryn (Tom)' },
        { uuid: 'Actor.pepin', name: 'Pépin (Eric)' },
        { uuid: 'Actor.yaz', name: 'Yaz Lorok (Gus)' },
        { uuid: 'Actor.valou', name: 'Valou (Valou)' },
      ]),
    }
    const service = new DiscordCommandsService(persistence as never, foundry as never)
    const planningMessage = (service as unknown as { planningMessage: (monday: string, selectedDays: number[]) => string })
      .planningMessage('2026-10-12', [0, 2])

    const reaction = (emoji: string, users: Array<{ id: string; bot: boolean }>) => ({
      emoji: { name: emoji },
      users: { fetch: jest.fn().mockResolvedValue(new Map(users.map(user => [user.id, user]))) },
    })
    const starter = {
      id: 'starter-1',
      content: planningMessage,
      reactions: {
        cache: new Map([
          ['monday', reaction('🇱', [{ id: '134346709487714304', bot: false }])],
          ['uncertain', reaction('❓', [{ id: '399621722158137346', bot: false }])],
          ['bot', reaction('🇹', [{ id: 'bot', bot: true }])],
        ]),
      },
    }
    const editReply = jest.fn().mockResolvedValue(undefined)

    await expect(service.handle({
      commandName: 'relancer-date-seance',
      id: 'reminder-command',
      user: { id: 'admin' },
      memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => true, fetchStarterMessage: jest.fn().mockResolvedValue(starter) },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)

    const preview = editReply.mock.calls[0][0]
    expect(preview.content).toContain('**Sans réponse (1)**')
    expect(preview.content).toContain('<@671746679636099094>')
    expect(preview.content).toContain('**En attente — « Ne sais pas encore » (1)**')
    expect(preview.content).toContain('<@399621722158137346>')
    expect(preview.content).not.toContain('<@134346709487714304>')
    expect(preview.allowedMentions).toEqual({ parse: [] })

    const customId = preview.components[0].toJSON().components[0].custom_id
    const followUp = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleButton({
      customId,
      user: { id: 'admin' },
      update: jest.fn().mockResolvedValue(undefined),
      followUp,
      reply: jest.fn(),
    } as never)).resolves.toBe(true)

    expect(followUp).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('**Sans réponse :** <@671746679636099094>'),
      ephemeral: false,
      allowedMentions: { users: ['671746679636099094', '399621722158137346'] },
    }))
    expect(followUp.mock.calls[0][0].content).toContain('❓ **En attente — « Ne sais pas encore » :** <@399621722158137346>')
  })

  it('refreshes the planning starter so a previously added day stays selected', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const freshContent = (service as unknown as { planningMessage: (monday: string, selectedDays: number[]) => string })
      .planningMessage('2026-10-05', [0, 4])
    const fetchStarterMessage = jest.fn().mockResolvedValue({ id: 'starter-1', content: freshContent })
    const reply = jest.fn().mockResolvedValue(undefined)

    await service.handle({
      commandName: 'modifier-date-seance',
      user: { id: 'admin' }, memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => true, fetchStarterMessage },
      reply,
    } as never)

    expect(fetchStarterMessage).toHaveBeenCalledWith({ force: true })
    const row = reply.mock.calls[0][0].components[0].toJSON()
    const friday = row.components[0].options.find((option: { value: string }) => option.value === '4')
    expect(friday.default).toBe(true)
  })

  it('refuses /modifier-date-seance outside the thread attached to the planning message', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const reply = jest.fn().mockResolvedValue(undefined)
    await service.handle({
      commandName: 'modifier-date-seance',
      user: { id: 'admin' }, memberPermissions: { has: jest.fn().mockReturnValue(true) },
      channel: { isThread: () => false },
      reply,
    } as never)
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('dans le fil'),
      ephemeral: true,
    }))
  })


  it('restricts the date-planning commands to admins', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    for (const commandName of ['proposer-date-seance', 'modifier-date-seance', 'analyse-date-seance', 'valider-date-seance', 'modifier-groupe-seance']) {
      const reply = jest.fn().mockResolvedValue(undefined)
      await service.handle({
        commandName, reply, user: { id: 'player' },
        memberPermissions: { has: jest.fn().mockReturnValue(false) },
      } as never)
      expect(reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('réservée'), ephemeral: true,
      }))
    }
  })

  it('publishes a recap preview only after the requester clicks Publier', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const preview = service as unknown as {
      pendingPreviewPublications: Map<string, { requesterId: string; content: string; files?: string[] }>
    }
    preview.pendingPreviewPublications.set('pf2-preview:publish:test', { requesterId: 'user-1', content: 'Aperçu public' })
    const update = jest.fn().mockResolvedValue(undefined)
    const followUp = jest.fn().mockResolvedValue(undefined)
    await expect(service.handleButton({
      customId: 'pf2-preview:publish:test', user: { id: 'user-1' }, update, followUp, reply: jest.fn(),
    } as never)).resolves.toBe(true)
    expect(update).toHaveBeenCalledWith({ components: [] })
    expect(followUp).toHaveBeenCalledWith({ content: 'Aperçu public', ephemeral: false, allowedMentions: { parse: [] } })
  })


  it('solver maximizes groups, never reuses a player, and favors less-played players', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const solver = service as unknown as {
      bestSessionGroupProposals: (
        days: readonly (readonly [string, string])[],
        availability: Map<string, Array<{ id: string; name: string; played: number }>>,
      ) => Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>
    }
    const p = (id: string, played: number) => ({ id, name: id, played })
    const proposals = solver.bestSessionGroupProposals(
      [['0', 'Lundi'], ['3', 'Jeudi']] as const,
      new Map([
        ['0', [p('A', 0), p('B', 0), p('C', 0), p('D', 0)]],
        ['3', [p('D', 0), p('E', 0), p('F', 0), p('G', 0), p('H', 5)]],
      ]),
    )
    expect(proposals[0]).toHaveLength(2)
    const ids = proposals[0].flatMap(group => group.players.map(player => player.id))
    expect(new Set(ids).size).toBe(8)
    expect(ids).toContain('H')

    const priority = solver.bestSessionGroupProposals(
      [['0', 'Lundi']] as const,
      new Map([['0', [p('A', 0), p('B', 1), p('C', 1), p('D', 2), p('E', 9)]]]),
    )
    expect(priority[0][0].players.map(player => player.id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('solver compacts perfect ties into a choose N/M pool', () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const solver = service as unknown as {
      bestSessionGroupProposals: (
        days: readonly (readonly [string, string])[],
        availability: Map<string, Array<{ id: string; name: string; played: number }>>,
      ) => Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>
      compactSessionGroupProposals: (
        proposals: Array<Array<{ key: string; label: string; players: Array<{ id: string; name: string; played: number }> }>>,
      ) => Array<{ fixed: Array<{ id: string }>; pool: Array<{ id: string }>; choose: number }> | null
    }
    const p = (id: string, played: number) => ({ id, name: id, played })
    const proposals = solver.bestSessionGroupProposals(
      [['0', 'Lundi']] as const,
      new Map([['0', [p('A', 0), p('B', 0), p('C', 0), p('D', 4), p('E', 4), p('F', 4)]]]),
    )
    const compact = solver.compactSessionGroupProposals(proposals)
    expect(compact).not.toBeNull()
    expect(compact?.[0].fixed.map(player => player.id)).toEqual(['A', 'B', 'C'])
    expect(compact?.[0].pool.map(player => player.id)).toEqual(['D', 'E', 'F'])
    expect(compact?.[0].choose).toBe(1)
  })

  it('counts draft sessions with XP as already played', async () => {
    const persistence = {
      listSessions: jest.fn().mockResolvedValue([
        { sessionNumber: 1, published: true, sessionXp: 0, participants: ['Actor.hero'] },
        { sessionNumber: 2, published: false, sessionXp: 120, participants: ['Actor.hero'] },
        { sessionNumber: 3, published: false, sessionXp: 0, participants: ['Actor.hero'] },
      ]),
      saveFoundryActorCache: jest.fn().mockResolvedValue(undefined),
      readFoundryActorCache: jest.fn().mockResolvedValue([]),
    }
    const foundry = {
      listActors: jest.fn().mockResolvedValue([{ uuid: 'Actor.hero', name: 'Héros (Eric)' }]),
    }
    const service = new DiscordCommandsService(persistence as never, foundry as never)
    const counts = await (service as unknown as { discordSessionCounts: () => Promise<Map<string, number>> }).discordSessionCounts()
    expect(counts.get('399621722158137346')).toBe(2)
  })

  it('rejects globally incompatible selected dates without publishing', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const players = ['A', 'B', 'C', 'D'].map(id => ({ id, name: id, played: 0 }))
    ;(service as any).pendingSchedulePublications.set('analysis-2', {
      requesterId: 'admin', channelId: 'thread', planningMessageId: 'starter',
      planningContent: 'Planning', dates: [{ key: '0', label: 'Lundi' }, { key: '3', label: 'Jeudi' }],
      availability: new Map([['0', players], ['3', players]]), reactions: '',
    })
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleComponent({
      customId: 'pf2-schedule:dates:analysis-2', user: { id: 'admin' },
      channelId: 'thread', values: ['0', '3'], deferUpdate: jest.fn().mockResolvedValue(undefined), editReply,
    } as never)
    expect(editReply.mock.calls[0][0].content).toContain('ne peuvent pas toutes')
    expect((service as any).pendingSessionValidations.has('analysis-2')).toBe(false)
  })

  it('updates attendance status silently when players react', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const players = ['100000000000000001', '100000000000000002', '100000000000000003', '100000000000000004']
    const content = [
      '**Séance du Lundi 19 octobre 2026**',
      `**Groupe proposé :** ${players.map(id => `<@${id}>`).join(', ')}`,
      '**Merci de confirmer votre présence :** ✅ présent · ❌ indisponible.',
      '**Choisissez également votre prochaine mission**',
      '[PF2-SESSION:2026-10-19]',
    ].join('\n')
    const users = (ids: string[]) => ({
      users: { fetch: jest.fn().mockResolvedValue(new Map(ids.map(id => [id, { id, bot: false }]))) },
    })
    const edit = jest.fn().mockResolvedValue(undefined)
    const message = {
      id: 'announcement-1', content,
      channel: { type: 0, name: 'objectif-prochaine-mission' },
      author: { id: 'bot' }, client: { user: { id: 'bot' } },
      reactions: { cache: new Collection([
        ['yes', { emoji: { name: '✅' }, ...users(players.slice(0, 3)) }],
        ['no', { emoji: { name: '❌' }, ...users([players[3]]) }],
      ]) },
      edit,
    }
    const reaction = { emoji: { name: '✅' }, message: {
      id: message.id, fetch: jest.fn().mockResolvedValue(message),
    } }
    await service.handleSessionConfirmationReaction(reaction as never)
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('3/4 ✅ · 1 ❌ · 0 ⏳ — ⚠️ Groupe à compléter'),
      allowedMentions: { parse: [] },
    }))
  })

  it('does not edit unrelated reactions or non-session messages', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const fetch = jest.fn()
    await service.handleSessionConfirmationReaction({ emoji: { name: '👍' }, message: { id: 'x', fetch } } as never)
    expect(fetch).not.toHaveBeenCalled()
    const edit = jest.fn()
    await service.handleSessionConfirmationReaction({
      emoji: { name: '✅' }, message: { id: 'y',
        fetch: jest.fn().mockResolvedValue({
          content: 'Un message ordinaire',
          channel: { type: 0, name: 'objectif-prochaine-mission' },
          author: { id: 'bot' }, client: { user: { id: 'bot' } }, edit,
        }),
      },
    } as never)
    expect(edit).not.toHaveBeenCalled()
  })

  it('does not perform a random draw until explicitly requested by the MJ', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const p = (id: string) => ({ id, name: id, played: 0 })
    const players = ['100000000000000001', '100000000000000002', '100000000000000003', '100000000000000004', '100000000000000005'].map(p)
    ;(service as any).pendingSchedulePublications.set('random-1', {
      requesterId: 'admin', channelId: 'thread', planningMessageId: 'planning',
      planningContent: 'Planning', dates: [{ key: '0', label: 'Lundi 26 octobre' }],
      availability: new Map([['0', players]]), reactions: '0:',
    })
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.95)
    try {
      const deferUpdate = jest.fn().mockResolvedValue(undefined)
      const editReply = jest.fn().mockResolvedValue(undefined)
      await service.handleComponent({
        customId: 'pf2-schedule:dates:random-1', user: { id: 'admin' },
        channelId: 'thread', values: ['0'], deferUpdate, editReply,
      } as never)
      expect(random).not.toHaveBeenCalled()
      expect(editReply.mock.calls[0][0].content).toContain('aucun tirage n’est effectué automatiquement')
      expect((service as any).pendingSessionValidations.has('random-1')).toBe(false)
      await service.handleComponent({
        customId: 'pf2-schedule:solution:random-1', user: { id: 'admin' },
        channelId: 'thread', values: ['random'], deferUpdate, editReply,
      } as never)
      expect(random).toHaveBeenCalledTimes(1)
      const result = (service as any).pendingSessionValidations.get('random-1')
      expect(result.userIds).toHaveLength(4)
      expect(new Set(result.userIds).size).toBe(4)
      expect(editReply.mock.calls[1][0].content).toContain('Tirage demandé par le MJ')
    } finally {
      random.mockRestore()
    }
  })

  it('acknowledges the publish click before reading fresh Discord reactions', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const calls: string[] = []
    ;(service as any).pendingSessionValidations.set('stale-ack', {
      requesterId: 'admin', channelId: 'thread', userIds: ['100000000000000001'],
      content: '✅ **Séances validées — proposition 1**',
      planningMessageId: 'starter', planningContent: 'Old planning',
      planningDates: ['0'], reactions: '0:100000000000000001',
    })
    const deferUpdate = jest.fn(async () => { calls.push('ack') })
    const fetchStarterMessage = jest.fn(async () => {
      calls.push('fetch')
      return { id: 'starter', content: 'Changed planning' }
    })
    const editReply = jest.fn().mockResolvedValue(undefined)
    await service.handleButton({
      customId: 'pf2-date-confirm:publish:stale-ack', user: { id: 'admin' },
      channelId: 'thread', deferUpdate, editReply,
      channel: { isThread: () => true, messages: {}, fetchStarterMessage },
    } as never)
    expect(calls).toEqual(['ack', 'fetch'])
    expect(editReply.mock.calls[0][0].content).toContain('dates ont changé')
    expect((service as any).pendingSessionValidations.has('stale-ack')).toBe(true)
  })

  it('keeps retryable state when publishing fails and reuses an existing announcement', async () => {
    const service = new DiscordCommandsService({} as never, {} as never)
    const ids = ['100000000000000001', '100000000000000002', '100000000000000003', '100000000000000004']
    ;(service as any).pendingSessionValidations.set('retry-1', {
      requesterId: 'admin', channelId: 'thread', userIds: ids,
      content: ['✅ **Séances validées — validation manuelle**', '',
        '**Lundi 26 octobre 2026**', ...ids.map(id => `- <@${id}>`)].join('\n'),
    })
    const messages = { fetch: jest.fn().mockResolvedValue(new Map()) }
    const thread = { url: 'https://discord.com/thread',
      messages: { fetch: jest.fn().mockResolvedValue(new Map()) },
      send: jest.fn().mockResolvedValue(undefined) }
    const startThread = jest.fn().mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce(thread)
    const announcement: any = {
      author: { id: 'bot' }, content: '[PF2-SESSION:2026-10-26]',
      thread: null, startThread, react: jest.fn().mockResolvedValue(undefined),
    }
    const send = jest.fn().mockResolvedValue(announcement)
    const target = { type: 0, name: 'objectif-prochaine-mission',
      messages: { fetch: jest.fn().mockResolvedValueOnce(new Map())
        .mockResolvedValue(new Map([['message', announcement]])) }, send }
    const editReply = jest.fn().mockResolvedValue(undefined)
    const interaction = {
      customId: 'pf2-date-confirm:publish:retry-1',
      user: { id: 'admin' }, channelId: 'thread',
      guild: { channels: { fetch: jest.fn().mockResolvedValue(new Map([['target', target]])) } },
      client: { user: { id: 'bot' } },
      deferUpdate: jest.fn().mockResolvedValue(undefined), editReply,
    }
    await service.handleButton(interaction as never)
    expect(send).toHaveBeenCalledTimes(1)
    expect((service as any).pendingSessionValidations.has('retry-1')).toBe(true)
    expect(editReply.mock.calls.at(-1)[0].components).toHaveLength(1)
    await service.handleButton(interaction as never)
    expect(send).toHaveBeenCalledTimes(1)
    expect(startThread).toHaveBeenCalledTimes(2)
    expect((service as any).pendingSessionValidations.has('retry-1')).toBe(false)
  })

})
