import React from 'react'
import styled from 'styled-components'
import { VanFeedMessage, VanObjective } from './types'
import {
  ActivityBar,
  ActivityLevel,
  ActivityValue,
  ObjectiveHint,
  VanCameraFrame,
  ObjectiveCheck,
  ObjectiveItem,
  ObjectivesList,
  ObjectiveText,
  VanFeed,
  VanFeedItem,
  VanEmptyState,
  VanPanelLabel,
  VanTwoColumnGrid
} from './van-styles'

const OBJECTIVE_HINTS: Record<string, string> = {
  'recuperer le materiel de localisation':
    "Récupérer le capteur EMF et le Thermomètre au rez-de-chaussée, ne montez pas à l'étage !",
  "trouver la zone d'activite du fantome":
    'Utilisez le matériel de localisation pour repérer la pièce où se trouve le fantôme puis sélectionnez-la dans la liste déroulante.',
  "recuperer le materiel d'identification":
    'Récupérer la lampe UV, la Camera Ghost et la Spirit Box.',
  'identifier le fantome':
    'Utilisez le matériel à votre disposition pour identifier le fantôme. Saisissez son nom après identification.',
}

function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

type VanStep1PuzzleProps = {
  objectives: VanObjective[]
  ghostActivity: number
  liveCameraFrame?: string
  messages?: VanFeedMessage[]
  onValidateLocation?: (roomId: string) => void
}

export function VanStep1Puzzle({
  objectives,
  ghostActivity,
  liveCameraFrame,
  messages = [],
  onValidateLocation,
}: VanStep1PuzzleProps) {
  const [selectedRoom, setSelectedRoom] = React.useState('')
  const [locationError, setLocationError] = React.useState('')
  const displayedObjectives = objectives.filter(
    o => normalizeKey(o.objective) !== 'intro terminee'
  )
  const firstUncheckedIdx = displayedObjectives.findIndex(o => !o.completed)
  const firstUncheckedKey =
    firstUncheckedIdx >= 0 ? normalizeKey(displayedObjectives[firstUncheckedIdx].objective) : ''

  const locationInteractive =
    firstUncheckedKey === "trouver la zone d'activite du fantome"

  const sortedMessages = [...messages].sort((a, b) => {
    const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0
    const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0
    return ta - tb
  })

  const handleValidateRoom = (): void => {
    if (!selectedRoom) {
      setLocationError('Choisissez une salle avant de valider.')
      return
    }

    const isCorrect = selectedRoom === 'salle-de-bain-1'
    if (!isCorrect) {
      setLocationError("Ce n'est pas la bonne salle.")
      return
    }

    setLocationError('')
    onValidateLocation?.(selectedRoom)
  }

  return (
    <VanTwoColumnGrid>
      <LeftPanel>
        <Block>
          <VanPanelLabel>ACTIVITÉ DU FANTÔME</VanPanelLabel>
          <ActivityBar>
            <ActivityLevel $level={ghostActivity} />
            <ActivityValue>{ghostActivity}/100</ActivityValue>
          </ActivityBar>
        </Block>

        <Separator />

        <Block style={{ flex: 1, minHeight: 0 }}>
          <VanPanelLabel>MISSION EN COURS</VanPanelLabel>
          <ScrollArea>
            <ObjectivesList>
              {displayedObjectives.length === 0 && (
                <VanEmptyState>Aucun objectif pour le moment.</VanEmptyState>
              )}
              {displayedObjectives.map((obj, idx) => {
                const key = normalizeKey(obj.objective)
                const isActive = idx === firstUncheckedIdx
                return (
                  <React.Fragment key={idx}>
                    <ObjectiveItem $completed={obj.completed}>
                      <ObjectiveCheck $completed={obj.completed}>✓</ObjectiveCheck>
                      <ObjectiveText>{obj.objective}</ObjectiveText>
                    </ObjectiveItem>
                    {isActive && OBJECTIVE_HINTS[key] && (
                      <ObjectiveHint>{OBJECTIVE_HINTS[key]}</ObjectiveHint>
                    )}
                    {isActive && locationInteractive && (
                      <RoomSelectorRow>
                        <RoomSelect
                          value={selectedRoom}
                          onChange={event => {
                            setSelectedRoom(event.target.value)
                            setLocationError('')
                          }}
                          aria-label="Choisir la salle suspecte"
                        >
                          <option value="">Choisir une salle</option>
                          <option value="salon">Salon</option>
                          <option value="cuisine">Cuisine</option>
                          <option value="chambre1">Chambre 1</option>
                          <option value="chambre2">Chambre 2</option>
                          <option value="salle-de-bain-1">Salle de bain 1</option>
                          <option value="salle-de-bain-2">Salle de bain 2</option>
                          <option value="toilettes">Toilettes</option>
                        </RoomSelect>
                        <RoomValidateButton type="button" onClick={handleValidateRoom} disabled={!selectedRoom}>
                          Valider la salle
                        </RoomValidateButton>
                        {locationError && <RoomError>{locationError}</RoomError>}
                      </RoomSelectorRow>
                    )}
                  </React.Fragment>
                )
              })}
            </ObjectivesList>
          </ScrollArea>
        </Block>
      </LeftPanel>

      <RightPanel>
        <Block>
          <VanPanelLabel>CAMÉRA</VanPanelLabel>
          <MediaBox>
            {liveCameraFrame ? (
              <VanCameraFrame src={liveCameraFrame} alt="Flux caméra" />
            ) : (
              <VanEmptyState>Caméra en attente de retour.</VanEmptyState>
            )}
          </MediaBox>
        </Block>

        <Block style={{ flex: 1, minHeight: 0 }}>
          <VanPanelLabel>MESSAGERIE</VanPanelLabel>
          <MessagePanel>
            <VanFeed>
              {sortedMessages.length === 0 && <VanEmptyState>Aucun message pour le moment.</VanEmptyState>}
              {sortedMessages.map(message => (
                <VanFeedItem key={message.id}>
                  <VanFeedTitle>{message.title}</VanFeedTitle>
                  {message.text && <VanFeedText>{message.text}</VanFeedText>}
                  {message.imageUrl && <VanFeedImage src={message.imageUrl} alt={message.title} />}
                  {message.sentAt && <VanFeedMeta>{new Date(message.sentAt).toLocaleTimeString()}</VanFeedMeta>}
                </VanFeedItem>
              ))}
            </VanFeed>
          </MessagePanel>
        </Block>
      </RightPanel>
    </VanTwoColumnGrid>
  )
}

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  min-height: 0;
  border: 1px solid #1a4d3e;
  border-radius: 6px;
  padding: 0.85rem;
  background: rgba(8, 16, 27, 0.35);
`

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  min-height: 0;
`

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 0;
`

const Separator = styled.div`
  height: 1px;
  background: #1a4d3e;
  margin: 0.3rem 0;
`

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const MediaBox = styled.div`
  width: min(100%, 760px);
  max-height: min(42vh, 380px);
  aspect-ratio: 16 / 10;
  border: 1px solid #26476e;
  border-radius: 4px;
  background: rgba(8, 16, 27, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto;
`

const MessagePanel = styled.div`
  border: 1px solid #26476e;
  border-radius: 4px;
  background: rgba(8, 16, 27, 0.42);
  padding: 0.55rem;
  min-height: 220px;
  max-height: 42vh;
  overflow: auto;
`

const RoomSelectorRow = styled.div`
  margin: 0.55rem 0 0.2rem 2.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`

const RoomSelect = styled.select`
  width: min(100%, 280px);
  border-radius: 6px;
  border: 1px solid #4f7fb1;
  background: #08111c;
  color: #dce8f7;
  padding: 0.45rem 0.55rem;
`

const RoomValidateButton = styled.button`
  width: fit-content;
  border-radius: 6px;
  border: 1px solid #4f7fb1;
  background: linear-gradient(180deg, #1a3858 0%, #102235 100%);
  color: #dce8f7;
  padding: 0.45rem 0.7rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const RoomError = styled.small`
  color: #ff9d9d;
  font-weight: 700;
`

const VanFeedTitle = styled.strong`
  color: #b9d6fb;
  letter-spacing: 0.08em;
`

const VanFeedText = styled.p`
  margin: 0;
  color: #dce8f7;
  line-height: 1.4;
  white-space: pre-wrap;
`

const VanFeedMeta = styled.small`
  color: #88a2c4;
`

const VanFeedImage = styled.img`
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border: 1px solid #26476e;
  border-radius: 4px;
  background: #08111c;
`
