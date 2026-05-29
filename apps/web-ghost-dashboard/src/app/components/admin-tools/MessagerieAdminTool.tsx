import React from 'react'
import styled from 'styled-components'
import { MessagerieAdminToolProps } from './types'

export function MessagerieAdminTool({
  sentMessages,
  draft,
  onDraftChange,
  onSend,
  onClearSent
}: MessagerieAdminToolProps): JSX.Element {
  const handleSend = () => {
    if (!draft.title.trim()) return
    onSend()
  }

  return (
    <Wrapper>
      <Section>
        <SectionTitle>Nouveau message</SectionTitle>
        <input
          type="text"
          placeholder="Titre (obligatoire)"
          value={draft.title}
          onChange={(e) => onDraftChange({ title: e.target.value })}
        />
        <textarea
          placeholder="Texte du message (optionnel)"
          rows={3}
          value={draft.text}
          onChange={(e) => onDraftChange({ text: e.target.value })}
        />
        <input
          type="url"
          placeholder="URL de l'image (optionnel)"
          value={draft.imageUrl}
          onChange={(e) => onDraftChange({ imageUrl: e.target.value })}
        />
        <input
          type="url"
          placeholder="URL audio (optionnel, joué automatiquement)"
          value={draft.audioUrl}
          onChange={(e) => onDraftChange({ audioUrl: e.target.value })}
        />
        <PrimaryButton type="button" onClick={handleSend} disabled={!draft.title.trim()}>
          Envoyer
        </PrimaryButton>
      </Section>

      <Section>
        <SectionTitleRow>
          <SectionTitle>Historique ({sentMessages.length})</SectionTitle>
          {sentMessages.length > 0 && (
            <DangerButton type="button" onClick={onClearSent}>Vider</DangerButton>
          )}
        </SectionTitleRow>
        {sentMessages.length === 0 && <Empty>Aucun message envoyé.</Empty>}
        <List>
          {[...sentMessages].reverse().map((msg) => (
            <SentRow key={msg.id}>
              <SentTitle>{msg.title}</SentTitle>
              {msg.text && <SentText>{msg.text}</SentText>}
              {msg.imageUrl && <SentImage src={msg.imageUrl} alt={msg.title} />}
              {msg.audioUrl && <SentAudio controls src={msg.audioUrl} />}
              {msg.sentAt && <SentDate>{new Date(msg.sentAt).toLocaleTimeString()}</SentDate>}
            </SentRow>
          ))}
        </List>
      </Section>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  input,
  textarea {
    padding: 0.4rem 0.6rem;
    border: 1px solid #2f3d50;
    border-radius: 4px;
    background: #1a222d;
    color: #e8f0ff;
    font-family: inherit;
    font-size: 0.9rem;
  }

  textarea {
    resize: vertical;
  }
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const PrimaryButton = styled.button`
  align-self: flex-start;
  padding: 0.45rem 0.8rem;
  background: #1c64f2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`

const DangerButton = styled.button`
  padding: 0.35rem 0.7rem;
  background: #b91c1c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`

const SentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem;
  border-left: 3px solid #1c64f2;
  background: #1a222d;
`

const SentTitle = styled.strong``
const SentText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.88rem;
  color: #b0c4de;
`
const SentImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
`
const SentAudio = styled.audio`
  width: 100%;
`
const SentDate = styled.small`
  color: #667;
  font-size: 0.78rem;
`

const Empty = styled.small`
  color: #888;
`

