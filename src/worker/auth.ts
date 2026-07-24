import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode('cdi-antigravity-secret-key-2026');

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'client';
  unit?: string | null;
}

export async function createToken(user: AuthUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as AuthUser;
  } catch (err) {
    return null;
  }
}

// Simple WebCrypto-compatible hash/check helper
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check SHA-256 first
  const sha256 = await hashPassword(password);
  if (sha256 === storedHash) return true;

  return password === storedHash;
}
