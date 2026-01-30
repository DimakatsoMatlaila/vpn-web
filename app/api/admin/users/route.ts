import { type NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/auth/admin"
import { getAllUsers } from "@/lib/storage/json-db"

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const authCheck = await checkAdmin(request)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Get all users
    const users = await getAllUsers()

    // Return sanitized user data (remove sensitive fields)
    const sanitizedUsers = users.map(user => ({
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      total: sanitizedUsers.length,
    })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
