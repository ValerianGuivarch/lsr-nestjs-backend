import React from 'react'
import styled from 'styled-components'
import { MessagerieAdminToolProps, VanDashboardMessage } from './types'

export function MessagerieAdminTool({
  templates,
  sentMessages,
  draft,
  onDraftChange,
  onAddTemplate,
  onUpdateTemplate,
  onRemoveTemplate,
  onSendTemplate,
  onClearSent
}: MessagerieAdminToolProps): JSX.Element {
  const handleAdd = () => {
    if (!draft.title.trim()) return
    onAddTemplate()
  }

  return (
    <Wrapper>
      <Section>
        <SectionTitle>Composer un message</SectionTitle>
        <Row>
          <label>
            <input
              type="radio"
              name="kind"
              checked={draft.kind === 'text'}
              onChange={() => onDraftChange({ kind: 'text' })}
            />
            Texte
          </label>
          <label>
            <input
              type="radio"
              name="kind"
              checked={draft.kind === 'text_image'}
              onChange={() => onDraftChange({ kind: 'text_image' })}
            />
            Texte + image
          </label>
        </Row>
        <input
          type="text"
          placeholder="Titre"
          value={draft.title}
          onChange={(e) => onDraftChange({ title: e.target.value })}
        />
        <textarea
          placeholder="Texte du message"
          rows={3}
          value={draft.text}
          onChange={(e) => onDraftChange({ text: e.target.value })}
        />
        {draft.kind === 'text_image' && (
          <input
            type="url"
            placeholder="URL de l'image"
            value={draft.imageUrl}
            onChange={(e) => onDraftChange({ imageUrl: e.target.value })}
          />
        )}
        <PrimaryButton type="button" onClick={handleAdd}>
          Ajouter au catalogue
        </PrimaryButton>
      </Section>

      <Section>
        <SectionTitle>Catalogue ({templates.length})</SectionTitle>
        {templates.length === 0 && <Empty>Aucun modèle.</Empty>}
        <List>
          {templates.map((tpl) => (
            <TemplateRow key={tpl.id}>
              <TemplateBody>
                <KindBadge>{tpl.kind}</KindBadge>
                <input
                  type="text"
                  value={tpl.title}
                  onChange={(e) => onUpdateTemplate(tpl.id, { title: e.target.value })}
                />
                {tpl.kind !== 'audio' && (
                  <textarea
                    rows={2}
                    value={tpl.text ?? ''}
                    onChange={(e) => onUpdateTemplate(tpl.id, { text: e.target.value })}
                  />
                )}
                {tpl.kind === 'text_image' && (
                  <input
                    type="url"
                    placeholder="URL image"
                    value={tpl.imageUrl ?? ''}
                    onChange={(e) => onUpdateTemplate(tpl.id, { imageUrl: e.target.value })}
                  />
                )}
                {tpl.kind === 'audio' && tpl.audioUrl && (
                  <audio controls preload="none" src={tpl.audioUrl} />
                )}
              </TemplateBody>
              <TemplateActions>
                <PrimaryButton type="button" onClick={() => onSendTemplate(tpl.id)}>
                  Envoyer
                </PrimaryButton>
                <DangerButton type="button" onClick={() => onRemoveTemplate(tpl.id)}>
                  Supprimer
                </DangerButton>
              </TemplateActions>
            </TemplateRow>
          ))}
        </List>
      </Section>

      <Section>
        <SectionTitleRow>
          <SectionTitle>Historique envoyés ({sentMessages.length})</SectionTitle>
          {sentMessages.length > 0 && (
            <DangerButton type="button" onClick={onClearSent}>Vider</DangerButton>
          )}
        </SectionTitleRow>
        {sentMessages.length === 0 && <Empty>Aucun message envoyé.</Empty>}
        <List>
          {sentMessages.map((msg) => (
            <SentRow key={msg.id}>
              <SentTitle>{msg.title}</SentTitle>
              {msg.text && <SentText>{msg.text}</SentText>}
              {msg.imageUrl && <SentImage src={msg.imageUrl} alt={msg.title} />}
              {msg.audioUrl && <audio controls preload="none" src={msg.audioUrl} />}
              {msg.sentAt && <SentDate>{new Date(msg.sentAt).toLocaleString()}</SentDate>}
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

const Row = styled.div`
  display: flex;
  gap: 1rem;
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
`

const DangerButton = styled.button`
  align-self: flex-start;
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

const TemplateRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  align-items: flex-start;
`

const TemplateBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const TemplateActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`

const KindBadge = styled.span`
  align-self: flex-start;
  font-size: 0.7rem;
  background: #1f2937;
  color: #fff;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`

const SentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem;
  border-left: 3px solid #1c64f2;
  background: #f4f7fb;
`

const SentTitle = styled.strong``
const SentText = styled.p`
  margin: 0;
  white-space: pre-wrap;
`
const SentImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
`
const SentDate = styled.small`
  color: #666;
`

const Empty = styled.small`
  color: #888;
`
