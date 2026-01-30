"use client"

import Image from "next/image"

export function WitsHeader() {
  return (
    <div className="bg-white rounded-t-2xl shadow-2xl p-6 border-b-4 border-[#FFD700]">
      <div className="flex items-center justify-center gap-6">
        <Image 
          src="/logos/mss-logo.png" 
          alt="Wits Logo" 
          width={120} 
          height={120}
          className="object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#003366]">Wits Cyber Security</h1>
          <p className="text-base text-gray-600 mt-1">Student Registration Portal</p>
        </div>
      </div>
    </div>
  )
}
