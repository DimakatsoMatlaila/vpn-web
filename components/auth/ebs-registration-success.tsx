"use client"

import Link from "next/link"
import type { GoogleUser, UserProfile } from "./ebs-register-card"
import { EBSVpnDownload } from "./ebs-vpn-download"

interface EBSRegistrationSuccessProps {
  user: GoogleUser
  profile: UserProfile
}

export function EBSRegistrationSuccess({ user, profile }: EBSRegistrationSuccessProps) {
  return (
    <div className="space-y-4">
      {/* Success Message */}
      <div className="bg-[#90EE90] border-2 border-[#228B22] p-3 flex items-center gap-3">
        <span className="text-2xl">✓</span>
        <div>
          <div className="font-bold text-[12px]">Registration Successful</div>
          <div className="text-[10px]">Your account has been created and is ready to use.</div>
        </div>
      </div>

      {/* Account Details */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Account Summary</div>
        <div className="ebs-inset p-3">
          <table className="w-full text-[11px]">
            <tbody>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold w-32">Email:</td>
                <td className="py-2 font-mono">{user.email}</td>
              </tr>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold">Name:</td>
                <td className="py-2">
                  {profile.firstName} {profile.lastName}
                </td>
              </tr>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold">CTFd Username:</td>
                <td className="py-2 font-mono">{profile.username}</td>
              </tr>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold">Student No:</td>
                <td className="py-2 font-mono">{profile.studentNumber}</td>
              </tr>
              <tr className="border-b border-[#c0c0c0]">
                <td className="py-2 pr-4 font-bold">Faculty:</td>
                <td className="py-2">{profile.faculty}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold">Year:</td>
                <td className="py-2">{profile.yearOfStudy}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* VPN Access */}
      <EBSVpnDownload />

      {/* Next Steps */}
      <div className="ebs-fieldset">
        <div className="text-[10px] font-bold text-[#003399] mb-2">Platform Access</div>
        <table className="text-[10px] w-full">
          <tbody>
            <tr>
              <td className="py-1 pr-2 align-top">1.</td>
              <td className="py-1">Download and configure your VPN profile above</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">2.</td>
              <td className="py-1">Login to CTFd using your username and password</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">3.</td>
              <td className="py-1">Access Moodle courses with your Wits Cyber account</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-top">4.</td>
              <td className="py-1">Join upcoming CTF competitions and workshops</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[#808080]">
        <button className="ebs-button" onClick={() => window.location.reload()}>
          Register Another
        </button>
      </div>
    </div>
  )
}
