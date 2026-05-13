import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { MdEdit } from 'react-icons/md'
import { JdrApiClient, JdrDto, DiceRollDto, DraftDto } from '../data/JdrApiClient'
import { DiceRollFeed } from '../components/DiceRollFeed'

export default function CharacterPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rolling, setRolling] = useState<string | null>(null)
  const [, setLastRoll] = useState<DiceRollDto | null>(null)
  const [portraitIndex, setPortraitIndex] = useState(0)
  const [draft, setDraft] = useState<DraftDto | null>(null)

  useEffect(() => {
    if (!jdrSlug) return
    const fetchJdr = async () => {
      try {
        setLoading(true)
        const data = await JdrApiClient.findOneBySlug(jdrSlug)
        setJdr(data)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchJdr()
  }, [jdrSlug])

  const character = jdr?.characters.find(c => c.slug === characterSlug)

  const portraitName = character?.name ?? ''
  const portraitSlug = character?.slug ?? ''

  const portraitCandidates = useMemo(() => {
    if (!portraitName && !portraitSlug) {
      return ['/l7r/placeholder.png']
    }

    const candidates = [
      `/l7r/${portraitName}.png`,
      `/l7r/${portraitSlug}.png`,
      `/l7r/${portraitName.toLowerCase()}.png`,
      `/l7r/${portraitSlug.toLowerCase()}.png`
    ].filter(Boolean)

    return Array.from(new Set(candidates))
  }, [portraitName, portraitSlug])

  useEffect(() => {
    setPortraitIndex(0)
  }, [portraitName, portraitSlug])

  useEffect(() => {
    if (!jdrSlug) return

    const refreshDraft = async () => {
      try {
        const activeDraft = await JdrApiClient.getActiveDraft(jdrSlug)
        setDraft(activeDraft)
      } catch {
        setDraft(null)
      }
    }

    refreshDraft()
    const id = setInterval(refreshDraft, 2500)
    return () => clearInterval(id)
  }, [jdrSlug])

  const handleRollDice = async (statSlug: string) => {
    if (!jdrSlug || !characterSlug) return
    try {
      setRolling(statSlug)
      const roll = await JdrApiClient.rollDice(jdrSlug, characterSlug, statSlug)
      setLastRoll(roll)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setRolling(null)
    }
  }

  if (loading) return <StatusShell>Chargement du personnage...</StatusShell>
  if (error) return <StatusShell>Erreur: {error}</StatusShell>
  if (!jdr || !character) return <StatusShell>Personnage non trouvé</StatusShell>

  const selectedClass = character.classSlug ? jdr.classes.find(c => c.slug === character.classSlug) : undefined
  const selectedGroup = character.groupSlug ? jdr.groups.find(g => g.slug === character.groupSlug) : undefined
  const activeRound = draft?.rounds.find(round => round.round === draft.currentRound)

  const characterTraits = character.traitSlugs
    .map(slug => jdr.traits.find(t => t.slug === slug))
    .filter((trait): trait is NonNullable<typeof trait> => Boolean(trait))

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
          <PortraitFrame>
            <PortraitImage
              src={portraitCandidates[portraitIndex]}
              alt={character.name}
              onError={() => {
                setPortraitIndex((prev) => (prev < portraitCandidates.length - 1 ? prev + 1 : prev))
              }}
            />
          </PortraitFrame>

          <HeroInfo>
            <Overline>{jdr.name} · Fiche de personnage</Overline>
            <CharacterTitle>{character.name}</CharacterTitle>
            <TagRow>
              {selectedClass && <Tag>Classe: {selectedClass.name} (Lvl {selectedClass.level})</Tag>}
              {selectedGroup && <Tag>Groupe: {selectedGroup.name}</Tag>}
              {!selectedClass && <Tag>Classe: Aucune</Tag>}
            </TagRow>
            {draft && selectedGroup?.slug === draft.groupSlug && (
              <DraftCtaButton onClick={() => navigate(`/jdr/${jdrSlug}/characters/${characterSlug}/draft`)}>
                DRAFT
                <DraftSubLabel>
                  Tour {draft.currentRound}/{draft.totalRounds}
                  {activeRound?.picks?.[character.slug] ? ' · Choix validé' : ' · Choix à faire'}
                </DraftSubLabel>
              </DraftCtaButton>
            )}
          </HeroInfo>

          <EditIconButton
            onClick={() => navigate(`/jdr/${jdrSlug}/characters/${characterSlug}/edit`)}
            aria-label="Éditer le personnage"
            title="Éditer"
          >
            <MdEdit size={20} />
          </EditIconButton>
        </HeroContent>
      </CompactHeader>

      <ContentGrid>
        <MainColumn>
          {characterTraits.length > 0 && (
            <SectionCard>
              <SectionTitle>Traits actifs</SectionTitle>
              <TraitTagGrid>
                {characterTraits.map((trait) => (
                  <TraitTagCard key={trait.slug} $isDefaut={trait.type.toLowerCase() === 'defaut'}>
                    <TraitTagTop>
                      <TraitName>{trait.name}</TraitName>
                      <TraitTypeBadge $type={trait.type}>{trait.type}</TraitTypeBadge>
                    </TraitTagTop>
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
                ))}
              </TraitTagGrid>
            </SectionCard>
          )}

          {character.text && (
            <SectionCard>
              <SectionTitle>Description</SectionTitle>
              <CharacterDescription>{character.text}</CharacterDescription>
            </SectionCard>
          )}

          <SectionCard>
            <SectionTitle>Stats</SectionTitle>
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
          </SectionCard>

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

          {character.resources.length > 0 && (
            <SectionCard>
              <SectionTitle>Ressources</SectionTitle>
              <ResourcesGrid>
                {character.resources.map(res => {
                  const resource = jdr.resources.find(r => r.slug === res.resourceSlug)
                  return (
                    <ResourceTile key={res.resourceSlug}>
                      <ResourceName>{resource?.name || res.resourceSlug}</ResourceName>
                      <ResourceValue>{res.value}</ResourceValue>
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
            <DiceRollFeed jdrSlug={jdrSlug!} characterSlug={characterSlug} maxItems={15} jdrData={jdr} />
          </SectionCard>
        </SideColumn>
      </ContentGrid>
    </PageShell>
  )
}

const StatusShell = styled.div`
  min-height: 50vh;
  display: grid;
  place-items: center;
  color: #dbe7ff;
  font-size: 1.05rem;
`

const PageShell = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 15% 20%, rgba(100, 160, 255, 0.2), transparent 28%),
    radial-gradient(circle at 80% 0%, rgba(240, 110, 60, 0.16), transparent 34%),
    linear-gradient(180deg, #0f1722 0%, #141d2b 45%, #0d1320 100%);
  color: #ecf3ff;
`

const CompactHeader = styled.section`
  position: relative;
  width: min(1500px, 100%);
  margin: 0 auto 0.85rem;
  border: 1px solid rgba(130, 170, 255, 0.28);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(14, 25, 40, 0.9) 0%, rgba(20, 37, 58, 0.88) 100%);
  overflow: hidden;
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

const PortraitFrame = styled.div`
  width: 88px;
  height: 110px;
  border-radius: 10px;
  border: 1px solid rgba(166, 194, 255, 0.44);
  background: linear-gradient(180deg, rgba(27, 41, 62, 0.9), rgba(12, 19, 31, 0.95));
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 900px) {
    width: 72px;
    height: 96px;
  }
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
  color: #9ab5df;
  margin-bottom: 0.25rem;
`

const CharacterTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.2rem, 1.8vw, 1.65rem);
  line-height: 1.1;
  color: #f4f8ff;
  text-shadow: 0 0 12px rgba(149, 201, 255, 0.12);
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
  border: 1px solid rgba(146, 178, 245, 0.38);
  background: rgba(14, 27, 46, 0.64);
  border-radius: 999px;
  padding: 0.16rem 0.54rem;
  color: #c6ddff;
  font-size: 0.74rem;
`

const DraftCtaButton = styled.button`
  margin-top: 0.6rem;
  width: fit-content;
  border: 2px solid rgba(255, 208, 112, 0.88);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 160, 66, 0.96), rgba(232, 96, 45, 0.96));
  color: #fff9ee;
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: 0.05em;
  padding: 0.36rem 0.92rem;
  display: grid;
  justify-items: start;
  box-shadow: 0 0 0 2px rgba(18, 28, 42, 0.55), 0 10px 24px rgba(0, 0, 0, 0.35);
  animation: pulse 1.8s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
`

const DraftSubLabel = styled.span`
  font-size: 0.67rem;
  letter-spacing: 0.04em;
`

const CharacterDescription = styled.p`
  margin: 0;
  max-width: 90ch;
  color: #d6e4fb;
  line-height: 1.6;
`

const EditIconButton = styled.button`
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid rgba(146, 183, 255, 0.48);
  background: linear-gradient(180deg, rgba(54, 91, 142, 0.95), rgba(32, 61, 101, 0.95));
  color: #eff5ff;
  display: grid;
  place-items: center;

  &:hover {
    filter: brightness(1.08);
  }
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
  border: 1px solid rgba(130, 168, 240, 0.25);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(16, 30, 49, 0.82), rgba(11, 20, 34, 0.88));
  padding: 1rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.26);
`

const SectionTitle = styled.h2`
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #f5f8ff;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.8rem;
`

const StatButton = styled.button`
  text-align: left;
  border: 1px solid rgba(124, 170, 246, 0.35);
  border-radius: 12px;
  background: linear-gradient(165deg, rgba(21, 37, 60, 0.85), rgba(11, 20, 34, 0.84));
  padding: 0.72rem 0.78rem;
  color: #eef5ff;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;

  &:hover:enabled {
    filter: brightness(1.08);
    border-color: rgba(170, 205, 255, 0.6);
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`

const StatBaseHint = styled.small`
  color: #99b4db;
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

const TraitTagCard = styled.div<{ $isDefaut: boolean }>`
  border: 2px solid ${({ $isDefaut }) => ($isDefaut ? 'rgba(18, 18, 18, 0.95)' : 'rgba(135, 176, 245, 0.34)')};
  border-radius: 12px;
  padding: 0.55rem 0.62rem;
  background: ${({ $isDefaut }) =>
    $isDefaut
      ? 'linear-gradient(165deg, rgba(52, 25, 25, 0.78), rgba(23, 16, 18, 0.92))'
      : 'linear-gradient(165deg, rgba(21, 39, 61, 0.86), rgba(13, 22, 36, 0.9))'};
`

const TraitTagTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`

const TraitName = styled.span`
  font-size: 0.96rem;
  color: #e7f1ff;
  font-weight: 800;
`

const TraitTypeBadge = styled.span<{ $type: string }>`
  border-radius: 999px;
  padding: 0.12rem 0.52rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${({ $type }) => ($type.toLowerCase() === 'defaut' ? '#ffe8e8' : '#eef6ff')};
  background: ${({ $type }) => {
    const lowered = $type.toLowerCase()
    if (lowered === 'defaut') return 'rgba(138, 45, 45, 0.72)'
    if (lowered === 'objet') return 'rgba(133, 90, 22, 0.66)'
    if (lowered === 'secret') return 'rgba(88, 66, 146, 0.72)'
    return 'rgba(33, 82, 151, 0.68)'
  }};
`

const TraitModifiers = styled.div`
  margin-top: 0.48rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
`

const TraitModifier = styled.span`
  border: 1px solid rgba(171, 201, 255, 0.3);
  border-radius: 999px;
  padding: 0.14rem 0.5rem;
  font-size: 0.74rem;
  color: #d9e9ff;
  background: rgba(13, 31, 53, 0.6);
`

const TraitHint = styled.span`
  margin-top: 0.48rem;
  display: inline-block;
  font-size: 0.75rem;
  color: #9ab3d8;
`

const Pill = styled.span`
  border: 1px solid rgba(155, 193, 255, 0.3);
  background: rgba(16, 32, 54, 0.75);
  border-radius: 999px;
  padding: 0.35rem 0.68rem;
  color: #d8e8ff;
  font-size: 0.87rem;
`

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem;
`

const ResourceTile = styled.div`
  border: 1px solid rgba(129, 163, 229, 0.23);
  border-radius: 10px;
  background: rgba(14, 29, 49, 0.7);
  padding: 0.58rem 0.7rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
`

const ResourceName = styled.span`
  color: #d7e7ff;
  font-size: 0.9rem;
`

const ResourceValue = styled.span`
  color: #ffe09f;
  font-size: 1.2rem;
  font-weight: 800;
`

