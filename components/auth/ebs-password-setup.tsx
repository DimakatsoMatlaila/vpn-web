"use client"

import type React from "react"
import { useState } from "react"
import type { GoogleUser } from "./ebs-register-card"

interface EBSPasswordSetupProps {
  user: GoogleUser
  onComplete: () => void
}

export function EBSPasswordSetup({ user, onComplete }: EBSPasswordSetupProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const allMet = requirements.every((r) => r.met)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allMet || !passwordsMatch) {
      setError("Please meet all password requirements")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password,
          googleId: user.sub,
          name: user.name,
          picture: user.picture,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to register")
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* User Info */}
      <div className="ebs-inset p-3">
        <table className="w-full text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 pr-4 text-right font-bold w-28">Email:</td>
              <td className="py-1 font-mono">{user.email}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-right font-bold">Name:</td>
              <td className="py-1">{user.name}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Password Fields */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold w-32 text-right">Password: *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ebs-input flex-1"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold w-32 text-right">Confirm: *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="ebs-input flex-1"
            required
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Password Requirements</div>
        <div className="grid grid-cols-2 gap-1">
          {requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px]">
              <span className={req.met ? "text-green-600" : "text-red-600"}>{req.met ? "✓" : "✗"}</span>
              <span className={req.met ? "text-green-700" : "text-muted-foreground"}>{req.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-[10px]">
            <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>{passwordsMatch ? "✓" : "✗"}</span>
            <span className={passwordsMatch ? "text-green-700" : "text-muted-foreground"}>Passwords match</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#ffcccc] border border-[#cc0000] p-2 text-[10px] text-[#cc0000]">Error: {error}</div>
      )}

      <div className="flex gap-2 pt-2 border-t border-[#808080]">
        <button type="submit" className="ebs-button" disabled={!allMet || !passwordsMatch || isLoading}>
          {isLoading ? "Processing..." : "Continue"}
        </button>
        <button type="button" className="ebs-button">
          Back
        </button>
      </div>
    </form>
  )
}
