import React from 'react'
import styled from 'styled-components'
import { VanObjective } from './types'
import {
  ActivityBar,
  ActivityLevel,
  ActivityValue,
  VanCameraFrame,
  ObjectiveCheck,
  ObjectiveItem,
  ObjectivesList,
  ObjectiveText,
  VanEmptyState,
  VanPanelLabel,
  VanTwoColumnGrid
} from './van-styles'

type VanStep1PuzzleProps = {
  objectives: VanObjective[]
  ghostActivity: number
  floorPlanImage?: string
  liveCameraFrame?: string
}

export function VanStep1Puzzle({
  objectives,
  ghostActivity,
  floorPlanImage,
  liveCameraFrame
}: VanStep1PuzzleProps) {
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
              <VanCameraFrame src={floorPlanImage} alt="Plan du lieu" />
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
  gap: 0.4rem;
  min-height: 0;
`

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const MediaBox = styled.div`
  width: 100%;
  max-height: 38vh;
  aspect-ratio: 16 / 10;
  border: 1px solid #26476e;
  border-radius: 4px;
  background: rgba(8, 16, 27, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`
