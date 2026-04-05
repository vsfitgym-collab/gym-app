export interface ValidationRule<T> {
  validate: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export const validators = {
  required: (message = 'Campo obrigatório'): ValidationRule<string> => ({
    validate: (value) => value !== null && value !== undefined && value.trim().length > 0,
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Mínimo de ${min} caracteres`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Máximo de ${max} caracteres`
  }),

  email: (message = 'Email inválido'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Valor mínimo: ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Valor máximo: ${max}`
  }),

  positive: (message = 'Valor deve ser positivo'): ValidationRule<number> => ({
    validate: (value) => value > 0,
    message
  }),

  integer: (message = 'Valor deve ser inteiro'): ValidationRule<number> => ({
    validate: (value) => Number.isInteger(value),
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message
  }),

  oneOf: <T>(options: T[], message?: string): ValidationRule<T> => ({
    validate: (value) => options.includes(value),
    message: message || `Valor deve ser um de: ${options.join(', ')}`
  }),

  notOneOf: <T>(options: T[], message?: string): ValidationRule<T> => ({
    validate: (value) => !options.includes(value),
    message: message || `Valor não pode ser: ${options.join(', ')}`
  })
}

export function validateField<T>(value: T, rules: ValidationRule<T>[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

export function validateObject<T extends Record<string, unknown>>(
  obj: T,
  rules: Partial<Record<keyof T, ValidationRule<unknown>[]>>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    if (fieldRules && fieldRules.length > 0) {
      const value = obj[field]
      const error = validateField(value as never, fieldRules as ValidationRule<never>[])
      if (error) {
        errors[field] = error
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export function sanitizeString(str: string, maxLength = 1000): string {
  if (!str) return ''
  
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

export function sanitizeHtml(html: string): string {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li']
  let result = html
  
  for (const tag of allowedTags) {
    result = result.replace(new RegExp(`<(?!\/?${tag})[^>]*>`, 'gi'), '')
  }
  
  return result
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

export function escapeSqlLike(str: string): string {
  return str.replace(/[%_]/g, '\\$&')
}
