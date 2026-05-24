import React, { useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

export type FloorPlanRoom = {
  id: string
  label: string
  type: 'corridor' | 'bathroom' | 'bedroom'
  /** colonne CSS grid (col-start / col-end) */
  col: [number, number]
  /** ligne CSS grid (row-start / row-end) */
  row: [number, number]
}

/**
 * Plan simple : couloir au centre, 3 chambres en haut, 2 salles de bain en bas.
 * Grille 6 colonnes x 3 lignes.
 */
export const DEFAULT_FLOOR_PLAN: FloorPlanRoom[] = [
  { id: 'bedroom1', label: 'Chambre 1', type: 'bedroom', col: [1, 3], row: [1, 2] },
  { id: 'bedroom2', label: 'Chambre 2', type: 'bedroom', col: [3, 5], row: [1, 2] },
  { id: 'bedroom3', label: 'Chambre 3', type: 'bedroom', col: [5, 7], row: [1, 2] },
  { id: 'corridor', label: 'Couloir', type: 'corridor', col: [1, 7], row: [2, 3] },
  { id: 'bathroom1', label: 'Salle de bain 1', type: 'bathroom', col: [1, 4], row: [3, 4] },
  { id: 'bathroom2', label: 'Salle de bain 2', type: 'bathroom', col: [4, 7], row: [3, 4] },
]

type FloorPlanInteractiveProps = {
  /** Si false, les pièces ne sont pas cliquables (lecture seule). */
  interactive?: boolean
  /** Ids des pièces considérées comme « la bonne réponse ». */
  correctRoomIds?: string[]
  /** Appelé après confirmation utilisateur si la pièce cliquée est correcte. */
  onCorrectValidation?: (room: FloorPlanRoom) => void
  /** Optionnel : override des pièces. */
  rooms?: FloorPlanRoom[]
}

export function FloorPlanInteractive({
  interactive = false,
  correctRoomIds = [],
  onCorrectValidation,
  rooms = DEFAULT_FLOOR_PLAN,
}: FloorPlanInteractiveProps): JSX.Element {
  const [pending, setPending] = useState<FloorPlanRoom | null>(null)
  const [errorRoom, setErrorRoom] = useState<FloorPlanRoom | null>(null)
  const [validatedRoomId, setValidatedRoomId] = useState<string | null>(null)

  const handleRoomClick = (room: FloorPlanRoom): void => {
    if (!interactive) return
    setPending(room)
  }

  const handleConfirm = (): void => {
    if (!pending) return
    const room = pending
    setPending(null)
    if (correctRoomIds.includes(room.id)) {
      setValidatedRoomId(room.id)
      onCorrectValidation?.(room)
    } else {
      setErrorRoom(room)
      window.setTimeout(() => setErrorRoom(null), 2500)
    }
  }

  const handleCancel = (): void => {
    setPending(null)
  }

  return (
    <Wrapper>
      <PlanGrid>
        {rooms.map(room => {
          const isValidated = validatedRoomId === room.id
          const isErrored = errorRoom?.id === room.id
          return (
            <RoomCell
              key={room.id}
              $type={room.type}
              $interactive={interactive}
              $validated={isValidated}
              $errored={isErrored}
              style={{
                gridColumn: `${room.col[0]} / ${room.col[1]}`,
                gridRow: `${room.row[0]} / ${room.row[1]}`,
              }}
              onClick={() => handleRoomClick(room)}
              type="button"
              disabled={!interactive}
            >
              <RoomLabel>{room.label}</RoomLabel>
            </RoomCell>
          )
        })}
      </PlanGrid>

      {errorRoom && <ErrorBanner>Erreur — ce n'est pas la bonne pièce.</ErrorBanner>}

      {pending && (
        <ModalOverlay onClick={handleCancel}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Valider la localisation&nbsp;?</ModalTitle>
            <ModalRoom>{pending.label}</ModalRoom>
            <ModalActions>
              <ModalButton $variant="confirm" type="button" onClick={handleConfirm}>
                Oui, valider
              </ModalButton>
              <ModalButton $variant="cancel" type="button" onClick={handleCancel}>
                Annuler
              </ModalButton>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  aspect-ratio: 4 / 3;
  width: 100%;
  max-height: 38vh;
  padding: 6px;
  background: rgba(8, 16, 27, 0.55);
  border: 1px solid #1a4d3e;
  border-radius: 4px;
`

const typeBg: Record<FloorPlanRoom['type'], string> = {
  corridor: '#11241a',
  bathroom: '#0d2a30',
  bedroom: '#16241a',
}

const validatedPulse = keyframes`
  0%, 100% { box-shadow: inset 0 0 0 2px #00ff95, 0 0 12px #00ff95; }
  50%      { box-shadow: inset 0 0 0 2px #00ff95, 0 0 4px #00ff95; }
`

const errorPulse = keyframes`
  0%, 100% { background: #4a1416; }
  50%      { background: #6a1f22; }
`

const RoomCell = styled.button<{
  $type: FloorPlanRoom['type']
  $interactive: boolean
  $validated: boolean
  $errored: boolean
}>`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${p => typeBg[p.$type]};
  color: #b8ffd2;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  border-radius: 3px;
  cursor: ${p => (p.$interactive ? 'pointer' : 'default')};
  box-sizing: border-box;
  padding: 0.4rem;
  border: 1px solid #1a4d3e;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover {
    ${p =>
      p.$interactive &&
      css`
        background: #1a3e2a;
      `}
  }

  ${p =>
    p.$validated &&
    css`
      animation: ${validatedPulse} 1.4s ease-in-out infinite;
      color: #d6ffe6;
      font-weight: 700;
    `}

  ${p =>
    p.$errored &&
    css`
      animation: ${errorPulse} 0.5s ease-in-out 4;
      color: #ffd6d6;
      border-color: #b53d3d;
    `}
`

const RoomLabel = styled.span`
  pointer-events: none;
`

const ErrorBanner = styled.div`
  align-self: center;
  padding: 0.5rem 0.9rem;
  background: rgba(180, 30, 30, 0.85);
  color: #fff;
  border: 1px solid #ff7a7a;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  font-weight: 700;
`

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`

const ModalBox = styled.div`
  background: #0d1b16;
  border: 2px solid #1a4d3e;
  border-radius: 6px;
  padding: 1.4rem 1.6rem;
  min-width: 280px;
  max-width: 90vw;
  color: #b8ffd2;
  font-family: 'Courier New', monospace;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 0 30px rgba(0, 200, 130, 0.25);
`

const ModalTitle = styled.div`
  font-size: 1rem;
  letter-spacing: 0.12em;
  color: #9affd1;
`

const ModalRoom = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #d6ffe6;
`

const ModalActions = styled.div`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
`

const ModalButton = styled.button<{ $variant: 'confirm' | 'cancel' }>`
  cursor: pointer;
  padding: 0.55rem 1.1rem;
  border-radius: 4px;
  font-family: inherit;
  letter-spacing: 0.08em;
  font-weight: 700;
  border: 1px solid
    ${p => (p.$variant === 'confirm' ? '#3aa35d' : '#b53d3d')};
  background: ${p => (p.$variant === 'confirm' ? '#163a23' : '#3a1414')};
  color: ${p => (p.$variant === 'confirm' ? '#bff5ce' : '#ffb0bb')};

  &:hover {
    filter: brightness(1.15);
  }
`
