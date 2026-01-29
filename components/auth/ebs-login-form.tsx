"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EBSLoginFormProps {
  onLoginSuccess: () => void
  onSwitchToRegister: () => void
}

export function EBSLoginForm({ onLoginSuccess, onSwitchToRegister }: EBSLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ebs-fieldset">
      <div className="text-xs font-bold mb-3 text-[#003399]">Returning Student</div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-2 border-red-600">
            <AlertDescription className="text-[11px]">{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="ebs-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ebs-input"
            placeholder="student@students.wits.ac.za"
            required
          />
        </div>

        <div>
          <label className="ebs-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ebs-input"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="ebs-button w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="pt-3 border-t border-[#808080] text-center">
          <p className="text-[10px] text-muted-foreground mb-2">New to Wits Cyber?</p>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="ebs-button w-full"
          >
            Create New Account
          </button>
        </div>
      </form>
    </div>
  )
}
