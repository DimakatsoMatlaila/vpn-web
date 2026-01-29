import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/storage/json-db"
import { signJWT } from "@/lib/auth/jwt"
import { createSession } from "@/lib/storage/json-db"

/**
 * Check if a user exists by email and create a session if they do
 * Used during Google sign-in to determine if user should go to dashboard or registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, googleId, name, picture } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists in database
    const user = await getUser(email)

    if (!user) {
      // User doesn't exist, proceed with registration
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    // User exists - log them in automatically
    console.log(`[Auth] User exists: ${email}, logging in automatically`)

    // Create session token
    const sessionToken = await signJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
    })

    // Store session in database
    await createSession({
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    // Set session cookie
    const response = NextResponse.json(
      {
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          hasVpnConfig: !!user.vpnConfig,
        },
      },
      { status: 200 }
    )

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[Auth Check User] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
