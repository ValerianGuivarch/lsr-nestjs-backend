import React from 'react'
import { SpiritBoxAdminToolProps, SpiritPresetSound } from './types'

export function SpiritBoxAdminTool({
  controlDeviceId,
  audioEnabled,
  latestPlayerMessageAt,
  latestPlayerAudioData,
  latestPlayerMimeType,
  presetSounds,
  onEnableAudio,
  onPlayLatest,
  onSendPresetSound,
}: SpiritBoxAdminToolProps): JSX.Element {
  const hasDevice = Boolean(controlDeviceId)

  const sendPreset = (preset: SpiritPresetSound): void => {
    if (!hasDevice) {
      return
    }
    onSendPresetSound(preset)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 780 }}>
      <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
        <h4 style={{ margin: '0 0 0.55rem 0' }}>SpiritBox admin</h4>
        <small style={{ color: '#99abc2' }}>
          Device cible: {hasDevice ? controlDeviceId : 'aucun'}
        </small>
        <div style={{ marginTop: '0.4rem' }}>
          <button
            type="button"
            onClick={onEnableAudio}
            style={{
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              border: '1px solid #3e5169',
              background: audioEnabled ? '#1f4b2f' : '#2f3d50',
              color: '#e8f0ff',
              cursor: 'pointer',
              marginRight: '0.55rem',
            }}
          >
            {audioEnabled ? 'Audio active' : 'Activer audio admin'}
          </button>
          <button
            type="button"
            onClick={onPlayLatest}
            disabled={!latestPlayerAudioData}
            style={{
              padding: '0.45rem 0.7rem',
              borderRadius: 8,
              border: '1px solid #3e5169',
              background: latestPlayerAudioData ? '#203144' : '#2a3340',
              color: '#dbe7f6',
              cursor: latestPlayerAudioData ? 'pointer' : 'not-allowed',
            }}
          >
            Lire dernier chunk
          </button>
        </div>
        <div style={{ marginTop: '0.45rem', color: '#c9d7e8', fontSize: '0.92rem' }}>
          Ecoute joueur: {hasDevice ? 'active' : 'inactive'}
          {latestPlayerMessageAt ? ` • dernier paquet ${latestPlayerMessageAt}` : ''}
        </div>
        {latestPlayerAudioData && (
          <div style={{ marginTop: '0.6rem' }}>
            <small style={{ color: '#8fa6c4', display: 'block', marginBottom: '0.3rem' }}>
              Lecteur debug (dernier chunk recu) :
            </small>
            <audio
              key={latestPlayerAudioData}
              controls
              src={latestPlayerAudioData}
              style={{ width: '100%' }}
            />
            {latestPlayerMimeType && (
              <small style={{ color: '#6a8aaa' }}>Format: {latestPlayerMimeType}</small>
            )}
          </div>
        )}
      </div>

      <div style={{ border: '1px solid #2f3d50', borderRadius: 10, padding: '0.8rem', background: '#151d27' }}>
        <h4 style={{ margin: '0 0 0.7rem 0' }}>Sons pre-etablis</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.55rem' }}>
          {presetSounds.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => sendPreset(preset)}
              disabled={!hasDevice}
              style={{
                padding: '0.55rem 0.7rem',
                borderRadius: 8,
                border: '1px solid #3e5169',
                background: '#203144',
                color: '#dbe7f6',
                cursor: hasDevice ? 'pointer' : 'not-allowed',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
