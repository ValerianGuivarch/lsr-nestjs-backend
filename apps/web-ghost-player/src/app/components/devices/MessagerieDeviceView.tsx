import React from 'react'
import styled from 'styled-components'
import { VanFeedMessage } from '../van/types'

type MessagerieDeviceViewProps = {
  messages: VanFeedMessage[]
}

export function MessagerieDeviceView({ messages }: MessagerieDeviceViewProps): JSX.Element {
  const sorted = [...messages].sort((a, b) => {
    const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0
    const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0
    return ta - tb
  })

  return (
    <Wrapper>
      <Header>
        <Title>MESSAGERIE</Title>
        <Subtitle>{sorted.length} message{sorted.length > 1 ? 's' : ''} reçu{sorted.length > 1 ? 's' : ''}</Subtitle>
      </Header>
      <Feed>
        {sorted.length === 0 && <Empty>Aucun message pour le moment.</Empty>}
        {sorted.map(message => (
          <Item key={message.id}>
            <ItemHeader>
              <ItemTitle>{message.title}</ItemTitle>
              {message.sentAt && <ItemDate>{new Date(message.sentAt).toLocaleTimeString()}</ItemDate>}
            </ItemHeader>
            {message.text && <ItemText>{message.text}</ItemText>}
            {message.imageUrl && <ItemImage src={message.imageUrl} alt={message.title} />}
            {message.audioUrl && (
              <ItemAudio controls preload="none" src={message.audioUrl}>
                Votre navigateur ne supporte pas la lecture audio.
              </ItemAudio>
            )}
          </Item>
        ))}
      </Feed>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 1.5rem;
  box-sizing: border-box;
  background: linear-gradient(135deg, #0a0e12 0%, #0d1117 50%, #090c11 100%);
  color: #dce8f7;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Header = styled.div`
  text-align: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #26476e;
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: 0.2em;
  color: #7fc0ff;
  text-shadow: 0 0 10px rgba(127, 192, 255, 0.4);
`

const Subtitle = styled.div`
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: #88a2c4;
  letter-spacing: 0.1em;
`

const Feed = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Empty = styled.div`
  color: #88a2c4;
  text-align: center;
  padding: 2rem 1rem;
  border: 1px dashed #26476e;
  border-radius: 6px;
`

const Item = styled.div`
  border: 1px solid #26476e;
  border-radius: 8px;
  padding: 0.85rem 0.95rem;
  background: rgba(8, 16, 27, 0.4);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const ItemTitle = styled.strong`
  color: #b9d6fb;
  letter-spacing: 0.08em;
`

const ItemDate = styled.span`
  font-size: 0.8rem;
  color: #88a2c4;
`

const ItemText = styled.p`
  margin: 0;
  color: #dce8f7;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`

const ItemImage = styled.img`
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid #26476e;
  background: #08111c;
`

const ItemAudio = styled.audio`
  width: 100%;
`
