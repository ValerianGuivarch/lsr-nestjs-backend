import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DraftDto, JdrApiClient, JdrDto, TraitDto, CharacterDto } from '../data/JdrApiClient'

export default function DraftFeedPage() {
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const navigate = useNavigate()

  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [draft, setDraft] = useState<DraftDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jdrSlug) return

    const refresh = async () => {
      try {
        const [jdrData, draftData] = await Promise.all([
          JdrApiClient.findOneBySlug(jdrSlug),
          JdrApiClient.getActiveDraft(jdrSlug)
        ])
        setJdr(jdrData)
        setDraft(draftData)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    refresh()
    const id = setInterval(refresh, 2500)
    return () => clearInterval(id)
  }, [jdrSlug])

  const groupCharacters = useMemo(() => {
    if (!jdr || !draft) return []
    return jdr.characters.filter((c) => c.groupSlugs.includes(draft.groupSlug))
  }, [jdr, draft])

  const characterMap = useMemo(() => {
    if (!jdr) return new Map<string, CharacterDto>()
    return new Map(jdr.characters.map((c) => [c.slug, c]))
  }, [jdr])

  const traitMap = useMemo(() => {
    if (!jdr) return new Map<string, TraitDto>()
    return new Map(jdr.traits.map((t) => [t.slug, t]))
  }, [jdr])

  const currentRound = draft?.rounds.find((r) => r.round === draft.currentRound)
  const progressPercent = draft ? ((draft.currentRound - 1) / draft.totalRounds) * 100 : 0

  if (loading) return <PageShell>Chargement du draft...</PageShell>
  if (error) return <PageShell>Erreur: {error}</PageShell>
  if (!jdr || !draft) return <PageShell>Aucun draft actif.</PageShell>

  const isDraftCompleted = draft.status === 'completed'

  return (
    <PageShell>
      <HeaderCard>
        <HeaderTop>
          <div>
            <Overline>{jdr.name} · {draft.name} · Draft Feed</Overline>
            <h1>Distribution de traits</h1>
          </div>
          <ActionButtons>
            <BackButton onClick={() => navigate(`/jdr/${jdrSlug}/mj`)}>Retour MJ</BackButton>
          </ActionButtons>
        </HeaderTop>

        <MetaRow>
          <MetaPill>Groupe: {draft.groupSlug}</MetaPill>
          <MetaPill>Type: {draft.traitType}</MetaPill>
          <MetaPill>
            Tour {draft.currentRound}/{draft.totalRounds}
            {isDraftCompleted && ' ✓ Terminé'}
          </MetaPill>
        </MetaRow>

        <ProgressBar>
          <ProgressFill $percent={progressPercent} />
        </ProgressBar>
      </HeaderCard>

      <MainContent>
        <CharacterGridSection>
          <SectionTitle>État du tour {draft.currentRound}</SectionTitle>
          <CharacterGrid>
            {draft.characterOrder.map((characterSlug) => {
              const character = characterMap.get(characterSlug)
              const picked = currentRound?.picks[characterSlug]
              const pickedTrait = picked ? traitMap.get(picked) : null
              const hand = draft.currentHandsByCharacter[characterSlug] ?? []

              return (
                <CharacterStatus key={characterSlug} $isDone={Boolean(picked)}>
                  <CharacterName>
                    {character?.name || characterSlug}
                    {picked && <StatusBadge $isDone>✓ Choisi</StatusBadge>}
                    {!picked && <StatusBadge>En attente...</StatusBadge>}
                  </CharacterName>

                  {pickedTrait && (
                    <PickedTrait $isDefaut={pickedTrait.type.toLowerCase() === 'défaut'}>
                      <PickedTraitName>{pickedTrait.name}</PickedTraitName>
                      <PickedTraitType>{pickedTrait.type}</PickedTraitType>
                    </PickedTrait>
                  )}

                  {!picked && (
                    <HandPreview>
                      <HandLabel>{hand.length} cartes en main</HandLabel>
                      <HandCards>
                        {hand.slice(0, 3).map((traitSlug) => {
                          const trait = traitMap.get(traitSlug)
                          return (
                            <HandCardPreview key={traitSlug} $isDefaut={trait?.type.toLowerCase() === 'défaut'}>
                              {trait?.name || traitSlug}
                            </HandCardPreview>
                          )
                        })}
                        {hand.length > 3 && <HandCardPreview>+{hand.length - 3}</HandCardPreview>}
                      </HandCards>
                    </HandPreview>
                  )}
                </CharacterStatus>
              )
            })}
          </CharacterGrid>
        </CharacterGridSection>

        {isDraftCompleted && (
          <CompletionBanner>
            <div>✨ Draft terminé! Les traits ont été distribués.</div>
          </CompletionBanner>
        )}
      </MainContent>
    </PageShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const PageShell = styled.div`
  min-height: 100vh;
  background: var(--color-bg-main);
  color: var(--color-text-main);
  padding: 1.5rem;
`

const HeaderCard = styled.div`
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;

  h1 {
    font-size: 1.75rem;
    margin: 0;
    font-weight: 600;
  }
`

const Overline = styled.div`
  font-size: 0.875rem;
  color: var(--color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: var(--color-bg-hover);
  }
`

const MetaRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`

const MetaPill = styled.div`
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--color-secondary);
`

const ProgressBar = styled.div`
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
`

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #06b6d4);
  width: ${(p) => p.$percent}%;
  transition: width 0.3s ease;
`

const MainContent = styled.div`
  max-width: 1200px;
`

const CharacterGridSection = styled.div``

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
`

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`

const CharacterStatus = styled.div<{ $isDone: boolean }>`
  background: var(--color-bg-card);
  border: 2px solid ${(p) => (p.$isDone ? '#10b981' : 'var(--color-border)')};
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  ${(p) =>
    p.$isDone &&
    `
    background: rgba(16, 185, 129, 0.05);
  `}
`

const CharacterName = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatusBadge = styled.span<{ $isDone?: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: ${(p) => (p.$isDone ? '#10b981' : '#f59e0b')};
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const PickedTrait = styled.div<{ $isDefaut: boolean }>`
  background: var(--color-bg-secondary);
  border-left: 4px solid ${(p) => (p.$isDefaut ? '#ef4444' : '#0ea5e9')};
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
`

const PickedTraitName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const PickedTraitType = styled.div`
  font-size: 0.875rem;
  color: var(--color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const HandPreview = styled.div`
  margin-top: 0.75rem;
`

const HandLabel = styled.div`
  font-size: 0.875rem;
  color: var(--color-secondary);
  margin-bottom: 0.5rem;
`

const HandCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const HandCardPreview = styled.div<{ $isDefaut?: boolean }>`
  padding: 0.5rem;
  background: ${(p) => (p.$isDefaut ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 165, 233, 0.1)')};
  border: 1px solid ${(p) => (p.$isDefaut ? '#fee2e2' : '#e0f2fe')};
  border-radius: 3px;
  font-size: 0.875rem;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CompletionBanner = styled.div`
  background: #10b98124;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  font-weight: 600;
  color: #10b981;
  font-size: 1.125rem;
  margin-top: 2rem;
`
