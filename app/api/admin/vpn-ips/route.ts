import { type NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/auth/admin"

/**
 * Get VPN user data from the backend cert-issuer
 * Returns array of users with their VPN IPs
 */
export async function GET(request: NextRequest) {
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
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[VPN Query] Backend returned error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch VPN users from backend' },
        { status: response.status }
      )
    }

    const vpnUsers = await response.json()

    // Create a map of email -> vpn_ip for easy lookup
    const vpnIpMap: Record<string, string> = {}
    vpnUsers.forEach((user: any) => {
      if (user.email && user.vpn_ip) {
        vpnIpMap[user.email] = user.vpn_ip
      }
    })

    console.log(`[VPN Query] Retrieved ${vpnUsers.length} VPN users from backend`)

    return NextResponse.json({
      success: true,
      vpnUsers: vpnUsers,
      vpnIpMap: vpnIpMap,
      total: vpnUsers.length,
    })
  } catch (error) {
    console.error("[VPN Query] Error:", error)
    return NextResponse.json(
      { error: "Failed to query VPN IPs from backend" },
      { status: 500 }
    )
  }
}
