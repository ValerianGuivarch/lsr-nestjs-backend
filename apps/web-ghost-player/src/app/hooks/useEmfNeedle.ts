import { useEffect, useMemo, useState } from 'react'

type Params = {
  role?: string
  emfLevel?: number
  powerOn?: boolean
}

export function useEmfNeedle({ role, emfLevel = 0, powerOn = true }: Params): { needleAngle: number } {
  const [emfNeedleJitter, setEmfNeedleJitter] = useState(0)

  useEffect(() => {
    if (role !== 'emf') {
      setEmfNeedleJitter(0)
      return
    }

    const clampedLevel = Math.max(0, Math.min(5, emfLevel))
    if (!powerOn || clampedLevel === 0) {
      setEmfNeedleJitter(0)
      return
    }

    const amplitudeByLevel = [0, 0.8, 1.5, 2.5, 3.8, 5.8]
    const amplitude = amplitudeByLevel[clampedLevel]

    const interval = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * amplitude * 2
      setEmfNeedleJitter(jitter)
    }, 70)

    return () => clearInterval(interval)
  }, [role, emfLevel, powerOn])

  const needleAngle = useMemo(() => {
    const clampedLevel = Math.max(0, Math.min(5, emfLevel))
    const baseAngle = powerOn ? -65 + (clampedLevel / 5) * 130 : -80
    return baseAngle + (powerOn && clampedLevel > 0 ? emfNeedleJitter : 0)
  }, [emfLevel, powerOn, emfNeedleJitter])

  return { needleAngle }
}
