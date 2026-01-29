import { type NextRequest, NextResponse } from "next/server"
import { getAccessToken } from "@/lib/storage/json-db"
import { getUserById } from "@/lib/storage/json-db"
import { parseScope } from "@/lib/oauth/utils"
import type { UserInfoResponse } from "@/lib/oauth/types"

export async function GET(request: NextRequest) {
  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "invalid_token",
        error_description: "Missing or invalid Authorization header",
      },
      { status: 401 },
    )
  }

  const token = authHeader.slice(7)

  // Validate access token
  const accessToken = await getAccessToken(token)
  if (!accessToken) {
    return NextResponse.json(
      {
        error: "invalid_token",
        error_description: "Invalid or expired access token",
      },
      { status: 401 },
    )
  }

  // Get user info
  const user = await getUserById(accessToken.user_id)
  if (!user) {
    return NextResponse.json(
      {
        error: "invalid_token",
        error_description: "User not found",
      },
      { status: 401 },
    )
  }

  // Build response based on scope
  const scopes = parseScope(accessToken.scope)

  const response: UserInfoResponse = {
    sub: user.id,
    email: user.email,
    email_verified: true,
    name: user.name,
  }

  // Add optional claims based on scope
  if (scopes.includes("profile")) {
    const nameParts = user.name.split(" ")
    response.given_name = nameParts[0]
    response.family_name = nameParts.slice(1).join(" ") || undefined
    response.picture = user.picture || undefined
    response.preferred_username = user.username || user.email.split("@")[0]
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
