import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`

const Title = styled.h1`
  font-size: 48px;
  color: white;
  margin-bottom: 50px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: 300;
  letter-spacing: 2px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1000px;
`

const Card = styled.button`
  background: white;
  border: none;
  border-radius: 12px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-4px);
  }
`

interface WeddingPage {
  path: string
  label: string
  description: string
}

const PAGES: WeddingPage[] = [
  { path: '/wall', label: 'Wall', description: 'Mur photo avec slideshow' },
  { path: '/admin', label: 'Admin', description: 'Gestion du mur photo' },
  { path: '/golf', label: 'Golf', description: 'Jeu de golf' },
  { path: '/foussier', label: 'Foussier', description: 'Expérience Foussier' },
  { path: '/so-lover', label: 'So Lover', description: 'Jeu So Lover' },
  { path: '/selfie', label: 'Selfie', description: 'Photobooth' },
  { path: '/souvenirs', label: 'Souvenirs', description: 'Galerie souvenirs' },
]

export default function WeddingDashboard() {
  const navigate = useNavigate()

  return (
    <Container>
      <Title>💍 Wedding</Title>
      <Grid>
        {PAGES.map(page => (
          <Card key={page.path} onClick={() => navigate(page.path)} title={page.description}>
            {page.label}
          </Card>
        ))}
      </Grid>
    </Container>
  )
}
