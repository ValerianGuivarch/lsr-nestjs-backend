import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

type SpiritAudioMessage = {
  id: string
  audioData: string
}

type Result = {
  spiritRecording: boolean
  spiritStatus: string
  spiritLastHeardAt: string
  spiritFrequency: number
  spiritSignalLocked: boolean
  tuneSpiritFrequencyDown: () => void
  tuneSpiritFrequencyUp: () => void
}

export function useSpiritBoxAudio(role: string | undefined, deviceId: string, powerOn: boolean): Result {
  const [spiritRecording, setSpiritRecording] = useState(false)
  const [spiritStatus, setSpiritStatus] = useState('READY')
  const [spiritLastHeardAt, setSpiritLastHeardAt] = useState('')
  const [spiritFrequency, setSpiritFrequency] = useState(99.2)
  const [spiritSignalLocked, setSpiritSignalLocked] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const spiritRecorderRef = useRef<MediaRecorder | null>(null)
  const spiritStreamRef = useRef<MediaStream | null>(null)
  const spiritHeaderChunkRef = useRef<Blob | null>(null)
  const spiritPcmContextRef = useRef<AudioContext | null>(null)
  const spiritPcmSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const spiritPcmProcessorRef = useRef<AudioWorkletNode | null>(null)
  const spiritSocketRef = useRef<Socket | null>(null)
  const lastSpiritMjMessageIdRef = useRef('')
  const spiritAudioContextRef = useRef<AudioContext | null>(null)
  const spiritNoiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const spiritNoiseGainRef = useRef<GainNode | null>(null)
  const spiritLockTimerRef = useRef<number | null>(null)
  const spiritDisplayLockTimerRef = useRef<number | null>(null)

  const BASE_STATIC_GAIN = 0.06
  const LOCKED_STATIC_GAIN = 0.018
  const SPIRITBOX_MIN_FREQUENCY = 87.5
  const SPIRITBOX_MAX_FREQUENCY = 108
  const SPIRITBOX_LOCKED_FREQUENCY = 93.4

  const clearSpiritDisplayLockTimer = useCallback((): void => {
    if (spiritDisplayLockTimerRef.current !== null) {
      window.clearTimeout(spiritDisplayLockTimerRef.current)
      spiritDisplayLockTimerRef.current = null
    }
  }, [])

  const clearSpiritLockTimer = useCallback((): void => {
    if (spiritLockTimerRef.current !== null) {
      window.clearTimeout(spiritLockTimerRef.current)
      spiritLockTimerRef.current = null
    }
  }, [])

  const unlockSpiritAudio = useCallback((): void => {
    setAudioUnlocked(true)
  }, [])

  useEffect(() => {
    if (audioUnlocked) {
      return
    }

    const handleGesture = (): void => {
      unlockSpiritAudio()
    }

    window.addEventListener('pointerdown', handleGesture, { passive: true })
    window.addEventListener('touchstart', handleGesture, { passive: true })
    window.addEventListener('keydown', handleGesture)

    return () => {
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('touchstart', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
  }, [audioUnlocked, unlockSpiritAudio])

  const blobToDataUrl = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Lecture audio impossible'))
        }
      }
      reader.onerror = () => reject(new Error('Lecture audio impossible'))
      reader.readAsDataURL(blob)
    })
  }, [])

  const floatToPcm16Base64 = useCallback((input: Float32Array): string => {
    const pcm16 = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]))
      pcm16[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff)
    }

    const bytes = new Uint8Array(pcm16.buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }

    return btoa(binary)
  }, [])

  const createGhostVoiceFX = useCallback((ctx: AudioContext, source: AudioNode): GainNode => {
    const lowPass = ctx.createBiquadFilter()
    lowPass.type = 'lowpass'
    lowPass.frequency.setValueAtTime(1800, ctx.currentTime)
    lowPass.Q.setValueAtTime(1.5, ctx.currentTime)

    const distortion = ctx.createWaveShaper()
    const distortionCurve = new Float32Array(44100)
    for (let i = 0; i < 44100; i++) {
      const x = (i / 44100) * 2 - 1
      const bitDepth = 8
      distortionCurve[i] = Math.sign(x) * Math.round(Math.abs(x) * (1 << bitDepth)) / (1 << bitDepth)
    }
    distortion.curve = distortionCurve
    distortion.oversample = '4x'

    const tremoloGain = ctx.createGain()
    const tremoloOsc = ctx.createOscillator()
    const tremoloDepth = ctx.createGain()

    tremoloOsc.frequency.setValueAtTime(4.5, ctx.currentTime)
    tremoloDepth.gain.setValueAtTime(0.35, ctx.currentTime)
    tremoloGain.gain.setValueAtTime(0.65, ctx.currentTime)

    source.connect(lowPass)
    lowPass.connect(distortion)
    distortion.connect(tremoloGain)
    tremoloOsc.connect(tremoloDepth)
    tremoloDepth.connect(tremoloGain.gain)
    tremoloOsc.start()

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.85, ctx.currentTime)
    tremoloGain.connect(masterGain)

    return masterGain
  }, [])

  const ensureSpiritAmbientAudio = useCallback((): void => {
    if (role !== 'spiritbox' || !powerOn || !audioUnlocked) {
      return
    }

    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) {
      return
    }

    if (!spiritAudioContextRef.current) {
      spiritAudioContextRef.current = new AudioContextCtor()
    }

    const ctx = spiritAudioContextRef.current
    if (!ctx) {
      return
    }

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    if (!spiritNoiseSourceRef.current || !spiritNoiseGainRef.current) {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 2))
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const channelData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = Math.random() * 2 - 1
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(2200, ctx.currentTime)
      noiseFilter.Q.setValueAtTime(0.75, ctx.currentTime)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(BASE_STATIC_GAIN, ctx.currentTime)

      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noiseSource.start()

      spiritNoiseSourceRef.current = noiseSource
      spiritNoiseGainRef.current = noiseGain
    }
  }, [audioUnlocked, powerOn, role])

  const stopSpiritAmbientAudio = useCallback((): void => {
    clearSpiritLockTimer()
    clearSpiritDisplayLockTimer()
    setSpiritSignalLocked(false)

    spiritNoiseSourceRef.current?.stop()
    spiritNoiseSourceRef.current = null
    spiritNoiseGainRef.current = null
  }, [clearSpiritDisplayLockTimer, clearSpiritLockTimer])

  const playGhostAudio = useCallback(
    (audioData: string): void => {
      if (!audioUnlocked) {
        setSpiritStatus('TOUCHEZ L ECRAN POUR ACTIVER L AUDIO')
        return
      }

      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioContextCtor) {
        setSpiritStatus('WEB AUDIO UNAVAILABLE')
        return
      }

      if (!spiritAudioContextRef.current) {
        spiritAudioContextRef.current = new AudioContextCtor()
      }

      const ctx = spiritAudioContextRef.current
      if (!ctx) {
        setSpiritStatus('AUDIO CONTEXT FAILED')
        return
      }

      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      try {
        const binaryString = atob(audioData.split(',')[1] || audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        ctx.decodeAudioData(
          bytes.buffer,
          decodedBuffer => {
            const source = ctx.createBufferSource()
            source.buffer = decodedBuffer

            const masterGain = createGhostVoiceFX(ctx, source)
            masterGain.connect(ctx.destination)
            source.start()
          },
          () => {
            setSpiritStatus('DECODE ERROR')
          }
        )
      } catch {
        setSpiritStatus('AUDIO PLAY ERROR')
      }
    },
    [audioUnlocked, createGhostVoiceFX]
  )

  const startSpiritRecording = useCallback(async (): Promise<void> => {
    if (spiritSocketRef.current || role !== 'spiritbox' || !powerOn) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      spiritStreamRef.current = stream
      spiritHeaderChunkRef.current = null

      const ghostAudioOrigin = import.meta.env.VITE_GHOST_AUDIO_ORIGIN as string | undefined
      const ghostAudioNamespace = ghostAudioOrigin
        ? `${ghostAudioOrigin.replace(/\/$/, '')}/ghost-audio`
        : '/ghost-audio'

      // Connexion Socket.IO vers le gateway /ghost-audio
      const socket = io(ghostAudioNamespace, {
        query: { deviceId, role: 'player' },
        transports: ['websocket'],
      })
      spiritSocketRef.current = socket

      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioContextCtor) {
        try {
          const pcmCtx = new AudioContextCtor({ latencyHint: 'interactive' })
          spiritPcmContextRef.current = pcmCtx
          if (pcmCtx.state === 'suspended') {
            void pcmCtx.resume()
          }

          const source = pcmCtx.createMediaStreamSource(stream)

          try {
            await pcmCtx.audioWorklet.addModule('/pcm-processor.js')
          } catch {
            throw new Error('AudioWorklet not supported')
          }

          const workletNode = new AudioWorkletNode(pcmCtx, 'pcm-processor')
          source.connect(workletNode)
          // AudioWorkletNode n'a pas besoin d'être connecté à destination pour tourner

          workletNode.port.onmessage = (event: MessageEvent<{ samples: Float32Array }>) => {
            if (!socket.connected) return
            const { samples } = event.data
            if (!samples || samples.length === 0) return
            const pcmBase64 = floatToPcm16Base64(samples)
            socket.emit('spiritbox:audio-chunk', {
              deviceId,
              chunk: pcmBase64,
              mimeType: 'audio/pcm;codecs=s16le',
              codec: 'pcm16',
              sampleRate: pcmCtx.sampleRate,
              channels: 1,
            })
            setSpiritStatus('ECOUTE EN COURS')
          }

          spiritPcmSourceRef.current = source
          spiritPcmProcessorRef.current = workletNode
          setSpiritRecording(true)
          setSpiritStatus('ECOUTE EN COURS')
          return
        } catch {
          spiritPcmProcessorRef.current = null
          spiritPcmSourceRef.current = null
          spiritPcmContextRef.current = null
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      spiritRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (!event.data || event.data.size === 0 || !socket.connected) {
          return
        }

        const chunkMimeType = event.data.type || mimeType || 'audio/webm'

        if (!spiritHeaderChunkRef.current) {
          // Premier chunk : contient le header webm + premier cluster audio
          spiritHeaderChunkRef.current = event.data
          const fullBlob = event.data
          void blobToDataUrl(fullBlob).then(audioData => {
            socket.emit('spiritbox:audio-chunk', {
              deviceId,
              chunk: audioData,
              mimeType: chunkMimeType,
              hasPrependedHeader: false,
            })
          })
        } else {
          // Chunks suivants : réinjecter le header pour rendre le chunk autonome
          const fullBlob = new Blob([spiritHeaderChunkRef.current, event.data], { type: chunkMimeType })
          void blobToDataUrl(fullBlob).then(audioData => {
            socket.emit('spiritbox:audio-chunk', {
              deviceId,
              chunk: audioData,
              mimeType: chunkMimeType,
              hasPrependedHeader: true,
            })
          })
        }

        setSpiritStatus('ECOUTE EN COURS')
      }

      socket.on('connect_error', () => setSpiritStatus('ERREUR CONNEXION WS'))

      // Timeslice 240ms : meilleur compromis fluidite / charge decode
      recorder.start(240)
      setSpiritRecording(true)
      setSpiritStatus('ECOUTE EN COURS')
    } catch (_e) {
      setSpiritStatus('AUDIO INDISPONIBLE')
    }
  }, [blobToDataUrl, deviceId, floatToPcm16Base64, powerOn, role])

  const stopSpiritRecording = useCallback((): void => {
    if (spiritPcmProcessorRef.current) {
      spiritPcmProcessorRef.current.port.onmessage = null
      spiritPcmProcessorRef.current.disconnect()
      spiritPcmProcessorRef.current = null
    }

    spiritPcmSourceRef.current?.disconnect()
    spiritPcmSourceRef.current = null

    if (spiritPcmContextRef.current) {
      void spiritPcmContextRef.current.close()
      spiritPcmContextRef.current = null
    }

    const recorder = spiritRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    spiritRecorderRef.current = null

    spiritSocketRef.current?.disconnect()
    spiritSocketRef.current = null
    spiritHeaderChunkRef.current = null

    spiritStreamRef.current?.getTracks().forEach(track => track.stop())
    spiritStreamRef.current = null

    setSpiritRecording(false)
  }, [])

  const tuneSpiritFrequency = useCallback(
    (delta: number): void => {
      setSpiritFrequency(prev => {
        const next = Math.max(
          SPIRITBOX_MIN_FREQUENCY,
          Math.min(SPIRITBOX_MAX_FREQUENCY, Number((prev + delta).toFixed(1)))
        )
        return next
      })
      ensureSpiritAmbientAudio()
    },
    [ensureSpiritAmbientAudio, SPIRITBOX_MAX_FREQUENCY, SPIRITBOX_MIN_FREQUENCY]
  )

  const tuneSpiritFrequencyDown = useCallback(() => {
    tuneSpiritFrequency(-0.1)
  }, [tuneSpiritFrequency])

  const tuneSpiritFrequencyUp = useCallback(() => {
    tuneSpiritFrequency(0.1)
  }, [tuneSpiritFrequency])

  useEffect(() => {
    if (role !== 'spiritbox' || !powerOn || !audioUnlocked) {
      stopSpiritAmbientAudio()
      return
    }

    ensureSpiritAmbientAudio()

    const ctx = spiritAudioContextRef.current
    if (!ctx) {
      return
    }

    const isExactlyTuned = Math.abs(spiritFrequency - SPIRITBOX_LOCKED_FREQUENCY) < 0.0001

    const noiseGain = spiritNoiseGainRef.current
    if (noiseGain) {
      noiseGain.gain.cancelScheduledValues(ctx.currentTime)
      if (!isExactlyTuned) {
        clearSpiritLockTimer()
        clearSpiritDisplayLockTimer()
        setSpiritSignalLocked(false)
        noiseGain.gain.setValueAtTime(BASE_STATIC_GAIN, ctx.currentTime)
      } else if (spiritLockTimerRef.current === null) {
        setSpiritSignalLocked(false)
        noiseGain.gain.setValueAtTime(BASE_STATIC_GAIN, ctx.currentTime)
        spiritLockTimerRef.current = window.setTimeout(() => {
          if (!spiritNoiseGainRef.current || !spiritAudioContextRef.current) {
            return
          }
          const now = spiritAudioContextRef.current.currentTime
          spiritNoiseGainRef.current.gain.cancelScheduledValues(now)
          spiritNoiseGainRef.current.gain.setValueAtTime(spiritNoiseGainRef.current.gain.value, now)
          spiritNoiseGainRef.current.gain.linearRampToValueAtTime(LOCKED_STATIC_GAIN, now + 2.2)
          spiritLockTimerRef.current = null

          clearSpiritDisplayLockTimer()
          spiritDisplayLockTimerRef.current = window.setTimeout(() => {
            setSpiritSignalLocked(true)
            spiritDisplayLockTimerRef.current = null
          }, 2200)
        }, 500)
      }
    }
  }, [BASE_STATIC_GAIN, LOCKED_STATIC_GAIN, SPIRITBOX_LOCKED_FREQUENCY, audioUnlocked, clearSpiritDisplayLockTimer, clearSpiritLockTimer, ensureSpiritAmbientAudio, powerOn, role, spiritFrequency, stopSpiritAmbientAudio])

  // Remonte la fréquence courante (et l'état de verrouillage) au backend pour l'admin.
  useEffect(() => {
    if (role !== 'spiritbox' || !deviceId) {
      return
    }

    const payload = JSON.stringify({ frequency: spiritFrequency, locked: spiritSignalLocked })
    fetch(`/apil7r/player/device/${deviceId}/spiritbox/frequency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {
      // Erreur silencieuse
    })
  }, [role, deviceId, spiritFrequency, spiritSignalLocked])

  useEffect(() => {
    if (role !== 'spiritbox' || !powerOn) {
      stopSpiritRecording()
      return
    }

    if (!spiritSocketRef.current) {
      void startSpiritRecording()
    }
  }, [powerOn, role, startSpiritRecording, stopSpiritRecording])

  useEffect(() => {
    if (role !== 'spiritbox' || !deviceId) {
      return
    }

    const pollMjMessage = () => {
      fetch(`/apil7r/player/device/${deviceId}/spiritbox/mj-message`)
        .then(r => r.json())
        .then((payload: { message?: SpiritAudioMessage }) => {
          const message = payload.message
          if (!message || message.id === lastSpiritMjMessageIdRef.current) {
            return
          }

          lastSpiritMjMessageIdRef.current = message.id
          setSpiritStatus('MESSAGE RECU')
          setSpiritLastHeardAt(new Date().toLocaleTimeString())
          playGhostAudio(message.audioData)
        })
        .catch(() => {
          // Reseau non disponible
        })
    }

    pollMjMessage()
    const interval = setInterval(pollMjMessage, 700)
    return () => clearInterval(interval)
  }, [role, deviceId, playGhostAudio])

  useEffect(() => {
    return () => {
      spiritStreamRef.current?.getTracks().forEach(track => track.stop())
      spiritStreamRef.current = null
      stopSpiritRecording()
      stopSpiritAmbientAudio()
    }
  }, [stopSpiritAmbientAudio, stopSpiritRecording])

  return {
    spiritRecording,
    spiritStatus,
    spiritLastHeardAt,
    spiritFrequency,
    spiritSignalLocked,
    tuneSpiritFrequencyDown,
    tuneSpiritFrequencyUp,
  }
}
