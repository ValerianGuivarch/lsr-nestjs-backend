/**
 * Source commune des correspondances Foundry ↔ joueur ↔ Discord.
 * Nom = prénom du joueur (pour /choix-quete). Les autres commandes affichent
 * des mentions Discord <@id> pour éviter les pseudos de compte changeants.
 *
 * Les alias Discord proviennent de correspondances explicitement identifiées ;
 * ils ne sont pas les surnoms dynamiques du serveur.
 */
export const PF2_PLAYER_IDENTITIES = [
  { id: '308566148931387393', name: 'Julien', aliases: ['Jupi'], actor: 'Jilkra', discordAliases: [] },
  { id: '492387405760823297', name: 'Valérian', aliases: ['Valou', 'Valerian'], actor: 'Valou', discordAliases: [] },
  { id: '688742453276180560', name: 'David', aliases: [], actor: 'Eos', discordAliases: [] },
  { id: '134346709487714304', name: 'Tom', aliases: [], actor: 'Eryn', discordAliases: ['nyu'] },
  { id: '688791427253403679', name: 'Sameh', aliases: [], actor: 'Neyla', discordAliases: ['triki'] },
  { id: '344733584441081857', name: 'Arcady', aliases: [], actor: 'Pen-Pen', discordAliases: ['playest'] },
  { id: '399621722158137346', name: 'Éric', aliases: ['Eric'], actor: 'Pépin', discordAliases: ['Helluin'] },
  { id: '404629333534179338', name: 'Marinella', aliases: ['Mana'], actor: 'Sashka', discordAliases: [] },
  { id: '688860103629340690', name: 'Nicolas', aliases: ['Nico'], actor: 'Vaga', discordAliases: ['Actéon Abbot', 'Acteon Abbot'] },
  { id: '671746679636099094', name: 'Augustin', aliases: ['Gus'], actor: 'Yaz Lorok', discordAliases: [] },
  { id: '689036096767524866', name: 'Eléna', aliases: ['Elena'], actor: 'Zab', discordAliases: [] },
  { id: '448500183186145291', name: 'Guilhem', aliases: [], actor: 'Tsuyi', discordAliases: [] },
  { id: '557907871212503050', name: 'Arthur', aliases: [], actor: 'Ruhtra', discordAliases: [] },
] as const

const normalize = (name: string): string =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

export function pf2PlayerByDiscordId(id: string) {
  return PF2_PLAYER_IDENTITIES.find(identity => identity.id === id)
}

export function pf2DiscordIdForPlayer(name: string): string | undefined {
  const key = normalize(name)
  return PF2_PLAYER_IDENTITIES.find(identity =>
    [identity.name, ...identity.aliases].some(alias => normalize(alias) === key)
  )?.id
}

export function pf2MatchesPlayerOrDiscordAlias(id: string, name: string): boolean {
  const identity = pf2PlayerByDiscordId(id)
  if (!identity) return false
  const key = normalize(name)
  return [identity.name, identity.actor, ...identity.aliases, ...identity.discordAliases]
    .some(alias => normalize(alias) === key)
}
