"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function EBSVpnDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/vpn/profile", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download VPN profile")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition")
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/i)
      const filename = filenameMatch ? filenameMatch[1] : "client.ovpn"

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ebs-fieldset">
      <div className="text-xs font-bold mb-3 text-[#003399]">VPN Access</div>

      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Download your personal VPN configuration file to securely connect to the WitsCyber lab environment.
        </p>

        {error && (
          <Alert variant="destructive" className="border-2 border-red-600">
            <AlertDescription className="text-[10px]">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-2 border-green-600 bg-green-50">
            <AlertDescription className="text-[10px] text-green-800">
              ✓ VPN profile downloaded successfully! Import it into your OpenVPN client.
            </AlertDescription>
          </Alert>
        )}

        <button onClick={handleDownload} disabled={loading} className="ebs-button w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
              Provisioning VPN Profile...
            </span>
          ) : (
            "Download VPN Configuration"
          )}
        </button>

        <div className="ebs-inset p-2">
          <div className="text-[10px] space-y-1">
            <div className="font-bold text-[#003399]">📋 Next Steps:</div>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Download and install OpenVPN Connect</li>
              <li>Import your .ovpn configuration file</li>
              <li>Connect to WitsCyber VPN</li>
              <li>Access lab resources and CTF challenges</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
