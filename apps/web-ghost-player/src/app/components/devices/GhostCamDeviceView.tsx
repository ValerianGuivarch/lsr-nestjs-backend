import React from 'react'
import styled, { keyframes } from 'styled-components'

type GhostCamDeviceState = {
  deviceId: string
  powerOn?: boolean
  message?: string
  huntActive: boolean
}

type GhostCamDeviceViewProps = {
  state: GhostCamDeviceState
  photoModeUnlocked: boolean
  photoModePassword: string
  photoModeError: string
  photoPaused: boolean
  onPhotoModePasswordChange: (value: string) => void
  onUnlockPhotoMode: () => void
  onTogglePhotoPause: () => void
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  hidePhotoButton?: boolean
  fearMessage?: string
  // Victoire affichée en overlay lorsque l'étape van >= 7 / photo finale validée.
  showVictoryOverlay?: boolean
  victoryPhoto?: string
}

export function GhostCamDeviceView({
  state,
  photoModeUnlocked,
  photoModePassword,
  photoModeError,
  photoPaused,
  onPhotoModePasswordChange,
  onUnlockPhotoMode,
  onTogglePhotoPause,
  videoRef,
  canvasRef,
  hidePhotoButton,
  fearMessage,
  showVictoryOverlay,
  victoryPhoto
}: GhostCamDeviceViewProps) {
  const [unlockPromptOpen, setUnlockPromptOpen] = React.useState(false)
  const [victoryDismissed, setVictoryDismissed] = React.useState(false)

  // Reset le "retour caméra" si la victoire est ré-armée (ex: reset MJ).
  React.useEffect(() => {
    if (!showVictoryOverlay) {
      setVictoryDismissed(false)
    }
  }, [showVictoryOverlay])

  React.useEffect(() => {
    if (photoModeUnlocked) {
      setUnlockPromptOpen(false)
    }
  }, [photoModeUnlocked])

  const handlePhotoButton = (): void => {
    if (!photoModeUnlocked) {
      setUnlockPromptOpen(true)
      return
    }

    onTogglePhotoPause()
  }

  return (
    <Root>
      <HudLine>
        <small>Device: {state.deviceId}</small>
        <small>{state.powerOn ? 'ONLINE' : 'OFFLINE'}</small>
      </HudLine>

      <GhostCamView>
        <GhostCamTitle>CAMERA</GhostCamTitle>
        {!hidePhotoButton && (
          <GhostCamActions>
            <GhostCamActionButton type="button" onClick={handlePhotoButton}>
              {photoModeUnlocked ? (photoPaused ? 'PHOTO - RELANCER' : 'PHOTO') : 'PHOTO [LOCK]'}
            </GhostCamActionButton>
          </GhostCamActions>
        )}

        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        <GhostCamCanvas ref={canvasRef} width={480} height={360} style={{ display: state.powerOn ? 'block' : 'none' }} />
        {!state.powerOn && <GhostCamOffline>CAM OFFLINE</GhostCamOffline>}
        {photoPaused && <GhostCamPaused>PAUSE PHOTO</GhostCamPaused>}
        {fearMessage && <FearOverlay>{fearMessage}</FearOverlay>}
      </GhostCamView>

      {unlockPromptOpen && !photoModeUnlocked && (
        <UnlockOverlay>
          <UnlockModal>
            <GhostCamLocker>Saisir le code pour déverrouiller l'appareil photo</GhostCamLocker>
            <PinDisplay>
              {Array.from({ length: 6 }).map((_, idx) => (
                <PinDot key={idx} $filled={idx < photoModePassword.length} />
              ))}
            </PinDisplay>
            <Keypad>
              {['1','2','3','4','5','6','7','8','9'].map(digit => (
                <KeypadButton
                  key={digit}
                  type="button"
                  onClick={() => onPhotoModePasswordChange((photoModePassword + digit).slice(0, 6))}
                >
                  {digit}
                </KeypadButton>
              ))}
              <KeypadButton
                type="button"
                $variant="secondary"
                onClick={() => onPhotoModePasswordChange('')}
              >
                C
              </KeypadButton>
              <KeypadButton
                key="0"
                type="button"
                onClick={() => onPhotoModePasswordChange((photoModePassword + '0').slice(0, 6))}
              >
                0
              </KeypadButton>
              <KeypadButton
                type="button"
                $variant="primary"
                onClick={onUnlockPhotoMode}
                disabled={photoModePassword.length === 0}
              >
                OK
              </KeypadButton>
            </Keypad>
            {photoModeError && <GhostCamError>{photoModeError}</GhostCamError>}
            <GhostCamCloseButton type="button" onClick={() => setUnlockPromptOpen(false)}>
              Fermer
            </GhostCamCloseButton>
          </UnlockModal>
        </UnlockOverlay>
      )}

      {state.message && <Message>{state.message}</Message>}
      {state.huntActive && <Hunt>HUNT!</Hunt>}

      {showVictoryOverlay && !victoryDismissed && (
        <VictoryOverlay>
          <VictoryCard>
            <VictoryTitle>Fantôme banni !</VictoryTitle>
            <VictorySubtitle>
              Votre photo a terrifié le spectre. La maison est sécurisée.
            </VictorySubtitle>
            {victoryPhoto && <VictoryPhoto src={victoryPhoto} alt="Photo finale" />}
            <VictoryBack type="button" onClick={() => setVictoryDismissed(true)}>
              Retour caméra
            </VictoryBack>
          </VictoryCard>
        </VictoryOverlay>
      )}
    </Root>
  )
}

const Root = styled.div`
  min-height: 100vh;
  width: 100%;
  background: #000;
  color: #dce8f7;
  padding: 0;
  position: relative;
  overflow: hidden;
`

const HudLine = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  color: #8ca07b;
  letter-spacing: 0.1em;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 100%);
`

const GhostCamView = styled.div`
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`

const GhostCamTitle = styled.div`
  color: #d5e2bd;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  width: auto;
  text-align: center;
  position: absolute;
  top: 0.95rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const GhostCamActions = styled.div`
  width: auto;
  display: flex;
  justify-content: flex-end;
  position: absolute;
  bottom: 1.4rem;
  right: 1.4rem;
  z-index: 3;
`

const GhostCamActionButton = styled.button`
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  letter-spacing: 0.08em;
  padding: 0.7rem 1.2rem;
  min-width: 74px;
  cursor: pointer;
  backdrop-filter: blur(4px);
`

const GhostCamCanvas = styled.canvas`
  display: block;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  border: 0;
  background: #0c1014;
  object-fit: cover;
`

const GhostCamOffline = styled.div`
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  border: 0;
  background: #0c1014;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #596069;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.1em;
`

const GhostCamPaused = styled.div`
  width: auto;
  text-align: center;
  color: #bcd7b9;
  letter-spacing: 0.12em;
  font-weight: 700;
  position: absolute;
  bottom: 5.6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const GhostCamLocker = styled.div`
  width: min(92vw, 520px);
  text-align: center;
  color: #fff;
  letter-spacing: 0.08em;
  line-height: 1.5;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const GhostCamUnlockRow = styled.div`
  width: min(92vw, 520px);
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
`

const GhostCamUnlockInput = styled.input`
  flex: 1 1 11rem;
  min-width: 0;
  border: 1px solid #4f7fb1;
  border-radius: 8px;
  background: #08111c;
  color: #dce8f7;
  padding: 0.55rem 0.75rem;
`

const GhostCamError = styled.div`
  width: min(92vw, 520px);
  text-align: center;
  color: #ff9d9d;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const UnlockOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(0, 0, 0, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const UnlockModal = styled.div`
  width: min(92vw, 460px);
  border: 1px solid #3e464e;
  border-radius: 12px;
  background: #0f141b;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const GhostCamCloseButton = styled.button`
  align-self: center;
  border-radius: 8px;
  border: 1px solid #7aa391;
  background: #17202b;
  color: #dce8f7;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
`

const Message = styled.div`
  font-size: 1.7rem;
  margin: 0;
  color: #d7eac0;
  text-align: center;
  position: absolute;
  left: 50%;
  top: 4rem;
  transform: translateX(-50%);
  z-index: 3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const Hunt = styled.div`
  color: #ff4444;
  font-size: 3rem;
  margin: 0;
  font-weight: bold;
  position: absolute;
  right: 1rem;
  top: 4rem;
  z-index: 3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
`

const PinDisplay = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin: 0.4rem 0 0.2rem;
`

const PinDot = styled.div<{ $filled: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #6b7e95;
  background: ${({ $filled }) => ($filled ? '#dce8f7' : 'transparent')};
  transition: background 120ms ease;
`

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  width: min(82vw, 320px);
  margin: 0 auto;
`

const KeypadButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  appearance: none;
  height: 56px;
  border-radius: 12px;
  border: 1px solid ${({ $variant }) =>
    $variant === 'primary' ? '#5fb27c' : $variant === 'secondary' ? '#b25f5f' : '#3e4a5b'};
  background: ${({ $variant }) =>
    $variant === 'primary' ? '#1e3a26' : $variant === 'secondary' ? '#3a1e1e' : '#19222e'};
  color: #f1f6ff;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 80ms ease, background 120ms ease;

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const FearOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(120, 0, 0, 0.55);
  color: #fff;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.8);
  z-index: 5;
  pointer-events: none;
`

const glow = keyframes`
  0%, 100% { text-shadow: 0 0 8px rgba(120, 255, 180, 0.4); }
  50% { text-shadow: 0 0 20px rgba(120, 255, 180, 0.9); }
`

const VictoryOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(20, 60, 40, 0.95), rgba(0, 0, 0, 0.97));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  z-index: 100;
  padding: 2rem;
`

const VictoryTitle = styled.h1`
  margin: 0;
  font-size: 2.4rem;
  color: #88ffaa;
  letter-spacing: 0.15rem;
  text-align: center;
  animation: ${glow} 2.5s ease-in-out infinite;
`

const VictorySubtitle = styled.div`
  font-size: 1.2rem;
  color: #b8ffcc;
  letter-spacing: 0.08em;
  text-align: center;
`

const VictoryPhoto = styled.img`
  max-width: 80vw;
  max-height: 55vh;
  border: 3px solid rgba(255, 220, 100, 0.7);
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 0 30px rgba(255, 220, 100, 0.3);
`

const VictoryCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 92vw;
`

const VictoryBack = styled.button`
  background: rgba(20, 60, 40, 0.85);
  color: #b8ffcc;
  border: 1px solid #4fd17a;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  &:hover {
    background: rgba(40, 100, 70, 0.9);
  }
`
