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
      // Only process our specific message types to avoid processing unrelated messages
      if (!event.data || !event.data.type) {
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
    <div className="space-y-6">
      {/* Mode indicator */}
      {isDemoMode && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">Demo Mode Active</p>
              <p className="text-sm text-amber-700">Using simulated Google sign-in for testing</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Authentication Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-700">Allowed Domains</p>
              <p className="text-gray-600">@students.wits.ac.za<br/>@wits.ac.za</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-700">Authentication Method</p>
              <p className="text-gray-600">Google OAuth 2.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold text-red-800">Authentication Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Button */}
      <div className="flex flex-col gap-3">
        <button 
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 border border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group" 
          onClick={handleSignIn} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-[#003366]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
              <span className="text-base">
                {isDemoMode ? "Demo Sign in with Google" : "Sign in with Google"}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Footer Note */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="flex items-start gap-2">
          <svg className="w-5 h-5 text-[#003366] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            <strong>Security Notice:</strong> You must use your Wits email address (@students.wits.ac.za or @wits.ac.za) to register.
            {!isDemoMode && (
              <span className="block mt-1 text-[#003366]">
                You will be redirected to Google's secure login page.
              </span>
            )}
          </span>
        </p>
      </div>
    </div>
  )
}
