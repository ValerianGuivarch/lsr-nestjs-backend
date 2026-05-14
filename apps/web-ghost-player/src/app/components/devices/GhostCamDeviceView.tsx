import React from 'react'
import styled from 'styled-components'

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
  canvasRef
}: GhostCamDeviceViewProps) {
  const [unlockPromptOpen, setUnlockPromptOpen] = React.useState(false)

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
        <GhostCamActions>
          <GhostCamActionButton type="button" onClick={handlePhotoButton}>
            {photoModeUnlocked ? (photoPaused ? 'PHOTO - RELANCER' : 'PHOTO') : 'PHOTO [LOCK]'}
          </GhostCamActionButton>
        </GhostCamActions>

        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        <GhostCamCanvas ref={canvasRef} width={480} height={360} style={{ display: state.powerOn ? 'block' : 'none' }} />
        {!state.powerOn && <GhostCamOffline>CAM OFFLINE</GhostCamOffline>}
        {photoPaused && <GhostCamPaused>PAUSE PHOTO</GhostCamPaused>}
      </GhostCamView>

      {unlockPromptOpen && !photoModeUnlocked && (
        <UnlockOverlay>
          <UnlockModal>
            <GhostCamLocker>Saisir code pour debloquer l'appareil photo</GhostCamLocker>
            <GhostCamUnlockRow>
              <GhostCamUnlockInput
                value={photoModePassword}
                onChange={event => onPhotoModePasswordChange(event.target.value)}
                placeholder="Code"
                inputMode="numeric"
              />
              <GhostCamActionButton type="button" onClick={onUnlockPhotoMode}>
                Debloquer
              </GhostCamActionButton>
            </GhostCamUnlockRow>
            {photoModeError && <GhostCamError>{photoModeError}</GhostCamError>}
            <GhostCamCloseButton type="button" onClick={() => setUnlockPromptOpen(false)}>
              Fermer
            </GhostCamCloseButton>
          </UnlockModal>
        </UnlockOverlay>
      )}

      {state.message && <Message>{state.message}</Message>}
      {state.huntActive && <Hunt>HUNT!</Hunt>}
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
  justify-content: center;
  position: absolute;
  bottom: 1.4rem;
  left: 50%;
  transform: translateX(-50%);
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
