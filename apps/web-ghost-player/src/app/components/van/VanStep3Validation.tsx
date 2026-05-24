import React from 'react'
import {
  VanFinalCard,
  VanFinalText,
  VanFinalTitle
} from './van-styles'

export function VanStep3Validation() {
  return (
    <VanFinalCard>
      <VanFinalTitle>Étape 5/7 - Bannissement</VanFinalTitle>
      <VanFinalText>
        Spectre identifié: ONI.
      </VanFinalText>
      <VanFinalText>
        Comment le vaincre: utilisez l&apos;encens dans sa zone d&apos;activité pour le repousser, puis appliquez le rituel de bannissement avec l&apos;équipement requis.
      </VanFinalText>
      <VanFinalText>
        Aucune validation MJ n&apos;est nécessaire: poursuivez directement la mission.
      </VanFinalText>
    </VanFinalCard>
  )
}
