export interface JwtClaims {
  sub: string
  email: string
  role: string
  exp: number
}

export function decodeToken(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function isTokenExpired(token: string | null, graceSeconds = 0): boolean {
  if (!token) return true
  const claims = decodeToken(token)
  if (!claims) return false
  if (!claims.exp) return true
  return Date.now() >= (claims.exp + graceSeconds) * 1000
}

export function getTokenExpiry(token: string): Date | null {
  const claims = decodeToken(token)
  if (!claims?.exp) return null
  return new Date(claims.exp * 1000)
}
