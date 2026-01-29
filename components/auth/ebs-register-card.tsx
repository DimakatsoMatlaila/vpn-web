"use client"

import { useState, useEffect } from "react"
import { EBSGoogleSignIn } from "./ebs-google-sign-in"
import { EBSPasswordSetup } from "./ebs-password-setup"
import { EBSProfileSetup } from "./ebs-profile-setup"
import { EBSRegistrationSuccess } from "./ebs-registration-success"
import { EBSProfileDashboard } from "./ebs-profile-dashboard"

export type RegistrationStep = "google" | "password" | "profile" | "success" | "dashboard"

export interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

export interface UserProfile {
  firstName: string
  lastName: string
  username: string
  sex: "male" | "female" | "other" | "prefer_not_to_say"
  studentNumber: string
  faculty: string
  yearOfStudy: string
  phoneNumber?: string
  bio?: string
}

export function EBSRegisterCard() {
  const [step, setStep] = useState<RegistrationStep>("google")
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        // User is already logged in
        setStep("dashboard")
      }
    } catch (error) {
      // Not logged in, show Google sign-in
    }
  }

  // Check for Google OAuth callback data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleUserData = params.get("google_user")
    const error = params.get("error")

    if (error) {
      alert(`Authentication error: ${error}`)
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname)
      return
    }

    if (googleUserData) {
      try {
        // Decode base64url encoded user data
        const decoded = atob(googleUserData.replace(/-/g, "+").replace(/_/g, "/"))
        const user: GoogleUser = JSON.parse(decoded)
        
        console.log("[Google OAuth] Received user data:", user)
        handleGoogleSuccess(user)
        
        // Clear URL params
        window.history.replaceState({}, "", window.location.pathname)
      } catch (err) {
        console.error("[Google OAuth] Failed to parse user data:", err)
        alert("Failed to process Google authentication")
      }
    }
  }, [])

  const handleGoogleSuccess = (user: GoogleUser) => {
    if (!user.email.endsWith("@students.wits.ac.za")) {
      alert("Error: Please sign in with your @students.wits.ac.za email address.")
      return
    }
    setGoogleUser(user)
    // Check if user already exists in database
    checkExistingUser(user)
  }

  const checkExistingUser = async (user: GoogleUser) => {
    try {
      // Check if user exists in database by email
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: user.email,
          googleId: user.sub,
          name: user.name,
          picture: user.picture,
        }),
      })

      const data = await response.json()

      if (data.exists) {
        // User exists - they're now logged in, go to dashboard
        console.log("[Registration] Existing user detected, redirecting to dashboard")
        setStep("dashboard")
      } else {
        // New user, continue with password setup
        console.log("[Registration] New user, proceeding with registration")
        setStep("password")
      }
    } catch (error) {
      console.error("[Registration] Error checking user:", error)
      // On error, assume new user and continue with registration
      setStep("password")
    }
  }

  const handlePasswordComplete = () => {
    setStep("profile")
  }

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile)
    setStep("success")
  }

  const handleLogout = () => {
    setStep("google")
    setGoogleUser(null)
    setUserProfile(null)
  }

  const getStepNumber = () => {
    switch (step) {
      case "google":
        return 1
      case "password":
        return 2
      case "profile":
        return 3
      case "success":
      case "dashboard":
        return 4
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Indicator - hide for dashboard and success */}
      {step !== "dashboard" && step !== "success" && (
        <div className="ebs-fieldset">
          <div className="text-[10px] font-bold text-[#003399] mb-2">Registration Progress</div>
          <div className="flex items-center justify-between">
            <StepIndicator num={1} label="Google Sign-In" current={getStepNumber()} />
            <div className="flex-1 border-t border-[#808080] mx-2 mt-[-10px]"></div>
            <StepIndicator num={2} label="Password" current={getStepNumber()} />
            <div className="flex-1 border-t border-[#808080] mx-2 mt-[-10px]"></div>
            <StepIndicator num={3} label="Profile" current={getStepNumber()} />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-3">
          {step === "dashboard" && "Your Dashboard"}
          {step === "google" && "Step 1: Google Authentication"}
          {step === "password" && "Step 2: Password Configuration"}
          {step === "profile" && "Step 3: Profile Information"}
          {step === "success" && "Registration Complete"}
        </div>

        {step === "dashboard" && <EBSProfileDashboard onLogout={handleLogout} />}
        {step === "google" && <EBSGoogleSignIn onSuccess={handleGoogleSuccess} />}
        {step === "password" && googleUser && (
          <EBSPasswordSetup user={googleUser} onComplete={handlePasswordComplete} />
        )}
        {step === "profile" && googleUser && <EBSProfileSetup user={googleUser} onComplete={handleProfileComplete} />}
        {step === "success" && googleUser && userProfile && (
          <EBSRegistrationSuccess user={googleUser} profile={userProfile} />
        )}
      </div>
    </div>
  )
}

function StepIndicator({ num, label, current }: { num: number; label: string; current: number }) {
  const isComplete = current > num
  const isCurrent = current === num

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold border
          ${
            isComplete
              ? "bg-[#003399] text-white border-[#003399]"
              : isCurrent
                ? "bg-[#ffc000] text-black border-[#808080]"
                : "bg-[#c0c0c0] text-[#808080] border-[#808080]"
          }`}
      >
        {isComplete ? "✓" : num}
      </div>
      <span className={`text-[9px] mt-1 ${isCurrent ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
    </div>
  )
}
