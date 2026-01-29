export interface OAuthClient {
  id: string
  client_id: string
  client_secret: string
  name: string
  redirect_uris: string[]
  allowed_scopes: string[]
}

export interface OAuthAuthorizationCode {
  id: string
  code: string
  client_id: string
  user_id: string
  redirect_uri: string
  scope: string | null
  code_challenge: string | null
  code_challenge_method: string | null
  expires_at: Date
}

export interface OAuthAccessToken {
  id: string
  token: string
  client_id: string
  user_id: string
  scope: string | null
  expires_at: Date
}

export interface OAuthRefreshToken {
  id: string
  token: string
  access_token_id: string
  expires_at: Date
}

export interface TokenResponse {
  access_token: string
  token_type: "Bearer"
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface UserInfoResponse {
  sub: string
  email: string
  email_verified: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  updated_at?: number
}
