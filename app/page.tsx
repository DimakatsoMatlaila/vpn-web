import type React from "react"
import { EBSRegisterCard } from "@/components/auth/ebs-register-card"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#ece9d8] flex items-center justify-center p-4">
      {/* Centered Registration Form */}
      <div className="w-full max-w-2xl">
        <div className="ebs-outset">
          {/* Content Header */}
          <div className="ebs-header flex items-center justify-between">
            <span>Wits Cyber - Student Registration</span>
            <span className="text-[10px] font-normal opacity-80">v1.0</span>
          </div>

          {/* Form Content */}
          <div className="p-6 bg-[#ece9d8]">
            <EBSRegisterCard />
          </div>
        </div>
      </div>
    </div>
  )
}
