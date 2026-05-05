import { supabase } from "@/lib/supabase"

interface Exercise {
  muscle_group?: string
  image_url?: string
  video_url?: string
}

const PUBLIC_STORAGE_MARKER = "/storage/v1/object/public/"

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function resolveExerciseStorageUrl(value: string | undefined, muscleGroup: string | undefined): string | null {
  if (!value) {
    return null
  }

  if (isAbsoluteUrl(value)) {
    return value
  }

  const publicStorageIndex = value.indexOf(PUBLIC_STORAGE_MARKER)
  if (publicStorageIndex >= 0) {
    return value
  }

  const path = value.includes("/") ? value : muscleGroup ? `${muscleGroup}/${value}` : null

  if (!path) {
    return null
  }

  try {
    const { data } = supabase.storage
      .from('exercicios')
      .getPublicUrl(path)

    return data?.publicUrl || null
  } catch (error) {
    console.error('[getExerciseMedia] Error resolving media:', error)
    return null
  }
}

export function getExerciseImage(exercise: Exercise | null): string | null {
  return resolveExerciseStorageUrl(exercise?.image_url, exercise?.muscle_group)
}

export function getExerciseVideo(exercise: Exercise | null): string | null {
  return resolveExerciseStorageUrl(exercise?.video_url, exercise?.muscle_group)
}

export function getExerciseMedia(exercise: Exercise | null) {
  const imageUrl = getExerciseImage(exercise)
  const videoUrl = getExerciseVideo(exercise)

  return {
    image: imageUrl,
    video: videoUrl,
    hasMedia: !!(imageUrl || videoUrl),
  }
}

export function getPlaceholderImage(): string {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext fill='%23666' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle'%3ESem imagem%3C/text%3E%3C/svg%3E"
}
