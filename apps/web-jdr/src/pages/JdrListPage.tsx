import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { JdrApiClient } from '../data/JdrApiClient'

const Shell = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  color: #e8e0d0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
`

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 2.5rem;
  color: #f0e6c8;
`

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
`

const JdrCard = styled.button`
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  text-align: left;
  cursor: pointer;
  color: #e8e0d0;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: #6b4c9a;
    background: linear-gradient(135deg, #1f1f3a, #1a2a4a);
  }
`

const JdrName = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`

const JdrSlug = styled.div`
  font-size: 0.75rem;
  color: #7a7a9a;
  margin-top: 0.25rem;
`

const StatusShell = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  color: #e8e0d0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`

export default function JdrListPage() {
  const navigate = useNavigate()
  const [jdrs, setJdrs] = useState<Array<{ slug: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    JdrApiClient.findAll()
      .then(setJdrs)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <StatusShell>Chargement...</StatusShell>
  if (error) return <StatusShell>Erreur : {error}</StatusShell>

  return (
    <Shell>
      <Title>Choisir un JdR</Title>
      <Grid>
        {jdrs.map((jdr) => (
          <JdrCard key={jdr.slug} onClick={() => navigate(`/jdr/${jdr.slug}/joueurs`)}>
            <JdrName>{jdr.name}</JdrName>
            <JdrSlug>{jdr.slug}</JdrSlug>
          </JdrCard>
        ))}
        {jdrs.length === 0 && <StatusShell style={{ minHeight: 'unset', color: '#7a7a9a' }}>Aucun JdR disponible.</StatusShell>}
      </Grid>
    </Shell>
  )
}
