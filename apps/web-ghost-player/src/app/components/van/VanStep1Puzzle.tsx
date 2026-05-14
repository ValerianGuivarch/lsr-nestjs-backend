import React from 'react'
import { VanFeedMessage, VanObjective } from './types'
import {
  ActivityBar,
  ActivityLevel,
  ActivityValue,
  VanCameraFrame,
  VanCameraViewport,
  MessageAudio,
  MessageImage,
  ObjectiveCheck,
  ObjectiveItem,
  ObjectivesList,
  ObjectiveText,
  VanEmptyState,
  VanFeed,
  VanFeedItem,
  VanPanelScroll,
  VanPanelEqual,
  VanPanelLabel,
  VanQuadGrid
} from './van-styles'

type VanStep1PuzzleProps = {
  objectives: VanObjective[]
  ghostActivity: number
  floorPlanImage?: string
  feedMessages: VanFeedMessage[]
}

export function VanStep1Puzzle({
  objectives,
  ghostActivity,
  floorPlanImage,
  feedMessages
}: VanStep1PuzzleProps) {
  return (
    <VanQuadGrid>
      <VanPanelEqual>
        <VanPanelLabel>MISSION EN COURS</VanPanelLabel>
        <VanPanelScroll>
          <ObjectivesList>
            {objectives.length === 0 && <VanEmptyState>Aucun objectif pour le moment.</VanEmptyState>}
            {objectives.map((obj, idx) => (
              <ObjectiveItem key={idx} $completed={obj.completed}>
                <ObjectiveCheck $completed={obj.completed}>✓</ObjectiveCheck>
                <ObjectiveText>{obj.objective}</ObjectiveText>
              </ObjectiveItem>
            ))}
          </ObjectivesList>
        </VanPanelScroll>
      </VanPanelEqual>

      <VanPanelEqual>
        <VanPanelLabel>ÉCRAN CAMÉRA</VanPanelLabel>
        <VanCameraViewport>
          {floorPlanImage ? (
            <VanCameraFrame src={floorPlanImage} alt="Caméra / plan du lieu" />
          ) : (
            <VanEmptyState>Caméras en attente de retour.</VanEmptyState>
          )}
        </VanCameraViewport>
      </VanPanelEqual>

      <VanPanelEqual>
        <VanPanelLabel>ACTIVITÉ DU FANTÔME</VanPanelLabel>
        <ActivityBar>
          <ActivityLevel $level={ghostActivity} />
          <ActivityValue>{ghostActivity}/10</ActivityValue>
        </ActivityBar>
      </VanPanelEqual>

      <VanPanelEqual>
        <VanPanelLabel>MESSAGERIE</VanPanelLabel>
        <VanFeed>
          {feedMessages.length === 0 && <VanEmptyState>Message en attente.</VanEmptyState>}
          {feedMessages.map(message => (
            <VanFeedItem key={message.id}>
              <strong>{message.title}</strong>
              {message.text && <span>{message.text}</span>}
              {message.imageUrl && <MessageImage src={message.imageUrl} alt={message.title} />}
              {message.audioUrl && (
                <MessageAudio controls preload="none" src={message.audioUrl}>
                  Votre navigateur ne supporte pas la lecture audio.
                </MessageAudio>
              )}
            </VanFeedItem>
          ))}
        </VanFeed>
      </VanPanelEqual>
    </VanQuadGrid>
  )
}
