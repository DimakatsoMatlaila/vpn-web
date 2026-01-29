export interface CTFdUser {
  id: string
  name: string
  email: string
  password: string // Plaintext for CTFd internal hashing
  type: "user" | "admin"
  verified: boolean
  hidden: boolean
  banned: boolean
  website?: string
  affiliation?: string
  country?: string
}

export interface CTFdAuthRequest {
  username: string
  password: string
}

export interface CTFdAuthResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
    type: string
  }
  error?: string
}

export interface CTFdSSOToken {
  token: string
  user_id: string
  email: string
  name: string
  expires_at: Date
}

export interface CTFdWebhookPayload {
  event: "user.register" | "user.login" | "user.update" | "challenge.solve"
  data: Record<string, unknown>
  timestamp: string
}
