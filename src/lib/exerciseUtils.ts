/**
 * Normaliza o nome do exercício para o formato de slug (ex: "Push Up" -> "push-up")
 * - Converte para minúsculo
 * - Remove acentos
 * - Remove caracteres especiais
 * - Substitui espaços por hífen
 */
export const normalizeExerciseName = (name: string): string => {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '')        // Remove caracteres especiais (mantém letras, números, espaços e hifens)
    .trim()
    .replace(/\s+/g, '-')            // Substitui múltiplos espaços por um único hífen
}

/**
 * Gera a URL do GIF no Supabase Storage bucket "exercicios"
 */
export const getSupabaseGifUrl = (name: string): string => {
  if (!name) return ''
  
  const slug = normalizeExerciseName(name)
  // Base URL fornecida pelo usuário
  return `https://gym-app.supabase.co/storage/v1/object/public/exercicios/${slug}.gif`
}
