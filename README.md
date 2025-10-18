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

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-yellow?style=for-the-badge" alt="Beta Status">
  <img src="https://img.shields.io/badge/version-0.2.0--beta-green?style=for-the-badge" alt="Version">
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
- 📱 Modern web interface with responsive design
- 🌙 Dark mode support
- 📦 Easy Docker deployment
- 🔒 End-to-end encryption of TOTP secrets
- 📋 Import/Export (JSON, otpauth URI)
- 🛡️ **Full 2FA support** - Secure login with mandatory or optional 2FA
- 💾 Backup codes for account recovery
- 🎨 Clean, modern UI with custom branding


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

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Generate secure secrets:**
```bash
# JWT Secret (copy the output)
openssl rand -base64 32

# Encryption Key (copy the output)
openssl rand -hex 16
```

4. **Edit `.env` file:**
```bash
nano .env
```

Replace the following values:
- `POSTGRES_PASSWORD`: Set a strong database password
- `JWT_SECRET`: Paste the JWT secret from step 3
- `ENCRYPTION_KEY`: Paste the encryption key from step 3  
- `DATABASE_URL`: Update with the same password as POSTGRES_PASSWORD

Example:
```env
POSTGRES_PASSWORD=my_secure_password_here
JWT_SECRET=1NRBJQja1Q1qjOw7LRXu2hDvm74HA5GbRWJ3yaL9GqM=
ENCRYPTION_KEY=91797e61a84e73c9dd5f78161f568ae4
DATABASE_URL=postgresql://totp:my_secure_password_here@postgres:5432/totp
```

5. **Start the application:**
```bash
docker compose up -d
```

6. **Access the application:**

Open http://localhost:5173 in your browser

**Important Notes:**
- The `.env` file is ignored by git and won't be overwritten during updates
- Always backup your `.env` file before major updates
- Keep your secrets secure and never commit them to version control

## 📦 Updating

To update to the latest version:
```bash
git pull
docker compose down
docker compose up -d --build
```

Your `.env` file and database will be preserved during updates.

## ⚙️ Configuration

### Environment Variables

Backend configuration in `docker-compose.yml`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REQUIRE_2FA_ON_REGISTER` | Force 2FA setup during registration | `"true"` | No |
| `JWT_SECRET` | Secret for JWT token signing | - | Yes |
| `ENCRYPTION_KEY` | Key for encrypting TOTP secrets (must be 32 chars) | - | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |

### Ports

- **5173** - Web interface
- **3000** - Backend API

### Configuring 2FA Behavior

**Mandatory 2FA (default):**
```yaml
REQUIRE_2FA_ON_REGISTER: "true"
```
Users must set up 2FA during registration with QR code and backup codes.

**Optional 2FA:**
```yaml
REQUIRE_2FA_ON_REGISTER: "false"
```
Users can enable 2FA later in Settings.

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

## 🔐 2FA Features

### Registration with 2FA
- Scan QR code with any authenticator app
- Receive 10 backup codes for emergency access
- Verify setup with 6-digit code

### Login with 2FA
- Enter email and password
- Automatically prompted for 2FA code
- Use backup codes if authenticator unavailable

### Managing 2FA
- Enable/disable 2FA in Settings
- Generate new backup codes
- Requires password + current 2FA code to disable

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

### Can't login after enabling 2FA

1. Use one of your backup codes instead of TOTP code
2. If no backup codes, you'll need to reset the database
3. Always save backup codes in a safe place!

### Clear cache issues

1. Clear browser cache and localStorage
2. Try incognito/private browsing mode
3. Check browser console for errors

## 🛠️ Development

### Project Structure
```
totp-sync/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── middleware/ # Auth & validation
│   └── Dockerfile
├── web/              # React + Vite frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page views
│   │   ├── services/   # API client
│   │   └── store/      # State management
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

## 📝 Changelog

### v0.2.0-beta (Latest)
- ✅ **Fixed 2FA login functionality** - Now working correctly
- ✅ **Fixed registration with 2FA** - Proper pendingData handling
- ✅ **Improved UI** - Removed unnecessary icons, added custom branding
- ✅ **Better error handling** - Clear error messages and validation
- ✅ **Code cleanup** - Removed unused dependencies

### v0.1.0-alpha
- Initial release
- Basic TOTP generation
- Docker setup

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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

<p align="center">Made with ❤️ by <a href="https://github.com/PrzemekSkw">PrzemekSkw</a></p>

<p align="center">
  <sub>Secure your accounts with self-hosted 2FA</sub>
</p>
