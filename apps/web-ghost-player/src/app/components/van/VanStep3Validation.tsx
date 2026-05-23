import React from 'react'
import {
  VanCameraFrame,
  VanDeclarationHint,
  VanDeclarationMeta,
  VanEmptyState,
  VanFinalCard,
  VanFinalText,
  VanFinalTitle
} from './van-styles'

type VanStep3ValidationProps = {
  floorPlanImage?: string
  liveCameraFrame?: string
  mjAccepted: boolean
}

export function VanStep3Validation({ liveCameraFrame, mjAccepted }: VanStep3ValidationProps) {
  return (
    <VanFinalCard>
      <VanFinalTitle>Étape 3 - Validation MJ</VanFinalTitle>
      {liveCameraFrame ? (
        <VanCameraFrame src={liveCameraFrame} alt="Flux caméra" />
      ) : (
        <VanEmptyState>Caméra en attente de retour.</VanEmptyState>
      )}
      <VanFinalText>
        Le nom du spectre a été saisi. En attente du bouton Accepter du MJ.
      </VanFinalText>
      {!mjAccepted && <VanDeclarationHint>Statut: en attente de validation MJ.</VanDeclarationHint>}
      {mjAccepted && <VanDeclarationMeta>Partie validée par le MJ: c’est gagné.</VanDeclarationMeta>}
    </VanFinalCard>
  )
}
