"use client"

import type React from "react"
import { useState } from "react"
import type { GoogleUser, UserProfile } from "./ebs-register-card"

interface EBSProfileSetupProps {
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

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Other"]

export function EBSProfileSetup({ user, onComplete }: EBSProfileSetupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "Required"
    if (!formData.lastName.trim()) newErrors.lastName = "Required"
    if (formData.username.length < 3) newErrors.username = "Min 3 characters"
    if (!/^\d{7}$/.test(formData.studentNumber)) newErrors.studentNumber = "Must be 7 digits"
    if (!formData.faculty) newErrors.faculty = "Required"
    if (!formData.yearOfStudy) newErrors.yearOfStudy = "Required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: user.email, googleId: user.sub }),
      })

      if (!response.ok) throw new Error("Failed to save profile")
      onComplete(formData)
    } catch (err) {
      setErrors({ form: "Failed to save profile. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Personal Info */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Personal Information</div>
        <table className="w-full text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 pr-2 text-right font-bold w-32">First Name: *</td>
              <td className="py-1">
                <input
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={`ebs-input w-48 ${errors.firstName ? "border-red-500" : ""}`}
                />
                {errors.firstName && <span className="text-red-600 text-[9px] ml-2">{errors.firstName}</span>}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold">Last Name: *</td>
              <td className="py-1">
                <input
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={`ebs-input w-48 ${errors.lastName ? "border-red-500" : ""}`}
                />
                {errors.lastName && <span className="text-red-600 text-[9px] ml-2">{errors.lastName}</span>}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold">CTFd Username: *</td>
              <td className="py-1">
                <input
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value.toLowerCase())}
                  className={`ebs-input w-48 font-mono ${errors.username ? "border-red-500" : ""}`}
                />
                {errors.username && <span className="text-red-600 text-[9px] ml-2">{errors.username}</span>}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold">Sex:</td>
              <td className="py-1">
                <select
                  value={formData.sex}
                  onChange={(e) => updateField("sex", e.target.value)}
                  className="ebs-input w-48"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Academic Info */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Academic Information</div>
        <table className="w-full text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 pr-2 text-right font-bold w-32">Student Number: *</td>
              <td className="py-1">
                <input
                  value={formData.studentNumber}
                  onChange={(e) => updateField("studentNumber", e.target.value.replace(/\D/g, ""))}
                  maxLength={7}
                  placeholder="1234567"
                  className={`ebs-input w-32 font-mono ${errors.studentNumber ? "border-red-500" : ""}`}
                />
                {errors.studentNumber && <span className="text-red-600 text-[9px] ml-2">{errors.studentNumber}</span>}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold">Faculty: *</td>
              <td className="py-1">
                <select
                  value={formData.faculty}
                  onChange={(e) => updateField("faculty", e.target.value)}
                  className={`ebs-input w-64 ${errors.faculty ? "border-red-500" : ""}`}
                >
                  <option value="">-- Select Faculty --</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold">Year of Study: *</td>
              <td className="py-1">
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => updateField("yearOfStudy", e.target.value)}
                  className={`ebs-input w-48 ${errors.yearOfStudy ? "border-red-500" : ""}`}
                >
                  <option value="">-- Select Year --</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contact Info */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Contact Information (Optional)</div>
        <table className="w-full text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 pr-2 text-right font-bold w-32">Phone:</td>
              <td className="py-1">
                <input
                  value={formData.phoneNumber || ""}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                  className="ebs-input w-48"
                />
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-right font-bold align-top">Bio:</td>
              <td className="py-1">
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) => updateField("bio", e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="ebs-input w-full"
                  placeholder="Tell us about your interest in cybersecurity..."
                />
                <div className="text-[9px] text-muted-foreground text-right">{formData.bio?.length || 0}/500</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {errors.form && (
        <div className="bg-[#ffcccc] border border-[#cc0000] p-2 text-[10px] text-[#cc0000]">Error: {errors.form}</div>
      )}

      <div className="flex gap-2 pt-2 border-t border-[#808080]">
        <button type="submit" className="ebs-button" disabled={isLoading}>
          {isLoading ? "Saving..." : "Complete Registration"}
        </button>
        <button type="button" className="ebs-button">
          Back
        </button>
      </div>
    </form>
  )
}
