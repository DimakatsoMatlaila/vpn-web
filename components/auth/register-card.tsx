"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleSignInButton } from "./google-sign-in-button"
import { PasswordSetupForm } from "./password-setup-form"
import { ProfileSetupForm } from "./profile-setup-form"
import { RegistrationSuccess } from "./registration-success"
import { CheckCircle2 } from "lucide-react"

export type RegistrationStep = "google" | "password" | "profile" | "success"

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

export function RegisterCard() {
  const [step, setStep] = useState<RegistrationStep>("google")
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const handleGoogleSuccess = (user: GoogleUser) => {
    if (!user.email.endsWith("@students.wits.ac.za")) {
      alert("Please sign in with your @students.wits.ac.za email address.")
      return
    }
    setGoogleUser(user)
    setStep("password")
  }

  const handlePasswordComplete = () => {
    setStep("profile")
  }

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile)
    setStep("success")
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
        return 4
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="space-y-1">
        {step !== "success" && (
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    getStepNumber() > num
                      ? "bg-primary text-primary-foreground"
                      : getStepNumber() === num
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {getStepNumber() > num ? <CheckCircle2 className="h-4 w-4" /> : num}
                </div>
                {num < 3 && <div className={`w-8 h-0.5 ${getStepNumber() > num ? "bg-primary" : "bg-secondary"}`} />}
              </div>
            ))}
          </div>
        )}
        <CardTitle className="text-2xl text-foreground">
          {step === "google" && "Create your account"}
          {step === "password" && "Set your password"}
          {step === "profile" && "Complete your profile"}
          {step === "success" && "Welcome to Wits Cyber!"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === "google" && "Sign in with your Wits student email to get started"}
          {step === "password" && "This password will be used for CTFd and AD login"}
          {step === "profile" && "Tell us a bit about yourself"}
          {step === "success" && "Your account has been created successfully"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "google" && <GoogleSignInButton onSuccess={handleGoogleSuccess} />}
        {step === "password" && googleUser && (
          <PasswordSetupForm user={googleUser} onComplete={handlePasswordComplete} />
        )}
        {step === "profile" && googleUser && <ProfileSetupForm user={googleUser} onComplete={handleProfileComplete} />}
        {step === "success" && googleUser && userProfile && (
          <RegistrationSuccess user={googleUser} profile={userProfile} />
        )}
      </CardContent>
    </Card>
  )
}
