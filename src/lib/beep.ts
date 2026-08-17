export function beepOk() {
  const ctx = crearCtx()
  if (!ctx) return
  tono(ctx, 660, 0, 0.35)
  tono(ctx, 990, 0.4, 0.6)
}

export function beepError() {
  const ctx = crearCtx()
  if (!ctx) return
  tono(ctx, 220, 0, 1.0)
}

function crearCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    return new AudioCtx()
  } catch {
    return null
  }
}

function tono(ctx: AudioContext, freq: number, inicio: number, duracion: number) {
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = freq
    const t = ctx.currentTime + inicio
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    gain.gain.setValueAtTime(0.5, t + duracion - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duracion)
    osc.start(t)
    osc.stop(t + duracion)
  } catch {
    // sin sonido si el navegador lo bloquea
  }
}