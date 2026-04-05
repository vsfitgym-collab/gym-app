import { supabase } from './supabase'

type LogLevel = 'info' | 'warn' | 'error' | 'security'
type LogAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'UNAUTHORIZED_ACCESS'
  | 'FORBIDDEN_ACCESS'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'PLAN_UPGRADE'
  | 'WORKOUT_CREATE'
  | 'WORKOUT_UPDATE'
  | 'WORKOUT_DELETE'
  | 'EXERCISE_CREATE'
  | 'EXERCISE_UPDATE'
  | 'EXERCISE_DELETE'
  | 'PROFILE_UPDATE'
  | 'DATA_EXPORT'

interface LogEntry {
  level: LogLevel
  action: LogAction
  userId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

class SecurityLogger {
  private enabled = true
  private logQueue: LogEntry[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private readonly MAX_QUEUE_SIZE = 10
  private readonly FLUSH_INTERVAL = 5000

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushInterval()
    }
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL)
  }

  private stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  async log(entry: LogEntry) {
    if (!this.enabled) return

    this.logQueue.push(entry)

    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flush()
    }
  }

  private async flush() {
    if (this.logQueue.length === 0) return

    const entries = [...this.logQueue]
    this.logQueue = []

    try {
      const { error } = await supabase.from('security_logs').insert(
        entries.map(entry => ({
          level: entry.level,
          action: entry.action,
          user_id: entry.userId || null,
          details: entry.details ? JSON.stringify(entry.details) : null,
          ip_address: entry.ip || null,
          user_agent: entry.userAgent || null,
          created_at: new Date().toISOString()
        }))
      )

      if (error) {
        console.error('Failed to log security event:', error)
      }
    } catch (error) {
      console.error('Security logger error:', error)
    }
  }

  info(action: LogAction, details?: Record<string, unknown>, userId?: string) {
    return this.log({ level: 'info', action, details, userId })
  }

  warn(action: LogAction, details?: Record<string, unknown>, userId?: string) {
    return this.log({ level: 'warn', action, details, userId })
  }

  error(action: LogAction, details?: Record<string, unknown>, userId?: string) {
    return this.log({ level: 'error', action, details, userId })
  }

  security(action: LogAction, details?: Record<string, unknown>, userId?: string) {
    return this.log({ level: 'security', action, details, userId })
  }

  destroy() {
    this.stopFlushInterval()
    this.flush()
    this.enabled = false
  }
}

export const securityLogger = new SecurityLogger()

export async function logLoginSuccess(userId: string, email: string) {
  await securityLogger.security('LOGIN_SUCCESS', { email }, userId)
}

export async function logLoginFailed(email: string, reason?: string) {
  await securityLogger.security('LOGIN_FAILED', { email, reason })
}

export async function logLogout(userId: string) {
  await securityLogger.info('LOGOUT', {}, userId)
}

export async function logUnauthorizedAccess(
  userId: string | null,
  resource: string,
  attemptedAction: string
) {
  await securityLogger.security('UNAUTHORIZED_ACCESS', { resource, attemptedAction }, userId || undefined)
}

export async function logForbiddenAccess(
  userId: string,
  resource: string,
  attemptedAction: string
) {
  await securityLogger.security('FORBIDDEN_ACCESS', { resource, attemptedAction }, userId)
}

export async function logPaymentAction(
  action: 'PAYMENT_CREATED' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED',
  userId: string,
  amount: number,
  plan: string
) {
  await securityLogger.security(action, { amount, plan }, userId)
}

export async function logDataExport(userId: string, dataType: string) {
  await securityLogger.info('DATA_EXPORT', { dataType }, userId)
}
