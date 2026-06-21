import React from 'react'
import { VanAdminToolProps } from './types'

const MIN_STEP = 1
const MAX_STEP = 7

function clampStep(value: number): number {
  if (value < MIN_STEP) return MIN_STEP
  if (value > MAX_STEP) return MAX_STEP
  return value
}

export function VanAdminTool({
  vanGhostActivity,
  onVanGhostActivityChange,
  vanObjectives,
  vanStep,
  objectiveStep,
  cameraModeLabel,
  onStepChange,
  onResetVan,
  onOpenCameraAdmin,
}: VanAdminToolProps): JSX.Element {
  const safeStep = clampStep(vanStep)
  const clampActivity = (value: number): number => Math.max(0, Math.min(100, value))
  const adjustActivity = (delta: number): void => {
    onVanGhostActivityChange(clampActivity(vanGhostActivity + delta))
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.8rem',
          padding: '0.8rem',
          border: '1px solid #2f3d50',
          borderRadius: 8,
          background: '#121b29',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <strong>Etape Van</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onStepChange(clampStep(safeStep - 1))}
              aria-label="Etape precedente"
            >
              ◀
            </button>
            <span
              style={{
                border: '1px solid #2f3d50',
                padding: '0.2rem 0.5rem',
                borderRadius: 6,
                minWidth: 60,
                textAlign: 'center',
                fontWeight: 700,
                color: '#b4d6ff',
              }}
            >
              {safeStep}/7
            </span>
            <button
              type="button"
              onClick={() => onStepChange(clampStep(safeStep + 1))}
              aria-label="Etape suivante"
            >
              ▶
            </button>
            <button type="button" onClick={onResetVan} aria-label="Reinitialiser la progression van">
              ⟲
            </button>
          </div>
          <small style={{ color: '#8fa6c4' }}>
            Navigation manuelle de la progression du scenario van.
          </small>
          <small style={{ color: '#8fa6c4' }}>
            Etape calculee depuis les objectifs: {objectiveStep}/7
          </small>
          <small style={{ color: '#8fa6c4' }}>
            Mode camera: {cameraModeLabel}
          </small>
          {safeStep >= 6 && onOpenCameraAdmin && (
            <button
              type="button"
              onClick={onOpenCameraAdmin}
              style={{
                marginTop: '0.4rem',
                background: '#3a86ff',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Étape 6/7 → Aller à l'admin caméra
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <label htmlFor="van-ghost-activity">
            <strong>Activite du fantome</strong>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => adjustActivity(-10)} aria-label="Diminuer de 10">
              -10
            </button>
            <button type="button" onClick={() => adjustActivity(-1)} aria-label="Diminuer de 1">
              -1
            </button>
            <button type="button" onClick={() => adjustActivity(+1)} aria-label="Augmenter de 1">
              +1
            </button>
            <button type="button" onClick={() => adjustActivity(+10)} aria-label="Augmenter de 10">
              +10
            </button>
          </div>
          <input
            id="van-ghost-activity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={vanGhostActivity}
            onChange={event => onVanGhostActivityChange(Number(event.target.value))}
          />
          <small style={{ color: '#8fa6c4' }}>Niveau actuel: {vanGhostActivity}%</small>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          padding: '0.8rem',
          border: '1px solid #5a4a1f',
          borderRadius: 8,
          background: '#1d1808',
        }}
      >
        <strong style={{ color: '#ffd166' }}>Infos MJ (codes &amp; fréquences)</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
          <span style={{ color: '#c8d8ed' }}>
            Code déverrouillage <strong>GhostCam</strong> :{' '}
            <code style={{ background: '#0b0f17', padding: '0.1rem 0.4rem', borderRadius: 4, color: '#ffd166' }}>
              131
            </code>
          </span>
          <span style={{ color: '#c8d8ed' }}>
            Fréquence <strong>Spiritbox</strong> (son débloqué) :{' '}
            <code style={{ background: '#0b0f17', padding: '0.1rem 0.4rem', borderRadius: 4, color: '#ffd166' }}>
              93.4 MHz
            </code>
          </span>
        </div>
        <small style={{ color: '#8fa6c4' }}>
          À communiquer aux joueurs uniquement quand le scénario le prévoit.
        </small>
      </section>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.8rem',
          border: '1px solid #2f3d50',
          borderRadius: 8,
          background: '#121b29',
        }}
      >
        <strong>Objectifs mission (lecture seule)</strong>
        {vanObjectives.length === 0 ? (
          <small style={{ color: '#8fa6c4' }}>Aucun objectif configure.</small>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.3rem' }}>
            {vanObjectives.map((objective, index) => (
              <li key={`${objective.objective}-${index}`} style={{ color: objective.completed ? '#8ee5a8' : '#c8d8ed' }}>
                {objective.completed ? '✓' : '○'} {objective.objective}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
