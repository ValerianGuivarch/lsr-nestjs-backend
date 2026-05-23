import React from 'react'
import styled from 'styled-components'
import { VanObjective } from './types'
import {
  ActivityBar,
  ActivityLevel,
  ActivityValue,
  FloorPlanImage,
  ObjectiveCheck,
  ObjectiveItem,
  ObjectivesList,
  ObjectiveText,
  VanActivityCopy,
  VanCameraFrame,
  VanDeclarationBlock,
  VanDeclarationButton,
  VanDeclarationError,
  VanDeclarationInput,
  VanDeclarationRow,
  VanDeclarationTitle,
  VanEmptyState,
  VanPanelLabel,
  VanTwoColumnGrid
} from './van-styles'

type VanStep2EquipmentProps = {
  floorPlanImage?: string
  liveCameraFrame?: string
  objectives: VanObjective[]
  ghostActivity: number
  materialCompleted: boolean
  vanGhostGuess: string
  onGhostGuessChange: (value: string) => void
  onDeclareGhost: () => void
  vanGhostDeclarationError: string
}

export function VanStep2Equipment({
  floorPlanImage,
  liveCameraFrame,
  objectives,
  ghostActivity,
  materialCompleted,
  vanGhostGuess,
  onGhostGuessChange,
  onDeclareGhost,
  vanGhostDeclarationError
}: VanStep2EquipmentProps) {
  return (
    <VanTwoColumnGrid>
      <LeftPanel>
        <Block>
          <VanPanelLabel>ACTIVITÉ DU FANTÔME</VanPanelLabel>
          <ActivityBar>
            <ActivityLevel $level={ghostActivity} />
            <ActivityValue>{ghostActivity}/10</ActivityValue>
          </ActivityBar>
        </Block>

        <Block style={{ flex: 1, minHeight: 0 }}>
          <VanPanelLabel>MISSION EN COURS</VanPanelLabel>
          <ScrollArea>
            <ObjectivesList>
              {objectives.length === 0 && <VanEmptyState>Aucun objectif pour le moment.</VanEmptyState>}
              {objectives.map((obj, idx) => (
                <ObjectiveItem key={idx} $completed={obj.completed}>
                  <ObjectiveCheck $completed={obj.completed}>✓</ObjectiveCheck>
                  <ObjectiveText>{obj.objective}</ObjectiveText>
                </ObjectiveItem>
              ))}
            </ObjectivesList>
          </ScrollArea>
        </Block>

        {materialCompleted && (
          <Block>
            <VanPanelLabel>IDENTIFICATION DU SPECTRE</VanPanelLabel>
            <VanActivityCopy>
              Le matériel est en place. Entre le nom du spectre identifié pour valider l'étape.
            </VanActivityCopy>
            <VanDeclarationBlock>
              <VanDeclarationTitle>Saisir le nom du spectre</VanDeclarationTitle>
              <VanDeclarationRow>
                <VanDeclarationInput
                  value={vanGhostGuess}
                  onChange={event => onGhostGuessChange(event.target.value)}
                  placeholder="Nom du spectre"
                  aria-label="Nom du spectre"
                />
                <VanDeclarationButton type="button" onClick={onDeclareGhost}>
                  Valider
                </VanDeclarationButton>
              </VanDeclarationRow>
              {vanGhostDeclarationError && <VanDeclarationError>{vanGhostDeclarationError}</VanDeclarationError>}
            </VanDeclarationBlock>
          </Block>
        )}
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

        <Block>
          <VanPanelLabel>PLAN DE LA MAISON</VanPanelLabel>
          <MediaBox>
            {floorPlanImage ? (
              <FloorPlanImage src={floorPlanImage} alt="Plan du lieu" />
            ) : (
              <VanEmptyState>Plan indisponible.</VanEmptyState>
            )}
          </MediaBox>
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
  gap: 0.5rem;
`

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`

const MediaBox = styled.div`
  flex: 1;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`
