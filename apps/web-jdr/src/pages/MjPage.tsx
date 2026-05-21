import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { JdrApiClient, JdrDto, RollState } from '../data/JdrApiClient'
import { DiceRollFeed } from '../components/DiceRollFeed'

const ROLL_STATES: { value: RollState; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'advantage', label: 'Avantage' },
  { value: 'double_advantage', label: 'Double avantage' },
  { value: 'disadvantage', label: 'Désavantage' }
]

function getVisibleKey(jdrSlug: string) {
  return `jdr_${jdrSlug}_visible`
}

function loadVisible(jdrSlug: string, allSlugs: string[]): string[] {
  try {
    const raw = localStorage.getItem(getVisibleKey(jdrSlug))
    if (!raw) return allSlugs
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : allSlugs
  } catch {
    return allSlugs
  }
}

function saveVisible(jdrSlug: string, slugs: string[]) {
  localStorage.setItem(getVisibleKey(jdrSlug), JSON.stringify(slugs))
}

export default function MjPage() {
  const { jdrSlug } = useParams<{ jdrSlug: string }>()
  const navigate = useNavigate()
  const [jdr, setJdr] = useState<JdrDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleSlugs, setVisibleSlugs] = useState<string[]>([])
  const [rollState, setRollState] = useState<RollState>('normal')
  const [rolling, setRolling] = useState<string | null>(null)
  const [rollFeedKey, setRollFeedKey] = useState(0)

  useEffect(() => {
    if (!jdrSlug) return
    const fetch = async () => {
      try {
        const data = await JdrApiClient.findOneBySlug(jdrSlug)
        setJdr(data)
        const allSlugs = data.characters.map((c) => c.slug)
        setVisibleSlugs(loadVisible(jdrSlug, allSlugs))
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [jdrSlug])

  const toggleVisible = (slug: string) => {
    setVisibleSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      saveVisible(jdrSlug!, next)
      return next
    })
  }

  const rollDice = async (characterSlug: string, statSlug: string) => {
    if (!jdrSlug) return
    const key = `${characterSlug}-${statSlug}`
    setRolling(key)
    try {
      await JdrApiClient.rollDice(jdrSlug, characterSlug, statSlug, rollState)
      setRollFeedKey((k) => k + 1)
    } catch (err) {
      alert('Erreur: ' + (err as Error).message)
    } finally {
      setRolling(null)
    }
  }

  if (loading) return <Container>Chargement...</Container>
  if (error) return <Container>Erreur: {error}</Container>
  if (!jdr) return <Container>JdR non trouvé</Container>

  const visibleChars = jdr.characters.filter((c) => visibleSlugs.includes(c.slug))

  return (
    <Container>
      <Header>
        <h1>{jdr.name}</h1>
        <button onClick={() => navigate(`/jdr/${jdrSlug}/mj/config`)}>Config</button>
      </Header>

      <SelectorBar>
        <SelectorLabel>Personnages affichés :</SelectorLabel>
        {jdr.characters.map((c) => (
          <CharCheckbox key={c.slug}>
            <input
              type="checkbox"
              checked={visibleSlugs.includes(c.slug)}
              onChange={() => toggleVisible(c.slug)}
              id={`vis-${c.slug}`}
            />
            <label htmlFor={`vis-${c.slug}`}>{c.name}</label>
          </CharCheckbox>
        ))}
      </SelectorBar>

      <RollStateBar>
        <span>État du dé :</span>
        {ROLL_STATES.map(({ value, label }) => (
          <RollStateBtn key={value} $active={rollState === value} onClick={() => setRollState(value)}>
            {label}
          </RollStateBtn>
        ))}
      </RollStateBar>

      <Content>
        <Main>
          <CharGrid>
            {visibleChars.map((char) => (
              <MiniCard key={char.slug}>
                <Portrait onClick={() => navigate(`/jdr/${jdrSlug}/characters/${char.slug}`)}>
                  {char.name.charAt(0).toUpperCase()}
                </Portrait>
                <CardName onClick={() => navigate(`/jdr/${jdrSlug}/characters/${char.slug}`)}>
                  {char.name}
                </CardName>
                {char.classSlug && (
                  <CardClass>{char.classSlug}{char.classLevel > 1 ? ` Niv.${char.classLevel}` : ''}</CardClass>
                )}
                <StatsGrid>
                  {char.stats.map((stat) => {
                    const statDef = jdr.stats.find((s) => s.slug === stat.statSlug)
                    const key = `${char.slug}-${stat.statSlug}`
                    return (
                      <StatBtn
                        key={stat.statSlug}
                        title={`${statDef?.name ?? stat.statSlug}: ${stat.finalValue}`}
                        $rolling={rolling === key}
                        onClick={() => rollDice(char.slug, stat.statSlug)}
                      >
                        <StatAbbr>{statDef?.name?.slice(0, 3).toUpperCase() ?? stat.statSlug.slice(0, 3).toUpperCase()}</StatAbbr>
                        <StatVal>{stat.finalValue}</StatVal>
                      </StatBtn>
                    )
                  })}
                </StatsGrid>
              </MiniCard>
            ))}
            {visibleChars.length === 0 && (
              <EmptyHint>Sélectionnez des personnages à afficher.</EmptyHint>
            )}
          </CharGrid>
        </Main>

        <Sidebar>
          <DiceRollFeed key={rollFeedKey} jdrSlug={jdrSlug!} maxItems={30} jdrData={jdr} />
        </Sidebar>
      </Content>
    </Container>
  )
}

const Container = styled.div`
  padding: 1.5rem 2rem;
  max-width: 1800px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h1 { margin: 0; }

  button {
    padding: 0.5rem 1.2rem;
    background: rgba(163, 118, 43, 0.25);
    border: 1px solid rgba(163, 118, 43, 0.6);
    border-radius: 6px;
    color: #e5c486;
    cursor: pointer;
    font-size: 0.95rem;
    &:hover { background: rgba(163, 118, 43, 0.45); }
  }
`

const SelectorBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding: 0.6rem 0.8rem;
  background: rgba(30, 22, 10, 0.3);
  border: 1px solid rgba(163, 118, 43, 0.25);
  border-radius: 8px;
`

const SelectorLabel = styled.span`
  color: #aaa;
  font-size: 0.85rem;
  margin-right: 0.5rem;
`

const CharCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  font-size: 0.85rem;
  input { cursor: pointer; }
`

const RollStateBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: #aaa;
`

const RollStateBtn = styled.button<{ $active: boolean }>`
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? 'rgba(229, 196, 134, 0.8)' : 'rgba(163, 118, 43, 0.35)')};
  background: ${(p) => (p.$active ? 'rgba(163, 118, 43, 0.4)' : 'transparent')};
  color: ${(p) => (p.$active ? '#e5c486' : '#888')};
  cursor: pointer;
  font-size: 0.8rem;
  &:hover { background: rgba(163, 118, 43, 0.3); color: #e5c486; }
`

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
  width: 100%;
`

const Main = styled.div`
  min-width: 0;
  width: 100%;
`

const Sidebar = styled.aside`
  height: fit-content;
  position: sticky;
  top: 1rem;
`

const CharGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-start;
`

const MiniCard = styled.div`
  background: rgba(30, 22, 10, 0.4);
  border: 1px solid rgba(163, 118, 43, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex: 0 0 160px;
  box-sizing: border-box;
`

const Portrait = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(89, 58, 22, 0.6);
  border: 2px solid rgba(163, 118, 43, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: #e5c486;
  cursor: pointer;
  &:hover { border-color: #e5c486; }
`

const CardName = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
  cursor: pointer;
  &:hover { color: #e5c486; }
`

const CardClass = styled.div`
  font-size: 0.75rem;
  color: #888;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
  width: 100%;
`

const StatBtn = styled.button<{ $rolling: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(163, 118, 43, ${(p) => (p.$rolling ? '0.9' : '0.35')});
  background: ${(p) => (p.$rolling ? 'rgba(163, 118, 43, 0.45)' : 'rgba(89, 58, 22, 0.25)')};
  cursor: pointer;
  min-width: 42px;
  transition: background 0.15s;
  &:hover { background: rgba(163, 118, 43, 0.35); border-color: rgba(163, 118, 43, 0.7); }
`

const StatAbbr = styled.span`
  font-size: 0.65rem;
  color: #aaa;
  letter-spacing: 0.04em;
`

const StatVal = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #e5c486;
`

const EmptyHint = styled.p`
  color: #666;
  font-size: 0.9rem;
`
