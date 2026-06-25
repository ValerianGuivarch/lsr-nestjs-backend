import React from 'react'
import styled from 'styled-components'

type ThermometerDeviceState = {
  deviceId: string
  powerOn?: boolean
  temperature?: number
  message?: string
  huntActive: boolean
}

type ThermometerDeviceViewProps = {
  state: ThermometerDeviceState
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ThermometerDeviceView({ state, videoRef, canvasRef }: ThermometerDeviceViewProps) {
  const powerOn = state.powerOn ?? true
  const tempC = state.temperature ?? 13.4
  const isGlacial = powerOn && tempC <= 6

  return (
    <Root>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={480} height={360} style={{ display: 'none' }} />

      <HudLine>
        <small>Device: {state.deviceId}</small>
        <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
      </HudLine>

      <DeviceBody>
        <LcdBezel>
          <LcdScreen $on={powerOn} $glacial={isGlacial}>
            {powerOn ? (
              <>
                <LcdTitle $glacial={isGlacial}>THERMOMETRE</LcdTitle>
                <LcdUnitRow $glacial={isGlacial}>Celsius</LcdUnitRow>
                <LcdTempValue $glacial={isGlacial}>{tempC.toFixed(1)}°C</LcdTempValue>
              </>
            ) : (
              <LcdOffText>- - -</LcdOffText>
            )}
          </LcdScreen>
        </LcdBezel>
      </DeviceBody>

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0.75rem;
  overflow: hidden;
`

const HudLine = styled.div`
  width: min(360px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.6rem;
  font-size: 0.75rem;
`

const DeviceBody = styled.div`
  width: min(360px, 100%);
  flex: 1 1 auto;
  max-height: 680px;
  border-radius: 18px 18px 40px 40px;
  background: linear-gradient(170deg, #1e2837 0%, #111924 55%, #0d141c 100%);
  border: 2px solid #2c3a4a;
  padding: 1.4rem 1.4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
`

const LcdBezel = styled.div`
  width: 100%;
  background: #0a1218;
  border-radius: 10px;
  border: 3px solid #1a2a3a;
  padding: 6px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
`

const LcdScreen = styled.div<{ $on: boolean; $glacial: boolean }>`
  background: ${({ $on, $glacial }) => {
    if (!$on) return '#1a130d'
    return $glacial
      ? 'linear-gradient(160deg, #092439 0%, #07192a 100%)'
      : 'linear-gradient(160deg, #3a2508 0%, #2a1a06 100%)'
  }};
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  min-height: clamp(140px, 32vh, 280px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  box-shadow: ${({ $on, $glacial }) => {
    if (!$on) return 'none'
    return $glacial
      ? '0 0 14px rgba(90, 185, 255, 0.45), inset 0 0 20px rgba(55, 145, 220, 0.18)'
      : '0 0 14px rgba(255, 170, 80, 0.35), inset 0 0 20px rgba(205, 110, 25, 0.16)'
  }};
`

const LcdTitle = styled.div<{ $glacial: boolean }>`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: ${({ $glacial }) => ($glacial ? '#c3e7ff' : '#f5d3ab')};
`

const LcdUnitRow = styled.div<{ $glacial: boolean }>`
  text-align: right;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $glacial }) => ($glacial ? '#b7e0ff' : '#f0c08a')};
  letter-spacing: 0.1em;
  margin-top: 2px;
`

const LcdTempValue = styled.div<{ $glacial: boolean }>`
  font-size: clamp(3.2rem, 16vw, 5rem);
  font-weight: 900;
  color: ${({ $glacial }) => ($glacial ? '#a7ddff' : '#ffd19a')};
  text-shadow: ${({ $glacial }) =>
    $glacial
      ? '0 0 14px rgba(120, 195, 255, 0.48), 0 0 30px rgba(70, 145, 215, 0.22)'
      : '0 0 14px rgba(255, 166, 70, 0.45), 0 0 30px rgba(210, 120, 30, 0.2)'};
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`

const LcdOffText = styled.div`
  font-size: 2.5rem;
  color: #4a3520;
  text-align: center;
  letter-spacing: 0.3em;
  padding: 1rem 0;
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
