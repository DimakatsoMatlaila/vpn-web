import { type NextRequest, NextResponse } from "next/server"
import { getUser, getUserByUsername } from "@/lib/storage/json-db"
import { verifyPassword } from "@/lib/auth/password"
import type { CTFdAuthResponse } from "@/lib/ctfd/types"

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get("X-CTFd-API-Key")
    const expectedApiKey = process.env.CTFD_API_KEY

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json<CTFdAuthResponse>({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json<CTFdAuthResponse>(
        { success: false, error: "Missing username or password" },
        { status: 400 },
      )
    }

    // Try to find user by username first, then by email
    let user = await getUserByUsername(username)

    if (!user) {
      // Try as email
      let email = username
      if (!username.includes("@")) {
        email = `${username}@students.wits.ac.za`
      }
      user = await getUser(email)
    }

    if (!user) {
      return NextResponse.json<CTFdAuthResponse>({ success: false, error: "User not found" }, { status: 404 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json<CTFdAuthResponse>({ success: false, error: "Invalid password" }, { status: 401 })
    }

    return NextResponse.json<CTFdAuthResponse>({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: "user",
      },
    })
  } catch (error) {
    console.error("CTFd auth verification error:", error)
    return NextResponse.json<CTFdAuthResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
