import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

/** A decoded tag is ignored for this long after a read, so one physical tag
 * held in front of the lens registers once instead of firing every frame —
 * while still being re-readable when the operator deliberately rescans it. */
const DEFAULT_RESCAN_COOLDOWN_MS = 1500

export interface LinenCameraOptions {
  /** Receives the raw string the QR payload carried, before any parsing. */
  onCode: (raw: string) => void
  cooldownMs?: number
}

export interface LinenCamera {
  active: boolean
  starting: boolean
  error: string | null
  /** Attach this to an element; the <video> is inserted as its first child. */
  containerRef: React.RefObject<HTMLDivElement | null>
  start: (event?: React.MouseEvent) => void
  stop: () => void
}

/** Camera names that mean something different to an operator than the raw
 * DOMException does — "NotAllowedError" tells an operator nothing. */
function explain(err: any): string {
  const name = err?.name || ''
  if (name === 'NotAllowedError') {
    return 'Camera blocked. Go to browser Settings → Site Settings → Camera → Allow this site, then reload. You can type the code on the tag below.'
  }
  if (name === 'NotFoundError') return 'No camera found.'
  if (name === 'NotReadableError') return 'Camera in use by another app.'
  return `${name}: ${err?.message}`
}

/**
 * Continuous QR reading for linen tags.
 *
 * Shared by the single-linen scanner and the batch scanning session so both
 * behave identically: the frame loop keeps running after a successful read
 * (one tag per camera-open would freeze the preview), and a repeat of the same
 * payload is suppressed until the cooldown expires.
 *
 * `onCode` goes through a ref because the loop is created once when the camera
 * starts but must always call the current handler — a captured closure would
 * keep processing against state from the moment the camera was opened.
 */
export function useLinenCamera({ onCode, cooldownMs = DEFAULT_RESCAN_COOLDOWN_MS }: LinenCameraOptions): LinenCamera {
  const [active, setActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef<number>(0)
  const lastRawRef = useRef<string | null>(null)
  const cooldownUntilRef = useRef(0)

  const onCodeRef = useRef(onCode)
  useEffect(() => { onCodeRef.current = onCode })

  const stop = useCallback(() => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current)
      loopRef.current = 0
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    lastRawRef.current = null
    cooldownUntilRef.current = 0
    setActive(false)
  }, [])

  const start = useCallback(async (event?: React.MouseEvent) => {
    // Treated as an explicit user gesture: getUserMedia is refused otherwise.
    event?.preventDefault()
    setError(null)
    setStarting(true)

    try {
      stop()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream

      const container = containerRef.current
      if (!container) throw new Error('Container not found')

      container.querySelector('video')?.remove()
      const video = document.createElement('video')
      video.setAttribute('autoplay', '')
      video.setAttribute('playsinline', '')
      video.setAttribute('muted', '')
      video.style.width = '100%'
      video.style.minHeight = '300px'
      video.style.objectFit = 'cover'
      video.srcObject = stream
      container.prepend(video)
      videoRef.current = video

      await video.play()
      setActive(true)
      setStarting(false)

      const scanCanvas = document.createElement('canvas')
      const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true })

      const loop = () => {
        const v = videoRef.current
        if (!v || v.readyState < 2) {
          loopRef.current = requestAnimationFrame(loop)
          return
        }

        scanCanvas.width = v.videoWidth
        scanCanvas.height = v.videoHeight
        scanCtx!.drawImage(v, 0, 0)

        const imageData = scanCtx!.getImageData(0, 0, scanCanvas.width, scanCanvas.height)
        const qr = jsQR(imageData.data, imageData.width, imageData.height, {
          // Labels printed dark-on-light onto dark fabric, or a photo of a
          // screen, decode inverted far more often than not.
          inversionAttempts: 'attemptBoth',
        })

        if (qr?.data) {
          const now = Date.now()
          if (now >= cooldownUntilRef.current || qr.data !== lastRawRef.current) {
            cooldownUntilRef.current = now + cooldownMs
            lastRawRef.current = qr.data
            onCodeRef.current(qr.data)
          }
        }

        // Keep reading: stopping here would freeze the preview after the first
        // tag and every later tag would silently do nothing.
        loopRef.current = requestAnimationFrame(loop)
      }

      loopRef.current = requestAnimationFrame(loop)
    } catch (err: any) {
      setStarting(false)
      setActive(false)
      setError(explain(err))
    }
  }, [stop, cooldownMs])

  useEffect(() => stop, [stop])

  return { active, starting, error, containerRef, start, stop }
}
