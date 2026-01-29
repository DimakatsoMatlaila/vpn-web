import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { getUserById } from "@/lib/storage/json-db"

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const sessionToken = request.cookies.get("session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyJWT(sessionToken)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = await getUserById(payload.sub as string)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        studentNumber: user.studentNumber,
        faculty: user.faculty,
        yearOfStudy: user.yearOfStudy,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        picture: user.picture,
        hasVpnConfig: !!user.vpnConfigPath,
        vpnAssignedIp: user.vpnAssignedIp,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
