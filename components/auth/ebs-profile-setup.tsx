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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">First Name <span className="text-red-500">*</span></label>
            <input
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="text-red-600 text-xs">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Last Name <span className="text-red-500">*</span></label>
            <input
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="text-red-600 text-xs">{errors.lastName}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">CTFd Username <span className="text-red-500">*</span></label>
            <input
              value={formData.username}
              onChange={(e) => updateField("username", e.target.value.toLowerCase())}
              className={`w-full px-4 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.username ? "border-red-500" : "border-gray-300"}`}
              placeholder="username"
            />
            {errors.username && <p className="text-red-600 text-xs">{errors.username}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Gender</label>
            <select
              value={formData.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Student Number <span className="text-red-500">*</span></label>
            <input
              value={formData.studentNumber}
              onChange={(e) => updateField("studentNumber", e.target.value.replace(/\D/g, ""))}
              maxLength={7}
              placeholder="1234567"
              className={`w-full px-4 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.studentNumber ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.studentNumber && <p className="text-red-600 text-xs">{errors.studentNumber}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Faculty <span className="text-red-500">*</span></label>
            <select
              value={formData.faculty}
              onChange={(e) => updateField("faculty", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.faculty ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">-- Select Faculty --</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.faculty && <p className="text-red-600 text-xs">{errors.faculty}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Year of Study <span className="text-red-500">*</span></label>
            <select
              value={formData.yearOfStudy}
              onChange={(e) => updateField("yearOfStudy", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all ${errors.yearOfStudy ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">-- Select Year --</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {errors.yearOfStudy && <p className="text-red-600 text-xs">{errors.yearOfStudy}</p>}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Information
          <span className="text-xs font-normal text-gray-500">(Optional)</span>
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <input
              value={formData.phoneNumber || ""}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
              placeholder="+27 XX XXX XXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Bio</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => updateField("bio", e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all resize-none"
              placeholder="Tell us about your interest in cybersecurity..."
            />
            <p className="text-xs text-gray-500 text-right">{formData.bio?.length || 0}/500 characters</p>
          </div>
        </div>
      </div>

      {errors.form && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{errors.form}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button 
          type="submit" 
          className="flex-1 bg-[#003366] hover:bg-[#004080] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : "Complete Registration"}
        </button>
      </div>
    </form>
  )
}
