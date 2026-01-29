import crypto from "crypto"

export function generateCode(length = 32): string {
  return crypto.randomBytes(length).toString("base64url")
}

export function generateToken(length = 48): string {
  return crypto.randomBytes(length).toString("base64url")
}

export function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: string): boolean {
  if (method === "plain") {
    return codeVerifier === codeChallenge
  }

  if (method === "S256") {
    const hash = crypto.createHash("sha256").update(codeVerifier).digest("base64url")
    return hash === codeChallenge
  }

  return false
}

export function parseScope(scope: string | null): string[] {
  if (!scope) return []
  return scope.split(" ").filter(Boolean)
}

export function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
  return allowedUris.some((allowed) => {
    // Exact match or wildcard subdomain match
    if (allowed === uri) return true
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2)
      const uriUrl = new URL(uri)
      return uriUrl.hostname.endsWith(domain)
    }
    return false
  })
}
