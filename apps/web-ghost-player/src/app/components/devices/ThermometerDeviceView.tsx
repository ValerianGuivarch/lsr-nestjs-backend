import React from 'react'
import styled, { keyframes } from 'styled-components'

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
  const tempF = (tempC * 9) / 5 + 32
  const ems = 0.95

  return (
    <Root>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={480} height={360} style={{ display: 'none' }} />

      <HudLine>
        <small>Device: {state.deviceId}</small>
        <small>{powerOn ? 'ONLINE' : 'OFFLINE'}</small>
      </HudLine>

      <DeviceBody>
        <DeviceTop>
          <BrandLine>GHOST HUNTIN'</BrandLine>
          <ModelLine>HOT OR NOT 300</ModelLine>
          <RangeLine>-50°C~700°C (-58°F~1382°F)</RangeLine>
        </DeviceTop>

        <LcdBezel>
          <LcdScreen $on={powerOn}>
            {powerOn ? (
              <>
                <LcdStatusRow>
                  <LcdTag>HOLD</LcdTag>
                  <LcdIcons>
                    <LcdIcon>▪▪▪</LcdIcon>
                    <LcdIcon>↑</LcdIcon>
                    <LcdIcon>⚠</LcdIcon>
                  </LcdIcons>
                </LcdStatusRow>
                <LcdUnitRow>°F</LcdUnitRow>
                <LcdTempValue>{tempF.toFixed(1)}</LcdTempValue>
                <LcdEmsRow>EMS {ems.toFixed(2)}</LcdEmsRow>
              </>
            ) : (
              <LcdOffText>- - -</LcdOffText>
            )}
          </LcdScreen>
        </LcdBezel>

        <ButtonRow>
          <DeviceButton $color="#e8c94a">SET</DeviceButton>
          <DeviceButton $color="#4a7ae8">▲</DeviceButton>
          <DeviceButton $color="#4a7ae8">▼</DeviceButton>
        </ButtonRow>
      </DeviceBody>

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const HudLine = styled.div`
  width: min(340px, 100%);
  display: flex;
  justify-content: space-between;
  color: #8ca07b;
  letter-spacing: 0.1em;
  margin-bottom: 0.9rem;
  font-size: 0.75rem;
`

const DeviceBody = styled.div`
  width: min(340px, 100%);
  border-radius: 18px 18px 40px 40px;
  background: linear-gradient(170deg, #1e2837 0%, #111924 55%, #0d141c 100%);
  border: 2px solid #2c3a4a;
  padding: 1.4rem 1.4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
`

const DeviceTop = styled.div`
  width: 100%;
  text-align: center;
`

const BrandLine = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  color: #b0c8e0;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`

const ModelLine = styled.div`
  font-size: 0.85rem;
  font-weight: 900;
  color: #d8eaf8;
  letter-spacing: 0.12em;
`

const RangeLine = styled.div`
  font-size: 0.55rem;
  color: #5a7a9a;
  letter-spacing: 0.06em;
  margin-top: 2px;
`

const LcdBezel = styled.div`
  width: 100%;
  background: #0a1218;
  border-radius: 10px;
  border: 3px solid #1a2a3a;
  padding: 6px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
`

const lcdGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(0, 255, 100, 0.3), inset 0 0 20px rgba(0, 180, 80, 0.08); }
  50% { box-shadow: 0 0 18px rgba(0, 255, 100, 0.5), inset 0 0 24px rgba(0, 180, 80, 0.14); }
`

const LcdScreen = styled.div<{ $on: boolean }>`
  background: ${({ $on }) => ($on ? 'linear-gradient(160deg, #0a2210 0%, #071c0d 100%)' : '#090e0b')};
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  animation: ${({ $on }) => ($on ? lcdGlow : 'none')} 3s ease-in-out infinite;
`

const LcdStatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LcdTag = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  color: #50e080;
  letter-spacing: 0.12em;
  border: 1px solid #50e080;
  padding: 1px 4px;
  border-radius: 2px;
`

const LcdIcons = styled.div`
  display: flex;
  gap: 4px;
`

const LcdIcon = styled.span`
  font-size: 0.55rem;
  color: #50e080;
  opacity: 0.7;
`

const LcdUnitRow = styled.div`
  text-align: right;
  font-size: 0.75rem;
  font-weight: 700;
  color: #50e080;
  letter-spacing: 0.1em;
  margin-top: 2px;
`

const LcdTempValue = styled.div`
  font-size: 3.2rem;
  font-weight: 900;
  color: #60f090;
  text-shadow: 0 0 14px rgba(96, 240, 144, 0.6), 0 0 30px rgba(40, 200, 80, 0.25);
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`

const LcdEmsRow = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #50e080;
  letter-spacing: 0.1em;
  margin-top: 2px;
`

const LcdOffText = styled.div`
  font-size: 2.5rem;
  color: #1a3320;
  text-align: center;
  letter-spacing: 0.3em;
  padding: 1rem 0;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 0.7rem;
  margin-top: 0.2rem;
`

const DeviceButton = styled.button<{ $color: string }>`
  background: ${({ $color }) => $color};
  color: #0a1218;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: default;
  box-shadow: 0 3px 0 rgba(0,0,0,0.4);
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
