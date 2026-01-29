"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, GraduationCap, Phone } from "lucide-react"
import type { GoogleUser, UserProfile } from "./register-card"

interface ProfileSetupFormProps {
  user: GoogleUser
  onComplete: (profile: UserProfile) => void
}

const FACULTIES = [
  "Commerce, Law and Management",
  "Engineering and the Built Environment",
  "Health Sciences",
  "Humanities",
  "Science",
]

const YEARS_OF_STUDY = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Other"]

export function ProfileSetupForm({ user, onComplete }: ProfileSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({})

  // Pre-populate from Google data
  const nameParts = user.name.split(" ")
  const [formData, setFormData] = useState<UserProfile>({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    username: user.email.split("@")[0] || "",
    sex: "prefer_not_to_say",
    studentNumber: "",
    faculty: "",
    yearOfStudy: "",
    phoneNumber: "",
    bio: "",
  })

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) return "Username must be at least 3 characters"
    if (username.length > 20) return "Username must be less than 20 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Only letters, numbers, and underscores allowed"
    return null
  }

  const validateStudentNumber = (num: string): string | null => {
    if (!/^\d{7}$/.test(num)) return "Student number must be 7 digits"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate required fields
    const newErrors: Partial<Record<keyof UserProfile, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"

    const usernameError = validateUsername(formData.username)
    if (usernameError) newErrors.username = usernameError

    const studentNumberError = validateStudentNumber(formData.studentNumber)
    if (studentNumberError) newErrors.studentNumber = studentNumberError

    if (!formData.faculty) newErrors.faculty = "Please select your faculty"
    if (!formData.yearOfStudy) newErrors.yearOfStudy = "Please select your year of study"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: user.email,
          googleId: user.sub,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.field) {
          setErrors({ [data.field]: data.error })
        } else {
          throw new Error(data.error || "Failed to save profile")
        }
        return
      }

      onComplete(formData)
    } catch (error) {
      console.error("Profile setup error:", error)
      setErrors({ username: "Failed to save profile. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Personal Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Personal Information</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">CTFd Username *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value.toLowerCase())}
            placeholder="e.g., cyber_warrior"
            className={`font-mono ${errors.username ? "border-destructive" : ""}`}
          />
          <p className="text-xs text-muted-foreground">This will be your display name on CTFd</p>
          {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <Select value={formData.sex} onValueChange={(value) => updateField("sex", value as UserProfile["sex"])}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Academic Info Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          <span>Academic Information</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentNumber">Student Number *</Label>
          <Input
            id="studentNumber"
            value={formData.studentNumber}
            onChange={(e) => updateField("studentNumber", e.target.value.replace(/\D/g, ""))}
            placeholder="1234567"
            maxLength={7}
            className={`font-mono ${errors.studentNumber ? "border-destructive" : ""}`}
          />
          {errors.studentNumber && <p className="text-xs text-destructive">{errors.studentNumber}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty *</Label>
          <Select value={formData.faculty} onValueChange={(value) => updateField("faculty", value)}>
            <SelectTrigger className={errors.faculty ? "border-destructive" : ""}>
              <SelectValue placeholder="Select your faculty" />
            </SelectTrigger>
            <SelectContent>
              {FACULTIES.map((faculty) => (
                <SelectItem key={faculty} value={faculty}>
                  {faculty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.faculty && <p className="text-xs text-destructive">{errors.faculty}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearOfStudy">Year of Study *</Label>
          <Select value={formData.yearOfStudy} onValueChange={(value) => updateField("yearOfStudy", value)}>
            <SelectTrigger className={errors.yearOfStudy ? "border-destructive" : ""}>
              <SelectValue placeholder="Select your year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS_OF_STUDY.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.yearOfStudy && <p className="text-xs text-destructive">{errors.yearOfStudy}</p>}
        </div>
      </div>

      {/* Contact Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>Contact (Optional)</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber || ""}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
            placeholder="+27 XX XXX XXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Tell us about your interest in cybersecurity..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{formData.bio?.length || 0}/500</p>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Profile...
          </>
        ) : (
          "Complete Registration"
        )}
      </Button>
    </form>
  )
}
