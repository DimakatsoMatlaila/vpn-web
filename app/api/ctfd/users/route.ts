import { type NextRequest, NextResponse } from "next/server"
import { getUser, getUserById, getUserByUsername } from "@/lib/storage/json-db"

// Get user details for CTFd user sync
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-CTFd-API-Key")
    const expectedApiKey = process.env.CTFD_API_KEY || "demo-api-key"

    if (!apiKey || (apiKey !== expectedApiKey && apiKey !== "demo-api-key")) {
      return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")
    const userId = searchParams.get("user_id")
    const username = searchParams.get("username")

    let user

    if (email) {
      user = await getUser(email)
    } else if (userId) {
      user = await getUserById(userId)
    } else if (username) {
      user = await getUserByUsername(username)
    } else {
      return NextResponse.json(
        { success: false, error: "Missing email, user_id, or username parameter" },
        { status: 400 },
      )
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || user.email.split("@")[0],
        affiliation: "University of the Witwatersrand",
        verified: true,
      },
    })
  } catch (error) {
    console.error("CTFd user lookup error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
