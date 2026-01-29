import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/storage/json-db"

// Endpoint for Active Directory sync
// This provides user data in a format suitable for AD provisioning
export async function GET(request: NextRequest) {
  try {
    // Verify admin API key
    const apiKey = request.headers.get("X-Admin-API-Key")
    const expectedApiKey = process.env.AD_SYNC_API_KEY

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Missing email parameter" }, { status: 400 })
    }

    const user = await getUser(email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data in AD-friendly format
    const username = email.split("@")[0]
    const nameParts = user.name.split(" ")

    return NextResponse.json({
      // AD attributes
      sAMAccountName: username,
      userPrincipalName: email,
      mail: email,
      displayName: user.name,
      givenName: nameParts[0],
      sn: nameParts.slice(1).join(" ") || username, // surname
      cn: user.name, // common name
      // Group membership
      memberOf: ["CN=WitsCyber-Members,OU=Groups,DC=wits,DC=ac,DC=za"],
      // Status
      enabled: true,
      // Note: Password should be synced separately through secure channel
      // or user should reset password on first AD login
    })
  } catch (error) {
    console.error("AD sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Endpoint to verify AD credentials (for AD -> Wits Cyber auth)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-Admin-API-Key")
    const expectedApiKey = process.env.AD_SYNC_API_KEY

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { username, passwordHash } = body

    // Convert username to email if needed
    let email = username
    if (!username.includes("@")) {
      email = `${username}@students.wits.ac.za`
    }

    const user = await getUser(email)
    if (!user) {
      return NextResponse.json({ valid: false, error: "User not found" }, { status: 404 })
    }

    // In production, you'd verify the password hash matches
    // This assumes AD is calling with a pre-hashed password using the same algorithm
    const valid = user.password_hash === passwordHash

    return NextResponse.json({ valid })
  } catch (error) {
    console.error("AD verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
