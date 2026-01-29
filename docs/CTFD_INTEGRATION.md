# CTFd Integration Guide

This guide explains how to integrate CTFd with the Wits Cyber authentication system.

## Overview

CTFd can be integrated in two ways:

1. **API Authentication** - CTFd verifies credentials against Wits Cyber API
2. **SSO (Single Sign-On)** - Users click "Login with Wits Cyber" in CTFd

## Prerequisites

- CTFd installed and running
- Administrator access to CTFd
- Wits Cyber Auth system deployed
- CTFd API key configured

## Method 1: API Authentication

This method allows CTFd to verify user credentials against the Wits Cyber database.

### Step 1: Generate API Key

Add the API key to your environment:

```bash
# Generate a secure API key
openssl rand -base64 32

# Add to .env
CTFD_API_KEY=your-generated-api-key
```

### Step 2: Create CTFd Authentication Plugin

Create a custom authentication plugin for CTFd:

**File: `CTFd/plugins/wits_cyber_auth/__init__.py`**

```python
from flask import request
import requests
from CTFd.utils.decorators import ratelimit
from CTFd.models import Users, db
from CTFd.utils.security.auth import login_user

WITS_CYBER_API_URL = "https://your-wits-cyber-domain.com"
WITS_CYBER_API_KEY = "your-api-key"

def load(app):
    @app.route('/wits-cyber/auth', methods=['POST'])
    @ratelimit(method="POST", limit=10, interval=60)
    def wits_cyber_auth():
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Verify credentials with Wits Cyber API
        response = requests.post(
            f"{WITS_CYBER_API_URL}/api/ctfd/auth/verify",
            json={"username": username, "password": password},
            headers={"X-CTFd-API-Key": WITS_CYBER_API_KEY}
        )
        
        if response.status_code != 200:
            return {"success": False, "error": "Authentication failed"}, 401
        
        data = response.json()
        if not data.get("success"):
            return {"success": False, "error": data.get("error", "Unknown error")}, 401
        
        # Find or create user in CTFd
        user_data = data["user"]
        user = Users.query.filter_by(email=user_data["email"]).first()
        
        if not user:
            # Create new user
            user = Users(
                name=user_data["name"],
                email=user_data["email"],
                password="",  # No local password
                verified=True,
                type="user"
            )
            db.session.add(user)
            db.session.commit()
        
        # Log in the user
        login_user(user)
        
        return {"success": True, "redirect": "/challenges"}
```

### Step 3: Modify CTFd Login Template

Update the login template to use the custom authentication:

**File: `CTFd/themes/your-theme/templates/login.html`**

```html
{% extends "base.html" %}

{% block content %}
<div class="login-form">
    <h2>Login to Wits Cyber CTF</h2>
    
    <form id="wits-cyber-login" method="POST" action="/wits-cyber/auth">
        <div class="form-group">
            <label for="username">Username or Email</label>
            <input type="text" name="username" id="username" 
                   placeholder="e.g., student123 or student123@students.wits.ac.za" required>
        </div>
        
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" name="password" id="password" 
                   placeholder="Your Wits Cyber password" required>
        </div>
        
        <button type="submit" class="btn btn-primary">Login</button>
    </form>
    
    <div class="divider">
        <span>or</span>
    </div>
    
    <a href="{{ WITS_CYBER_SSO_URL }}" class="btn btn-secondary">
        Login with Wits Cyber SSO
    </a>
    
    <p class="register-link">
        Don't have an account? 
        <a href="https://your-wits-cyber-domain.com">Register at Wits Cyber</a>
    </p>
</div>
{% endblock %}
```

## Method 2: SSO Integration

This method provides a seamless single sign-on experience.

### Step 1: Create SSO Plugin

**File: `CTFd/plugins/wits_cyber_sso/__init__.py`**

```python
from flask import redirect, request, url_for
import requests
from CTFd.utils.decorators import ratelimit
from CTFd.models import Users, db
from CTFd.utils.security.auth import login_user

WITS_CYBER_API_URL = "https://your-wits-cyber-domain.com"
WITS_CYBER_API_KEY = "your-api-key"

def load(app):
    @app.route('/sso/login')
    def sso_login():
        """Redirect to Wits Cyber for authentication"""
        return_url = request.host_url.rstrip('/')
        sso_url = f"{WITS_CYBER_API_URL}/api/ctfd/auth/sso?return_url={return_url}"
        return redirect(sso_url)
    
    @app.route('/sso/callback')
    @ratelimit(method="GET", limit=10, interval=60)
    def sso_callback():
        """Handle SSO callback from Wits Cyber"""
        token = request.args.get('token')
        
        if not token:
            return redirect(url_for('auth.login', error='missing_token'))
        
        # Validate token with Wits Cyber
        response = requests.post(
            f"{WITS_CYBER_API_URL}/api/ctfd/auth/sso/validate",
            json={"token": token},
            headers={"X-CTFd-API-Key": WITS_CYBER_API_KEY}
        )
        
        if response.status_code != 200:
            return redirect(url_for('auth.login', error='invalid_token'))
        
        data = response.json()
        if not data.get("success"):
            return redirect(url_for('auth.login', error=data.get("error", "sso_failed")))
        
        # Find or create user
        user_data = data["user"]
        user = Users.query.filter_by(email=user_data["email"]).first()
        
        if not user:
            user = Users(
                name=user_data["name"],
                email=user_data["email"],
                password="",
                verified=True,
                type="user"
            )
            db.session.add(user)
            db.session.commit()
        
        # Log in and redirect
        login_user(user)
        return redirect('/challenges')
```

### Step 2: Configure CTFd

In your CTFd `config.py` or environment:

```python
# Wits Cyber SSO Configuration
WITS_CYBER_API_URL = "https://your-wits-cyber-domain.com"
WITS_CYBER_API_KEY = "your-ctfd-api-key"
WITS_CYBER_SSO_ENABLED = True
```

### Step 3: Update Login Page

Add SSO button to the login page:

```html
<a href="/sso/login" class="btn btn-wits-cyber">
    <img src="/themes/your-theme/static/img/wits-cyber-logo.svg" alt="">
    Sign in with Wits Cyber
</a>
```

## Webhook Integration

To receive events from CTFd (user registrations, challenge solves, etc.):

### Step 1: Configure Webhook in CTFd

Add to your CTFd configuration:

```python
WEBHOOK_URL = "https://your-wits-cyber-domain.com/api/ctfd/webhook"
WEBHOOK_SECRET = "your-webhook-secret"
```

### Step 2: Implement Webhook Sender

**File: `CTFd/plugins/wits_cyber_webhooks/__init__.py`**

```python
import hmac
import hashlib
import json
import requests
from datetime import datetime
from CTFd.utils.events import subscribe

WEBHOOK_URL = "https://your-wits-cyber-domain.com/api/ctfd/webhook"
WEBHOOK_SECRET = "your-webhook-secret"

def send_webhook(event, data):
    """Send webhook to Wits Cyber"""
    payload = {
        "event": event,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    body = json.dumps(payload)
    signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()
    
    requests.post(
        WEBHOOK_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-CTFd-Signature": signature
        }
    )

def load(app):
    @subscribe('user.register')
    def on_user_register(user):
        send_webhook('user.register', {
            "id": user.id,
            "name": user.name,
            "email": user.email
        })
    
    @subscribe('challenge.solve')
    def on_challenge_solve(solve):
        send_webhook('challenge.solve', {
            "user_id": solve.user_id,
            "challenge_id": solve.challenge_id,
            "solved_at": solve.date.isoformat()
        })
```

## API Reference

### Verify Credentials

```
POST /api/ctfd/auth/verify
```

**Headers:**
```
X-CTFd-API-Key: your-api-key
Content-Type: application/json
```

**Request:**
```json
{
  "username": "student123",
  "password": "userpassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Student Name",
    "email": "student123@students.wits.ac.za",
    "type": "user"
  }
}
```

### SSO Token Validation

```
POST /api/ctfd/auth/sso/validate
```

**Headers:**
```
X-CTFd-API-Key: your-api-key
Content-Type: application/json
```

**Request:**
```json
{
  "token": "sso-token-from-callback"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@students.wits.ac.za",
    "name": "Student Name",
    "type": "user",
    "verified": true
  }
}
```

### Get User Info

```
GET /api/ctfd/users?email=student@students.wits.ac.za
```

**Headers:**
```
X-CTFd-API-Key: your-api-key
```

**Response:**
```json
{
  "id": "uuid",
  "email": "student@students.wits.ac.za",
  "name": "Student Name",
  "username": "student",
  "affiliation": "University of the Witwatersrand",
  "verified": true
}
```

## Troubleshooting

### "Invalid API key" Error

1. Verify the API key in CTFd matches the one in Wits Cyber `.env`
2. Check that the header name is exactly `X-CTFd-API-Key`

### "User not found" Error

The user hasn't registered on Wits Cyber yet. Direct them to:
`https://your-wits-cyber-domain.com`

### SSO Token Expired

SSO tokens are valid for 5 minutes. If users see this error:
1. Have them click the SSO button again
2. Ensure server clocks are synchronized

### Rate Limiting

The API has rate limits:
- Authentication: 10 requests per minute
- SSO: 10 requests per minute

If users are hitting limits, check for infinite redirect loops.
