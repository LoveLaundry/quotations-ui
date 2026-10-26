const CHANNEL = 'll-linen-live'

export function publishLinenChange(): void {
  try {
    const channel = new BroadcastChannel(CHANNEL)
    channel.postMessage({ t: Date.now() })
    channel.close()
  } catch {
    // BroadcastChannel is unavailable (older browsers / non-window).
  }
}

export function subscribeLinenChange(onChange: () => void): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = () => onChange()
    return () => channel.close()
  } catch {
    return () => undefined
  }
}
