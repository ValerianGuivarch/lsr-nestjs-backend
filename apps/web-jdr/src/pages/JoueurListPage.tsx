import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { JdrApiClient, JdrDto, CharacterDto } from '../data/JdrApiClient'

const HOUSE_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  gryffondor: { bg: 'linear-gradient(135deg, #7f1d1d, #9b2626)', border: '#c0392b', label: '#ffd700' },
  serpentard: { bg: 'linear-gradient(135deg, #1a3a2a, #1f4d38)', border: '#27ae60', label: '#c0c0c0' },
  serdaigle: { bg: 'linear-gradient(135deg, #1a2a4a, #1e3665)', border: '#2980b9', label: '#cd7f32' },
  poufsouffle: { bg: 'linear-gradient(135deg, #4a3a0a, #5c4a10)', border: '#d4ac0d', label: '#000000' },
}

export default function JoueurListPage() {
  const navigate = useNavigate()
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jdrSlug) return
    JdrApiClient.findOneBySlug(jdrSlug)
      .then(setJdr)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [jdrSlug])

  if (loading) return <StatusShell>Chargement...</StatusShell>
  if (error) return <StatusShell>Erreur : {error}</StatusShell>
  if (!jdr) return <StatusShell>JdR introuvable.</StatusShell>

  const playableCharacters = jdr.characters.filter((c) => c.isPlayable)

  return (
    <PageShell>
      <PageHeader>
        <BackButton type="button" onClick={() => navigate(`/jdr/${jdrSlug}/mj`)}>
          ← MJ
        </BackButton>
        <PageTitle>{jdr.name} — Personnages jouables</PageTitle>
      </PageHeader>

      {playableCharacters.length === 0 && (
        <EmptyState>Aucun personnage jouable configuré pour ce JdR.</EmptyState>
      )}

      <CharacterGrid>
        {playableCharacters.map((character) => (
          <CharacterCard
            key={character.slug}
            character={character}
            jdr={jdr}
            onClick={() => navigate(`/jdr/${jdrSlug}/characters/${character.slug}`)}
          />
        ))}
      </CharacterGrid>
    </PageShell>
  )
}

function CharacterCard({
  character,
  jdr,
  onClick
}: {
  character: CharacterDto
  jdr: JdrDto
  onClick: () => void
}) {
  const group = jdr.groups.find((g) => character.groupSlugs.includes(g.slug))
  const klass = jdr.classes.find((c) => c.slug === character.classSlug)
  const houseStyle = character.groupSlugs[0] ? HOUSE_COLORS[character.groupSlugs[0]] : undefined

  const portraitSrc = `/l7r/portraits/${jdr.slug}/${character.slug}.jpg`

  return (
    <CardWrapper
      onClick={onClick}
      $bgGradient={houseStyle?.bg}
      $borderColor={houseStyle?.border}
    >
      <CardPortrait>
        <PortraitImg
          src={portraitSrc}
          alt={character.name}
          onError={(e) => { (e.target as HTMLImageElement).src = '/l7r/placeholder.png' }}
        />
      </CardPortrait>
      <CardBody>
        <CardName $labelColor={houseStyle?.label}>{character.name}</CardName>
        {group && <CardTag>{group.name}</CardTag>}
        {klass && <CardTag>Lvl {klass.level} {klass.name}</CardTag>}
      </CardBody>
    </CardWrapper>
  )
}

const StatusShell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  font-size: 1.1rem;
  color: var(--color-secondary, #8a633c);
`

const PageShell = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
`

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const BackButton = styled.button`
  background: rgba(244, 229, 197, 0.7);
  border: 1px solid rgba(171, 127, 81, 0.35);
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.85rem;
  color: #5b3b2e;
  cursor: pointer;
  &:hover { background: rgba(244, 229, 197, 0.95); }
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  color: #4c2f2d;
`

const EmptyState = styled.p`
  text-align: center;
  color: #8a6744;
  padding: 2rem;
`

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`

const CardWrapper = styled.div<{ $bgGradient?: string; $borderColor?: string }>`
  border-radius: 14px;
  border: 1.5px solid ${({ $borderColor }) => $borderColor ?? 'rgba(171, 127, 81, 0.4)'};
  background: ${({ $bgGradient }) => $bgGradient ?? 'linear-gradient(135deg, rgba(252, 243, 223, 0.9), rgba(244, 229, 197, 0.92))'};
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  }
`

const CardPortrait = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.15);
`

const PortraitImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
`

const CardBody = styled.div`
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const CardName = styled.div<{ $labelColor?: string }>`
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ $labelColor }) => $labelColor ?? '#f5e6cc'};
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`

const CardTag = styled.div`
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  width: fit-content;
`
