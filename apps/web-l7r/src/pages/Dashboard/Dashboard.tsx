import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import axios from 'axios'

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  font-family: 'Arial', sans-serif;
`

const Title = styled.h1`
  color: white;
  font-size: 3em;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 900px;
  width: 100%;
`

const Card = styled.button`
  background: white;
  border: none;
  border-radius: 10px;
  padding: 30px 20px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    background: #f5f5f5;
  }
  
  &:active {
    transform: translateY(-2px);
  }
`

interface Features {
  l7r: boolean
  ghost: boolean
  pf2: boolean
  wedding: boolean
  jdr: boolean
  diary: boolean
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [features, setFeatures] = useState<Features | null>(null)

  useEffect(() => {
    axios.get<{ features: Features }>('/apil7r/config/features').then(res => {
      setFeatures(res.data.features)
    }).catch(err => {
      console.error('Failed to fetch features:', err)
      // Fallback to defaults
      setFeatures({
        l7r: true,
        ghost: false,
        pf2: true,
        wedding: false,
        jdr: false,
        diary: true
      })
    })
  }, [])

  if (!features) {
    return <DashboardContainer><Title>Chargement...</Title></DashboardContainer>
  }

  return (
    <DashboardContainer>
      <Title>🎮 Dashboard</Title>
      <Grid>
        {features.l7r && (
          <Card onClick={() => navigate('/l7r/dashboard')}>
            ⚔️ L7R
          </Card>
        )}
        {features.ghost && (
          <Card onClick={() => navigate('/ghost/dashboard')}>
            👻 Ghost
          </Card>
        )}
        {features.pf2 && (
          <Card onClick={() => navigate('/pf2')}>
            🐉 PF2
          </Card>
        )}
        {features.wedding && (
          <Card onClick={() => navigate('/wedding')}>
            💒 Wedding
          </Card>
        )}
        {features.jdr && (
          <Card onClick={() => navigate('/jdr/dashboard')}>
            🎲 JdR
          </Card>
        )}
        {features.diary && (
          <Card onClick={() => navigate('/diary')}>
            📖 Diary
          </Card>
        )}
      </Grid>
    </DashboardContainer>
  )
}

export default Dashboard
