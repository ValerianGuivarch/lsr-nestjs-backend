import React, { useRef } from 'react'
import styled from 'styled-components'

type EmfDeviceState = {
  deviceId: string
  emfLevel?: number
  powerOn?: boolean
  message?: string
  huntActive: boolean
}

type EmfDeviceViewProps = {
  state: EmfDeviceState
  needleAngle: number
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function EmfDeviceView({ state, needleAngle, videoRef, canvasRef }: EmfDeviceViewProps) {
  const emfLevel = Math.max(0, Math.min(5, state.emfLevel ?? 0))
  const powerOn = state.powerOn ?? true
  const displayedEmfRef = useRef(0)

  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

  const emfRanges: Array<{ min: number; max: number }> = [
    { min: 0.0, max: 0.4 },
    { min: 1.2, max: 1.9 },
    { min: 2.1, max: 3.0 },
    { min: 7.5, max: 12.0 },
    { min: 15.5, max: 21.0 },
    { min: 21.0, max: 27.0 }
  ]

  const baseAngle = powerOn ? -65 + (emfLevel / 5) * 130 : -80
  const angleDelta = needleAngle - baseAngle
  const ratioFromNeedle = clamp(0.5 + angleDelta / 24, 0, 1)
  const range = emfRanges[emfLevel]
  const emfValue = range.min + (range.max - range.min) * ratioFromNeedle

  if (!powerOn) {
    displayedEmfRef.current = 0
  } else {
    const smoothing = emfLevel >= 4 ? 0.08 : 0.06
    displayedEmfRef.current = displayedEmfRef.current + (emfValue - displayedEmfRef.current) * smoothing
  }

  const emfDisplay = `${displayedEmfRef.current.toFixed(1)} mG`

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={480} height={360} style={{ display: 'none' }} />

      <DeviceScreen>
        <HudLine>
          <small>Device: {state.deviceId}</small>
          <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
        </HudLine>

        <EmfBody>
          <EmfTop>
            <EmfBrand>GHOST TECH</EmfBrand>
            <EmfLabel>ELECTRO MAGNETIC FIELD READER</EmfLabel>
          </EmfTop>

          <EmfDisplay $on={powerOn}>{powerOn ? emfDisplay : 'OFF'}</EmfDisplay>

          <GaugeShell>
            <GaugeArc />
            <GaugeTicks>
              {[0, 1, 2, 3, 4, 5].map(level => (
                <GaugeTick key={level} style={{ transform: `translateX(-50%) rotate(${-65 + (level / 5) * 130}deg)` }} />
              ))}
            </GaugeTicks>
            <GaugeNeedle $on={powerOn} style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }} />
            <GaugeCenter />
          </GaugeShell>

          <LedRail>
            {[1, 2, 3, 4, 5].map(level => (
              <Led key={level} $active={powerOn && level <= emfLevel} $level={level} />
            ))}
          </LedRail>

          <EmfFoot>
            <span>EMF SENSOR</span>
            <PowerBadge $on={powerOn}>{powerOn ? 'POWER ON' : 'POWER OFF'}</PowerBadge>
          </EmfFoot>
        </EmfBody>

        {state.message && <Message>{state.message}</Message>}
        {state.huntActive && <Hunt>HUNT!</Hunt>}
      </DeviceScreen>
    </>
  )
}

const DeviceScreen = styled.div`
  height: 100dvh;
  width: 100%;
  background: radial-gradient(circle at 50% 10%, #14171c 0%, #07080a 55%, #040507 100%);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
`

const HudLine = styled.div`
  width: min(420px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.6rem;
`

const EmfBody = styled.div`
  width: min(420px, 100%);
  flex: 1 1 auto;
  max-height: 760px;
  border-radius: 16px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(180deg, #2f3439 0%, #14181c 100%);
  border: 1px solid #3e464e;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15);
`

const EmfTop = styled.div`
  margin-bottom: 0.9rem;
`

const EmfBrand = styled.div`
  color: #d5e2bd;
  font-size: clamp(1rem, 3.8vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.16em;
`

const EmfLabel = styled.div`
  color: #88957d;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
`

const EmfDisplay = styled.div<{ $on: boolean }>`
  margin: 1rem 0;
  min-height: 96px;
  border-radius: 12px;
  background: ${({ $on }) => ($on ? '#0c1014' : '#090b0d')};
  border: 1px solid ${({ $on }) => ($on ? '#3f4e5c' : '#242b31')};
  color: ${({ $on }) => ($on ? '#d9efb4' : '#596069')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2.1rem, 10vw, 3.7rem);
  font-weight: 700;
  letter-spacing: 0.1em;
`

const GaugeShell = styled.div`
  position: relative;
  margin: 0.2rem auto 1rem;
  width: min(360px, 92%);
  height: 130px;
`

const GaugeArc = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 200px 200px 0 0;
  border: 2px solid #55606a;
  border-bottom: none;
`

const GaugeTicks = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 88%;
  height: 110px;
`

const GaugeTick = styled.div`
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 2px;
  height: 22px;
  transform-origin: bottom center;
  background: #c4d2b2;
`

const GaugeNeedle = styled.div<{ $on: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 4px;
  height: 94px;
  transform-origin: bottom center;
  border-radius: 10px;
  background: ${({ $on }) => ($on ? '#ff5f5f' : '#6f7680')};
  transition: transform 120ms linear;
`

const GaugeCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: radial-gradient(circle at 35% 35%, #b7c4a8 0%, #5b6656 40%, #2e342d 100%);
`

const LedRail = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.95rem;
`

const Led = styled.div<{ $active: boolean; $level: number }>`
  height: 22px;
  border-radius: 6px;
  border: 1px solid #2f343b;
  background: ${({ $active, $level }) => {
    if (!$active) return '#12151a'
    if ($level <= 2) return '#79e36c'
    if ($level <= 4) return '#f4c34f'
    return '#ff5e5e'
  }};
`

const EmfFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #96a689;
  font-size: 0.85rem;
`

const PowerBadge = styled.span<{ $on: boolean }>`
  border-radius: 999px;
  border: 1px solid ${({ $on }) => ($on ? '#79e36c' : '#4f5964')};
  color: ${({ $on }) => ($on ? '#a6f39b' : '#9aa3ad')};
  padding: 0.25rem 0.62rem;
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
