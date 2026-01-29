// JSON file-based database for production use
// All data is stored in JSON files for easy backup and syncing

import fs from 'fs/promises'
import path from 'path'

export interface User {
  id: string
  email: string
  googleId: string
  name: string
  picture: string
  passwordHash: string
  firstName?: string
  lastName?: string
  username?: string
  sex?: string
  studentNumber?: string
  faculty?: string
  yearOfStudy?: string
  phoneNumber?: string
  bio?: string
  vpnConfigPath?: string
  vpnAssignedIp?: string
  createdAt: string
  updatedAt: string
}

export interface OAuthClient {
  id: string
  clientId: string
  clientSecret: string
  name: string
  redirectUris: string[]
  allowedScopes: string[]
  createdAt: string
}

export interface OAuthAuthorizationCode {
  id: string
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  codeChallenge?: string
  codeChallengeMethod?: string
  expiresAt: string
  createdAt: string
}

export interface OAuthAccessToken {
  id: string
  token: string
  clientId: string
  userId: string
  scope: string
  expiresAt: string
  createdAt: string
}

export interface OAuthRefreshToken {
  id: string
  token: string
  accessTokenId: string
  expiresAt: string
  createdAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

interface Database {
  users: User[]
  oauthClients: OAuthClient[]
  oauthAuthorizationCodes: OAuthAuthorizationCode[]
  oauthAccessTokens: OAuthAccessToken[]
  oauthRefreshTokens: OAuthRefreshToken[]
  sessions: Session[]
}

// Data directory path
const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'database.json')

// Initialize database structure
const initDatabase = (): Database => ({
  users: [],
  oauthClients: [
    {
      id: crypto.randomUUID(),
      clientId: 'moodle_client',
      clientSecret: process.env.MOODLE_CLIENT_SECRET || 'moodle_secret_change_in_production',
      name: 'Moodle LMS',
      redirectUris: [
        'http://localhost:8080/admin/oauth2callback.php',
        'https://moodle.witscyber.co.za/admin/oauth2callback.php',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      clientId: 'ctfd_client',
      clientSecret: process.env.CTFD_CLIENT_SECRET || 'ctfd_secret_change_in_production',
      name: 'CTFd Platform',
      redirectUris: [
        'http://localhost:8000/oauth/callback',
        'https://ctfd.witscyber.co.za/oauth/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      createdAt: new Date().toISOString(),
    },
  ],
  oauthAuthorizationCodes: [],
  oauthAccessTokens: [],
  oauthRefreshTokens: [],
  sessions: [],
})

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create data directory:', error)
  }
}

// Read database from file
async function readDatabase(): Promise<Database> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return initialized database
    const db = initDatabase()
    await writeDatabase(db)
    return db
  }
}

// Write database to file
async function writeDatabase(db: Database): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

// User operations
export async function createUser(data: {
  googleId: string
  email: string
  name: string
  picture: string
  passwordHash: string
}): Promise<User> {
  const db = await readDatabase()
  
  const user: User = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  db.users.push(user)
  await writeDatabase(db)
  
  return user
}

export async function getUser(email: string): Promise<User | null> {
  const db = await readDatabase()
  return db.users.find((u) => u.email === email) || null
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await readDatabase()
  return db.users.find((u) => u.id === id) || null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await readDatabase()
  return db.users.find((u) => u.username === username) || null
}

export async function updateUserProfile(
  email: string,
  data: Partial<Omit<User, 'id' | 'email' | 'googleId' | 'createdAt'>>
): Promise<User | null> {
  const db = await readDatabase()
  const userIndex = db.users.findIndex((u) => u.email === email)
  
  if (userIndex === -1) return null
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  await writeDatabase(db)
  return db.users[userIndex]
}

export async function updateUserVpnConfig(
  email: string,
  vpnConfigPath: string,
  vpnAssignedIp: string
): Promise<User | null> {
  return updateUserProfile(email, { vpnConfigPath, vpnAssignedIp })
}

// OAuth Client operations
export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  const db = await readDatabase()
  return db.oauthClients.find((c) => c.clientId === clientId) || null
}

export async function verifyOAuthClient(
  clientId: string,
  clientSecret: string
): Promise<OAuthClient | null> {
  const db = await readDatabase()
  const client = db.oauthClients.find((c) => c.clientId === clientId)
  
  if (!client || client.clientSecret !== clientSecret) {
    return null
  }
  
  return client
}

// OAuth Authorization Code operations
export async function createAuthorizationCode(data: {
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  codeChallenge?: string
  codeChallengeMethod?: string
  expiresAt: Date
}): Promise<OAuthAuthorizationCode> {
  const db = await readDatabase()
  
  const authCode: OAuthAuthorizationCode = {
    id: crypto.randomUUID(),
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }
  
  db.oauthAuthorizationCodes.push(authCode)
  await writeDatabase(db)
  
  return authCode
}

export async function getAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null> {
  const db = await readDatabase()
  return db.oauthAuthorizationCodes.find((c) => c.code === code) || null
}

export async function deleteAuthorizationCode(code: string): Promise<void> {
  const db = await readDatabase()
  db.oauthAuthorizationCodes = db.oauthAuthorizationCodes.filter((c) => c.code !== code)
  await writeDatabase(db)
}

// OAuth Access Token operations
export async function createAccessToken(data: {
  token: string
  clientId: string
  userId: string
  scope: string
  expiresAt: Date
}): Promise<OAuthAccessToken> {
  const db = await readDatabase()
  
  const accessToken: OAuthAccessToken = {
    id: crypto.randomUUID(),
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }
  
  db.oauthAccessTokens.push(accessToken)
  await writeDatabase(db)
  
  return accessToken
}

export async function getAccessToken(token: string): Promise<OAuthAccessToken | null> {
  const db = await readDatabase()
  return db.oauthAccessTokens.find((t) => t.token === token) || null
}

// OAuth Refresh Token operations
export async function createRefreshToken(data: {
  token: string
  accessTokenId: string
  expiresAt: Date
}): Promise<OAuthRefreshToken> {
  const db = await readDatabase()
  
  const refreshToken: OAuthRefreshToken = {
    id: crypto.randomUUID(),
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }
  
  db.oauthRefreshTokens.push(refreshToken)
  await writeDatabase(db)
  
  return refreshToken
}

export async function getRefreshToken(token: string): Promise<OAuthRefreshToken | null> {
  const db = await readDatabase()
  return db.oauthRefreshTokens.find((t) => t.token === token) || null
}

// Session operations
export async function createSession(data: {
  userId: string
  token: string
  expiresAt: Date
}): Promise<Session> {
  const db = await readDatabase()
  
  const session: Session = {
    id: crypto.randomUUID(),
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }
  
  db.sessions.push(session)
  await writeDatabase(db)
  
  return session
}

export async function getSession(token: string): Promise<Session | null> {
  const db = await readDatabase()
  return db.sessions.find((s) => s.token === token) || null
}

export async function deleteSession(token: string): Promise<void> {
  const db = await readDatabase()
  db.sessions = db.sessions.filter((s) => s.token !== token)
  await writeDatabase(db)
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const db = await readDatabase()
  db.oauthRefreshTokens = db.oauthRefreshTokens.filter((t) => t.token !== token)
  await writeDatabase(db)
}

// Cleanup expired tokens and codes
export async function cleanupExpired(): Promise<void> {
  const db = await readDatabase()
  const now = new Date().toISOString()
  
  db.oauthAuthorizationCodes = db.oauthAuthorizationCodes.filter((c) => c.expiresAt > now)
  db.oauthAccessTokens = db.oauthAccessTokens.filter((t) => t.expiresAt > now)
  db.oauthRefreshTokens = db.oauthRefreshTokens.filter((t) => t.expiresAt > now)
  db.sessions = db.sessions.filter((s) => s.expiresAt > now)
  
  await writeDatabase(db)
}
