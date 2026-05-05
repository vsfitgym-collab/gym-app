import { useState } from "react"
import { Play, Volume2, VolumeX, Dumbbell } from "lucide-react"

interface ExerciseMediaProps {
  videoSrc?: string | null
  imageSrc?: string | null
  exerciseName: string
  isPlaying: boolean
  isMuted: boolean
  videoError: boolean
  onPlayToggle: () => void
  onMuteToggle: () => void
  onVideoError: () => void
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 ${className}`} />
  )
}

export function ExerciseMedia({
  videoSrc,
  imageSrc,
  exerciseName,
  isPlaying,
  isMuted,
  videoError,
  onPlayToggle,
  onMuteToggle,
  onVideoError,
}: ExerciseMediaProps) {
  const [imageLoading, setImageLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)

  const showVideo = videoSrc && !videoError

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1A1A1A]">
      {/* Loading skeleton */}
      {(showVideo ? videoLoading : imageLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A] z-10">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-32 h-4 rounded" />
          </div>
        </div>
      )}

      {/* Video */}
      {showVideo ? (
        <video
          src={videoSrc || undefined}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          autoPlay={isPlaying}
          controls={false}
          onClick={onPlayToggle}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => {
            setVideoLoading(false)
            onVideoError()
          }}
          poster={imageSrc || undefined}
        />
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt={exerciseName}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/20">
            <Dumbbell className="w-20 h-20" />
            <p className="text-sm">Sem mídia disponível</p>
          </div>
        </div>
      )}

      {/* Video Controls */}
      {showVideo && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={onPlayToggle}
              className="p-3 bg-black/60 backdrop-blur-sm rounded-xl hover:bg-black/80 transition-colors"
            >
              {isPlaying ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button 
              onClick={onMuteToggle}
              className="p-3 bg-black/60 backdrop-blur-sm rounded-xl hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Play button overlay when paused */}
      {showVideo && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={onPlayToggle}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  )
}