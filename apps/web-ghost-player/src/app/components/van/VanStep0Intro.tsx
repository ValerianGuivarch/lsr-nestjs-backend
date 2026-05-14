import React from 'react'
import { VanIntroActions, VanIntroButton, VanIntroCard, VanIntroHint, VanIntroText, VanIntroTitle } from './van-styles'

type VanStep0IntroProps = {
  vanIntroState: 'idle' | 'playing' | 'done'
  onPlayIntro: () => void
}

export function VanStep0Intro({ vanIntroState, onPlayIntro }: VanStep0IntroProps) {
  return (
    <VanIntroCard>
      <VanIntroTitle>Étape 0 - Audio de lancement</VanIntroTitle>
      <VanIntroText>
        Le jeu n’est pas lancé. Clique sur lecture pour démarrer l’audio d’introduction.
      </VanIntroText>
      <VanIntroActions>
        <VanIntroButton type="button" onClick={onPlayIntro} disabled={vanIntroState === 'playing'}>
          {vanIntroState === 'playing' ? 'Lecture en cours...' : 'Lecture'}
        </VanIntroButton>
      </VanIntroActions>
      <VanIntroHint>
        Intro: <strong>https://l7r.fr/l7r/GhostIntro.mp3</strong>. À la fin du son, passage automatique en étape 1.
      </VanIntroHint>
    </VanIntroCard>
  )
}
