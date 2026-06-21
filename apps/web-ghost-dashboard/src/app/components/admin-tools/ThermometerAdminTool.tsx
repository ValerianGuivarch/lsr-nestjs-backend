import React from 'react'
import { ThermometerAdminToolProps } from './types'

export function ThermometerAdminTool({
  devices,
  controlDeviceId,
  controlPowerOn,
  controlActive,
  cameraFrame,
  onControlDeviceChange,
  onControlPowerOnChange,
  onControlActiveChange,
}: ThermometerAdminToolProps): JSX.Element {
  const thermometerDevices = devices.filter(
    device => device.role === 'ghostorbs' || device.role === 'thermometer'
  )

  if (thermometerDevices.length === 0) {
    return <small>Aucun device thermometre configure.</small>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr)', gap: '0.9rem' }}>
      <div
        style={{
          aspectRatio: '4 / 3',
          background: '#000',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '0.85rem',
        }}
      >
        {cameraFrame ? (
          <img
            src={cameraFrame}
            alt="Flux caméra Thermomètre"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span>Aucun flux caméra</span>
        )}
      </div>
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

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }} htmlFor="control-thermometer-power">
          <input
            id="control-thermometer-power"
            type="checkbox"
            checked={controlPowerOn}
            onChange={event => onControlPowerOnChange(event.target.checked)}
          />
          Thermometre allume
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }} htmlFor="control-thermometer-active">
          <input
            id="control-thermometer-active"
            type="checkbox"
            checked={controlActive}
            onChange={event => onControlActiveChange(event.target.checked)}
            disabled={!controlPowerOn}
          />
          Actif
        </label>
        <small>
          {controlPowerOn
            ? controlActive
              ? 'Mode glacial (~3°C)'
              : 'Mode normal (~16°C)'
            : 'Capteur eteint (0°C)'}
        </small>
      </div>
    </div>
  )
}
