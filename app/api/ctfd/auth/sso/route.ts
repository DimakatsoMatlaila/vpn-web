import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth/jwt"
import { createCTFdSSOToken } from "@/lib/ctfd/db"

// Generate SSO token for CTFd login
// User clicks "Login with Wits Cyber" in CTFd, gets redirected here
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const returnUrl = searchParams.get("return_url") || process.env.CTFD_URL

  // Check if user is authenticated
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("return_to", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJWT(sessionCookie.value)
  if (!payload) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("return_to", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Generate SSO token
  const ssoToken = await createCTFdSSOToken(payload.sub, payload.email, payload.name)

  // Redirect to CTFd with SSO token
  const ctfdUrl = new URL("/sso/callback", returnUrl || "")
  ctfdUrl.searchParams.set("token", ssoToken)

  return NextResponse.redirect(ctfdUrl)
}
