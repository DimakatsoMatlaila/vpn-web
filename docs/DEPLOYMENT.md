# Production Deployment Guide

## Overview

This system uses JSON file-based storage for all data. No database setup required!

## Prerequisites

- Node.js 18+
- VPN backend server running (see `backend/README.md`)
- Google OAuth credentials
- Domain/server with SSL certificate (for production)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` from the template:

```bash
cp .env.production .env.local
```

Edit `.env.local` with your configuration:

```env
# Required
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# VPN Backend
VPN_BACKEND_URL=http://vpn-backend-server:3001

# OAuth Secrets
MOODLE_CLIENT_SECRET=your-moodle-secret
CTFD_CLIENT_SECRET=your-ctfd-secret
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized JavaScript origins:
   - `https://auth.witscyber.co.za`
4. Add authorized redirect URIs:
   - `https://auth.witscyber.co.za/api/auth/google/callback`
5. Copy Client ID and Secret to `.env.local`

### 4. Build for Production

```bash
npm run build
```

### 5. Start Production Server

```bash
NODE_ENV=production npm start
```

Server runs on port 3000 by default.

## Data Management

### Storage Location

All data is stored in the `data/` directory:
- `data/database.json` - User accounts, OAuth clients, tokens
- `data/vpn-profiles/` - User VPN configuration files

### Backup

**Automated backup:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf backup-$DATE.tar.gz data/
```

Run daily via cron:
```cron
0 2 * * * /path/to/backup.sh
```

**Manual backup:**
```bash
cp -r data/ backup/data-$(date +%Y%m%d-%H%M%S)/
```

### Restore

```bash
tar -xzf backup-20260129-120000.tar.gz
# or
cp -r backup/data-20260129-120000/ data/
```

### File Permissions

```bash
chmod 700 data/
chmod 600 data/database.json
chmod 700 data/vpn-profiles/
chmod 600 data/vpn-profiles/*.ovpn
```

## Docker Deployment

### Build Image

```bash
docker build -t witscyber-registration .
```

### Run Container

```bash
docker run -d \
  --name witscyber-reg \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env.local:/app/.env.local:ro \
  --restart unless-stopped \
  witscyber-registration
```

**Important:** Mount `data/` as a volume to persist data!

### Docker Compose

```yaml
version: '3.8'
services:
  registration:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./.env.local:/app/.env.local:ro
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name auth.witscyber.co.za;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name auth.witscyber.co.za;
    return 301 https://$server_name$request_uri;
}
```

## Systemd Service

Create `/etc/systemd/system/witscyber-registration.service`:

```ini
[Unit]
Description=WitsCyber Registration System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/witscyber-registration
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=witscyber-reg
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable witscyber-registration
sudo systemctl start witscyber-registration
sudo systemctl status witscyber-registration
```

## Monitoring

### Logs

**With systemd:**
```bash
journalctl -u witscyber-registration -f
```

**With Docker:**
```bash
docker logs -f witscyber-reg
```

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "service": "vpn-backend",
  "version": "1.0.0"
}
```

## Scaling

### Load Balancing

Since data is file-based, run multiple instances with shared storage:

```yaml
version: '3.8'
services:
  registration:
    build: .
    deploy:
      replicas: 3
    volumes:
      - nfs-data:/app/data  # Shared NFS/network storage
      - ./.env.local:/app/.env.local:ro

volumes:
  nfs-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=nfs-server,rw
      device: ":/export/witscyber/data"
```

**Note:** Ensure file locking is handled by NFS or use a distributed lock service.

## Troubleshooting

### "ENOENT: no such file or directory"
- Data directory not created
- Run app once to auto-create, or: `mkdir -p data/vpn-profiles`

### "Permission denied" on data/
```bash
chown -R www-data:www-data data/
chmod 700 data/
```

### VPN profiles not downloading
- Check `VPN_BACKEND_URL` is accessible
- Verify VPN backend is running
- Check firewall rules between servers

### Sessions not persisting
- Verify `JWT_SECRET` hasn't changed
- Check `data/database.json` write permissions
- Review session expiration settings

## Security Checklist

- [ ] HTTPS enabled (SSL certificate configured)
- [ ] `JWT_SECRET` is strong and unique (32+ chars)
- [ ] OAuth secrets rotated regularly
- [ ] `data/` directory has restricted permissions (700)
- [ ] Firewall configured (only ports 80/443 exposed)
- [ ] Regular backups automated
- [ ] Google OAuth restricted to @students.wits.ac.za
- [ ] VPN backend on private network
- [ ] Environment variables not committed to git

## Support

For issues or questions:
- Check logs first
- Review environment configuration
- Verify VPN backend connectivity
- Contact WitsCyber support
