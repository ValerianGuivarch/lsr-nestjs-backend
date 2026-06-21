import { useCallback, useEffect, useState } from 'react'

type Role = 'ghostcam' | 'thermometer' | 'ghostorbs' | 'emf' | 'spiritbox' | 'van' | undefined

type Result = {
  photoPaused: boolean
  photoModeUnlocked: boolean
  photoModePassword: string
  photoModeError: string
  setPhotoModePassword: (value: string) => void
  togglePhotoPause: () => void
  unlockPhotoMode: () => void
}

export function useGhostCamPhotoMode(
  role: Role,
  sessionUnlocked: boolean,
  persistUnlocked: (unlocked: boolean) => Promise<void>
): Result {
  const [photoPaused, setPhotoPaused] = useState(false)
  const [photoModeUnlocked, setPhotoModeUnlocked] = useState(sessionUnlocked)
  const [photoModePassword, setPhotoModePassword] = useState('')
  const [photoModeError, setPhotoModeError] = useState('')

  useEffect(() => {
    setPhotoModeUnlocked(sessionUnlocked)
  }, [sessionUnlocked])

  useEffect(() => {
    if (role !== 'ghostcam' && role !== 'thermometer' && role !== 'ghostorbs' && role !== 'emf') {
      setPhotoModePassword('')
      setPhotoModeError('')
    }

    if (role !== 'ghostcam') {
      setPhotoPaused(false)
    }
  }, [role])

  const unlockPhotoMode = useCallback(() => {
    if (photoModePassword.trim() !== '131') {
      setPhotoModeError('Mot de passe incorrect')
      return
    }

    setPhotoModeUnlocked(true)
    setPhotoModeError('')
    void persistUnlocked(true).catch(() => {
      setPhotoModeError('Impossible de sauvegarder le déverrouillage')
    })
  }, [photoModePassword, persistUnlocked])

  const togglePhotoPause = useCallback(() => {
    setPhotoPaused(prev => !prev)
  }, [])

  return {
    photoPaused,
    photoModeUnlocked,
    photoModePassword,
    photoModeError,
    setPhotoModePassword,
    togglePhotoPause,
    unlockPhotoMode
  }
}
