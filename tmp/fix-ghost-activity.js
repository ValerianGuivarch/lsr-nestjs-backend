const fs = require('fs')
let src = fs.readFileSync('apps/web-ghost-player/src/app/app.tsx', 'utf8')
let ok = 0

function rep(oldStr, newStr, label) {
  if (!src.includes(oldStr)) { console.log('NOT FOUND:', label); return }
  src = src.replace(oldStr, newStr)
  console.log('OK:', label)
  ok++
}

// 1. Ajouter lastActivityAdjustRef useRef
rep(
  `  const lastTriggeredSoundRef = useRef<Record<string, string>>({})`,
  `  const lastTriggeredSoundRef = useRef<Record<string, string>>({})
  const lastActivityAdjustRef = useRef(0)`,
  'lastActivityAdjustRef'
)

// 2. Modifier le polling: ghostActivityLevel protégé
rep(
  `          setVanData({
            ghostActivityLevel: device.ghostActivityLevel ?? 0,`,
  `          setVanData(prev => ({
            ghostActivityLevel: (Date.now() - lastActivityAdjustRef.current < 3000)
              ? (prev?.ghostActivityLevel ?? device.ghostActivityLevel ?? 0)
              : (device.ghostActivityLevel ?? 0),`,
  'polling protection start'
)

// Fermer le setVanData: }) → }))
rep(
  `            vanSentMessages: parseVanSentMessages(device.vanSentMessages)
          })`,
  `            vanSentMessages: parseVanSentMessages(device.vanSentMessages)
          }))`,
  'polling close'
)

// 3. Supprimer le useEffect auto-increment
const autoIncrBlock = `
  useEffect(() => {
    if (state?.role !== 'van' || vanPhase !== 'step1' || !deviceId) {
      return
    }

    const interval = setInterval(async () => {
      setVanData(prev => {
        if (!prev) return prev
        const nextActivityLevel = Math.min(100, prev.ghostActivityLevel + 1)
        
        // Patch server with new activity level
        fetch(\`/apil7r/player/device/\${deviceId}/van\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ghostActivityLevel: nextActivityLevel })
        }).catch(() => {
          // Network error, ignore
        })
        
        return {
          ...prev,
          ghostActivityLevel: nextActivityLevel
        }
      })
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [state?.role, vanPhase, deviceId])`

rep(autoIncrBlock, '', 'auto-increment removed')

// 4. Ajouter adjustGhostActivity dans le rendu van
rep(
  `    const ghostActivity = vanData?.ghostActivityLevel ?? 0
    const objectives = vanData?.missionObjectives ?? []
    const mjAccepted = Boolean(state.huntActive)`,
  `    const ghostActivity = vanData?.ghostActivityLevel ?? 0
    const objectives = vanData?.missionObjectives ?? []
    const mjAccepted = Boolean(state.huntActive)

    const adjustGhostActivity = (delta) => {
      setVanData(prev => {
        if (!prev) return prev
        const next = Math.max(0, Math.min(100, prev.ghostActivityLevel + delta))
        lastActivityAdjustRef.current = Date.now()
        if (deviceId) {
          void fetch('/apil7r/admin/device/' + encodeURIComponent(deviceId) + '/van', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ghostActivityLevel: next })
          }).catch(() => {})
        }
        return { ...prev, ghostActivityLevel: next }
      })
    }`,
  'adjustGhostActivity'
)

// 5. Modifier VanHeader pour ajouter les boutons
rep(
  `            <VanHeader>
              <VanTitle>PARANORMAL DETECTION SYSTEM</VanTitle>
              <VanStatus>
                {'MISSION EN COURS'}
              </VanStatus>
            </VanHeader>`,
  `            <VanHeader>
              <VanTitle>PARANORMAL DETECTION SYSTEM</VanTitle>
              <VanStatus>{'MISSION EN COURS'}</VanStatus>
              {(vanPhase === 'step1' || vanPhase === 'step2') && (
                <VanActivityControls>
                  <VanActivityBtn type="button" onClick={() => adjustGhostActivity(-10)}>\u221210</VanActivityBtn>
                  <VanActivityDisplay>ACTIVIT\u00c9 : {ghostActivity}/100</VanActivityDisplay>
                  <VanActivityBtn type="button" onClick={() => adjustGhostActivity(+10)}>+10</VanActivityBtn>
                </VanActivityControls>
              )}
            </VanHeader>`,
  'VanHeader buttons'
)

// 6. Ajouter les styled components si pas présents
if (!src.includes('VanActivityControls')) {
  src += `
const VanActivityControls = styled.div\`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
\`

const VanActivityDisplay = styled.span\`
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #9cc9ff;
  min-width: 120px;
  text-align: center;
  letter-spacing: 0.06em;
\`

const VanActivityBtn = styled.button\`
  all: unset;
  cursor: pointer;
  background: rgba(79, 163, 255, 0.12);
  border: 1px solid #26476e;
  border-radius: 3px;
  color: #7fc0ff;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.2rem 0.7rem;
  transition: background 0.15s;
  &:hover { background: rgba(79, 163, 255, 0.28); }
  &:active { background: rgba(79, 163, 255, 0.45); }
\`
`
  console.log('OK: styled components')
  ok++
}

fs.writeFileSync('apps/web-ghost-player/src/app/app.tsx', src, 'utf8')
console.log(`\nTotal: ${ok} modifications applied, file: ${src.split('\n').length} lines`)
