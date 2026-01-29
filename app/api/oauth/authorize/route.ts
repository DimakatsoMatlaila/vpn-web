import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { getOAuthClient, createAuthorizationCode } from "@/lib/storage/json-db"
import { validateRedirectUri, parseScope } from "@/lib/oauth/utils"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Required OAuth parameters
  const clientId = searchParams.get("client_id")
  const redirectUri = searchParams.get("redirect_uri")
  const responseType = searchParams.get("response_type")
  const scope = searchParams.get("scope")
  const state = searchParams.get("state")

  // PKCE parameters
  const codeChallenge = searchParams.get("code_challenge")
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "plain"

  // Validate required parameters
  if (!clientId || !redirectUri || responseType !== "code") {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Missing required parameters: client_id, redirect_uri, or response_type",
      },
      { status: 400 },
    )
  }

  // Validate client
  const client = await getOAuthClient(clientId)
  if (!client) {
    return NextResponse.json(
      {
        error: "invalid_client",
        error_description: "Unknown client_id",
      },
      { status: 400 },
    )
  }

  // Validate redirect URI
  if (!validateRedirectUri(redirectUri, client.redirect_uris)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Invalid redirect_uri",
      },
      { status: 400 },
    )
  }

  // Validate scope
  const requestedScopes = parseScope(scope)
  const invalidScopes = requestedScopes.filter((s) => !client.allowed_scopes.includes(s))
  if (invalidScopes.length > 0) {
    const errorUrl = new URL(redirectUri)
    errorUrl.searchParams.set("error", "invalid_scope")
    errorUrl.searchParams.set("error_description", `Invalid scopes: ${invalidScopes.join(", ")}`)
    if (state) errorUrl.searchParams.set("state", state)
    return NextResponse.redirect(errorUrl)
  }

  // Check if user is authenticated
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("return_to", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJWT(sessionCookie.value)
  if (!payload) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("return_to", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Generate authorization code
  const code = await createAuthorizationCode({
    clientId,
    userId: payload.sub,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
  })

  // Redirect back to client with authorization code
  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set("code", code)
  if (state) callbackUrl.searchParams.set("state", state)

  return NextResponse.redirect(callbackUrl)
}
