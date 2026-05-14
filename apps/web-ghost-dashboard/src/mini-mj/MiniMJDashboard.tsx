import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

interface GameState {
  gameId: string
  isInitialized: boolean
  isRunning: boolean
  startedAt?: string
  initialSpectralActivity: number
  accelerationRate: number
  currentSpectralActivity: number
  currentScenarioStep: number
}

interface ScenarioStep {
  id: number
  title: string
  description: string
  requiredTools: string[]
  actions: Array<{
    id: string
    label: string
    description?: string
    type: 'info' | 'trigger' | 'check'
  }>
  completed: boolean
}

const SCENARIO: ScenarioStep[] = [
  {
    id: 1,
    title: 'Préparation',
    description: 'Installez et testez les équipements',
    requiredTools: ['EMF', 'Spirit Box'],
    actions: [
      { id: 'check-emf', label: 'Vérifier l\'EMF', type: 'check' },
      { id: 'check-spiritbox', label: 'Tester le Spirit Box', type: 'check' }
    ],
    completed: false
  },
  {
    id: 2,
    title: 'Première exploration',
    description: 'Explorez le lieu et recherchez des signes d\'activité',
    requiredTools: ['EMF', 'Ghost Cam', 'Motion Sensor'],
    actions: [
      { id: 'scan-rooms', label: 'Scanner les pièces', type: 'trigger' },
      { id: 'detect-motion', label: 'Détecteur de mouvement activé', type: 'info' }
    ],
    completed: false
  },
  {
    id: 3,
    title: 'Communication',
    description: 'Essayez de communiquer avec l\'entité',
    requiredTools: ['Spirit Box', 'Sound Detector'],
    actions: [
      { id: 'spiritbox-session', label: 'Démarrer session Spirit Box', type: 'trigger' }
    ],
    completed: false
  },
  {
    id: 4,
    title: 'Montée d\'activité',
    description: 'L\'activité spectrale augmente considérablement',
    requiredTools: ['EMF', 'Ghost Orbs', 'Thermometer'],
    actions: [
      { id: 'monitor-activity', label: 'Surveiller l\'activité', type: 'check' },
      { id: 'temperature-drop', label: 'Baisse de température détectée', type: 'info' }
    ],
    completed: false
  },
  {
    id: 5,
    title: 'Chasse',
    description: 'La chasse commence, le fantôme manifeste sa présence',
    requiredTools: ['Van'],
    actions: [
      { id: 'ghost-hunt', label: 'La chasse est lancée', type: 'trigger' }
    ],
    completed: false
  }
]

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #11161d;
  color: #e8f0ff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  min-height: 100vh;
  max-width: 500px;
  margin: 0 auto;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #2f3d50;
  padding-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 300;
    letter-spacing: 2px;
  }

  p {
    margin: 8px 0 0;
    font-size: 12px;
    opacity: 0.7;
    text-transform: uppercase;
  }
`

const StatusCard = styled.div`
  background: #1a222d;
  border: 1px solid #2f3d50;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      opacity: 0.7;
      font-size: 12px;
    }
  }

  strong {
    font-size: 16px;
    color: #5ec8ff;
  }
`

const ActivityBar = styled.div`
  background: #1a222d;
  border: 1px solid #2f3d50;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 12px;
    opacity: 0.7;
    text-transform: uppercase;
  }

  progress {
    width: 100%;
    height: 24px;
    border-radius: 4px;
    background: #0a0f15;
    accent-color: #ff6b6b;
    cursor: pointer;
  }

  .activity-value {
    text-align: center;
    font-weight: 600;
    color: #ff6b6b;
    font-size: 18px;
  }
`

const StepSection = styled.div`
  background: #1a222d;
  border: 1px solid #2f3d50;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .step-title {
    font-size: 16px;
    font-weight: 600;
    color: #5ec8ff;

    .step-num {
      opacity: 0.6;
      margin-right: 8px;
    }
  }

  .step-description {
    font-size: 12px;
    opacity: 0.7;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .tool {
      background: #0a0f15;
      border: 1px solid #2f3d50;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      opacity: 0.8;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .action {
      padding: 8px 12px;
      background: #0a0f15;
      border: 1px solid #2f3d50;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
      text-align: left;

      &:hover {
        border-color: #5ec8ff;
        background: rgba(94, 200, 255, 0.1);
      }

      &.trigger {
        border-color: #ff6b6b;
        &:hover {
          background: rgba(255, 107, 107, 0.1);
        }
      }
    }
  }
`

const Controls = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;

  button {
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s;

    &.primary {
      background: #5ec8ff;
      color: #0a0f15;
      &:hover {
        background: #4db8ff;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &.success {
      background: #51cf66;
      color: #0a0f15;
      &:hover {
        background: #40c057;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &.danger {
      background: #ff6b6b;
      color: #fff;
      &:hover {
        background: #ff5252;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`

const ConfigSection = styled.div`
  background: #1a222d;
  border: 1px solid #2f3d50;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    opacity: 0.8;

    input {
      background: #0a0f15;
      border: 1px solid #2f3d50;
      border-radius: 4px;
      padding: 8px;
      color: #e8f0ff;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #5ec8ff;
      }
    }
  }
`

export default function MiniMJDashboard() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [initialActivity, setInitialActivity] = useState(20)
  const [accelerationRate, setAccelerationRate] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameId = 'hardcoded-game'

  // Récupérer l'état du jeu
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const res = await fetch(`/api/ghost/game/${gameId}`)
        if (res.ok) {
          setGameState(await res.json())
        }
      } catch (err) {
        console.error('Erreur fetch game state:', err)
      }
    }

    fetchGameState()
    const interval = setInterval(fetchGameState, 1000)
    return () => clearInterval(interval)
  }, [])

  const currentStep = gameState ? SCENARIO[gameState.currentScenarioStep] : null

  const handleInit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ghost/admin/game/${gameId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialSpectralActivity: initialActivity,
          accelerationRate: accelerationRate
        })
      })
      if (res.ok) {
        setGameState(await res.json())
      } else {
        setError('Erreur initialisation')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ghost/admin/game/${gameId}/start`, {
        method: 'POST'
      })
      if (res.ok) {
        setGameState(await res.json())
      } else {
        setError('Erreur démarrage')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ghost/admin/game/${gameId}/stop`, {
        method: 'POST'
      })
      if (res.ok) {
        setGameState(await res.json())
      } else {
        setError('Erreur arrêt')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceStep = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ghost/admin/game/${gameId}/advance-step`, {
        method: 'POST'
      })
      if (res.ok) {
        setGameState(await res.json())
      } else {
        setError('Erreur avancement')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Header>
        <h1>👻 MJ</h1>
        <p>Mini Dashboard</p>
      </Header>

      {error && (
        <StatusCard style={{ borderColor: '#ff6b6b' }}>
          <div>
            <span>❌ Erreur</span>
            <strong>{error}</strong>
          </div>
        </StatusCard>
      )}

      {!gameState?.isInitialized ? (
        <ConfigSection>
          <label>
            Activité initiale ({initialActivity}%)
            <input
              type="range"
              min="0"
              max="100"
              value={initialActivity}
              onChange={e => setInitialActivity(Number(e.target.value))}
            />
          </label>
          <label>
            Taux d\'accélération ({accelerationRate}s)
            <input
              type="number"
              min="5"
              max="120"
              value={accelerationRate}
              onChange={e => setAccelerationRate(Number(e.target.value))}
            />
          </label>
          <Controls>
            <button className="success" onClick={handleInit} disabled={loading}>
              Initialiser
            </button>
          </Controls>
        </ConfigSection>
      ) : (
        <>
          <StatusCard>
            <div>
              <span>État</span>
              <strong>{gameState.isRunning ? '▶ En cours' : '⏸ Arrêtée'}</strong>
            </div>
          </StatusCard>

          <ActivityBar>
            <label>Activité spectrale</label>
            <progress value={gameState.currentSpectralActivity} max="100" />
            <div className="activity-value">{Math.round(gameState.currentSpectralActivity)}%</div>
          </ActivityBar>

          {currentStep && (
            <StepSection>
              <div className="step-title">
                <span className="step-num">#{currentStep.id}</span>
                {currentStep.title}
              </div>
              <div className="step-description">{currentStep.description}</div>
              <div className="tools">
                {currentStep.requiredTools.map(tool => (
                  <div key={tool} className="tool">
                    {tool}
                  </div>
                ))}
              </div>
              <div className="actions">
                {currentStep.actions.map(action => (
                  <div
                    key={action.id}
                    className={`action ${action.type === 'trigger' ? 'trigger' : ''}`}
                  >
                    {action.label}
                  </div>
                ))}
              </div>
            </StepSection>
          )}

          <Controls>
            {!gameState.isRunning ? (
              <button className="success" onClick={handleStart} disabled={loading}>
                Démarrer
              </button>
            ) : (
              <button className="danger" onClick={handleStop} disabled={loading}>
                Arrêter
              </button>
            )}
            <button
              className="primary"
              onClick={handleAdvanceStep}
              disabled={loading || gameState.currentScenarioStep >= SCENARIO.length - 1}
            >
              Étape suivante
            </button>
          </Controls>
        </>
      )}
    </Container>
  )
}
