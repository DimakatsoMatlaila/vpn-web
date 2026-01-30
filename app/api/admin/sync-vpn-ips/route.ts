import { type NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/auth/admin"
import { getAllUsers, updateUserVpnConfig } from "@/lib/storage/json-db"

/**
 * Sync VPN IPs from backend vpn-users.json to database
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const authCheck = await checkAdmin(request)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const backendUrl = process.env.VPN_BACKEND_URL || 'http://localhost:3001'
    
    // Fetch vpn-users.json from backend
    const response = await fetch(`${backendUrl}/api/admin/vpn-users`, {
      method: 'GET',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch VPN users from backend' },
        { status: 500 }
      )
    }

    const vpnUsers = await response.json()
    const users = await getAllUsers()
    
    let updatedCount = 0
    let errors = []

    // Update each user's VPN IP
    for (const vpnUser of vpnUsers) {
      const user = users.find(u => u.email === vpnUser.email)
      if (user && user.vpnConfigPath) {
        try {
          await updateUserVpnConfig(user.email, user.vpnConfigPath, vpnUser.vpn_ip)
          updatedCount++
          console.log(`[Admin] Updated VPN IP for ${user.email}: ${vpnUser.vpn_ip}`)
        } catch (err) {
          errors.push({ email: vpnUser.email, error: err.message })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} VPN IP addresses`,
      updatedCount,
      totalVpnUsers: vpnUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("VPN IP sync error:", error)
    return NextResponse.json({ error: "Failed to sync VPN IPs" }, { status: 500 })
  }
}
