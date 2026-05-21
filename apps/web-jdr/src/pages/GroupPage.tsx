import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { JdrApiClient, JdrDto } from '../data/JdrApiClient'

const HOUSE_SLUGS = ['gryffondor', 'serpentard', 'serdaigle', 'poufsouffle'] as const
const HOUSE_META: Record<string, { label: string; bg: string; textColor: string; border: string }> = {
  gryffondor:  { label: 'Gryffondor',  bg: 'linear-gradient(135deg, #7f1d1d, #9b2626)', textColor: '#ffd700', border: 'rgba(255, 215, 0, 0.4)' },
  serpentard:  { label: 'Serpentard',  bg: 'linear-gradient(135deg, #1a3a2a, #1f4d38)', textColor: '#c0c0c0', border: 'rgba(192, 192, 192, 0.4)' },
  serdaigle:   { label: 'Serdaigle',   bg: 'linear-gradient(135deg, #1a2a4a, #1e3665)', textColor: '#cd7f32', border: 'rgba(205, 127, 50, 0.4)' },
  poufsouffle: { label: 'Poufsouffle', bg: 'linear-gradient(135deg, #4a3a0a, #5c4a10)', textColor: '#f0d060', border: 'rgba(240, 208, 96, 0.4)' },
}

const TRAIT_LIMITS = { normal: 3, defaut: 1, objet: 1, sorts: 3 }

export default function GroupPage() {
  const { jdrSlug, groupSlug } = useParams<{ jdrSlug: string; groupSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingPoints, setUpdatingPoints] = useState<string | null>(null)

  const loadJdr = async () => {
    if (!jdrSlug) return
    try {
      setJdr(await JdrApiClient.findOneBySlug(jdrSlug))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJdr() }, [jdrSlug])

  const handleAdjustPoints = async (resourceSlug: string, delta: number, currentValue: number) => {
    if (!jdrSlug || updatingPoints) return
    try {
      setUpdatingPoints(resourceSlug)
      setJdr(await JdrApiClient.updateGroupResource(jdrSlug, resourceSlug, Math.max(0, currentValue + delta)))
    } catch (e) {
      alert('Erreur: ' + (e as Error).message)
    } finally {
      setUpdatingPoints(null)
    }
  }

  if (loading) return <PageShell>Chargement...</PageShell>
  if (error)   return <PageShell>Erreur: {error}</PageShell>
  if (!jdr)    return <PageShell>JdR non trouvé</PageShell>

  const group = jdr.groups.find(g => g.slug === groupSlug)
  if (!group)  return <PageShell>Groupe non trouvé</PageShell>

  const members = jdr.characters.filter(c => c.groupSlugs.includes(group.slug))

  const isHpJdr =
    jdr.name.toLowerCase().includes('hp') ||
    jdr.classes.some((k) => k.slug === 'eleve' || k.slug === 'sorcier') ||
    jdr.groups.some((g) => ['gryffondor', 'serpentard', 'serdaigle', 'poufsouffle'].includes(g.slug))

  const housePoints = isHpJdr
    ? HOUSE_SLUGS.map((hs) => {
        const resourceSlug = `points-${hs}`
        const gr = jdr.groupResources.find(r => r.resourceSlug === resourceSlug)
        const meta = HOUSE_META[hs]
        return gr !== undefined ? { houseSlug: hs, resourceSlug, ...meta, value: gr.value } : null
      }).filter((h): h is NonNullable<typeof h> => h !== null)
    : null

  return (
    <PageShell>
      {/* ── Header ────────────────────────────────────────────── */}
      <HeaderCard>
        <HeaderBack onClick={() => navigate(-1)}>← Retour</HeaderBack>
        <HeaderTitle>{group.name}</HeaderTitle>
        <HeaderMeta>{members.length} membre{members.length !== 1 ? 's' : ''}</HeaderMeta>
        {group.text && <HeaderDesc>{group.text}</HeaderDesc>}
      </HeaderCard>

      {/* ── Points des maisons (HP uniquement) ────────────────── */}
      {housePoints && housePoints.length > 0 && (
        <HouseSection>
          <SectionTitle>Points des maisons</SectionTitle>
          <HouseGrid>
            {housePoints.map(h => (
              <HouseCard key={h.houseSlug} $bg={h.bg} $border={h.border}>
                <HouseLabel $textColor={h.textColor}>{h.label}</HouseLabel>
                <HouseControls>
                  <HouseBtn
                    onClick={() => handleAdjustPoints(h.resourceSlug, -1, h.value)}
                    disabled={updatingPoints === h.resourceSlug || h.value <= 0}
                    $textColor={h.textColor}
                  >−</HouseBtn>
                  <HouseValue $textColor={h.textColor}>{h.value}</HouseValue>
                  <HouseBtn
                    onClick={() => handleAdjustPoints(h.resourceSlug, +1, h.value)}
                    disabled={updatingPoints === h.resourceSlug}
                    $textColor={h.textColor}
                  >+</HouseBtn>
                </HouseControls>
              </HouseCard>
            ))}
          </HouseGrid>
        </HouseSection>
      )}

      {/* ── Feed des membres ──────────────────────────────────── */}
      <SectionTitle style={{ marginBottom: '0.75rem' }}>Membres</SectionTitle>
      {members.length === 0 ? (
        <EmptyHint>Aucun membre dans ce groupe.</EmptyHint>
      ) : (
        <MemberFeed>
          {members.map(character => {
            const allTraits = character.traitSlugs
              .map(slug => jdr.traits.find(t => t.slug === slug))
              .filter((t): t is NonNullable<typeof t> => Boolean(t))

            const normaux = allTraits.filter(t => t.type.toLowerCase() === 'normal').slice(0, TRAIT_LIMITS.normal)
            const defauts = allTraits.filter(t => t.type.toLowerCase() === 'defaut').slice(0, TRAIT_LIMITS.defaut)
            const objets  = allTraits.filter(t => t.type.toLowerCase() === 'objet').slice(0, TRAIT_LIMITS.objet)
            const sorts   = allTraits.filter(t => t.type.toLowerCase() === 'sorts').slice(0, TRAIT_LIMITS.sorts)

            const allVisible = [...normaux, ...defauts, ...objets, ...sorts]
            const klass = character.classSlug ? jdr.classes.find(c => c.slug === character.classSlug) : undefined

            return (
              <MemberCard
                key={character.slug}
                onClick={() => navigate(`/jdr/${jdrSlug}/characters/${character.slug}`)}
              >
                <CardHeader>
                  <Portrait
                    src={`/l7r/portraits/${jdrSlug}/${character.slug}.jpg`}
                    alt={character.name}
                    onError={e => { (e.target as HTMLImageElement).src = '/l7r/placeholder.png' }}
                  />
                  <CardMeta>
                    <MemberName>{character.name}</MemberName>
                    {klass && (
                      <MemberClass>
                        {klass.name}{character.classLevel > 1 ? ` — Niv. ${character.classLevel}` : ''}
                      </MemberClass>
                    )}
                  </CardMeta>
                </CardHeader>

                {allVisible.length > 0 && (
                  <TraitSection onClick={e => e.stopPropagation()}>
                    {normaux.length > 0 && (
                      <TraitGroup>
                        <TraitGroupLabel>Traits</TraitGroupLabel>
                        <TraitPills>
                          {normaux.map(t => <TraitPill key={t.slug} $variant="normal">{t.name}</TraitPill>)}
                        </TraitPills>
                      </TraitGroup>
                    )}
                    {defauts.length > 0 && (
                      <TraitGroup>
                        <TraitGroupLabel>Défaut</TraitGroupLabel>
                        <TraitPills>
                          {defauts.map(t => <TraitPill key={t.slug} $variant="defaut">{t.name}</TraitPill>)}
                        </TraitPills>
                      </TraitGroup>
                    )}
                    {objets.length > 0 && (
                      <TraitGroup>
                        <TraitGroupLabel>Objet</TraitGroupLabel>
                        <TraitPills>
                          {objets.map(t => <TraitPill key={t.slug} $variant="objet">{t.name}</TraitPill>)}
                        </TraitPills>
                      </TraitGroup>
                    )}
                    {sorts.length > 0 && (
                      <TraitGroup>
                        <TraitGroupLabel>Sorts</TraitGroupLabel>
                        <TraitPills>
                          {sorts.map(t => <TraitPill key={t.slug} $variant="sorts">{t.name}</TraitPill>)}
                        </TraitPills>
                      </TraitGroup>
                    )}
                  </TraitSection>
                )}
              </MemberCard>
            )
          })}
        </MemberFeed>
      )}
    </PageShell>
  )
}

// ─── Styled components ────────────────────────────────────────────────────────

const PageShell = styled.div`
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 10% 12%, rgba(198, 150, 88, 0.22), transparent 30%),
    radial-gradient(circle at 90% 8%, rgba(142, 89, 49, 0.18), transparent 36%),
    linear-gradient(180deg, #f9edd4 0%, #f2dfbd 52%, #ecd6af 100%);
  color: #3b2926;
  max-width: 1200px;
  margin: 0 auto;
`

const HeaderCard = styled.section`
  border: 1px solid rgba(165, 121, 74, 0.36);
  border-radius: 14px;
  background: linear-gradient(140deg, rgba(248, 236, 210, 0.95) 0%, rgba(241, 224, 188, 0.95) 100%);
  padding: 1.1rem 1.4rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 28px rgba(89, 55, 34, 0.15);
`

const HeaderBack = styled.button`
  background: none;
  border: none;
  color: #7a5631;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  &:hover { color: #4b2f2a; }
`

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.3rem, 2vw, 1.9rem);
  color: #4c2f2d;
  text-shadow: 0 1px 0 rgba(255, 248, 230, 0.72);
`

const HeaderMeta = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #7a5631;
`

const HeaderDesc = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.92rem;
  color: #5a4338;
  line-height: 1.5;
`

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #5b3c2e;
`

const HouseSection = styled.section`
  margin-bottom: 1.75rem;
`

const HouseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`

const HouseCard = styled.div<{ $bg: string; $border: string }>`
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`

const HouseLabel = styled.div<{ $textColor: string }>`
  color: ${({ $textColor }) => $textColor};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const HouseControls = styled.div`
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  align-items: center;
  gap: 0.3rem;
`

const HouseBtn = styled.button<{ $textColor: string }>`
  height: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  color: ${({ $textColor }) => $textColor};
  font-size: 1.1rem;
  font-weight: 800;
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.22); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

const HouseValue = styled.div<{ $textColor: string }>`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: ${({ $textColor }) => $textColor};
  font-family: 'Cinzel', Georgia, serif;
`

const MemberFeed = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`

const MemberCard = styled.div`
  border: 1px solid rgba(171, 127, 81, 0.3);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(252, 243, 223, 0.9), rgba(244, 229, 197, 0.92));
  padding: 0.9rem;
  box-shadow: 0 8px 20px rgba(109, 70, 43, 0.13);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(109, 70, 43, 0.2);
  }
`

const CardHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
`

const Portrait = styled.img`
  width: 54px;
  height: 68px;
  border-radius: 8px;
  object-fit: cover;
  object-position: center top;
  border: 1px solid rgba(171, 125, 66, 0.42);
  background: rgba(241, 224, 195, 0.9);
  flex-shrink: 0;
`

const CardMeta = styled.div`
  min-width: 0;
`

const MemberName = styled.div`
  font-size: 1.02rem;
  font-weight: 800;
  color: #4c2f2d;
`

const MemberClass = styled.div`
  font-size: 0.78rem;
  color: #7a5631;
  margin-top: 0.15rem;
`

const TraitSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  border-top: 1px solid rgba(171, 127, 81, 0.2);
  padding-top: 0.65rem;
`

const TraitGroup = styled.div``

const TraitGroupLabel = styled.div`
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8a6645;
  margin-bottom: 0.3rem;
  font-weight: 700;
`

const TraitPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`

const VARIANT_STYLES: Record<string, { border: string; bg: string; color: string }> = {
  normal: { border: 'rgba(62, 102, 184, 0.45)',  bg: 'rgba(220, 231, 247, 0.9)',  color: '#2c4571' },
  defaut: { border: 'rgba(171, 56, 56, 0.55)',   bg: 'rgba(250, 215, 210, 0.9)',  color: '#7f1d1d' },
  objet:  { border: 'rgba(75, 130, 80, 0.5)',    bg: 'rgba(218, 240, 220, 0.9)',  color: '#1a4a20' },
  sorts:  { border: 'rgba(133, 96, 182, 0.52)',  bg: 'rgba(232, 220, 248, 0.9)',  color: '#4a1d8a' },
}

const TraitPill = styled.span<{ $variant: string }>`
  border: 1px solid ${({ $variant }) => VARIANT_STYLES[$variant]?.border ?? 'rgba(171, 127, 81, 0.35)'};
  background: ${({ $variant }) => VARIANT_STYLES[$variant]?.bg ?? 'rgba(246, 231, 199, 0.8)'};
  color: ${({ $variant }) => VARIANT_STYLES[$variant]?.color ?? '#66452f'};
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
`

const EmptyHint = styled.p`
  color: #8a6645;
  font-style: italic;
`
