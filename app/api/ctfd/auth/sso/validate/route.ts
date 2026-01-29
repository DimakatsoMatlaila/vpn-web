import { type NextRequest, NextResponse } from "next/server"
import { getCTFdSSOToken, deleteCTFdSSOToken } from "@/lib/ctfd/db"

// CTFd calls this endpoint to validate the SSO token
export async function POST(request: NextRequest) {
  try {
    // Verify API key from CTFd
    const apiKey = request.headers.get("X-CTFd-API-Key")
    const expectedApiKey = process.env.CTFD_API_KEY

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 })
    }

    // Get and validate SSO token
    const ssoToken = await getCTFdSSOToken(token)
    if (!ssoToken) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Delete token (one-time use)
    await deleteCTFdSSOToken(token)

    return NextResponse.json({
      success: true,
      user: {
        id: ssoToken.user_id,
        email: ssoToken.email,
        name: ssoToken.name,
        type: "user",
        verified: true,
      },
    })
  } catch (error) {
    console.error("CTFd SSO validation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
