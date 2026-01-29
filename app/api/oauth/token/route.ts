import { type NextRequest, NextResponse } from "next/server"
import {
  getOAuthClient,
  getAuthorizationCode,
  deleteAuthorizationCode,
  createAccessToken,
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from "@/lib/storage/json-db"
import { verifyCodeChallenge } from "@/lib/oauth/utils"
import type { TokenResponse } from "@/lib/oauth/types"

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")

  let body: Record<string, string>
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  } else {
    body = await request.json()
  }

  const grantType = body.grant_type

  // Handle different grant types
  if (grantType === "authorization_code") {
    return handleAuthorizationCodeGrant(body, request)
  } else if (grantType === "refresh_token") {
    return handleRefreshTokenGrant(body, request)
  }

  return NextResponse.json(
    {
      error: "unsupported_grant_type",
      error_description: "Only authorization_code and refresh_token grants are supported",
    },
    { status: 400 },
  )
}

async function handleAuthorizationCodeGrant(body: Record<string, string>, request: NextRequest): Promise<NextResponse> {
  const { code, client_id, client_secret, redirect_uri, code_verifier } = body

  // Validate required parameters
  if (!code || !client_id || !redirect_uri) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Missing required parameters",
      },
      { status: 400 },
    )
  }

  // Validate client
  const client = await getOAuthClient(client_id)
  if (!client) {
    return NextResponse.json(
      {
        error: "invalid_client",
        error_description: "Unknown client",
      },
      { status: 401 },
    )
  }

  // Validate client secret (if not using PKCE)
  if (!code_verifier && client_secret !== client.client_secret) {
    return NextResponse.json(
      {
        error: "invalid_client",
        error_description: "Invalid client credentials",
      },
      { status: 401 },
    )
  }

  // Get and validate authorization code
  const authCode = await getAuthorizationCode(code)
  if (!authCode) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      },
      { status: 400 },
    )
  }

  // Validate redirect URI matches
  if (authCode.redirect_uri !== redirect_uri) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Redirect URI mismatch",
      },
      { status: 400 },
    )
  }

  // Validate PKCE if code challenge was used
  if (authCode.code_challenge && authCode.code_challenge_method) {
    if (!code_verifier) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Code verifier required",
        },
        { status: 400 },
      )
    }

    if (!verifyCodeChallenge(code_verifier, authCode.code_challenge, authCode.code_challenge_method)) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Invalid code verifier",
        },
        { status: 400 },
      )
    }
  }

  // Delete the authorization code (one-time use)
  await deleteAuthorizationCode(code)

  // Create access token
  const { token, expiresIn, tokenId } = await createAccessToken({
    clientId: client_id,
    userId: authCode.user_id,
    scope: authCode.scope,
  })

  // Create refresh token
  const refreshToken = await createRefreshToken(tokenId)

  const response: TokenResponse = {
    access_token: token,
    token_type: "Bearer",
    expires_in: expiresIn,
    refresh_token: refreshToken,
    scope: authCode.scope || undefined,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  })
}

async function handleRefreshTokenGrant(body: Record<string, string>, request: NextRequest): Promise<NextResponse> {
  const { refresh_token, client_id, client_secret } = body

  if (!refresh_token || !client_id) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Missing required parameters",
      },
      { status: 400 },
    )
  }

  // Validate client
  const client = await getOAuthClient(client_id)
  if (!client || client.client_secret !== client_secret) {
    return NextResponse.json(
      {
        error: "invalid_client",
        error_description: "Invalid client credentials",
      },
      { status: 401 },
    )
  }

  // Get refresh token
  const storedRefreshToken = await getRefreshToken(refresh_token)
  if (!storedRefreshToken) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired refresh token",
      },
      { status: 400 },
    )
  }

  // Delete old refresh token
  await deleteRefreshToken(refresh_token)

  // Create new access token
  const { token, expiresIn, tokenId } = await createAccessToken({
    clientId: client_id,
    userId: storedRefreshToken.access_token_id, // This should be user_id, fix in schema
    scope: null,
  })

  // Create new refresh token
  const newRefreshToken = await createRefreshToken(tokenId)

  const response: TokenResponse = {
    access_token: token,
    token_type: "Bearer",
    expires_in: expiresIn,
    refresh_token: newRefreshToken,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  })
}
