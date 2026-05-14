import React from 'react'
import {
  FloorPlanImage,
  VanActivityCopy,
  VanDeclarationBlock,
  VanDeclarationButton,
  VanDeclarationError,
  VanDeclarationHint,
  VanDeclarationInput,
  VanDeclarationRow,
  VanDeclarationTitle,
  VanEmptyState,
  VanGridLayout,
  VanPanel,
  VanPanelLabel
} from './van-styles'

type VanStep2EquipmentProps = {
  floorPlanImage?: string
  vanGhostGuess: string
  onGhostGuessChange: (value: string) => void
  onDeclareGhost: () => void
  vanGhostDeclarationError: string
}

export function VanStep2Equipment({
  floorPlanImage,
  vanGhostGuess,
  onGhostGuessChange,
  onDeclareGhost,
  vanGhostDeclarationError
}: VanStep2EquipmentProps) {
  return (
    <VanGridLayout>
      <VanPanel>
        <VanPanelLabel>ÉTAPE 2 - MATÉRIEL RÉCUPÉRÉ</VanPanelLabel>
        <VanActivityCopy>
          Le MJ peut agir sur EMF, thermomètre, caméra (orbes/fantôme) et spiritbox (messages pré-enregistrés).
        </VanActivityCopy>
        <VanDeclarationBlock>
          <VanDeclarationTitle>Saisir le nom du spectre</VanDeclarationTitle>
          <VanDeclarationHint>Nom attendu pour cette partie: edouard</VanDeclarationHint>
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
      </VanPanel>

      <VanPanel>
        <VanPanelLabel>ÉCRAN CAMÉRA</VanPanelLabel>
        {floorPlanImage ? (
          <FloorPlanImage src={floorPlanImage} alt="Caméra / plan du lieu" />
        ) : (
          <VanEmptyState>Caméras en attente de retour.</VanEmptyState>
        )}
      </VanPanel>
    </VanGridLayout>
  )
}
