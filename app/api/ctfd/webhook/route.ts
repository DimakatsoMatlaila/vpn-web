import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import type { CTFdWebhookPayload } from "@/lib/ctfd/types"

// Webhook endpoint for CTFd events
// Useful for syncing user data or tracking challenge completions
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("X-CTFd-Signature")
    const webhookSecret = process.env.CTFD_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const body = await request.text()
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload: CTFdWebhookPayload = JSON.parse(body)

    // Handle different webhook events
    switch (payload.event) {
      case "user.register":
        console.log("CTFd user registered:", payload.data)
        break
      case "user.login":
        console.log("CTFd user logged in:", payload.data)
        break
      case "challenge.solve":
        console.log("Challenge solved:", payload.data)
        // Could update leaderboard, send notifications, etc.
        break
      default:
        console.log("Unknown webhook event:", payload.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("CTFd webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
