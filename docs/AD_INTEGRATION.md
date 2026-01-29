# Active Directory Integration Guide

This guide explains how to integrate the Wits Cyber authentication system with Active Directory.

## Overview

The integration allows:
- Syncing user accounts from Wits Cyber to AD
- Using the same password across both systems
- Querying user information for AD provisioning

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Wits Cyber    │◀───────▶│ Active Directory│
│   Auth System   │  Sync   │     Server      │
└─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
   User registers            User can login
   and sets password         with same credentials
```

## API Endpoints

### Get User for AD Sync

```
GET /api/ad/sync?email=student@students.wits.ac.za
```

**Headers:**
```
X-Admin-API-Key: your-ad-sync-api-key
```

**Response:**
```json
{
  "sAMAccountName": "student123",
  "userPrincipalName": "student123@students.wits.ac.za",
  "mail": "student123@students.wits.ac.za",
  "displayName": "Student Name",
  "givenName": "Student",
  "sn": "Name",
  "cn": "Student Name",
  "memberOf": ["CN=WitsCyber-Members,OU=Groups,DC=wits,DC=ac,DC=za"],
  "enabled": true
}
```

## Integration Methods

### Method 1: PowerShell Sync Script

Create a scheduled task to sync users from Wits Cyber to AD:

```powershell
# sync-wits-cyber-users.ps1

$WitsCyberApiUrl = "https://your-wits-cyber-domain.com"
$ApiKey = "your-ad-sync-api-key"
$ADSearchBase = "OU=WitsCyber,DC=wits,DC=ac,DC=za"

# Get list of registered users from your database
# This could be an additional endpoint or database query
$users = Invoke-RestMethod -Uri "$WitsCyberApiUrl/api/admin/users" `
    -Headers @{ "X-Admin-API-Key" = $ApiKey }

foreach ($user in $users) {
    $email = $user.email
    $username = $email.Split("@")[0]
    
    # Check if user exists in AD
    $adUser = Get-ADUser -Filter "mail -eq '$email'" -SearchBase $ADSearchBase -ErrorAction SilentlyContinue
    
    if (-not $adUser) {
        # Get full user details from Wits Cyber
        $userDetails = Invoke-RestMethod -Uri "$WitsCyberApiUrl/api/ad/sync?email=$email" `
            -Headers @{ "X-Admin-API-Key" = $ApiKey }
        
        # Create new AD user
        New-ADUser `
            -Name $userDetails.cn `
            -SamAccountName $userDetails.sAMAccountName `
            -UserPrincipalName $userDetails.userPrincipalName `
            -EmailAddress $userDetails.mail `
            -DisplayName $userDetails.displayName `
            -GivenName $userDetails.givenName `
            -Surname $userDetails.sn `
            -Path $ADSearchBase `
            -Enabled $true `
            -ChangePasswordAtLogon $true
        
        # Add to group
        Add-ADGroupMember -Identity "WitsCyber-Members" -Members $userDetails.sAMAccountName
        
        Write-Host "Created AD user: $username"
    }
}
```

### Method 2: Azure AD Connect

If using Azure AD, configure Azure AD Connect with custom sync rules:

1. **Install Azure AD Connect** on a domain-joined server

2. **Configure Custom Sync Rule:**
   - Source: Wits Cyber Database (via API)
   - Target: Azure AD
   - Mapping: Use the attribute mappings from the `/api/ad/sync` response

3. **Set up Password Hash Sync** (if applicable)

### Method 3: LDAP Proxy

For direct LDAP authentication, you can create a proxy that validates against Wits Cyber:

```python
# ldap_proxy.py
from ldap3 import Server, Connection, ALL
import requests

WITS_CYBER_API = "https://your-wits-cyber-domain.com"
API_KEY = "your-ad-sync-api-key"

def authenticate_user(username, password):
    """Authenticate user against Wits Cyber API"""
    response = requests.post(
        f"{WITS_CYBER_API}/api/ctfd/auth/verify",
        json={"username": username, "password": password},
        headers={"X-CTFd-API-Key": API_KEY}
    )
    return response.status_code == 200 and response.json().get("success")

# Use with your LDAP server configuration
```

## Password Synchronization

### Option 1: Same Password (Recommended)

Users set one password during Wits Cyber registration that works for:
- CTFd
- Active Directory
- Moodle (via OAuth, no password needed)

**Implementation:**
1. User creates password on Wits Cyber
2. Password hash is stored in Wits Cyber database
3. AD sync script sets the same password in AD
4. User uses same credentials everywhere

### Option 2: Password Write-Back

Configure AD to write password changes back to Wits Cyber:

```powershell
# On password change in AD, call Wits Cyber API
# This requires a custom password filter DLL or Azure AD Password Protection

$newPasswordHash = [System.Convert]::ToBase64String(
    [System.Security.Cryptography.SHA256]::Create().ComputeHash(
        [System.Text.Encoding]::UTF8.GetBytes($newPassword)
    )
)

Invoke-RestMethod -Uri "$WitsCyberApiUrl/api/ad/password-sync" `
    -Method POST `
    -Headers @{ "X-Admin-API-Key" = $ApiKey } `
    -Body (@{
        username = $username
        passwordHash = $newPasswordHash
    } | ConvertTo-Json)
```

## Security Considerations

### API Key Security

- Store API keys in secure vaults (Azure Key Vault, HashiCorp Vault)
- Rotate keys regularly
- Use separate keys for different services
- Restrict API key permissions to minimum needed

### Network Security

- Use HTTPS for all API calls
- Consider VPN or private endpoints for AD sync
- Implement IP allowlisting for admin APIs
- Monitor for unusual API activity

### Password Handling

- Never store plaintext passwords
- Use bcrypt with appropriate work factor (12+)
- Implement password complexity requirements
- Consider adding MFA for sensitive operations

## Troubleshooting

### User Not Syncing to AD

1. Check API connectivity:
```powershell
Invoke-RestMethod -Uri "$WitsCyberApiUrl/api/health" -Headers @{ "X-Admin-API-Key" = $ApiKey }
```

2. Verify user exists in Wits Cyber:
```powershell
Invoke-RestMethod -Uri "$WitsCyberApiUrl/api/ad/sync?email=user@students.wits.ac.za" `
    -Headers @{ "X-Admin-API-Key" = $ApiKey }
```

3. Check AD permissions for the sync service account

### Password Mismatch

If users can log into Wits Cyber but not AD:

1. Verify password sync ran successfully
2. Check for password policy conflicts between systems
3. Have user reset password on Wits Cyber

### Group Membership Issues

Verify the AD group exists and the sync service has permission to modify membership:

```powershell
Get-ADGroup -Identity "WitsCyber-Members"
Get-ADGroupMember -Identity "WitsCyber-Members"
