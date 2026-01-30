"use client"

import { useEffect, useState } from "react"
import { EBSVpnDownload } from "./ebs-vpn-download"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserProfile {
  id: string
  email: string
  name: string
  username?: string
  firstName?: string
  lastName?: string
  studentNumber?: string
  faculty?: string
  yearOfStudy?: string
  phoneNumber?: string
  bio?: string
  picture?: string
  hasVpnConfig: boolean
  vpnAssignedIp?: string
}

interface EBSProfileDashboardProps {
  onLogout: () => void
}

export function EBSProfileDashboard({ onLogout }: EBSProfileDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load profile")
      }

      const data = await response.json()
      setProfile(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    // Clear session cookie
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    onLogout()
  }

  if (loading) {
    return (
      <div className="ebs-fieldset">
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[11px] text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="ebs-fieldset">
        <Alert variant="destructive" className="border-2 border-red-600">
          <AlertDescription className="text-[11px]">
            {error || "Failed to load profile"}
          </AlertDescription>
        </Alert>
        <button onClick={handleLogout} className="ebs-button w-full mt-3">
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Welcome Message */}
      <div className="bg-[#90EE90] border-2 border-[#228B22] p-3 flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <div className="font-bold text-[12px]">Welcome back, {profile.firstName || profile.name}!</div>
          <div className="text-[10px]">Your account is active and ready to use.</div>
        </div>
      </div>

      {/* Admin Access */}
      {profile.email === "2555500@students.wits.ac.za" && (
        <div className="bg-[#FFD700] border-2 border-[#FF8C00] p-3 flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            <div className="font-bold text-[12px]">Administrator Access</div>
            <div className="text-[10px]">You have admin privileges</div>
          </div>
          <a 
            href="/admin"
            className="ebs-button text-[10px] px-3 py-1"
          >
            Admin Dashboard
          </a>
        </div>
      )}

      {/* Account Details */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Your Profile</div>
        <div className="ebs-inset p-3">
          <table className="w-full text-[11px]">
            <tbody>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold w-32">Email:</td>
                <td className="py-2 font-mono">{profile.email}</td>
              </tr>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold">Name:</td>
                <td className="py-2">
                  {profile.firstName} {profile.lastName}
                </td>
              </tr>
              {profile.username && (
                <tr className="border-b border-[#c0c0c0]">
                  <td className="py-2 pr-4 font-bold">Username:</td>
                  <td className="py-2 font-mono">{profile.username}</td>
                </tr>
              )}
              {profile.studentNumber && (
                <tr className="border-b border-[#c0c0c0]">
                  <td className="py-2 pr-4 font-bold">Student No:</td>
                  <td className="py-2 font-mono">{profile.studentNumber}</td>
                </tr>
              )}
              {profile.faculty && (
                <tr className="border-b border-[#c0c0c0]">
                  <td className="py-2 pr-4 font-bold">Faculty:</td>
                  <td className="py-2">{profile.faculty}</td>
                </tr>
              )}
              {profile.yearOfStudy && (
                <tr>
                  <td className="py-2 pr-4 font-bold">Year:</td>
                  <td className="py-2">{profile.yearOfStudy}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VPN Access */}
      <EBSVpnDownload />

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[#808080]">
        <button className="ebs-button flex-1" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
