import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { getUserById } from "@/lib/storage/json-db"

const ADMIN_EMAIL = "2555500@students.wits.ac.za"

/**
 * Middleware to check if user is admin
 */
export async function checkAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value
  if (!sessionToken) {
    return { error: "Not authenticated", status: 401 }
  }

  const payload = await verifyJWT(sessionToken)
  if (!payload || !payload.sub) {
    return { error: "Invalid session", status: 401 }
  }

  const user = await getUserById(payload.sub as string)
  if (!user) {
    return { error: "User not found", status: 404 }
  }

  if (user.email !== ADMIN_EMAIL) {
    return { error: "Unauthorized. Admin access required.", status: 403 }
  }

  return { user, admin: true }
}

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL
}
