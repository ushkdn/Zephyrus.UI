import type { UserRole } from '../../types'

interface JwtPayload {
  sub: string
  email: string
  given_name: string
  family_name: string
  role: UserRole
  exp: number
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Creates a real-looking JWT without a valid signature — sufficient for jwtDecode() parsing. */
export function sign(payload: JwtPayload): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(payload))
  return `${header}.${body}.fakesignature`
}
