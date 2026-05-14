import React from 'react'
import {
  FloorPlanImage,
  VanDeclarationHint,
  VanDeclarationMeta,
  VanEmptyState,
  VanFinalCard,
  VanFinalText,
  VanFinalTitle
} from './van-styles'

type VanStep3ValidationProps = {
  floorPlanImage?: string
  mjAccepted: boolean
}

export function VanStep3Validation({ floorPlanImage, mjAccepted }: VanStep3ValidationProps) {
  return (
    <VanFinalCard>
      <VanFinalTitle>Étape 3 - Validation MJ</VanFinalTitle>
      {floorPlanImage ? (
        <FloorPlanImage src={floorPlanImage} alt="Caméra finale" />
      ) : (
        <VanEmptyState>Caméra en attente.</VanEmptyState>
      )}
      <VanFinalText>
        Le nom du spectre "edouard" a été saisi. En attente du bouton Accepter du MJ.
      </VanFinalText>
      {!mjAccepted && <VanDeclarationHint>Statut: en attente de validation MJ.</VanDeclarationHint>}
      {mjAccepted && <VanDeclarationMeta>Partie validée par le MJ: c’est gagné.</VanDeclarationMeta>}
    </VanFinalCard>
  )
}
