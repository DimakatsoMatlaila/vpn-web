// VPN Backend API integration
// Communicates with the VPN backend server to provision OpenVPN profiles

export interface VpnProfileResponse {
  success: boolean
  ovpnFile?: string // Base64 encoded .ovpn file content
  fileName?: string
  assignedIp?: string
  error?: string
}

export async function requestVpnProfile(email: string): Promise<VpnProfileResponse> {
  const backendUrl = process.env.VPN_BACKEND_URL || 'http://localhost:3001'
  const apiEndpoint = `${backendUrl}/api/profile`

  try {
    console.log(`[VPN] Requesting profile for ${email} from ${apiEndpoint}`)

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[VPN] Backend error: ${response.status} - ${errorText}`)
      return {
        success: false,
        error: `Backend returned ${response.status}: ${errorText}`,
      }
    }

    // The backend returns the .ovpn file as a download
    // We need to read it and convert to base64
    const ovpnContent = await response.text()
    const ovpnBase64 = Buffer.from(ovpnContent).toString('base64')

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition')
    const fileNameMatch = contentDisposition?.match(/filename="?(.+?)"?$/i)
    const fileName = fileNameMatch ? fileNameMatch[1] : `${email.split('@')[0]}.ovpn`

    // Extract assigned IP from custom header (primary method)
    let assignedIp = response.headers.get('x-vpn-ip') || undefined

    // Fallback: Extract assigned IP from the ovpn file content if header not present
    if (!assignedIp) {
      const ifconfigMatch = ovpnContent.match(/ifconfig\s+(\d+\.\d+\.\d+\.\d+)/i)
      assignedIp = ifconfigMatch ? ifconfigMatch[1] : undefined
    }

    console.log(`[VPN] Successfully retrieved profile: ${fileName}${assignedIp ? ` (IP: ${assignedIp})` : ''}`)

    return {
      success: true,
      ovpnFile: ovpnBase64,
      fileName,
      assignedIp,
    }
  } catch (error) {
    console.error('[VPN] Failed to request profile from backend:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function saveVpnProfileToStorage(
  email: string,
  ovpnBase64: string,
  fileName: string
): Promise<string> {
  const fs = require('fs').promises
  const path = require('path')

  // Create VPN profiles directory
  const vpnDir = path.join(process.cwd(), 'data', 'vpn-profiles')
  await fs.mkdir(vpnDir, { recursive: true })

  // Save file
  const sanitizedEmail = email.replace(/[^a-z0-9@._-]/gi, '_')
  const filePath = path.join(vpnDir, `${sanitizedEmail}.ovpn`)
  
  const ovpnContent = Buffer.from(ovpnBase64, 'base64').toString('utf-8')
  await fs.writeFile(filePath, ovpnContent, 'utf-8')

  console.log(`[VPN] Saved profile to ${filePath}`)
  
  return filePath
}
