import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DraftDto, JdrApiClient, JdrDto, TraitDto } from '../data/JdrApiClient'

export default function DraftPage() {
  const { jdrSlug, characterSlug } = useParams<{ jdrSlug: string; characterSlug: string }>()
  const navigate = useNavigate()

  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [draft, setDraft] = useState<DraftDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTraitSlug, setSelectedTraitSlug] = useState<string | null>(null)
  const [changingMind, setChangingMind] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const character = useMemo(
    () => jdr?.characters.find((c) => c.slug === characterSlug),
    [jdr, characterSlug]
  )

  const currentRound = draft?.rounds.find((round) => round.round === draft.currentRound)
  const availableTraits = useMemo(() => {
    if (!jdr || !draft || !characterSlug) return []
    return (draft.currentHandsByCharacter[characterSlug] ?? [])
      .map((slug) => jdr.traits.find((trait) => trait.slug === slug))
      .filter((trait): trait is TraitDto => Boolean(trait))
  }, [jdr, draft, characterSlug])

  const alreadyPickedByCharacter = characterSlug && currentRound?.picks ? currentRound.picks[characterSlug] : undefined
  const everyonePicked = Boolean(draft && currentRound && draft.characterOrder.every((slug) => Boolean(currentRound.picks[slug])))
  const canChangeMind = Boolean(alreadyPickedByCharacter && draft?.status === 'active' && !everyonePicked)
  const alreadyPickedLabel = alreadyPickedByCharacter === '__pass__'
    ? 'Ce personnage a passé son tour.'
    : alreadyPickedByCharacter
      ? `Ce personnage a validé: ${jdr?.traits.find((trait) => trait.slug === alreadyPickedByCharacter)?.name || alreadyPickedByCharacter}`
      : null

  const handleConfirmPick = async () => {
    if (!jdrSlug || !characterSlug || !selectedTraitSlug) return

    try {
      setSubmitting(true)
      const updatedDraft = await JdrApiClient.pickDraft(jdrSlug, characterSlug, selectedTraitSlug)
      setDraft(updatedDraft)
      setSelectedTraitSlug(null)
      setChangingMind(false)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePass = async () => {
    if (!jdrSlug || !characterSlug) return
    try {
      setSubmitting(true)
      const updatedDraft = await JdrApiClient.passDraft(jdrSlug, characterSlug)
      setDraft(updatedDraft)
      setSelectedTraitSlug(null)
      setChangingMind(false)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <StatusShell>Chargement du draft...</StatusShell>
  if (error) return <StatusShell>Erreur: {error}</StatusShell>
  if (!jdr || !character) return <StatusShell>Personnage non trouvé</StatusShell>
  if (!draft) return <StatusShell>Aucun draft actif.</StatusShell>

  if (character.groupSlug !== draft.groupSlug) {
    return <StatusShell>Ce personnage ne fait pas partie du draft actif.</StatusShell>
  }

  return (
    <PageShell>
      <HeaderCard>
        <HeaderTop>
          <div>
            <Overline>{jdr.name} · {draft.name}</Overline>
            <h1>{character.name}</h1>
          </div>
          <BackButton onClick={() => navigate(`/jdr/${jdrSlug}/characters/${characterSlug}`)}>Retour fiche</BackButton>
        </HeaderTop>

        <MetaRow>
          <MetaPill>Groupe: {draft.groupSlug}</MetaPill>
          <MetaPill>Type de traits: {draft.traitType}</MetaPill>
          <MetaPill>Tour {draft.currentRound}/{draft.totalRounds}</MetaPill>
        </MetaRow>
      </HeaderCard>

      <MainGrid>
        <SectionCard>
          <SectionTitle>Cartes de ce tour</SectionTitle>
          {alreadyPickedByCharacter && !changingMind ? (
            <WaitingBox>
              <span>{alreadyPickedLabel}</span>
              <small>En attente des autres joueuses...</small>
              {canChangeMind && <button onClick={() => setChangingMind(true)}>Changer d'avis</button>}
            </WaitingBox>
          ) : availableTraits.length === 0 ? (
            <WaitingBox>
              <span>Aucune carte disponible dans sa main.</span>
              <small>Ce personnage peut passer son tour.</small>
              <button onClick={handlePass} disabled={submitting}>Passer</button>
            </WaitingBox>
          ) : (
            <>
              {changingMind && alreadyPickedByCharacter && (
                <WaitingBox>
                  <span>Changer d'avis: le trait déjà validé est grisé.</span>
                  <small>Choisissez une autre carte ou revenez à l'attente.</small>
                  <button onClick={() => {
                    setChangingMind(false)
                    setSelectedTraitSlug(null)
                  }}>Revenir à l'attente</button>
                </WaitingBox>
              )}
            <CardGrid>
              {availableTraits.map((trait) => {
                const selected = selectedTraitSlug === trait.slug
                const isDefaut = trait.type.toLowerCase() === 'defaut'
                const isAlreadyChosen = alreadyPickedByCharacter === trait.slug
                return (
                  <TraitCard
                    key={trait.slug}
                    $isDefaut={isDefaut}
                    $selected={selected}
                    $disabled={Boolean(isAlreadyChosen && changingMind)}
                    disabled={Boolean(isAlreadyChosen && changingMind)}
                    onClick={() => {
                      if (isAlreadyChosen && changingMind) return
                      setSelectedTraitSlug(trait.slug)
                    }}
                  >
                    <TraitCardTitle>{trait.name}</TraitCardTitle>
                    <TraitCardType>{trait.type}</TraitCardType>
                    {isAlreadyChosen && changingMind && <TraitCardType>Déjà choisi</TraitCardType>}
                    <TraitModifiers>
                      {trait.modifiers.length === 0 && <TraitModifier>Pas de modificateur</TraitModifier>}
                      {trait.modifiers.map((modifier) => (
                        <TraitModifier key={`${trait.slug}-${modifier.statSlug}`}>
                          {modifier.value >= 0 ? '+' : ''}{modifier.value} {modifier.statSlug}
                        </TraitModifier>
                      ))}
                    </TraitModifiers>
                  </TraitCard>
                )
              })}
            </CardGrid>
            </>
          )}

          <ActionsRow>
            <ConfirmButton
              disabled={!selectedTraitSlug || submitting || (Boolean(alreadyPickedByCharacter) && !changingMind)}
              onClick={handleConfirmPick}
            >
              Confirmer la sélection
            </ConfirmButton>
          </ActionsRow>
        </SectionCard>

        <SectionCard>
          <SectionTitle>Etat du tour</SectionTitle>
          <PlayersList>
            {draft.characterOrder.map((slug) => {
              const char = jdr.characters.find((characterItem) => characterItem.slug === slug)
              const pickedTraitSlug = currentRound?.picks?.[slug]
              const pickedTraitName = pickedTraitSlug
                ? pickedTraitSlug === '__pass__'
                  ? 'A passé'
                  : jdr.traits.find((trait) => trait.slug === pickedTraitSlug)?.name || pickedTraitSlug
                : null

              return (
                <PlayerRow key={slug}>
                  <strong>{char?.name || slug}</strong>
                  <span>{pickedTraitName ? `A choisi: ${pickedTraitName}` : 'En attente'}</span>
                </PlayerRow>
              )
            })}
          </PlayersList>

          {everyonePicked && <RoundDone>Tour terminé. Passage au tour suivant...</RoundDone>}
        </SectionCard>
      </MainGrid>
    </PageShell>
  )
}

const StatusShell = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #dbe7ff;
`

const PageShell = styled.div`
  min-height: 100vh;
  padding: 1.4rem;
  background:
    radial-gradient(circle at 12% 15%, rgba(119, 148, 228, 0.23), transparent 30%),
    radial-gradient(circle at 85% 0%, rgba(230, 130, 60, 0.2), transparent 34%),
    linear-gradient(180deg, #0f1722 0%, #101927 45%, #0a101b 100%);
  color: #eaf2ff;
`

const HeaderCard = styled.section`
  width: min(1400px, 100%);
  margin: 0 auto 1rem;
  border: 1px solid rgba(139, 177, 248, 0.3);
  border-radius: 14px;
  padding: 0.9rem;
  background: rgba(12, 25, 42, 0.78);
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;

  h1 {
    margin: 0;
  }
`

const Overline = styled.div`
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  color: #9fbbe8;
`

const BackButton = styled.button`
  border: 1px solid rgba(145, 182, 244, 0.46);
  border-radius: 10px;
  padding: 0.42rem 0.75rem;
  background: rgba(24, 45, 70, 0.75);
  color: #edf5ff;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.7rem;
`

const MetaPill = styled.span`
  border: 1px solid rgba(145, 182, 244, 0.4);
  border-radius: 999px;
  padding: 0.18rem 0.62rem;
  background: rgba(17, 34, 54, 0.75);
  font-size: 0.8rem;
`

const MainGrid = styled.div`
  width: min(1400px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;

  @media (max-width: 1050px) {
    grid-template-columns: 1fr;
  }
`

const SectionCard = styled.section`
  border: 1px solid rgba(126, 166, 238, 0.26);
  border-radius: 14px;
  padding: 0.95rem;
  background: rgba(12, 23, 37, 0.83);
`

const SectionTitle = styled.h2`
  margin: 0 0 0.8rem;
  font-size: 1rem;
`

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.7rem;
`

const TraitCard = styled.button<{ $isDefaut: boolean; $selected: boolean; $disabled: boolean }>`
  border: 2px solid
    ${({ $isDefaut, $selected }) =>
      $selected ? 'rgba(255, 209, 95, 0.9)' : $isDefaut ? 'rgba(20, 20, 20, 0.95)' : 'rgba(138, 176, 238, 0.46)'};
  border-radius: 12px;
  text-align: left;
  padding: 0.65rem;
  background: ${({ $isDefaut }) =>
    $isDefaut
      ? 'linear-gradient(155deg, rgba(52, 25, 25, 0.78), rgba(25, 17, 18, 0.93))'
      : 'linear-gradient(155deg, rgba(22, 38, 60, 0.86), rgba(14, 25, 40, 0.9))'};
  color: #eaf2ff;
  display: grid;
  gap: 0.46rem;
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};

  &:disabled {
    opacity: 0.45;
  }
`

const TraitCardTitle = styled.strong`
  font-size: 0.95rem;
`

const TraitCardType = styled.span`
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b5caea;
`

const TraitModifiers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
`

const TraitModifier = styled.span`
  border: 1px solid rgba(170, 202, 255, 0.28);
  border-radius: 999px;
  padding: 0.12rem 0.44rem;
  font-size: 0.72rem;
`

const ActionsRow = styled.div`
  margin-top: 0.8rem;
  display: flex;
  justify-content: flex-end;
`

const ConfirmButton = styled.button`
  border: 2px solid rgba(255, 205, 90, 0.85);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 164, 72, 0.96), rgba(234, 99, 45, 0.96));
  color: #fff8ec;
  font-weight: 800;
  padding: 0.46rem 0.95rem;

  &:disabled {
    opacity: 0.45;
  }
`

const WaitingBox = styled.div`
  border: 1px solid rgba(136, 172, 236, 0.34);
  border-radius: 12px;
  background: rgba(15, 29, 48, 0.8);
  padding: 0.72rem;
  display: grid;
  gap: 0.2rem;

  small {
    color: #b8cae6;
  }
`

const PlayersList = styled.div`
  display: grid;
  gap: 0.48rem;
`

const PlayerRow = styled.div`
  border: 1px solid rgba(126, 164, 236, 0.24);
  border-radius: 10px;
  background: rgba(17, 30, 49, 0.72);
  padding: 0.5rem 0.56rem;
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;

  span {
    color: #c5d9f8;
    font-size: 0.84rem;
  }
`

const RoundDone = styled.div`
  margin-top: 0.7rem;
  color: #ffd595;
  font-size: 0.86rem;
  font-weight: 700;
`
