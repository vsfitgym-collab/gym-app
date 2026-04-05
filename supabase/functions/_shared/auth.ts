import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || '',
    role: profile?.role || 'aluno'
  }
}

export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function forbidden(message = 'Forbidden'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function badRequest(message = 'Bad Request'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function notFound(message = 'Not Found'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function internalError(message = 'Internal Server Error'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  })
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / (windowSeconds * 1000))}`
  
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds * 1000 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count += 1
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
}

export function sanitizeInput(input: string, maxLength = 1000): string {
  if (!input) return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"]/g, '')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  
  for (const field of fields) {
    const value = obj[field]
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      missing.push(field as string)
    }
  }
  
  return { valid: missing.length === 0, missing }
}
