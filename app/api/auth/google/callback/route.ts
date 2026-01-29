import { type NextRequest, NextResponse } from "next/server"

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  hd?: string // Hosted domain
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Error</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; background: #ece9d8; padding: 20px; }
    .error { background: #ffcccc; border: 2px solid #cc0000; padding: 15px; }
  </style>
</head>
<body>
  <div class="error">
    <h3>Authentication Failed</h3>
    <p>${error}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: '${error}'
      }, '${new URL(request.url).origin}');
      setTimeout(() => window.close(), 2000);
    }
  </script>
</body>
</html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  if (!code) {
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Error</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; background: #ece9d8; padding: 20px; }
    .error { background: #ffcccc; border: 2px solid #cc0000; padding: 15px; }
  </style>
</head>
<body>
  <div class="error">
    <h3>Authentication Failed</h3>
    <p>No authorization code received</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'No authorization code received'
      }, '${new URL(request.url).origin}');
      setTimeout(() => window.close(), 2000);
    }
  </script>
</body>
</html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokens)
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url))
    }

    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const userInfo: GoogleUserInfo = await userInfoResponse.json()

    // Validate Wits student domain
    if (userInfo.hd !== "students.wits.ac.za") {
      return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Invalid Domain</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; background: #ece9d8; padding: 20px; }
    .error { background: #ffcccc; border: 2px solid #cc0000; padding: 15px; }
  </style>
</head>
<body>
  <div class="error">
    <h3>Invalid Email Domain</h3>
    <p>You must use a @students.wits.ac.za email address.</p>
    <p>Your email: ${userInfo.email}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Must use @students.wits.ac.za email address'
      }, '${new URL(request.url).origin}');
      setTimeout(() => window.close(), 3000);
    }
  </script>
</body>
</html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // Return HTML that sends message to parent window and closes popup
    const userData = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google Sign In - Success</title>
  <style>
    body {
      font-family: Tahoma, Arial, sans-serif;
      background: #ece9d8;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .message {
      background: white;
      border: 2px solid;
      border-color: #ffffff #808080 #808080 #ffffff;
      padding: 20px;
      text-align: center;
    }
    .spinner {
      border: 3px solid #d4d0c8;
      border-top: 3px solid #003399;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="message">
    <div class="spinner"></div>
    <p>Authentication successful!</p>
    <p style="font-size: 11px; color: #666;">Completing sign-in...</p>
  </div>
  <script>
    try {
      // Send user data to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: ${JSON.stringify(userData)}
        }, '${new URL(request.url).origin}');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        // Fallback if no opener (shouldn't happen in popup)
        window.location.href = '/?google_user=${Buffer.from(JSON.stringify(userData)).toString("base64url")}';
      }
    } catch (error) {
      console.error('Failed to communicate with parent:', error);
      // Fallback to redirect
      window.location.href = '/?error=popup_communication_failed';
    }
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error("Google callback error:", error)
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Error</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; background: #ece9d8; padding: 20px; }
    .error { background: #ffcccc; border: 2px solid #cc0000; padding: 15px; }
  </style>
</head>
<body>
  <div class="error">
    <h3>Authentication Failed</h3>
    <p>An unexpected error occurred during authentication.</p>
    <p style="font-size: 10px; color: #666;">${error instanceof Error ? error.message : 'Unknown error'}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Authentication failed. Please try again.'
      }, '${new URL(request.url).origin}');
      setTimeout(() => window.close(), 3000);
    }
  </script>
</body>
</html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
}
