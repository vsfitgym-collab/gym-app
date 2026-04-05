import { useEffect, useRef } from 'react'
import './ContadorCircular.css'

interface ContadorCircularProps {
  tempo: number
  isRunning: boolean
}

export default function ContadorCircular({ tempo, isRunning }: ContadorCircularProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const circumference = 2 * Math.PI * 45

  useEffect(() => {
    if (!isRunning && tempo > 0 && audioRef.current) {
      const playSound = () => {
        audioRef.current?.play().catch(() => {})
      }
      playSound()
    }
  }, [tempo, isRunning])

  const progress = tempo > 0 ? (tempo / 90) * circumference : 0
  const mins = Math.floor(tempo / 60)
  const secs = tempo % 60

  return (
    <div className="contador-circular">
      <audio ref={audioRef} preload="auto">
        <source src="https://assets.mixkit.co/active/storage/sfx/2869/2869-preview.mp3" type="audio/mp3" />
      </audio>
      <svg className="circular-svg" viewBox="0 0 100 100">
        <circle
          className="circular-bg"
          cx="50"
          cy="50"
          r="45"
        />
        <circle
          className="circular-progress"
          cx="50"
          cy="50"
          r="45"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference - progress
          }}
        />
      </svg>
      <div className="contador-texto">
        <span className="contador-tempo">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <span className="contador-label">DESCANSO</span>
      </div>
    </div>
  )
}