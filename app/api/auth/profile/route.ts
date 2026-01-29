import { type NextRequest, NextResponse } from "next/server"
import { updateUserProfile, getUserByUsername } from "@/lib/storage/json-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      email,
      googleId,
      firstName,
      lastName,
      username,
      sex,
      studentNumber,
      faculty,
      yearOfStudy,
      phoneNumber,
      bio,
    } = body

    // Validate required fields
    if (!email || !googleId || !firstName || !lastName || !username || !studentNumber || !faculty || !yearOfStudy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "Invalid username format", field: "username" }, { status: 400 })
    }

    // Validate student number
    if (!/^\d{7}$/.test(studentNumber)) {
      return NextResponse.json({ error: "Invalid student number", field: "studentNumber" }, { status: 400 })
    }

    // Check if username is already taken
    const existingUsername = await getUserByUsername(username)
    if (existingUsername && existingUsername.email !== email) {
      return NextResponse.json({ error: "Username already taken", field: "username" }, { status: 409 })
    }

    // Update user profile
    await updateUserProfile(email, {
      firstName,
      lastName,
      username,
      sex,
      studentNumber,
      faculty,
      yearOfStudy,
      phoneNumber,
      bio,
    })

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      data: {
        email,
        username,
        firstName,
        lastName,
      },
    })
  } catch (error) {
    console.error("Profile save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
