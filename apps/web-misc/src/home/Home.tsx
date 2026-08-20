import React from 'react'
import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    background: #0f0f14;
    color: rgba(255,255,255,0.92);
  }
  *, *::before, *::after { box-sizing: border-box; }
`

type AppLink = {
  label: string
  description: string
  href: string
}

// Dev ports come from package.json's dev:web:* / dev:admin-jdr scripts.
function buildDevUrl(port: number): string {
  return `${window.location.protocol}//${window.location.hostname}:${port}`
}

const apps: AppLink[] = [
  { label: 'JDR', description: 'Fiches de personnage', href: buildDevUrl(4202) },
  { label: 'Admin JDR', description: 'Back-office des JDR', href: buildDevUrl(4203) },
  { label: 'PF2', description: 'Compendium Pathfinder 2', href: buildDevUrl(4200) },
  { label: 'Foussier', description: 'Calcul de crampillons', href: '/foussier' }
]

const Home: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>Applications</Title>
        <Grid>
          {apps.map(app => (
            <Card key={app.label} href={app.href}>
              <CardLabel>{app.label}</CardLabel>
              <CardDescription>{app.description}</CardDescription>
            </Card>
          ))}
        </Grid>
      </Container>
    </>
  )
}

export default Home

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Title = styled.h1`
  margin: 0 0 2rem;
  font-size: 1.75rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 240px));
  gap: 1rem;
  width: 100%;
  max-width: 900px;
`

const Card = styled.a`
  display: block;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`

const CardLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
`

const CardDescription = styled.div`
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
`
