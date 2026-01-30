import type React from "react"
import { EBSRegisterCard } from "@/components/auth/ebs-register-card"
import { WitsHeader } from "@/components/auth/wits-header"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004080] to-[#002b55] flex items-center justify-center p-4">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
      }} />
      
      {/* Centered Registration Form */}
      <div className="w-full max-w-4xl relative z-10">
        {/* Header with logos */}
        <WitsHeader />

        {/* Form Content */}
        <div className="bg-white shadow-2xl p-8">
          <EBSRegisterCard />
        </div>
        
        {/* OpenVPN Footer */}
        <div className="bg-white rounded-b-2xl shadow-2xl px-8 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <span className="text-sm font-medium">Powered by</span>
            <Image 
              src="/logos/ovpn-logo.svg" 
              alt="OpenVPN" 
              width={100} 
              height={30}
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center text-white text-sm opacity-90">
          <p>© {new Date().getFullYear()} Wits Cybersecurity Interest Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
