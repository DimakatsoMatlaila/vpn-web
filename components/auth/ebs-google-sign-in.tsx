"use client"

import { useState } from "react"
import type { GoogleUser } from "./ebs-register-card"

interface EBSGoogleSignInProps {
  onSuccess: (user: GoogleUser) => void
}

export function EBSGoogleSignIn({ onSuccess }: EBSGoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if we're in demo mode
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  const handleDemoSignIn = () => {
    if (!isDemoMode) {
      setError("Demo sign-in is disabled in database mode. Please configure Google OAuth.")
      return
    }
    
    setIsLoading(true)
    console.log("[DEMO MODE] Simulating Google sign-in")

    setTimeout(() => {
      onSuccess({
        email: "student@students.wits.ac.za",
        name: "Demo Student",
        picture: "/student-avatar.png",
        sub: "demo-123456",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleRealGoogleSignIn = () => {
    setError(null)
    setIsLoading(true)
    
    // Check if Google OAuth is configured
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    
    if (!googleClientId || googleClientId === 'your-google-client-id.apps.googleusercontent.com') {
      setError(
        "Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local. " +
        "See docs/ENV_SETUP.md for instructions."
      )
      setIsLoading(false)
      return
    }

    if (!appUrl) {
      setError(
        "Application URL not configured. Please set NEXT_PUBLIC_APP_URL in .env.local (e.g., http://localhost:3000)"
      )
      setIsLoading(false)
      return
    }

    // Build Google OAuth URL using configured app URL
    const redirectUri = `${appUrl}/api/auth/google/callback`
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', googleClientId)
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('hd', 'students.wits.ac.za') // Restrict to Wits domain
    
    console.log("[DATABASE MODE] Opening Google OAuth popup:", googleAuthUrl.toString())
    
    // Open popup window (Oracle EBS style)
    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    const popup = window.open(
      googleAuthUrl.toString(),
      'Google Sign In - Wits Cyber',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,location=no,status=no`
    )
    
    if (!popup) {
      setError("Popup blocked. Please allow popups for this site.")
      setIsLoading(false)
      return
    }
    
    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin - accept both window origin and configured app URL
      const allowedOrigins = [window.location.origin, appUrl]
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('[Google OAuth] Message from unexpected origin:', event.origin)
        return
      }
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log("[Google OAuth] Received user data from popup:", event.data.user)
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)
        onSuccess(event.data.user)
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.error("[Google OAuth] Error from popup:", event.data.error)
        window.removeEventListener('message', handleMessage)
        setError(event.data.error || "Authentication failed")
        setIsLoading(false)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Check if popup was closed without completing auth
    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed)
        window.removeEventListener('message', handleMessage)
        setIsLoading(false)
        setError("Authentication window was closed")
      }
    }, 500)
  }

  const handleSignIn = () => {
    if (isDemoMode) {
      handleDemoSignIn()
    } else {
      handleRealGoogleSignIn()
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode indicator */}
      {isDemoMode && (
        <div className="bg-[#ffc000] border border-[#808080] p-2 text-[10px]">
          <strong>⚠️ DEMO MODE:</strong> Using simulated Google sign-in for testing
        </div>
      )}
      
      {!isDemoMode && (
        <div className="bg-[#add8e6] border border-[#808080] p-2 text-[10px]">
          <strong>🔒 DATABASE MODE:</strong> Real Google OAuth authentication required
        </div>
      )}

      <div className="ebs-inset p-4">
        <table className="w-full text-[11px]">
          <tbody>
            <tr>
              <td className="py-1 pr-4 text-right font-bold w-32">Domain:</td>
              <td className="py-1">@students.wits.ac.za</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-right font-bold">Auth Method:</td>
              <td className="py-1">Google OAuth 2.0</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-right font-bold">Mode:</td>
              <td className="py-1">
                <span className={`px-2 py-0.5 border text-[10px] ${isDemoMode ? 'bg-[#ffc000] border-[#808080]' : 'bg-[#90EE90] border-[#228B22]'}`}>
                  {isDemoMode ? 'Demo (Simulated)' : 'Production (Real OAuth)'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {error && (
        <div className="bg-[#ffcccc] border-2 border-[#cc0000] p-3 text-[10px]">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button 
          className="ebs-button flex items-center gap-2" 
          onClick={handleSignIn} 
          disabled={isLoading}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? "Signing in..." : isDemoMode ? "Demo Sign in with Google" : "Sign in with Google"}
        </button>
        <button className="ebs-button">Cancel</button>
      </div>

      <div className="text-[10px] text-muted-foreground border-t border-[#808080] pt-2 mt-2">
        Note: You must use your @students.wits.ac.za email address to register.
        {!isDemoMode && (
          <div className="mt-1 text-[#003399]">
            Real Google authentication will redirect you to Google's login page.
          </div>
        )}
      </div>
    </div>
  )
}
