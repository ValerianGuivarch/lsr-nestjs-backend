import React from 'react'
import styled, { keyframes } from 'styled-components'
import { VanTextConfig, DEFAULT_VAN_TEXT_CONFIG } from 'ghost/frontend'

type Props = {
  ghostName?: string
  textConfig?: VanTextConfig
}

export function VanStep6Banish({ ghostName, textConfig }: Props): JSX.Element {
  const t = textConfig ?? DEFAULT_VAN_TEXT_CONFIG
  return (
    <Layout>
      <BanishTitle>{t.banish.fullTitle}</BanishTitle>
      {ghostName && <GhostNameBadge>{ghostName.toUpperCase()}</GhostNameBadge>}
      <BanishImage src={t.banish.imageUrl} alt={ghostName ?? 'Fantôme'} />
      <BanishInstruction>{t.banish.fullInstruction}</BanishInstruction>
    </Layout>
  )

}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const Layout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
  background: radial-gradient(circle at center, rgba(60, 10, 10, 0.4), rgba(0, 0, 0, 0.7));
  border-radius: 8px;
`

const BanishTitle = styled.h2`
  margin: 0;
  font-size: 2rem;
  color: #ff5555;
  letter-spacing: 0.2rem;
  text-shadow: 0 0 14px rgba(255, 60, 60, 0.6);
  animation: ${pulse} 2s ease-in-out infinite;
`

const GhostNameBadge = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffdddd;
  letter-spacing: 0.25rem;
  border: 2px solid rgba(255, 80, 80, 0.5);
  border-radius: 4px;
  padding: 0.35rem 1.2rem;
  background: rgba(255, 40, 40, 0.08);
`

const BanishImage = styled.img`
  max-width: 55%;
  max-height: 40vh;
  border-radius: 8px;
  border: 2px solid rgba(255, 80, 80, 0.4);
  object-fit: contain;
  box-shadow: 0 0 30px rgba(255, 50, 50, 0.25);
`

const BanishInstruction = styled.p`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.7;
  text-align: center;
  color: #ffdddd;
  max-width: 560px;

  strong {
    color: #ffaa44;
  }
`
