// In-memory demo store for development/demo mode
// This simulates a database when no real DB is connected

export interface DemoUser {
  id: string
  email: string
  googleId: string
  name: string
  picture: string
  passwordHash: string
  firstName: string
  lastName: string
  username: string
  sex: string
  studentNumber: string
  faculty: string
  yearOfStudy: string
  phoneNumber?: string
  bio?: string
  createdAt: Date
}

export interface DemoToken {
  token: string
  userId: string
  type: "access" | "refresh" | "sso"
  expiresAt: Date
}

export interface DemoOAuthClient {
  clientId: string
  clientSecret: string
  redirectUris: string[]
  name: string
}

// In-memory stores
const users: Map<string, DemoUser> = new Map()
const tokens: Map<string, DemoToken> = new Map()
const authCodes: Map<string, { userId: string; clientId: string; expiresAt: Date; codeChallenge?: string }> = new Map()

// Pre-configured OAuth clients
const oauthClients: Map<string, DemoOAuthClient> = new Map([
  [
    "moodle_client",
    {
      clientId: "moodle_client",
      clientSecret: "moodle_secret_123",
      redirectUris: ["http://localhost:8080/admin/oauth2callback.php", "https://moodle.example.com/callback"],
      name: "Moodle LMS",
    },
  ],
  [
    "ctfd_client",
    {
      clientId: "ctfd_client",
      clientSecret: "ctfd_secret_456",
      redirectUris: ["http://localhost:8000/oauth/callback", "https://ctfd.example.com/callback"],
      name: "CTFd Platform",
    },
  ],
])

// Seed demo user
const demoUser: DemoUser = {
  id: "demo-user-001",
  email: "student@students.wits.ac.za",
  googleId: "demo-123456",
  name: "Demo Student",
  picture: "/student-avatar.png",
  passwordHash: "$2b$10$demo-hash-for-testing", // bcrypt hash placeholder
  firstName: "Demo",
  lastName: "Student",
  username: "demo_student",
  sex: "prefer_not_to_say",
  studentNumber: "1234567",
  faculty: "Science",
  yearOfStudy: "3rd Year",
  phoneNumber: "+27 12 345 6789",
  bio: "Cybersecurity enthusiast and CTF player",
  createdAt: new Date(),
}
users.set(demoUser.email, demoUser)

export const demoStore = {
  // User operations
  getUser: (email: string) => users.get(email),
  getUserById: (id: string) => Array.from(users.values()).find((u) => u.id === id),
  getUserByUsername: (username: string) => Array.from(users.values()).find((u) => u.username === username),
  createUser: (user: DemoUser) => {
    users.set(user.email, user)
    return user
  },
  updateUser: (email: string, data: Partial<DemoUser>) => {
    const user = users.get(email)
    if (user) {
      const updated = { ...user, ...data }
      users.set(email, updated)
      return updated
    }
    return null
  },
  getAllUsers: () => Array.from(users.values()),

  // Token operations
  createToken: (token: DemoToken) => {
    tokens.set(token.token, token)
    return token
  },
  getToken: (token: string) => tokens.get(token),
  deleteToken: (token: string) => tokens.delete(token),

  // Auth code operations
  createAuthCode: (code: string, data: { userId: string; clientId: string; codeChallenge?: string }) => {
    authCodes.set(code, { ...data, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }) // 10 min expiry
    return code
  },
  getAuthCode: (code: string) => {
    const data = authCodes.get(code)
    if (data && data.expiresAt > new Date()) {
      authCodes.delete(code) // One-time use
      return data
    }
    return null
  },

  // OAuth client operations
  getOAuthClient: (clientId: string) => oauthClients.get(clientId),

  // Check if demo mode
  isDemoMode: () => {
    const demoMode = process.env.DEMO_MODE
    if (demoMode === 'false') return false
    if (demoMode === 'true') return true
    // ERROR: DEMO_MODE must be explicitly set
    throw new Error(
      'DEMO_MODE environment variable is not set! Set DEMO_MODE=true or DEMO_MODE=false in .env.local'
    )
  },
}
