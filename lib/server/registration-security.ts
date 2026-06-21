type RateLimitEntry = { count: number; resetAt: number }

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const globalRateLimit = globalThis as typeof globalThis & {
  __ruumRegistrationRateLimit?: Map<string, RateLimitEntry>
}

const attempts = globalRateLimit.__ruumRegistrationRateLimit ?? new Map<string, RateLimitEntry>()
globalRateLimit.__ruumRegistrationRateLimit = attempts

function clientAddress(request: Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

export function checkRegistrationRequest(request: Request, scope: string) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return { allowed: false as const, status: 403, message: 'Origen no permitido.' }
  }

  const now = Date.now()
  const key = `${scope}:${clientAddress(request)}`
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true as const }
  }
  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false as const,
      status: 429,
      message: 'Demasiados intentos. Espera antes de volver a intentar.',
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }
  current.count += 1
  return { allowed: true as const }
}

export function isAcceptablePassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}
