const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  if (envUrl) return envUrl
  console.warn("VITE_SUPABASE_URL não definido, usando valor padrão")
  return 'https://ueixrbdbtjpyuortrniz.supabase.co'
}

export const SUPABASE_URL = getBaseUrl()

export interface LocalExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gif: string
}

export const normalizePath = (path: string): string => {
  if (!path) return ''
  return path
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const getGifUrl = (exercise: LocalExercise): string => {
  if (!exercise?.gif) return ''
  
  let path = exercise.gif
  if (!path.startsWith('exercicios/')) {
    path = `exercicios/${path}`
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`
}

export const getGifUrlByName = (name: string): string => {
  if (!name) return ''
  const slug = normalizePath(name)
  return `${SUPABASE_URL}/storage/v1/object/public/exercicios/${slug}.gif`
}

export const getSupabaseGifUrl = getGifUrlByName

export const getExerciseGifWithFallback = (exercise: LocalExercise): string => {
  const primaryUrl = getGifUrl(exercise)
  if (primaryUrl) return primaryUrl
  
  const fallbackSlug = normalizePath(exercise.name)
  return `${SUPABASE_URL}/storage/v1/object/public/exercicios/${fallbackSlug}.gif`
}

export const getImageFallback = (): string => {
  return '/fallback-exercise.svg'
}