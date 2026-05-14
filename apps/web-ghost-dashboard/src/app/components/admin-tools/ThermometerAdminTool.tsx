import React from 'react'
import { ThermometerAdminToolProps } from './types'

export function ThermometerAdminTool({
  devices,
  controlDeviceId,
  controlTemperature,
  controlPowerOn,
  cameraFrame,
  onControlDeviceChange,
  onControlTemperatureChange,
  onControlPowerOnChange,
}: ThermometerAdminToolProps): JSX.Element {
  const thermometerDevices = devices.filter(
    device => device.role === 'ghostorbs' || device.role === 'thermometer'
  )

  if (thermometerDevices.length === 0) {
    return <small>Aucun device thermometre configure.</small>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 360px', gap: '0.9rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label htmlFor="control-thermometer-device">Device Thermometre</label>
        <select
          id="control-thermometer-device"
          value={controlDeviceId}
          onChange={event => onControlDeviceChange(event.target.value)}
        >
          {thermometerDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.deviceId}
            </option>
          ))}
        </select>

        <label htmlFor="control-thermometer-temp">Temperature (°C)</label>
        <input
          id="control-thermometer-temp"
          type="range"
          min={-20}
          max={40}
          step={1}
          value={controlTemperature}
          onChange={event => onControlTemperatureChange(Number(event.target.value))}
        />
        <small>Temperature actuelle: {controlTemperature}°C</small>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }} htmlFor="control-thermometer-power">
          <input
            id="control-thermometer-power"
            type="checkbox"
            checked={controlPowerOn}
            onChange={event => onControlPowerOnChange(event.target.checked)}
          />
          Thermometre allume
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <strong>Camera Thermometre: {controlDeviceId || 'aucun'}</strong>
        {cameraFrame ? (
          <img
            src={cameraFrame}
            alt={controlDeviceId || 'thermometer-camera'}
            style={{ width: '100%', maxWidth: 360, borderRadius: 8, border: '1px solid #2f3d50', aspectRatio: '4 / 3', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 360,
              aspectRatio: '4 / 3',
              borderRadius: 8,
              border: '1px solid #2f3d50',
              color: '#8fa6c4',
              textAlign: 'center',
              padding: '0.6rem',
              fontSize: '0.85rem',
            }}
          >
            En attente de frame camera thermometre...
          </div>
        )}
      </div>
    </div>
  )
}
