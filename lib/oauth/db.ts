import { demoStore } from "@/lib/demo/store"
import type { OAuthClient, OAuthAuthorizationCode, OAuthAccessToken, OAuthRefreshToken } from "./types"
import { generateCode, generateToken } from "./utils"

const isDemoMode = () => {
  const demoMode = process.env.DEMO_MODE
  if (demoMode === 'false') return false
  if (demoMode === 'true') return true
  // ERROR: DEMO_MODE must be explicitly set
  throw new Error(
    'DEMO_MODE environment variable is not set! Set DEMO_MODE=true or DEMO_MODE=false in .env.local'
  )
}

// In-memory stores for demo mode
const demoAuthCodes = new Map<string, OAuthAuthorizationCode>()
const demoAccessTokens = new Map<string, OAuthAccessToken>()
const demoRefreshTokens = new Map<string, OAuthRefreshToken>()

// Client operations
export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  if (isDemoMode()) {
    const client = demoStore.getOAuthClient(clientId)
    if (client) {
      return {
        id: clientId,
        client_id: client.clientId,
        client_secret: client.clientSecret,
        name: client.name,
        redirect_uris: client.redirectUris,
        allowed_scopes: ["openid", "profile", "email"],
        created_at: new Date(),
      }
    }
    return null
  }

  // Real DB query would go here
  return null
}

// Authorization code operations
export async function createAuthorizationCode(data: {
  clientId: string
  userId: string
  redirectUri: string
  scope: string | null
  codeChallenge: string | null
  codeChallengeMethod: string | null
}): Promise<string> {
  const code = generateCode(32)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  if (isDemoMode()) {
    demoAuthCodes.set(code, {
      id: code,
      code,
      client_id: data.clientId,
      user_id: data.userId,
      redirect_uri: data.redirectUri,
      scope: data.scope,
      code_challenge: data.codeChallenge,
      code_challenge_method: data.codeChallengeMethod,
      expires_at: expiresAt,
      created_at: new Date(),
    })
    return code
  }

  return code
}

export async function getAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null> {
  if (isDemoMode()) {
    const authCode = demoAuthCodes.get(code)
    if (authCode && authCode.expires_at > new Date()) {
      demoAuthCodes.delete(code) // One-time use
      return authCode
    }
    return null
  }

  return null
}

export async function deleteAuthorizationCode(code: string): Promise<void> {
  if (isDemoMode()) {
    demoAuthCodes.delete(code)
    return
  }
}

// Access token operations
export async function createAccessToken(data: {
  clientId: string
  userId: string
  scope: string | null
}): Promise<{ token: string; expiresIn: number; tokenId: string }> {
  const token = generateToken(48)
  const expiresIn = 3600
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  const tokenId = `token-${Date.now()}`

  if (isDemoMode()) {
    demoAccessTokens.set(token, {
      id: tokenId,
      token,
      client_id: data.clientId,
      user_id: data.userId,
      scope: data.scope,
      expires_at: expiresAt,
      created_at: new Date(),
    })
    return { token, expiresIn, tokenId }
  }

  return { token, expiresIn, tokenId }
}

export async function getAccessToken(token: string): Promise<OAuthAccessToken | null> {
  if (isDemoMode()) {
    const accessToken = demoAccessTokens.get(token)
    if (accessToken && accessToken.expires_at > new Date()) {
      return accessToken
    }
    // For demo, also accept a special demo token
    if (token === "demo-access-token") {
      return {
        id: "demo-token-id",
        token: "demo-access-token",
        client_id: "moodle_client",
        user_id: "demo-user-001",
        scope: "openid profile email",
        expires_at: new Date(Date.now() + 3600000),
        created_at: new Date(),
      }
    }
    return null
  }

  return null
}

// Refresh token operations
export async function createRefreshToken(accessTokenId: string): Promise<string> {
  const token = generateToken(48)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  if (isDemoMode()) {
    demoRefreshTokens.set(token, {
      id: `refresh-${Date.now()}`,
      token,
      access_token_id: accessTokenId,
      expires_at: expiresAt,
      created_at: new Date(),
    })
    return token
  }

  return token
}

export async function getRefreshToken(token: string): Promise<OAuthRefreshToken | null> {
  if (isDemoMode()) {
    const refreshToken = demoRefreshTokens.get(token)
    if (refreshToken && refreshToken.expires_at > new Date()) {
      return refreshToken
    }
    return null
  }

  return null
}

export async function deleteRefreshToken(token: string): Promise<void> {
  if (isDemoMode()) {
    demoRefreshTokens.delete(token)
    return
  }
}
