import { describe, expect, it } from 'vitest'
import {
  questIdFromSearch, placesForDiscordQuest, questFocusCamera, leadingQuestEmoji, questPlaceEmoji, questPlaceEmojis, questClusterEmoji,
} from './quest-map-navigation'
import type { HybridQuestPlace } from './hybrid-quest-grouping'

const quest = (id: string, title: string, completed = false) => ({
  id, title, completed, url: 'https://discord.com/channels/guild/' + id,
})
const place = (id: string, links: ReturnType<typeof quest>[]): HybridQuestPlace => ({
  id, name: id, latitude: 23, longitude: -25, questLinks: links, questCompleted: links.every(q => q.completed),
})

describe('Discord → map location focus', () => {
  it('accepts only a Discord snowflake in the query parameter', () => {
    const id = '1565017298668888206'
    expect(questIdFromSearch('?quest=' + id)).toBe(id)
    expect(questIdFromSearch('?foo=1&quest=oops')).toBe(null)
    expect(questIdFromSearch('?quest=%3Cscript%3E')).toBe(null)
    expect(questIdFromSearch('?quest=1234')).toBe(null)
    expect(questIdFromSearch('?other=1')).toBe(null)
  })
  it('centers on one mapped site and frames all mapped sites for a multi-location quest', () => {
    expect(questFocusCamera([])).toBeNull()
    expect(questFocusCamera([place('a',[])]))
      .toEqual({ kind: 'single', center: [-25, 23] })
    const other = { ...place('b',[]), longitude: -29, latitude: 18 }
    expect(questFocusCamera([place('a',[]), other]))
      .toEqual({ kind: 'multiple', bounds: [[-29, 18], [-25, 23]] })
  })
  it('focuses all places for one quest, even if the quest is completed or mixed with others', () => {
    const id = '1565017298668888206'
    const sites = [
      place('1', [quest(id, '😈 Détruire le monde'), quest('1536259632455094412','🌿 Fleurs')]),
      place('2', [quest(id, '😈 Détruire le monde', true)]),
      place('3', [quest('1536259632455094412', '🌿 Fleurs')]),
    ]
    expect(placesForDiscordQuest(sites,id).map(p => p.id)).toEqual(['1','2'])
  })
})

describe('Discord quest emoji markers', () => {
  it('recognizes the Unicode emoji chosen in the Discord thread title', () => {
    expect(leadingQuestEmoji('😈 Détruire le monde')).toBe('😈')
    expect(leadingQuestEmoji('🏖️ Veiller sur Pointesable')).toBe('🏖️')
    expect(leadingQuestEmoji('⚒️ Machine disparue')).toBe('⚒️')
    expect(leadingQuestEmoji('👩‍🔬 Alchimie')).toBe('👩‍🔬')
    expect(leadingQuestEmoji('🇫🇷 Mission')).toBe('🇫🇷')
    expect(leadingQuestEmoji('Quête sans icône')).toBeNull()
  })
  it('uses the emoji for a single quest but not for a shared location', () => {
    const mine = quest('1565017298668888206','😈 Détruire le monde')
    const other = quest('1536259632455094412','🌿 Les Druides')
    expect(questPlaceEmoji(place('port',[mine]),false)).toBe('😈')
    expect(questPlaceEmoji(place('loge',[mine,other]),false)).toBeNull()
    expect(questPlaceEmojis(place('loge',[mine,other]),false)).toEqual(['😈','🌿'])
    expect(questPlaceEmojis(place('loge',[mine,other]),true)).toEqual(['😈','🌿'])
    expect(questPlaceEmoji(place('loge',[mine,{...other,completed:true}]),false)).toBe('😈')
    expect(questPlaceEmoji(place('loge',[mine,{...other,completed:true}]),true)).toBeNull()
    expect(questPlaceEmoji(place('anon',[{...mine,title:'Sans icône'}]),false)).toBeNull()
  })
  it('uses an emoji for clustered sites only if all refer to the same distinct quest', () => {
    const mine = quest('1565017298668888206','😈 Détruire le monde')
    const other = quest('1536259632455094412','🌿 Les Druides')
    expect(questClusterEmoji([place('a',[mine]),place('b',[mine])],false)).toBe('😈')
    expect(questClusterEmoji([place('a',[mine]),place('b',[other])],false)).toBeNull()
    expect(questClusterEmoji([place('a',[mine]),place('b',[mine,other])],false)).toBeNull()
  })
})
