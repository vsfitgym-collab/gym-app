import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  initialTime: number
  autoStart?: boolean
  onComplete?: () => void
  onTick?: (remaining: number) => void
}

interface UseTimerReturn {
  time: number
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setTime: (time: number) => void
}

export function useTimer({ 
  initialTime, 
  autoStart = false, 
  onComplete, 
  onTick 
}: UseTimerOptions): UseTimerReturn {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
    setIsComplete(false)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      setIsRunning(true)
    }
  }, [isPaused])

  const reset = useCallback(() => {
    clearTimer()
    setTime(initialTime)
    setIsRunning(false)
    setIsPaused(false)
    setIsComplete(false)
  }, [initialTime, clearTimer])

  const setTimeValue = useCallback((newTime: number) => {
    setTime(newTime)
    setIsComplete(false)
    setIsRunning(false)
    setIsPaused(false)
  }, [])

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => {
          const newTime = prev - 1
          if (onTick) onTick(newTime)
          
          if (newTime <= 0) {
            clearTimer()
            setIsRunning(false)
            setIsComplete(true)
            if (onComplete) onComplete()
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return clearTimer
  }, [isRunning, time, onComplete, onTick, clearTimer])

  return {
    time,
    isRunning,
    isPaused,
    isComplete,
    start,
    pause,
    resume,
    reset,
    setTime: setTimeValue
  }
}

interface UseExerciseTimerOptions {
  series: number
  descansoEntreSeries: number
  descansoAposUltima?: number
  onSerieComplete?: (serie: number) => void
  onTreinoComplete?: () => void
}

interface UseExerciseTimerReturn {
  serieAtual: number
  tempoDescanso: number
  isDescansando: boolean
  isTreinoCompleto: boolean
  isPausado: boolean
  iniciarSerie: () => void
  completarSerie: () => void
  pularDescanso: () => void
  pausar: () => void
  resumir: () => void
  reiniciarTreino: () => void
}

export function useExerciseTimer({
  series,
  descansoEntreSeries,
  descansoAposUltima: _descansoAposUltima,
  onSerieComplete,
  onTreinoComplete
}: UseExerciseTimerOptions): UseExerciseTimerReturn {
  const [serieAtual, setSerieAtual] = useState(1)
  const [isDescansando, setIsDescansando] = useState(false)
  const [isTreinoCompleto, setIsTreinoCompleto] = useState(false)
  const [isPausado, setIsPausado] = useState(false)

  const {
    time: tempoDescanso,
    isRunning: descansoAtivo,
    start: iniciarDescanso,
    pause: pausarDescanso,
    resume: resumirDescanso,
    reset: resetarDescanso
  } = useTimer({
    initialTime: descansoEntreSeries,
    autoStart: false,
    onComplete: () => {
      setIsDescansando(false)
      if (serieAtual < series) {
        setSerieAtual((prev) => prev + 1)
        if (onSerieComplete) onSerieComplete(serieAtual)
      } else {
        if (onTreinoComplete) onTreinoComplete()
      }
    }
  })

  const iniciarSerie = useCallback(() => {
    setIsPausado(false)
  }, [])

  const completarSerie = useCallback(() => {
    setIsDescansando(true)
    resetarDescanso()
    
    setTimeout(() => {
      iniciarDescanso()
    }, 0)
  }, [resetarDescanso, iniciarDescanso])

  const pularDescanso = useCallback(() => {
    pausarDescanso()
    setIsDescansando(false)
    if (serieAtual < series) {
      setSerieAtual((prev) => prev + 1)
      if (onSerieComplete) onSerieComplete(serieAtual)
    } else {
      setIsTreinoCompleto(true)
      if (onTreinoComplete) onTreinoComplete()
    }
  }, [serieAtual, series, pausarDescanso, onSerieComplete, onTreinoComplete])

  const pausar = useCallback(() => {
    setIsPausado(true)
    if (isDescansando) {
      pausarDescanso()
    }
  }, [isDescansando, pausarDescanso])

  const resumir = useCallback(() => {
    setIsPausado(false)
    if (isDescansando) {
      resumirDescanso()
    }
  }, [isDescansando, resumirDescanso])

  const reiniciarTreino = useCallback(() => {
    setSerieAtual(1)
    setIsDescansando(false)
    setIsTreinoCompleto(false)
    setIsPausado(false)
    resetarDescanso()
  }, [resetarDescanso])

  return {
    serieAtual,
    tempoDescanso,
    isDescansando: descansoAtivo && isDescansando,
    isTreinoCompleto,
    isPausado,
    iniciarSerie,
    completarSerie,
    pularDescanso,
    pausar,
    resumir,
    reiniciarTreino
  }
}