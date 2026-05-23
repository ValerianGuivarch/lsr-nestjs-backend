import React from 'react'
import { GhostCamAdminToolProps } from './types'

export function GhostCamAdminTool({
  cameraFrame,
  onPhoto,
  onRelock,
  ghostcamDeviceId,
  ghostcamDeviceOptions,
  ghostDurationSec,
  onGhostcamDeviceChange,
  onGhostDurationChange,
  onTriggerGhost,
  ghostorbsDeviceId,
  ghostorbsDeviceOptions,
  orbDurationSec,
  onGhostorbsDeviceChange,
  onOrbDurationChange,
  onTriggerOrbs,
}: GhostCamAdminToolProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          aspectRatio: '16 / 9',
          minHeight: 320,
          background: '#000',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {cameraFrame ? (
          <img
            src={cameraFrame}
            alt="ghostcam-live"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8fa6c4',
              fontSize: '1rem',
            }}
          >
            En attente du flux camera...
          </div>
        )}

        <button
          type="button"
          onClick={onPhoto}
          disabled={!cameraFrame}
          title="Prendre une photo"
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.95)',
            background: 'rgba(255,255,255,0.22)',
            cursor: cameraFrame ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          }}
        />

        <button
          type="button"
          onClick={onRelock}
          title="Reverrouiller l'appareil photo côté joueur"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '0.45rem 0.85rem',
            borderRadius: 8,
            border: '1px solid #c98d35',
            background: 'rgba(34, 24, 12, 0.72)',
            color: '#ffe2b0',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          Reverrouiller
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.8rem' }}>
        <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
          <h4 style={{ margin: '0 0 0.65rem 0' }}>Apparition Fantome</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label htmlFor="ghost-device">Device camera</label>
            <select id="ghost-device" value={ghostcamDeviceId} onChange={event => onGhostcamDeviceChange(event.target.value)}>
              {ghostcamDeviceOptions.map(deviceId => (
                <option key={deviceId} value={deviceId}>
                  {deviceId}
                </option>
              ))}
            </select>

            <label htmlFor="ghost-duration">Duree (sec)</label>
            <input
              id="ghost-duration"
              type="number"
              min={1}
              max={30}
              value={ghostDurationSec}
              onChange={event => onGhostDurationChange(Number(event.target.value))}
            />

            <button type="button" onClick={onTriggerGhost}>Afficher le fantome</button>
          </div>
        </div>

        <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
          <h4 style={{ margin: '0 0 0.65rem 0' }}>Apparition Orbes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label htmlFor="orbs-device">Device orbes</label>
            <select id="orbs-device" value={ghostorbsDeviceId} onChange={event => onGhostorbsDeviceChange(event.target.value)}>
              {ghostorbsDeviceOptions.map(deviceId => (
                <option key={deviceId} value={deviceId}>
                  {deviceId}
                </option>
              ))}
            </select>

            <label htmlFor="orbs-duration">Duree (sec)</label>
            <input
              id="orbs-duration"
              type="number"
              min={1}
              max={30}
              value={orbDurationSec}
              onChange={event => onOrbDurationChange(Number(event.target.value))}
            />

            <button type="button" onClick={onTriggerOrbs}>Afficher les orbes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
