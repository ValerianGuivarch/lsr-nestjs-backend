import React from 'react'
import { Link } from 'react-router-dom'
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

type AppSection = {
  title: string
  description: string
  apps: Array<AppLink & { admin?: boolean }>
}

const dashboardAdminPassword = import.meta.env.VITE_DASHBOARD_ADMIN_PASSWORD || 'admin'

function externalAppUrl(subdomain: 'admin' | 'map' | 'wiki', localPort: number, path = ''): string {
  const isPublicDashboard = ['l7r.fr', 'www.l7r.fr'].includes(window.location.hostname)
  return isPublicDashboard
    ? `https://${subdomain}.l7r.fr${path}`
    : `${window.location.protocol}//${window.location.hostname}:${localPort}${path}`
}

const Home: React.FC = () => {
  const sections: AppSection[] = [
    {
      title: 'Pathfinder 2',
      description: 'Campagne, ressources de jeu et outils pour les joueurs.',
      apps: [
        { label: 'Accès jeu PF2', description: 'Ouvrir la table de jeu Pathfinder 2', href: 'https://pf2.l7r.fr' },
        { label: 'Résumés', description: 'Chroniques et XP de campagne', href: '/résumés' },
        { label: 'Wiki', description: 'Livres, pages et recherche', href: externalAppUrl('wiki', 4205) },
        { label: 'Carte — PJ', description: 'Carte de Golarion, vue joueurs', href: externalAppUrl('map', 4204, '/pj') },
        { label: 'PF2', description: 'Référentiel Pathfinder 2', href: '/pf2' },
        { label: 'PF2 Admin', description: 'Catalogue, scénarios et référentiels MJ', href: '/pf2-mj', admin: true }
      ]
    },
    {
      title: 'JDR',
      description: 'Fiches de personnage et gestion des autres jeux.',
      apps: [
        { label: 'JDR', description: 'Fiches de personnage', href: '/jdr' },
        { label: 'Admin JDR', description: 'Back-office des JDR', href: externalAppUrl('admin', 4203), admin: true }
      ]
    }
  ]

  function openAdmin(app: AppLink): void {
    const enteredPassword = window.prompt(`Mot de passe requis pour ouvrir « ${app.label} »`)
    if (enteredPassword === null) return

    if (enteredPassword !== dashboardAdminPassword) {
      window.alert('Mot de passe incorrect.')
      return
    }

    window.location.assign(app.href)
  }

  return (
    <>
      <GlobalStyle />
      <Container>
        <Eyebrow>Portail de campagne</Eyebrow>
        <Title>Applications</Title>
        <Intro>Choisis un espace de jeu ou d’administration.</Intro>

        {sections.map((section) => (
          <Section key={section.title}>
            <SectionHeading>
              <SectionTitle>{section.title}</SectionTitle>
              <SectionDescription>{section.description}</SectionDescription>
            </SectionHeading>
            <Grid>
              {section.apps.map((app) =>
                app.admin ? (
                  <AdminCard key={app.label} type="button" onClick={() => openAdmin(app)}>
                    <CardKind>Administration · mot de passe</CardKind>
                    <CardLabel>{app.label}</CardLabel>
                    <CardDescription>{app.description}</CardDescription>
                  </AdminCard>
                ) : app.href.startsWith('/') ? (
                  <Card key={app.label} as={Link} to={app.href}>
                    <CardKind>Accès jeu</CardKind>
                    <CardLabel>{app.label}</CardLabel>
                    <CardDescription>{app.description}</CardDescription>
                  </Card>
                ) : (
                  <Card key={app.label} href={app.href}>
                    <CardKind>Accès jeu</CardKind>
                    <CardLabel>{app.label}</CardLabel>
                    <CardDescription>{app.description}</CardDescription>
                  </Card>
                )
              )}
            </Grid>
          </Section>
        ))}

      </Container>
    </>
  )
}

export default Home

const Container = styled.div`
  min-height: 100vh;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 4rem 1.5rem 5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`

const Eyebrow = styled.p`
  margin: 0;
  color: #9ea6d8;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`

const Title = styled.h1`
  margin: 0.35rem 0 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.04em;
`

const Intro = styled.p`
  margin: 0.7rem 0 3rem;
  color: rgba(255, 255, 255, 0.65);
`

const Section = styled.section`
  padding: 1.4rem 0 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.11);
`

const SectionHeading = styled.div`
  margin-bottom: 1rem;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
`

const SectionDescription = styled.p`
  margin: 0.3rem 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.92rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`

const Card = styled.a`
  min-height: 148px;
  display: block;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: rgba(97, 118, 184, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  color: inherit;
  text-align: left;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: rgba(97, 118, 184, 0.24);
    border-color: rgba(155, 177, 255, 0.55);
    transform: translateY(-2px);
  }
`

const AdminCard = styled.button`
  min-height: 148px;
  display: block;
  padding: 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  background: rgba(169, 103, 59, 0.16);
  border-color: rgba(233, 163, 97, 0.3);
  border-style: solid;
  border-width: 1px;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: rgba(169, 103, 59, 0.28);
    border-color: rgba(255, 194, 126, 0.72);
  }
`

const CardKind = styled.div`
  margin-bottom: 0.7rem;
  color: #aebcff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  ${AdminCard} & {
    color: #ffc184;
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
