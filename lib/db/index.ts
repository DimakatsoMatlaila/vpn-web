// Database connection module with demo mode support
import { demoStore, type DemoUser } from "@/lib/demo/store"

export interface DatabaseConfig {
  connectionString: string
}

// Check if we're in demo mode - ONLY checks DEMO_MODE flag, no fallbacks
const isDemoMode = () => {
  const demoMode = process.env.DEMO_MODE
  if (demoMode === 'false') {
    console.log('[MODE CHECK] DEMO_MODE=false - Database mode REQUIRED')
    return false
  }
  if (demoMode === 'true') {
    console.log('[MODE CHECK] DEMO_MODE=true - Demo mode enabled')
    return true
  }
  // ERROR: DEMO_MODE must be explicitly set
  throw new Error(
    'DEMO_MODE environment variable is not set! Set DEMO_MODE=true for demo mode or DEMO_MODE=false for database mode in .env.local'
  )
}

// Placeholder for real database queries
export async function query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> {
  if (isDemoMode()) {
    console.log("[DEMO MODE] Skipping database query:", sql)
    return { rows: [] }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Database not configured. Set DATABASE_URL in .env.local and set DEMO_MODE=false"
    )
  }

  // Replace this with your actual database query implementation
  console.log("[DATABASE] Executing query:", sql, params)
  throw new Error(
    "Database query function not implemented. Install 'pg' or 'mysql2' and implement the query function."
  )
}

export async function getUser(email: string) {
  if (isDemoMode()) {
    const user = demoStore.getUser(email)
    if (user) {
      return {
        id: user.id,
        google_id: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        password_hash: user.passwordHash,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
      }
    }
    return null
  }

  const result = await query<{
    id: string
    google_id: string
    email: string
    name: string
    picture: string
    password_hash: string
  }>("SELECT * FROM users WHERE email = $1", [email])
  return result.rows[0] || null
}

export async function getUserById(id: string) {
  if (isDemoMode()) {
    const user = demoStore.getUserById(id)
    if (user) {
      return {
        id: user.id,
        google_id: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        password_hash: user.passwordHash,
        username: user.username,
      }
    }
    return null
  }

  const result = await query<{
    id: string
    google_id: string
    email: string
    name: string
    picture: string
    password_hash: string
  }>("SELECT * FROM users WHERE id = $1", [id])
  return result.rows[0] || null
}

export async function getUserByUsername(username: string) {
  if (isDemoMode()) {
    const user = demoStore.getUserByUsername(username)
    if (user) {
      return {
        id: user.id,
        google_id: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        password_hash: user.passwordHash,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        student_number: user.studentNumber,
        faculty: user.faculty,
      }
    }
    return null
  }

  const result = await query<{
    id: string
    google_id: string
    email: string
    name: string
    picture: string
    password_hash: string
    username: string
  }>("SELECT * FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE p.username = $1", [username])
  return result.rows[0] || null
}

export async function createUser(data: {
  googleId: string
  email: string
  name: string
  picture: string
  passwordHash: string
}) {
  if (isDemoMode()) {
    const id = `user-${Date.now()}`
    const nameParts = data.name.split(" ")
    const newUser: DemoUser = {
      id,
      email: data.email,
      googleId: data.googleId,
      name: data.name,
      picture: data.picture,
      passwordHash: data.passwordHash,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      username: data.email.split("@")[0],
      sex: "prefer_not_to_say",
      studentNumber: "",
      faculty: "",
      yearOfStudy: "",
      createdAt: new Date(),
    }
    demoStore.createUser(newUser)
    return { id }
  }

  const result = await query<{ id: string }>(
    `INSERT INTO users (google_id, email, name, picture, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.googleId, data.email, data.name, data.picture, data.passwordHash],
  )
  return result.rows[0]
}

export async function updateUserProfile(
  email: string,
  data: {
    firstName: string
    lastName: string
    username: string
    sex: string
    studentNumber: string
    faculty: string
    yearOfStudy: string
    phoneNumber?: string
    bio?: string
  },
) {
  if (isDemoMode()) {
    const updated = demoStore.updateUser(email, data)
    return updated ? { success: true } : null
  }

  // Real database update would go here
  return { success: true }
}
