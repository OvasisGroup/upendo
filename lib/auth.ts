import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const AUTH_COOKIE = 'upendo_token'

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createSession(payload: { id: string; role: string; email: string; isOwner: boolean }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export async function getSession(): Promise<{ id: string; role: string; email: string; isOwner: boolean } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as any
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 })
}
