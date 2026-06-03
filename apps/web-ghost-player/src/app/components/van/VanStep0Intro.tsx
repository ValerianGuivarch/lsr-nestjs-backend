import React from 'react'
import { VanIntroActions, VanIntroButton, VanIntroCard, VanIntroHint, VanIntroText, VanIntroTitle } from './van-styles'
import { VanTextConfig, DEFAULT_VAN_TEXT_CONFIG } from 'ghost/frontend'

type VanStep0IntroProps = {
  vanIntroState: 'idle' | 'playing' | 'done'
  onPlayIntro: () => void
  textConfig?: VanTextConfig
}

export function VanStep0Intro({ vanIntroState, onPlayIntro, textConfig }: VanStep0IntroProps) {
  const t = textConfig ?? DEFAULT_VAN_TEXT_CONFIG
  return (
    <VanIntroCard>
      <VanIntroTitle>{t.intro.title}</VanIntroTitle>
      <VanIntroText>{t.intro.body}</VanIntroText>
      <VanIntroActions>
        <VanIntroButton type="button" onClick={onPlayIntro} disabled={vanIntroState === 'playing'}>
          {vanIntroState === 'playing' ? t.intro.buttonPlaying : t.intro.buttonIdle}
        </VanIntroButton>
      </VanIntroActions>
    </VanIntroCard>
  )
}
