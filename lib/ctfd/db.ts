import { query } from "@/lib/db"
import { generateToken } from "@/lib/oauth/utils"
import type { CTFdSSOToken } from "./types"

// SSO token operations for CTFd
export async function createCTFdSSOToken(userId: string, email: string, name: string): Promise<string> {
  const token = generateToken(32)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes - short lived for SSO

  await query(
    `INSERT INTO ctfd_sso_tokens (token, user_id, email, name, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET token = $1, expires_at = $5`,
    [token, userId, email, name, expiresAt],
  )

  return token
}

export async function getCTFdSSOToken(token: string): Promise<CTFdSSOToken | null> {
  const result = await query<CTFdSSOToken>("SELECT * FROM ctfd_sso_tokens WHERE token = $1 AND expires_at > NOW()", [
    token,
  ])
  return result.rows[0] || null
}

export async function deleteCTFdSSOToken(token: string): Promise<void> {
  await query("DELETE FROM ctfd_sso_tokens WHERE token = $1", [token])
}

// Additional schema for CTFd SSO tokens
export const CTFD_SCHEMA = `
-- CTFd SSO tokens table
CREATE TABLE IF NOT EXISTS ctfd_sso_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for CTFd webhook authentication
CREATE TABLE IF NOT EXISTS ctfd_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ctfd_sso_token ON ctfd_sso_tokens(token);
`
