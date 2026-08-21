import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import styled from 'styled-components'
import { JdrApiClient } from './JdrApiClient'

export default function JdrSelectionPage() {
  const navigate = useNavigate()
  const [jdrSlug, setJdrSlug] = useState('')
  const [characterSlug, setCharacterSlug] = useState('')

  const { data: jdrs, isLoading: loadingJdrs } = useQuery({
    queryKey: ['jdr-list'],
    queryFn: () => JdrApiClient.findAll()
  })

  const { data: jdr, isLoading: loadingJdr } = useQuery({
    queryKey: ['jdr', jdrSlug],
    queryFn: () => JdrApiClient.findOneBySlug(jdrSlug),
    enabled: !!jdrSlug
  })

  // Hidden characters (public=false) are not offered here; they still work via a direct link.
  const publicCharacters = jdr?.characters.filter((c) => c.public) ?? []

  function handleJdrChange(slug: string) {
    setJdrSlug(slug)
    setCharacterSlug('')
  }

  function handleValidate() {
    if (jdrSlug && characterSlug) {
      navigate(`/jdr/${jdrSlug}/characters/${characterSlug}`)
    }
  }

  return (
    <Container>
      <Title>Choisir un personnage</Title>

      <Field>
        <label htmlFor="jdr-select">JdR</label>
        <select id="jdr-select" value={jdrSlug} onChange={(e) => handleJdrChange(e.target.value)} disabled={loadingJdrs}>
          <option value="">-- Selectionner un JdR --</option>
          {jdrs?.map((j) => (
            <option key={j.slug} value={j.slug}>{j.name}</option>
          ))}
        </select>
      </Field>

      <Field>
        <label htmlFor="character-select">Personnage</label>
        <select
          id="character-select"
          value={characterSlug}
          onChange={(e) => setCharacterSlug(e.target.value)}
          disabled={!jdrSlug || loadingJdr}
        >
          <option value="">-- Selectionner un personnage --</option>
          {publicCharacters.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </Field>

      <ValidateButton onClick={handleValidate} disabled={!jdrSlug || !characterSlug}>
        Valider
      </ValidateButton>
    </Container>
  )
}

const Container = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  select {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.15);

    /* the dropdown list is rendered by the browser with its own (light) background,
       so options need an explicit dark background + light text to stay readable */
    option {
      background: #1e1e2e;
      color: #f5f5f5;
    }
  }
`

const ValidateButton = styled.button`
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.25);
  }
`
