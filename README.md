<p align="center">
  <img src="assets/logo.png" alt="TOTP Sync Logo" width="150">
</p>

<h1 align="center">TOTP Sync</h1>

<p align="center">
  Self-hosted two-factor authentication (2FA) app with web interface and cross-device synchronization.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-yellow?style=for-the-badge" alt="Beta Status">
  <img src="https://img.shields.io/badge/version-0.3.0--beta-green?style=for-the-badge" alt="Version">
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

### 🔐 Security & Authentication
- **Secure TOTP generation** - Compatible with Google Authenticator, Authy, 1Password, etc.
- **End-to-end encryption** - TOTP secrets encrypted with AES-256
- **Mandatory 2FA** - Optional account protection during registration
- **Backup codes** - 10 emergency codes per account for recovery
- **JWT authentication** - Secure 30-day session tokens

### 🔍 Search & Organization
- **Live search** - Instant filtering as you type
- **Multi-field search** - Find by account name or issuer/app name
- **Result counter** - Shows "X of Y" matches
- **Expandable search bar** - Smooth animations in navbar
- **Perfect for 100+ entries** - Fast client-side filtering

### 🎨 User Interface
- **Modern design** - Clean, intuitive interface
- **Dark mode** - Automatic or manual theme switching
- **Responsive layout** - Works on desktop, tablet, and mobile browsers
- **Progress indicators** - Visual countdown for code expiration
- **Hide codes** - Optional privacy mode (auto-hide after 10 seconds)
- **Bulk operations** - Select and delete multiple entries

### 📋 Import & Export
- **JSON format** - Standard TOTP export compatible with most apps
- **otpauth URI** - Import from Google Authenticator, Authy, FreeOTP+, 2FAuth
- **Bulk import** - Add multiple accounts at once
- **Replace or merge** - Choose how to handle existing entries

### 🔄 Synchronization
- **Cross-device sync** - Access codes from any device via web browser
- **Self-hosted backend** - Full control over your data
- **PostgreSQL database** - Reliable and scalable storage

### 🐳 Deployment
- **Docker Compose** - One-command deployment
- **Easy updates** - Pull and rebuild without data loss
- **Environment variables** - Simple configuration
- **Reverse proxy ready** - Works with Nginx, Caddy, Traefik

## 🗄️ Database Options

TOTP Sync supports two database backends - choose based on your needs:

### PostgreSQL (Default)
**Best for:** Multi-user deployments, production environments, high availability
```env
DATABASE_TYPE=postgresql
POSTGRES_DB=totp_sync
POSTGRES_USER=totp_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://totp_user:your_password@postgres:5432/totp_sync
```

**Features:**
- ✅ Full ACID compliance
- ✅ Concurrent user support
- ✅ Advanced querying capabilities
- ✅ Battle-tested for production

### SQLite
**Best for:** Personal use, simple deployments, single-user setups
```env
DATABASE_TYPE=sqlite
SQLITE_PATH=/data/totp-sync.db
```

**Features:**
- ✅ Zero configuration
- ✅ Single file database
- ✅ Perfect for home labs
- ✅ Easy backups (just copy the file)

### Switching Databases

Simply change `DATABASE_TYPE` in your `.env` file and restart:
```bash
docker compose down
docker compose up -d
```

**Note:** Data is not automatically migrated between databases. Export your entries before switching.

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
- `ENCRYPTION_KEY`: Paste the encryption key from step 3 (must be exactly 32 characters)
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
- Verify setup with 6-digit code before account creation

### Login with 2FA
- Enter email and password
- Automatically prompted for 2FA code when enabled
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
4. Choose "Replace All" or "Merge" with existing entries
5. Your entries will be encrypted and synced

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
3. Check browser console for errors (F12)

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

### v0.3.0-beta (Latest)
- ✅ **Added search functionality** - Live filtering by account name and issuer
- ✅ **Expandable search bar** - Smooth animations with auto-focus
- ✅ **Result counter** - Shows "X of Y" matches when searching
- ✅ **Empty state** - Clear messaging when no results found
- ✅ **Performance** - Fast client-side filtering for 100+ entries

### v0.2.0-beta
- ✅ **Fixed 2FA login functionality** - Now working correctly
- ✅ **Fixed registration with 2FA** - Proper pendingData handling
- ✅ **Improved UI** - Removed unnecessary icons, added custom branding
- ✅ **Better error handling** - Clear error messages and validation

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
