import React from 'react'
import { SpiritBoxAdminToolProps, SpiritPresetSound } from './types'

export function SpiritBoxAdminTool({
  controlDeviceId,
  latestPlayerMessageAt,
  presetSounds,
  onSendPresetSound,
  frequency,
  signalLocked,
  lockedFrequency = 93.4,
}: SpiritBoxAdminToolProps): JSX.Element {
  const hasDevice = Boolean(controlDeviceId)
  const hasFrequency = typeof frequency === 'number'
  const onRightFrequency = Boolean(signalLocked) || (hasFrequency && Math.abs((frequency as number) - lockedFrequency) < 0.15)

  const sendPreset = (preset: SpiritPresetSound): void => {
    if (!hasDevice) {
      return
    }
    onSendPresetSound(preset)
  }

  const soundPreset = presetSounds[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 780 }}>
      <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
        <h4 style={{ margin: '0 0 0.55rem 0' }}>SpiritBox admin</h4>
        <small style={{ color: '#99abc2' }}>
          Device cible: {hasDevice ? controlDeviceId : 'aucun'}
        </small>
        <div style={{ marginTop: '0.45rem', color: '#c9d7e8', fontSize: '0.92rem' }}>
          Ecoute joueur: {hasDevice ? 'active' : 'inactive'}
          {latestPlayerMessageAt ? ` • dernier paquet ${latestPlayerMessageAt}` : ''}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${onRightFrequency ? '#2f7d4f' : '#5a3030'}`,
          borderRadius: 10,
          padding: '0.8rem',
          background: onRightFrequency ? '#12251a' : '#241515',
        }}
      >
        <h4 style={{ margin: '0 0 0.55rem 0' }}>Fréquence joueur</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#e6f0fb' }}>
            {hasFrequency ? `${(frequency as number).toFixed(1)} MHz` : '— MHz'}
          </span>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: onRightFrequency ? '#76e39b' : '#e58a8a',
            }}
          >
            {!hasFrequency ? 'inconnu' : onRightFrequency ? '✓ BONNE FRÉQUENCE' : '✗ hors fréquence'}
          </span>
        </div>
        <small style={{ color: '#8fa1b8' }}>Cible: {lockedFrequency.toFixed(1)} MHz</small>
      </div>

      <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
        <h4 style={{ margin: '0 0 0.7rem 0' }}>Envoyer un son</h4>
        {soundPreset ? (
          <button
            type="button"
            onClick={() => sendPreset(soundPreset)}
            disabled={!hasDevice || !onRightFrequency}
            style={{
              padding: '0.7rem 1rem',
              borderRadius: 8,
              border: '1px solid #3e5169',
              background: hasDevice && onRightFrequency ? '#236b3f' : '#203144',
              color: '#dbe7f6',
              cursor: hasDevice && onRightFrequency ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            🔊 {soundPreset.label}
          </button>
        ) : null}
        {hasDevice && !onRightFrequency ? (
          <div style={{ marginTop: '0.5rem', color: '#e58a8a', fontSize: '0.85rem' }}>
            Le joueur n'est pas sur la bonne fréquence : le son ne peut pas être envoyé.
          </div>
        ) : null}
      </div>
    </div>
  )
}
