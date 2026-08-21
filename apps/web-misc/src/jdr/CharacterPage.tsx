import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import styled from 'styled-components'
import { JdrApiClient, RollState } from './JdrApiClient'
import { DiceRollFeed } from './DiceRollFeed'

const ROLL_STATES: Array<{ value: RollState; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'disadvantage', label: 'Desavantage' },
  { value: 'advantage', label: 'Avantage' },
  { value: 'double_advantage', label: 'Double avantage' }
]

export default function CharacterPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const queryClient = useQueryClient()
  const jdrQueryKey = ['jdr', jdrSlug] as const
  const { data: jdr, isLoading: loading, error } = useQuery({
    queryKey: jdrQueryKey,
    queryFn: () => JdrApiClient.findOneBySlug(jdrSlug ?? ''),
    enabled: !!jdrSlug,
    // Refetch periodically so edits made from the admin (traits, stats...) show up without a manual reload.
    refetchInterval: 15000
  })
  const [rolling, setRolling] = useState<string | null>(null)
  const [rollState, setRollState] = useState<RollState>('normal')
  const [updatingResource, setUpdatingResource] = useState<string | null>(null)
  const [arbitraryFormula, setArbitraryFormula] = useState('1d20')
  const [rollingArbitrary, setRollingArbitrary] = useState(false)
  const [spellPopup, setSpellPopup] = useState<{ slug: string; name: string } | null>(null)

  const character = jdr?.characters.find(c => c.slug === characterSlug)

  const portraitName = character?.name ?? ''
  const portraitSlug = character?.slug ?? ''

  const portraitCandidates = (!portraitName && !portraitSlug)
    ? ['/l7r/placeholder.png']
    : Array.from(new Set([
      `/l7r/${portraitName}.png`,
      `/l7r/${portraitSlug}.png`,
      `/l7r/${portraitName.toLowerCase()}.png`,
      `/l7r/${portraitSlug.toLowerCase()}.png`
    ].filter(Boolean)))

  const handleRollDice = async (statSlug: string, text?: string | null) => {
    if (!jdrSlug || !characterSlug) return
    try {
      setRolling(statSlug)
      await JdrApiClient.rollDice(jdrSlug, characterSlug, statSlug, rollState, text ?? null)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setRolling(null)
    }
  }

  const handleRollArbitrary = async () => {
    if (!jdrSlug || !characterSlug) return
    const formula = arbitraryFormula.trim()
    if (!/^\d+d\d+$/i.test(formula)) {
      alert('Format invalide. Exemple: 2d6, 1d20, 3d8')
      return
    }
    try {
      setRollingArbitrary(true)
      await JdrApiClient.rollArbitrary(jdrSlug, characterSlug, formula)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setRollingArbitrary(false)
    }
  }

  if (loading) return <StatusShell>Chargement du personnage...</StatusShell>
  if (error) return <StatusShell>Erreur: {(error as Error).message}</StatusShell>
  if (!jdr || !character) return <StatusShell>Personnage non trouvé</StatusShell>

  const selectedClass = character.classSlug ? jdr.classes.find(c => c.slug === character.classSlug) : undefined
  const selectedGroups = jdr.groups.filter(g => character.groupSlugs.includes(g.slug))
  const isHpJdr =
    jdr.name.toLowerCase().includes('hp') ||
    jdr.classes.some((klass) => klass.slug === 'eleve' || klass.slug === 'sorcier') ||
    jdr.groups.some((group) => ['gryffondor', 'serpentard', 'serdaigle', 'poufsouffle'].includes(group.slug))

  const pvResource = jdr.resources.find((resource) => resource.slug === 'pv' || resource.name.toLowerCase() === 'pv')
  const characterPv = pvResource
    ? character.resources.find((resource) => resource.resourceSlug === pvResource.slug)
    : undefined

  const HOUSE_SLUGS = ['gryffondor', 'serpentard', 'serdaigle', 'poufsouffle'] as const
  const HOUSE_META: Record<string, { label: string; bg: string; textColor: string }> = {
    gryffondor: { label: 'Gryffondor', bg: 'linear-gradient(135deg, #7f1d1d, #9b2626)', textColor: '#ffd700' },
    serpentard: { label: 'Serpentard', bg: 'linear-gradient(135deg, #1a3a2a, #1f4d38)', textColor: '#c0c0c0' },
    serdaigle:  { label: 'Serdaigle',  bg: 'linear-gradient(135deg, #1a2a4a, #1e3665)', textColor: '#cd7f32' },
    poufsouffle:{ label: 'Poufsouffle',bg: 'linear-gradient(135deg, #4a3a0a, #5c4a10)', textColor: '#f0d060' },
  }
  const housePoints: Array<{ houseSlug: string; label: string; bg: string; textColor: string; value: number }> | null =
    isHpJdr
      ? HOUSE_SLUGS.map((houseSlug) => {
          const resourceSlug = `points-${houseSlug}`
          const gr = jdr.groupResources.find((r) => r.resourceSlug === resourceSlug)
          const meta = HOUSE_META[houseSlug]
          return gr !== undefined ? { houseSlug, ...meta, value: gr.value } : null
        }).filter((h): h is NonNullable<typeof h> => h !== null)
      : null

  const resourcesForPanel = character.resources.filter((resource) => {
    if (!isHpJdr || !pvResource) return true
    return resource.resourceSlug !== pvResource.slug
  })

  const handleAdjustResource = async (resourceSlug: string, currentValue: number, delta: number) => {
    if (!jdrSlug || !characterSlug || updatingResource) return

    const nextValue = Math.max(0, currentValue + delta)
    try {
      setUpdatingResource(resourceSlug)
      const updated = await JdrApiClient.updateCharacterResource(jdrSlug, characterSlug, resourceSlug, nextValue)
      queryClient.setQueryData(jdrQueryKey, updated)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setUpdatingResource(null)
    }
  }

  const characterTraits = character.traitSlugs
    .map(slug => jdr.traits.find(t => t.slug === slug))
    .filter((trait): trait is NonNullable<typeof trait> => Boolean(trait))

  const traitsByType = {
    normal: characterTraits.filter((trait) => trait.type.toLowerCase() === 'normal'),
    secret: characterTraits.filter((trait) => trait.type.toLowerCase() === 'secret'),
    defaut: characterTraits.filter((trait) => trait.type.toLowerCase() === 'defaut'),
    sorts: characterTraits.filter((trait) => trait.type.toLowerCase() === 'sorts')
  }

  const itemNames = character.items
    .map(oi => {
      const item = jdr.items.find(i => i.slug === oi.itemSlug)
      return item ? `${item.name}${oi.quantity > 1 ? ` (${oi.quantity})` : ''}` : null
    })
    .filter(Boolean)

  return (
    <PageShell>
      <CompactHeader>
        <HeroContent>
          <PortraitColumn>
            <PortraitFrame>
              <PortraitImage
                src={portraitCandidates[0] || '/l7r/placeholder.png'}
                alt={character.name}
              />
            </PortraitFrame>
            {isHpJdr && pvResource && characterPv && (
              <PvPanel>
                <PvLabel>PV</PvLabel>
                <PvValueRow>
                  <PvButton type="button" onClick={() => handleAdjustResource(pvResource.slug, characterPv.value, -1)} disabled={updatingResource === pvResource.slug || characterPv.value <= 0}>-</PvButton>
                  <PvValue>{characterPv.value}</PvValue>
                  <PvButton type="button" onClick={() => handleAdjustResource(pvResource.slug, characterPv.value, 1)} disabled={updatingResource === pvResource.slug}>+</PvButton>
                </PvValueRow>
              </PvPanel>
            )}
          </PortraitColumn>

          <HeroInfo>
            <Overline>{jdr.name} · Fiche de personnage</Overline>
            <CharacterTitle>{character.name}</CharacterTitle>
            <TagRow>
              {selectedClass && <Tag>Classe: {selectedClass.name} (Lvl {selectedClass.level})</Tag>}
              {selectedGroups.map(g => (
                <Tag key={g.slug}>{g.name}</Tag>
              ))}
              {!selectedClass && <Tag>Classe: Aucune</Tag>}
            </TagRow>
            {housePoints && housePoints.length > 0 && (
              <HousePointsRow>
                {housePoints.map((h) => (
                  <HousePill key={h.houseSlug} $bg={h.bg} $textColor={h.textColor}>
                    <HousePillLabel>{h.label}</HousePillLabel>
                    <HousePillValue $textColor={h.textColor}>{h.value}</HousePillValue>
                  </HousePill>
                ))}
              </HousePointsRow>
            )}
          </HeroInfo>
        </HeroContent>
      </CompactHeader>

      <ContentGrid>
        <MainColumn>
          <SectionCard>
            <StatsHeader>
              <SectionTitle>Stats</SectionTitle>
              <RollStateControls>
                {ROLL_STATES.map((state) => (
                  <RollStateButton
                    key={state.value}
                    type="button"
                    $active={rollState === state.value}
                    onClick={() => setRollState(state.value)}
                  >
                    {state.label}
                  </RollStateButton>
                ))}
              </RollStateControls>
            </StatsHeader>
            <StatsGrid>
              {character.stats.map(stat => (
                <StatButton
                  key={stat.statSlug}
                  onClick={() => handleRollDice(stat.statSlug)}
                  disabled={rolling === stat.statSlug}
                  title={`Lancer ${stat.statSlug}`}
                >
                  <span>{stat.statSlug} : {stat.finalValue}</span>
                  {stat.finalValue !== stat.value && <StatBaseHint>(base {stat.value})</StatBaseHint>}
                </StatButton>
              ))}
            </StatsGrid>
            <ArbitraryRollRow>
              <ArbitraryInput
                type="text"
                value={arbitraryFormula}
                onChange={e => setArbitraryFormula(e.target.value)}
                placeholder="1d20"
                aria-label="Formule de dé arbitraire"
                onKeyDown={e => { if (e.key === 'Enter') handleRollArbitrary() }}
              />
              <ArbitraryButton type="button" onClick={handleRollArbitrary} disabled={rollingArbitrary}>
                🎲 {rollingArbitrary ? '...' : 'Lancer'}
              </ArbitraryButton>
            </ArbitraryRollRow>
          </SectionCard>

          {characterTraits.length > 0 && (
            <SectionCard>
              <SectionTitle>Traits</SectionTitle>
              <TraitTagGrid>
                {[...traitsByType.normal, ...traitsByType.secret, ...traitsByType.defaut].map((trait) => {
                  const variant = trait.type.toLowerCase() === 'secret' ? 'secret' : trait.type.toLowerCase() === 'defaut' ? 'defaut' : 'normal'
                  return (
                    <TraitTagCard key={trait.slug} $variant={variant}>
                      <TraitName>{trait.name}</TraitName>
                      {trait.modifiers.length > 0 ? (
                        <TraitModifiers>
                          {trait.modifiers.map((modifier) => (
                            <TraitModifier key={`${trait.slug}-${modifier.statSlug}`}>
                              {modifier.value >= 0 ? '+' : ''}{modifier.value} {modifier.statSlug}
                            </TraitModifier>
                          ))}
                        </TraitModifiers>
                      ) : (
                        <TraitHint>Aucun modificateur</TraitHint>
                      )}
                    </TraitTagCard>
                  )
                })}
              </TraitTagGrid>
            </SectionCard>
          )}

          {itemNames.length > 0 && (
            <SectionCard>
              <SectionTitle>Objets</SectionTitle>
              <PillList>
                {itemNames.map((name, i) => (
                  <Pill key={i}>{name}</Pill>
                ))}
              </PillList>
            </SectionCard>
          )}

          {traitsByType.sorts.length > 0 && (
            <SectionCard>
              <SectionTitle>Sorts</SectionTitle>
              <TraitTagGrid>
                {traitsByType.sorts.map((trait) => (
                  <TraitTagCard
                    key={trait.slug}
                    $variant="sorts"
                    onClick={() => setSpellPopup({ slug: trait.slug, name: trait.name })}
                    style={{ cursor: 'pointer' }}
                    title={`Lancer ${trait.name}`}
                  >
                    <TraitName>{trait.name}</TraitName>
                    {trait.modifiers.length > 0 && (
                      <TraitModifiers>
                        {trait.modifiers.map((modifier) => (
                          <TraitModifier key={`${trait.slug}-${modifier.statSlug}`}>
                            {modifier.value >= 0 ? '+' : ''}{modifier.value} {modifier.statSlug}
                          </TraitModifier>
                        ))}
                      </TraitModifiers>
                    )}
                  </TraitTagCard>
                ))}
              </TraitTagGrid>
            </SectionCard>
          )}

          {resourcesForPanel.length > 0 && (
            <SectionCard>
              <SectionTitle>Ressources</SectionTitle>
              <ResourcesGrid>
                {resourcesForPanel.map(res => {
                  const resource = jdr.resources.find(r => r.slug === res.resourceSlug)
                  const isUpdating = updatingResource === res.resourceSlug
                  return (
                    <ResourceTile key={res.resourceSlug}>
                      <ResourceName>{resource?.name || res.resourceSlug}</ResourceName>
                      <ResourceValueRow>
                        <ResourceButton type="button" onClick={() => handleAdjustResource(res.resourceSlug, res.value, -1)} disabled={isUpdating || res.value <= 0}>-</ResourceButton>
                        <ResourceValue>{res.value}</ResourceValue>
                        <ResourceButton type="button" onClick={() => handleAdjustResource(res.resourceSlug, res.value, 1)} disabled={isUpdating}>+</ResourceButton>
                      </ResourceValueRow>
                    </ResourceTile>
                  )
                })}
              </ResourcesGrid>
            </SectionCard>
          )}
        </MainColumn>

        <SideColumn>
          <SectionCard>
            <SectionTitle>Flux des lancers</SectionTitle>
            <DiceRollFeed jdrSlug={jdr.slug} characterSlug={characterSlug} maxItems={15} />
          </SectionCard>
        </SideColumn>
      </ContentGrid>

      {spellPopup && (
        <SpellModalBackdrop onClick={() => setSpellPopup(null)}>
          <SpellModalCard onClick={(e) => e.stopPropagation()}>
            <SpellModalTitle>{spellPopup.name}</SpellModalTitle>
            <SpellModalHint>Choisis la stat pour lancer ce sort :</SpellModalHint>
            <SpellStatGrid>
              {jdr.stats.map((stat) => (
                <SpellStatButton
                  key={stat.slug}
                  type="button"
                  disabled={rolling === stat.slug}
                  onClick={async () => {
                    const name = spellPopup.name
                    setSpellPopup(null)
                    await handleRollDice(stat.slug, name)
                  }}
                >
                  {stat.name}
                </SpellStatButton>
              ))}
            </SpellStatGrid>
            <SpellModalClose type="button" onClick={() => setSpellPopup(null)}>Annuler</SpellModalClose>
          </SpellModalCard>
        </SpellModalBackdrop>
      )}
    </PageShell>
  )
}

const StatusShell = styled.div`
  min-height: 50vh;
  display: grid;
  place-items: center;
  color: #6f4f37;
  font-size: 1.05rem;
`

const PageShell = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 10% 12%, rgba(198, 150, 88, 0.22), transparent 30%),
    radial-gradient(circle at 90% 8%, rgba(142, 89, 49, 0.18), transparent 36%),
    linear-gradient(180deg, #f9edd4 0%, #f2dfbd 52%, #ecd6af 100%);
  color: #3b2926;
`

const CompactHeader = styled.section`
  position: relative;
  width: min(1500px, 100%);
  margin: 0 auto 0.85rem;
  border: 1px solid rgba(165, 121, 74, 0.36);
  border-radius: 14px;
  background: linear-gradient(140deg, rgba(248, 236, 210, 0.95) 0%, rgba(241, 224, 188, 0.95) 100%);
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(89, 55, 34, 0.15);
`

const HeroContent = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.65rem 0.8rem;

  @media (max-width: 900px) {
    grid-template-columns: 72px 1fr auto;
  }
`

const PortraitColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const PortraitFrame = styled.div`
  width: 88px;
  height: 110px;
  border-radius: 10px;
  border: 1px solid rgba(171, 125, 66, 0.52);
  background: linear-gradient(180deg, rgba(241, 224, 195, 0.92), rgba(226, 206, 168, 0.95));
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 900px) {
    width: 72px;
    height: 96px;
  }
`

const PvPanel = styled.div`
  border: 1px solid rgba(166, 117, 70, 0.4);
  border-radius: 10px;
  background: rgba(251, 241, 216, 0.88);
  padding: 0.38rem 0.45rem;
  box-shadow: 0 6px 16px rgba(108, 70, 40, 0.1);
`

const PvLabel = styled.div`
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a5631;
  text-align: center;
`

const PvValueRow = styled.div`
  margin-top: 0.15rem;
  display: grid;
  grid-template-columns: 1.5rem 1fr 1.5rem;
  align-items: center;
  gap: 0.3rem;
`

const PvButton = styled.button`
  padding: 0;
  height: 1.5rem;
  border-radius: 6px;
  border: 1px solid rgba(163, 110, 58, 0.42);
  background: linear-gradient(180deg, #8d5030, #6e3d28);
  color: #fff5dd;
  font-weight: 800;
`

const PvValue = styled.div`
  text-align: center;
  font-weight: 800;
  color: #4b2f2a;
`

const PortraitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
`

const HeroInfo = styled.div`
  min-width: 0;
`

const Overline = styled.div`
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-size: 0.68rem;
  color: #8a633c;
  margin-bottom: 0.25rem;
`

const CharacterTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.2rem, 1.8vw, 1.65rem);
  line-height: 1.1;
  color: #4c2f2d;
  text-shadow: 0 1px 0 rgba(255, 248, 230, 0.72);
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-top: 0.38rem;
`

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(167, 119, 64, 0.42);
  background: rgba(244, 229, 198, 0.8);
  border-radius: 999px;
  padding: 0.16rem 0.54rem;
  color: #5e3e35;
  font-size: 0.74rem;
`

const ContentGrid = styled.div`
  width: min(1500px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 1.1rem;

  @media (max-width: 1150px) {
    grid-template-columns: 1fr;
  }
`

const MainColumn = styled.div`
  display: grid;
  gap: 1rem;
`

const SideColumn = styled.aside`
  display: grid;
  gap: 1rem;
  align-content: start;
`

const SectionCard = styled.section`
  border: 1px solid rgba(171, 127, 81, 0.3);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(252, 243, 223, 0.9), rgba(244, 229, 197, 0.92));
  padding: 1rem;
  box-shadow: 0 8px 20px rgba(109, 70, 43, 0.13);
`

const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`

const RollStateControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const RollStateButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? 'rgba(172, 112, 61, 0.95)' : 'rgba(184, 138, 86, 0.4)')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? 'linear-gradient(180deg, rgba(153, 88, 43, 0.95), rgba(123, 69, 36, 0.95))' : 'rgba(245, 230, 197, 0.95)')};
  color: ${({ $active }) => ($active ? '#fff4de' : '#5b3f2e')};
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.26rem 0.62rem;
`

const SectionTitle = styled.h2`
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #5b3c2e;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.8rem;
`

const StatButton = styled.button`
  text-align: left;
  border: 1px solid rgba(179, 133, 83, 0.4);
  border-radius: 12px;
  background: linear-gradient(165deg, rgba(249, 237, 207, 0.96), rgba(239, 220, 183, 0.96));
  padding: 0.72rem 0.78rem;
  color: #4a2e2a;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;

  &:hover:enabled {
    filter: brightness(1.08);
    border-color: rgba(167, 110, 62, 0.75);
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`

const StatBaseHint = styled.small`
  color: #8d6b45;
  font-weight: 500;
`

const PillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const TraitTagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.6rem;
`

const TraitTagCard = styled.div<{ $variant: 'normal' | 'secret' | 'defaut' | 'sorts' }>`
  border: 2px solid ${({ $variant }) => {
    if ($variant === 'defaut') return 'rgba(171, 56, 56, 0.6)'
    if ($variant === 'secret') return 'rgba(28, 28, 28, 0.74)'
    if ($variant === 'sorts') return 'rgba(133, 96, 182, 0.58)'
    return 'rgba(62, 102, 184, 0.52)'
  }};
  border-radius: 12px;
  padding: 0.55rem 0.62rem;
  background: ${({ $variant }) => {
    if ($variant === 'defaut') return 'linear-gradient(165deg, rgba(250, 227, 223, 0.95), rgba(244, 208, 202, 0.95))'
    if ($variant === 'secret') return 'linear-gradient(165deg, rgba(236, 236, 236, 0.95), rgba(220, 220, 220, 0.95))'
    if ($variant === 'sorts') return 'linear-gradient(165deg, rgba(242, 235, 252, 0.96), rgba(226, 214, 244, 0.96))'
    return 'linear-gradient(165deg, rgba(235, 242, 252, 0.97), rgba(220, 231, 247, 0.97))'
  }};
`

const TraitName = styled.span`
  font-size: 0.96rem;
  color: #5f3f31;
  font-weight: 800;
`

const TraitModifiers = styled.div`
  margin-top: 0.48rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
`

const TraitModifier = styled.span`
  border: 1px solid rgba(175, 130, 81, 0.35);
  border-radius: 999px;
  padding: 0.14rem 0.5rem;
  font-size: 0.74rem;
  color: #66452f;
  background: rgba(246, 231, 199, 0.8);
`

const TraitHint = styled.span`
  margin-top: 0.48rem;
  display: inline-block;
  font-size: 0.75rem;
  color: #876446;
`

const Pill = styled.span`
  border: 1px solid rgba(177, 133, 82, 0.35);
  background: rgba(247, 233, 202, 0.86);
  border-radius: 999px;
  padding: 0.35rem 0.68rem;
  color: #5f4030;
  font-size: 0.87rem;
`

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem;
`

const ResourceTile = styled.div`
  border: 1px solid rgba(177, 136, 91, 0.28);
  border-radius: 10px;
  background: rgba(250, 239, 214, 0.9);
  padding: 0.58rem 0.7rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
`

const ResourceName = styled.span`
  color: #5f4235;
  font-size: 0.9rem;
`

const ResourceValueRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const ResourceButton = styled.button`
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(163, 110, 58, 0.42);
  background: linear-gradient(180deg, #8d5030, #6e3d28);
  color: #fff5dd;
  font-weight: 800;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ResourceValue = styled.span`
  color: #4b2f2a;
  font-size: 1.2rem;
  font-weight: 800;
`

const ArbitraryRollRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: center;
`

const ArbitraryInput = styled.input`
  width: 7rem;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.95rem;
  padding: 0.4rem 0.6rem;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  background: rgba(252, 243, 223, 0.85);
  color: var(--color-text);
  text-align: center;
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
`

const ArbitraryButton = styled.button`
  background: linear-gradient(135deg, #3a5a8a, #2c4571);
  color: #f0e6cc;
  border: 1px solid #2a3d5f;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4a6a9a, #3a5481);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const HousePointsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
`

const HousePill = styled.div<{ $bg: string; $textColor: string }>`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: ${({ $bg }) => $bg};
  border-radius: 999px;
  padding: 0.18rem 0.65rem 0.18rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`

const HousePillLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.75);
  text-transform: uppercase;
`

const HousePillValue = styled.span<{ $textColor?: string }>`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ $textColor }) => $textColor ?? '#fff'};
  font-family: 'Cinzel', Georgia, serif;
`

const SpellModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 12, 5, 0.55);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
`

const SpellModalCard = styled.div`
  background: linear-gradient(180deg, #fbeed1, #f1d9ad);
  border: 1px solid rgba(118, 76, 36, 0.45);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  width: min(420px, 100%);
  box-shadow: 0 18px 40px rgba(40, 22, 8, 0.35);
  color: #3b2926;
`

const SpellModalTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  color: #5a3712;
`

const SpellModalHint = styled.p`
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  color: #6f4f37;
`

const SpellStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
`

const SpellStatButton = styled.button`
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  border: 1px solid rgba(118, 76, 36, 0.4);
  background: #fff6e1;
  color: #3b2926;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  &:hover:not(:disabled) {
    background: #ffe6b3;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
`

const SpellModalClose = styled.button`
  margin-top: 0.9rem;
  width: 100%;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(118, 76, 36, 0.35);
  background: transparent;
  color: #6f4f37;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: rgba(118, 76, 36, 0.08);
  }
`
