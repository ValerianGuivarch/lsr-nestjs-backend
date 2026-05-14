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
  onTuneFrequencyDown: () => void
  onTuneFrequencyUp: () => void
}

export function SpiritBoxDeviceView({
  state,
  spiritStatus,
  spiritLastHeardAt,
  spiritFrequency,
  onTuneFrequencyDown,
  onTuneFrequencyUp,
}: SpiritBoxDeviceViewProps) {
  const powerOn = state.powerOn ?? true
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
          <span>{powerOn ? 'FM 100ms' : 'OFF'}</span>
        </SpiritBoxHeader>

        <SpiritBoxScreen $on={powerOn}>
          <SpiritFrequency>{spiritFrequency.toFixed(1).padStart(5, '0')}</SpiritFrequency>
          <SpiritStatus>{spiritStatus}</SpiritStatus>
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
  min-height: 100vh;
  width: 100%;
  background: #07111c;
  color: #dce8f7;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const HudLine = styled.div`
  width: min(560px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.9rem;
`

const SpiritBoxShell = styled.div`
  width: min(560px, 100%);
  border-radius: 16px;
  padding: 1rem;
  background: linear-gradient(180deg, #cbcfd5 0%, #8f98a3 100%);
  border: 1px solid #68717b;
`

const SpiritBoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
  color: #101416;
`

const SpiritBoxScreen = styled.div<{ $on: boolean }>`
  border-radius: 8px;
  border: 1px solid #b16727;
  background: ${({ $on }) => ($on ? '#f39b52' : '#5f5448')};
  color: #120d09;
  padding: 0.8rem;
  min-height: 130px;
`

const SpiritFrequency = styled.div`
  font-size: clamp(2.2rem, 9vw, 3.4rem);
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
