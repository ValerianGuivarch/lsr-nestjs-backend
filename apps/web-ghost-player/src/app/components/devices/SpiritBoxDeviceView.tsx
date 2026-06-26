import React from 'react'
import styled from 'styled-components'

type SpiritBoxDeviceState = {
  deviceId: string
  powerOn?: boolean
  message?: string
  huntActive: boolean
}

type SpiritBoxDeviceViewProps = {
  state: SpiritBoxDeviceState
  spiritStatus: string
  spiritLastHeardAt: string
  spiritFrequency: number
  spiritSignalLocked: boolean
  onTuneFrequencyDown: () => void
  onTuneFrequencyUp: () => void
}

export function SpiritBoxDeviceView({
  state,
  spiritStatus,
  spiritLastHeardAt,
  spiritFrequency,
  spiritSignalLocked,
  onTuneFrequencyDown,
  onTuneFrequencyUp,
}: SpiritBoxDeviceViewProps) {
  const powerOn = state.powerOn ?? true
  const displayedStatus = spiritSignalLocked ? 'AUDIO DISPONIBLE' : spiritStatus
  const holdTimeoutRef = React.useRef<number | null>(null)
  const holdIntervalRef = React.useRef<number | null>(null)

  const clearHold = (): void => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  const startHold = (step: () => void): void => {
    if (!powerOn) {
      return
    }

    clearHold()
    step()

    holdTimeoutRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(step, 120)

      window.setTimeout(() => {
        if (holdIntervalRef.current !== null) {
          window.clearInterval(holdIntervalRef.current)
          holdIntervalRef.current = window.setInterval(step, 45)
        }
      }, 650)
    }, 260)
  }

  React.useEffect(() => {
    return () => {
      clearHold()
    }
  }, [])

  return (
    <Root>
      <HudLine>
        <small>Device: {state.deviceId}</small>
        <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
      </HudLine>

      <SpiritBoxShell>
        <SpiritBoxHeader>
          <strong>P-SB7T Spirit Box</strong>
          <span>{powerOn ? '87.5 - 108 MHz' : 'OFF'}</span>
        </SpiritBoxHeader>

        <SpiritBoxScreen $on={powerOn} $locked={spiritSignalLocked}>
          <SpiritFrequency>{spiritFrequency.toFixed(1).padStart(5, '0')}</SpiritFrequency>
          <SpiritStatus>{displayedStatus}</SpiritStatus>
          {spiritLastHeardAt && <SpiritTimestamp>Dernier msg MJ: {spiritLastHeardAt}</SpiritTimestamp>}
        </SpiritBoxScreen>

        <SpiritActions>
          <SpiritButton
            type="button"
            onMouseDown={() => startHold(onTuneFrequencyDown)}
            onMouseUp={clearHold}
            onMouseLeave={clearHold}
            onTouchStart={() => startHold(onTuneFrequencyDown)}
            onTouchEnd={clearHold}
            onClick={event => event.preventDefault()}
            disabled={!powerOn}
          >
            -
          </SpiritButton>
          <SpiritButton
            type="button"
            onMouseDown={() => startHold(onTuneFrequencyUp)}
            onMouseUp={clearHold}
            onMouseLeave={clearHold}
            onTouchStart={() => startHold(onTuneFrequencyUp)}
            onTouchEnd={clearHold}
            onClick={event => event.preventDefault()}
            disabled={!powerOn}
          >
            +
          </SpiritButton>
        </SpiritActions>
      </SpiritBoxShell>

      {state.message && <Message>{state.message}</Message>}
      {state.huntActive && <Hunt>HUNT!</Hunt>}
    </Root>
  )
}

const Root = styled.div`
  height: 100dvh;
  width: 100%;
  background: #07111c;
  color: #dce8f7;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
`

const HudLine = styled.div`
  width: min(360px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.6rem;
`

const SpiritBoxShell = styled.div`
  width: min(360px, 100%);
  border-radius: 16px;
  padding: 1rem;
  background: linear-gradient(180deg, #cbcfd5 0%, #8f98a3 100%);
  border: 1px solid #68717b;
  flex: 1 1 auto;
  max-height: 760px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const SpiritBoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
  color: #101416;
`

const SpiritBoxScreen = styled.div<{ $on: boolean; $locked: boolean }>`
  border-radius: 8px;
  border: 1px solid ${({ $locked }) => ($locked ? '#247a2f' : '#b16727')};
  background: ${({ $on, $locked }) => {
    if (!$on) return '#5f5448'
    return $locked ? '#78d96b' : '#f39b52'
  }};
  color: ${({ $locked }) => ($locked ? '#07220a' : '#120d09')};
  padding: 0.8rem;
  flex: 1 1 auto;
  min-height: clamp(160px, 34vh, 320px);
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const SpiritFrequency = styled.div`
  font-size: clamp(2.8rem, 14vw, 4.4rem);
  line-height: 1;
  letter-spacing: 0.03em;
  font-family: 'Courier New', monospace;
  font-weight: 700;
`

const SpiritStatus = styled.div`
  margin-top: 0.5rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  font-weight: 700;
`

const SpiritTimestamp = styled.div`
  margin-top: 0.45rem;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
`

const SpiritActions = styled.div`
  margin-top: 0.8rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`

const SpiritButton = styled.button`
  border: 1px solid #2f3942;
  border-radius: 8px;
  padding: 0.52rem 0.9rem;
  background: linear-gradient(180deg, #222a30 0%, #14191e 100%);
  color: #dce5ef;
  letter-spacing: 0.08em;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const Message = styled.div`
  font-size: 1.7rem;
  margin: 1rem;
  color: #d7eac0;
  text-align: center;
`

const Hunt = styled.div`
  color: #ff4444;
  font-size: 3rem;
  margin: 2rem;
  font-weight: bold;
`
