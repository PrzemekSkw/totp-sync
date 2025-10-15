<p align="center">
  <img src="assets/logo.png" alt="TOTP Sync Logo" width="150">
</p>

<h1 align="center">TOTP Sync</h1>

<p align="center">
  Self-hosted two-factor authentication (2FA) app with web interface and cross-device synchronization.
</p>

<p align="center">
  <a href="https://github.com/PrzemekSkw/totp-sync/stargazers">
    <img src="https://img.shields.io/github/stars/PrzemekSkw/totp-sync?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/PrzemekSkw/totp-sync/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
</p>

---

## 📸 Screenshots

<p align="center">
  <img src="screenshots/dashboard.png" alt="Dashboard with TOTP codes" width="45%">
  <img src="screenshots/dark-mode.png" alt="Dark mode support" width="45%">
</p>

<p align="center">
  <img src="screenshots/login.png" alt="Login page" width="45%">
  <img src="screenshots/2fa-setup.png" alt="2FA Setup with QR code" width="45%">
</p>

---

## ✨ Features

- 🔐 Secure TOTP code generation (compatible with Google Authenticator, Authy, etc.)
- 🔄 Cross-device synchronization via self-hosted backend
- 📱 Modern web interface
- 🌙 Dark mode support
- 📦 Easy Docker deployment
- 🔒 End-to-end encryption of TOTP secrets
- 📋 Import/Export (JSON, otpauth URI)
- 🛡️ Mandatory 2FA on registration (configurable)
- 💾 Backup codes for account recovery


## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/PrzemekSkw/totp-sync.git
cd totp-sync
```

2. **Generate secure secrets:**
```bash
# JWT Secret (copy the output)
openssl rand -base64 32

# Encryption Key (copy the output)
openssl rand -hex 16
```

3. **Configure docker-compose.yml:**

Edit `docker-compose.yml` and replace the following placeholders:

- `POSTGRES_PASSWORD`: Set a strong database password
- `JWT_SECRET`: Paste the JWT secret generated in step 2
- `ENCRYPTION_KEY`: Paste the encryption key generated in step 2
- Update `DATABASE_URL` with your database password

Example:
```yaml
environment:
  POSTGRES_PASSWORD: "your_strong_password_here"
  JWT_SECRET: "your_generated_jwt_secret"
  ENCRYPTION_KEY: "your_generated_encryption_key"
  DATABASE_URL: "postgresql://totp_user:your_strong_password_here@postgres:5432/totp_sync"
```

4. **Start the application:**
```bash
docker compose up -d
```

5. **Access the app:**

Open http://localhost:5173 in your browser

## ⚙️ Configuration

### Environment Variables

Backend configuration in `docker-compose.yml`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REQUIRE_2FA_ON_REGISTER` | Force 2FA setup during registration | `"true"` | No |
| `JWT_SECRET` | Secret for JWT token signing | - | Yes |
| `ENCRYPTION_KEY` | Key for encrypting TOTP secrets | - | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |

### Ports

- **5173** - Web interface
- **3000** - Backend API

### Disabling Mandatory 2FA

To allow users to skip 2FA setup during registration, change:
```yaml
REQUIRE_2FA_ON_REGISTER: "false"
```

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **Always change default passwords** - Generate strong, unique passwords
2. **Generate new secrets** - Never use example secrets in production
3. **Use HTTPS in production** - Set up a reverse proxy (Nginx, Caddy, Traefik)
4. **Store backup codes safely** - Save them in a secure password manager
5. **Regular backups** - Back up the PostgreSQL volume regularly
6. **Keep updated** - Pull latest changes and rebuild regularly

### Production Deployment

For production use:
- Use a reverse proxy with SSL/TLS certificates
- Change default ports
- Use Docker secrets for sensitive values
- Set up monitoring and logging
- Regular security updates

## 📱 Import/Export

### Supported Formats

- **JSON** - Standard TOTP export format
- **otpauth URI** - Compatible with Google Authenticator, Authy, FreeOTP+, etc.

### Importing from other apps

1. Export from your current 2FA app (Google Authenticator, Authy, FreeOTP+, 2FAuth, etc.)
2. In TOTP Sync, click "Import"
3. Select your export file or paste URIs
4. Your entries will be encrypted and synced

## 🐛 Troubleshooting

### Application won't start

Check logs:
```bash
docker compose logs -f
```

### Database connection issues

Ensure PostgreSQL is healthy:
```bash
docker compose ps
```

### Can't login

1. Clear browser cache and localStorage
2. Verify JWT_SECRET and ENCRYPTION_KEY are set correctly
3. Check backend logs for errors

## 🛠️ Development

### Project Structure
```
totp-sync/
├── backend/          # Node.js + Express API
│   ├── src/
│   └── Dockerfile
├── web/              # React + Vite frontend
│   ├── src/
│   └── Dockerfile
└── docker-compose.yml
```

### Running in development mode
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd web
npm install
npm run dev
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 💖 Support

If you find this project useful, you can support its development:

**Support via BuyMeCoffe:**

<a href="https://www.buymeacoffee.com/przemekskw" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" width="210">
</a>

**Support via PayPal:**

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue.svg)](https://paypal.me/przemeskw)

**Support via Github Sponsors:**

[![GitHub Sponsors](https://img.shields.io/github/sponsors/PrzemekSkw?style=for-the-badge&logo=github&color=ea4aaa)](https://github.com/sponsors/PrzemekSkw)

Your support helps maintain and improve this project. Thank you! ❤️


## ⭐ Star on Github

If you find this project useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=PrzemekSkw/totp-sync&type=Date)](https://star-history.com/#PrzemekSkw/totp-sync&Date)


---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


