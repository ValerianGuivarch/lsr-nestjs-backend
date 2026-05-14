import React from 'react'
import { EmfAdminToolProps } from './types'

export function EmfAdminTool({
  devices,
  controlDeviceId,
  controlEmfLevel,
  controlPowerOn,
  cameraFrame,
  onControlDeviceChange,
  onControlEmfLevelChange,
  onControlPowerOnChange,
}: EmfAdminToolProps): JSX.Element {
  const emfDevices = devices.filter(device => device.role === 'emf')

  if (emfDevices.length === 0) {
    return <small>Aucun device EMF configure.</small>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 360px', gap: '0.9rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label htmlFor="control-device">Device EMF</label>
        <select
          id="control-device"
          value={controlDeviceId}
          onChange={event => onControlDeviceChange(event.target.value)}
        >
          {emfDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.deviceId}
            </option>
          ))}
        </select>

        <label htmlFor="control-emf">Niveau EMF</label>
        <input
          id="control-emf"
          type="range"
          min={0}
          max={5}
          step={1}
          value={controlEmfLevel}
          onChange={event => onControlEmfLevelChange(Number(event.target.value))}
        />
        <small>Niveau actuel: {controlEmfLevel}</small>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }} htmlFor="control-emf-power">
          <input
            id="control-emf-power"
            type="checkbox"
            checked={controlPowerOn}
            onChange={event => onControlPowerOnChange(event.target.checked)}
          />
          EMF allume
        </label>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <strong>Camera EMF: {controlDeviceId || 'aucun'}</strong>
        {cameraFrame ? (
          <img
            src={cameraFrame}
            alt={controlDeviceId || 'emf-camera'}
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
            En attente de frame camera EMF...
          </div>
        )}
      </div>
    </div>
  )
}
