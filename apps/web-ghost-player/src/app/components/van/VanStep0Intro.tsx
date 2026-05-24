import React from 'react'
import { VanIntroActions, VanIntroButton, VanIntroCard, VanIntroHint, VanIntroText, VanIntroTitle } from './van-styles'

type VanStep0IntroProps = {
  vanIntroState: 'idle' | 'playing' | 'done'
  onPlayIntro: () => void
}

export function VanStep0Intro({ vanIntroState, onPlayIntro }: VanStep0IntroProps) {
  return (
    <VanIntroCard>
      <VanIntroTitle>MESSAGE EN ATTENTE</VanIntroTitle>
      <VanIntroText>
        Une transmission cryptée vient d'être interceptée. Les équipements de détection sont en veille.
        Initialisez le système pour recevoir le briefing de mission — les coordonnées de l'entité sont attendues.
      </VanIntroText>
      <VanIntroActions>
        <VanIntroButton type="button" onClick={onPlayIntro} disabled={vanIntroState === 'playing'}>
          {vanIntroState === 'playing' ? '— TRANSMISSION EN COURS —' : 'INITIALISER'}
        </VanIntroButton>
      </VanIntroActions>
    </VanIntroCard>
  )
}
