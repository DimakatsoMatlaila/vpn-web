import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { getUserById, updateUserVpnConfig } from "@/lib/storage/json-db"
import { requestVpnProfile, saveVpnProfileToStorage } from "@/lib/vpn/backend-api"
import fs from "fs/promises"

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

    // Check if user already has VPN config
    if (user.vpnConfigPath) {
      try {
        const vpnContent = await fs.readFile(user.vpnConfigPath, "utf-8")
        const fileName = `${user.email.split("@")[0]}.ovpn`

        return new NextResponse(vpnContent, {
          headers: {
            "Content-Type": "application/x-openvpn-profile",
            "Content-Disposition": `attachment; filename="${fileName}"`,
          },
        })
      } catch (error) {
        console.error("[VPN] Error reading existing VPN file:", error)
        // Continue to request new profile from backend
      }
    }

    // Request new VPN profile from backend
    const vpnResponse = await requestVpnProfile(user.email)

    if (!vpnResponse.success || !vpnResponse.ovpnFile) {
      return NextResponse.json(
        { error: vpnResponse.error || "Failed to provision VPN profile" },
        { status: 500 }
      )
    }

    // Save VPN profile to storage
    const filePath = await saveVpnProfileToStorage(
      user.email,
      vpnResponse.ovpnFile,
      vpnResponse.fileName || `${user.email.split("@")[0]}.ovpn`
    )

    // Update user record with VPN config path
    await updateUserVpnConfig(user.email, filePath, vpnResponse.assignedIp || "")

    // Return the VPN profile file
    const vpnContent = Buffer.from(vpnResponse.ovpnFile, "base64").toString("utf-8")

    return new NextResponse(vpnContent, {
      headers: {
        "Content-Type": "application/x-openvpn-profile",
        "Content-Disposition": `attachment; filename="${vpnResponse.fileName || "client.ovpn"}"`,
      },
    })
  } catch (error) {
    console.error("VPN profile request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
