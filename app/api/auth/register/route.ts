import { type NextRequest, NextResponse } from "next/server"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { signJWT } from "@/lib/auth/jwt"
import { createUser, getUser } from "@/lib/storage/json-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleId, email, name, picture, password } = body

    // Validate required fields
    if (!googleId || !email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate Wits student email
    if (!email.endsWith("@students.wits.ac.za")) {
      return NextResponse.json({ error: "Only @students.wits.ac.za emails are allowed" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.errors.join(", ") }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUser(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await createUser({
      googleId,
      email,
      name,
      picture: picture || "/student-avatar.png",
      passwordHash,
    })

    // Generate session token
    const token = await signJWT({
      sub: user.id,
      email,
      name,
    })

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email, name },
    })

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
