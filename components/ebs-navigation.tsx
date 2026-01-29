"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { href: "/", label: "Registration" },
]

export function EBSNavigation() {
  const pathname = usePathname()

  // Hide navigation on admin console
  if (pathname.startsWith("/polaris-solaris")) {
    return null
  }

  return (
    <div className="w-full">
      {/* Title Bar */}
      <div className="ebs-titlebar">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#ffc000] border border-[#808080] flex items-center justify-center text-[8px] text-black font-bold">
            W
          </div>
          <span className="text-sm">Wits Cyber - Student Registration System v1.0</span>
        </div>
        <div className="flex gap-1">
          <button className="w-5 h-4 bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] text-[10px] leading-none">
            _
          </button>
          <button className="w-5 h-4 bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] text-[10px] leading-none">
            □
          </button>
          <button className="w-5 h-4 bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] text-[10px] leading-none text-red-600 font-bold">
            ×
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="ebs-menubar flex items-center gap-1">
        <span className="px-2 py-1 text-xs hover:bg-[#316ac5] hover:text-white cursor-pointer">File</span>
        <span className="px-2 py-1 text-xs hover:bg-[#316ac5] hover:text-white cursor-pointer">Edit</span>
        <span className="px-2 py-1 text-xs hover:bg-[#316ac5] hover:text-white cursor-pointer">View</span>
        <span className="px-2 py-1 text-xs hover:bg-[#316ac5] hover:text-white cursor-pointer">Tools</span>
        <span className="px-2 py-1 text-xs hover:bg-[#316ac5] hover:text-white cursor-pointer">Help</span>
      </div>

      {/* Toolbar */}
      <div className="ebs-outset flex items-center gap-2 px-2 py-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`ebs-button ${isActive ? "border-[#404040] border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff]" : ""}`}
              >
                {item.label}
              </button>
            </Link>
          )
        })}        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">
          Connected: Production (JSON Storage)
        </span>
      </div>
    </div>
  )
}
