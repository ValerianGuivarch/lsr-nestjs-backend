import React from 'react'
import styled, { keyframes } from 'styled-components'
import { VanTextConfig, DEFAULT_VAN_TEXT_CONFIG } from 'ghost/frontend'

type Props = {
  finalPhoto?: string
  textConfig?: VanTextConfig
}

export function VanStep7Victory({ finalPhoto, textConfig }: Props): JSX.Element {
  const t = textConfig ?? DEFAULT_VAN_TEXT_CONFIG
  return (
    <VictoryLayout>
      <VictoryTitle>{t.victory.title}</VictoryTitle>
      <Subtitle>{t.victory.subtitle}</Subtitle>
      {finalPhoto ? (
        <PhotoFrame>
          <Photo src={finalPhoto} alt="Photo de victoire" />
        </PhotoFrame>
      ) : (
        <PhotoPlaceholder>{t.victory.photoPlaceholder}</PhotoPlaceholder>
      )}
    </VictoryLayout>
  )
}

const glow = keyframes`
  0%, 100% { text-shadow: 0 0 8px rgba(120, 255, 180, 0.4); }
  50% { text-shadow: 0 0 18px rgba(120, 255, 180, 0.9); }
`

const VictoryLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: radial-gradient(circle at center, rgba(20, 60, 40, 0.4), rgba(0, 0, 0, 0.7));
  border-radius: 8px;
`

const VictoryTitle = styled.h1`
  margin: 0;
  text-align: center;
  font-size: 3.8rem;
  color: #88ffaa;
  letter-spacing: 0.15rem;
  animation: ${glow} 2.5s ease-in-out infinite;
`

const Subtitle = styled.div`
  font-size: 5.6rem;
  font-weight: 800;
  color: #ffe066;
  text-shadow: 0 0 12px rgba(255, 220, 100, 0.7);
`

const PhotoFrame = styled.div`
  background: rgba(0, 0, 0, 0.6);
  border: 3px solid rgba(255, 220, 100, 0.7);
  border-radius: 6px;
  padding: 0.75rem;
  max-width: 70%;
  max-height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Photo = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`

const PhotoPlaceholder = styled.div`
  font-style: italic;
  color: #ccc;
`
