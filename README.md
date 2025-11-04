## 📖 About
...

<p align="center">
  <img src="assets/logo.png" alt="TOTP Sync Logo" width="150">
</p>

<h1 align="center">TOTP Sync</h1>

<p align="center">
  Self-hosted two-factor authentication (2FA) app with web interface and cross-device synchronization.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-yellow?style=for-the-badge" alt="Beta Status">
  <img src="https://img.shields.io/badge/version-0.5.0--beta-green?style=for-the-badge" alt="Version">
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

## 📺 Live Demo

https://github.com/user-attachments/assets/32998f57-b0a3-4819-bd77-6f8da26fc392.webm

*live demo: login → dashboard → add token*

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
- **WebAuthn/Passkey support** - Passwordless login with biometrics (Touch ID, Face ID, Windows Hello)
- **Security key authentication** - YubiKey, Titan, and other FIDO2 hardware keys
- **Cross-device authentication** - Scan QR code with phone to login from desktop
- **Mandatory 2FA** - Optional account protection during registration
- **Backup codes** - 10 emergency codes per account for recovery
- **JWT authentication** - Secure 30-day session tokens
- **Registration control** - Enable/disable new user signups

### 🔑 WebAuthn Features
- **Passwordless login** - Use biometrics or security keys instead of passwords
- **Multiple authenticators** - Register YubiKey, Touch ID, Android biometrics simultaneously
- **Cross-platform support** - Works on desktop, mobile, and hardware keys
- **Platform authenticators** - Touch ID (Mac/iOS), Face ID (iOS), Windows Hello
- **Roaming authenticators** - YubiKey, Google Titan, USB security keys
- **QR code authentication** - Scan with phone to authenticate on desktop
- **Security key management** - Add, rename, and remove keys in Settings

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
- **PostgreSQL or SQLite** - Choose your preferred database

### �� Deployment
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

**Optional WebAuthn configuration (for passwordless login):**
```env
RP_NAME="TOTP Sync"
RP_ID="yourdomain.com"
ORIGIN="https://yourdomain.com"
```

**Note:** WebAuthn requires HTTPS in production. Use `localhost` for local testing.

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
- WebAuthn requires HTTPS in production (except localhost)

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
| `ALLOW_REGISTRATION` | Enable/disable new user registration | `"true"` | No |
| `JWT_SECRET` | Secret for JWT token signing | - | Yes |
| `ENCRYPTION_KEY` | Key for encrypting TOTP secrets (must be 32 chars) | - | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `RP_NAME` | WebAuthn relying party name | `"TOTP Sync"` | No |
| `RP_ID` | WebAuthn relying party ID (your domain) | `"localhost"` | No |
| `ORIGIN` | WebAuthn origin (full URL with protocol) | `"http://localhost:5173"` | No |

### WebAuthn Configuration

For passwordless authentication to work properly:

**Local Development:**
```env
RP_ID="localhost"
ORIGIN="http://localhost:5173"
```

**Production:**
```env
RP_ID="yourdomain.com"
ORIGIN="https://yourdomain.com"
```

**Important:**
- `RP_ID` must match your domain (without protocol or port)
- `ORIGIN` must be the full URL users access
- HTTPS is required in production (localhost works with HTTP)
- Create `.well-known/webauthn` file for domain verification

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

### Controlling User Registration

**Open Registration (default):**
```yaml
ALLOW_REGISTRATION: "true"
```
Anyone can create a new account.

**Closed Registration:**
```yaml
ALLOW_REGISTRATION: "false"
```
New user registration is disabled. Only existing users can login.

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **Always change default passwords** - Generate strong, unique passwords
2. **Generate new secrets** - Never use example secrets in production
3. **Use HTTPS in production** - Required for WebAuthn, recommended for all traffic
4. **Store backup codes safely** - Save them in a secure password manager
5. **Regular backups** - Back up the PostgreSQL volume regularly
6. **Keep updated** - Pull latest changes and rebuild regularly
7. **WebAuthn best practices** - Register multiple authenticators (YubiKey + biometrics)

### Production Deployment

For production use:
- Use a reverse proxy with SSL/TLS certificates
- Configure WebAuthn with your domain
- Change default ports
- Use Docker secrets for sensitive values
- Set up monitoring and logging
- Regular security updates
- Consider disabling registration after initial setup

## 🔐 2FA Features

### Registration with 2FA
- Scan QR code with any authenticator app
- Receive 10 backup codes for emergency access
- Verify setup with 6-digit code before account creation

### Login with 2FA
- Enter email and password
- Automatically prompted for 2FA code when enabled
- Use backup codes if authenticator unavailable

### Login with WebAuthn/Passkeys
- **Platform authenticators:** Touch ID, Face ID, Windows Hello
- **Roaming authenticators:** YubiKey, Google Titan, USB keys
- **Cross-device:** Scan QR code with phone to login from desktop
- **No passwords needed:** Completely passwordless authentication

### Managing 2FA
- Enable/disable 2FA in Settings
- Generate new backup codes
- Requires password + current 2FA code to disable

### Managing Security Keys
- Add multiple authenticators (YubiKey, Touch ID, phone)
- Name your keys for easy identification
- Remove keys you no longer use
- See last used date for each key

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

### WebAuthn not working

1. **Check HTTPS:** WebAuthn requires HTTPS (except localhost)
2. **Verify RP_ID:** Must match your domain exactly
3. **Check browser support:** Use Chrome, Firefox, Safari, or Edge (latest versions)
4. **Clear browser data:** Sometimes cached credentials cause issues
5. **Check .well-known/webauthn:** File must be accessible and return JSON

### Security key not recognized

1. Ensure key is FIDO2/WebAuthn compatible
2. Try a different USB port
3. Update key firmware if available
4. Check browser permissions

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
│   ├── public/
│   │   └── .well-known/webauthn  # WebAuthn domain verification
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

### v0.5.0-beta (Latest)
- ✨ **WebAuthn/Passkey support** - Passwordless login with biometrics and security keys
- ✨ **Cross-device authentication** - Scan QR code with phone to login from desktop
- ✨ **Security key management** - Add/remove YubiKey, Touch ID, Windows Hello in Settings
- ✨ **Registration control** - `ALLOW_REGISTRATION` environment variable
- 🔒 **Enhanced security** - FIDO2/WebAuthn standard support
- 📱 **Platform authenticators** - Touch ID, Face ID, Windows Hello, Android biometrics
- 🔑 **Roaming authenticators** - YubiKey, Google Titan, USB security keys
- 🌐 **.well-known/webauthn** - Domain verification support
- 📚 **Updated documentation** - WebAuthn setup guide and troubleshooting

### v0.4.0-beta
- 🔒 **Security upgrade** - Migrated to Node.js native crypto module
- 🔐 **AES-256-GCM encryption** - Upgraded from AES-256-CBC with authentication
- 🗄️ **SQLite support** - Choose between PostgreSQL and SQLite
- 🐳 **Node.js 20** - Updated runtime for better performance
- ✅ **Zero vulnerabilities** - Clean npm security audit
- ⚠️ **Breaking change** - Encryption system overhaul (migration required)

### v0.3.0-beta
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

## 🎯 Roadmap

### v1.0.0 (Planned)
- 📱 **Mobile app** - Native iOS and Android applications
- 🔄 **Push notifications** - Real-time sync alerts
- 🌍 **Multi-language support** - Internationalization
- 📊 **Usage statistics** - Analytics dashboard
- 🔐 **Advanced security** - Rate limiting, IP whitelisting

### Future Features
- 📂 **Folders/Categories** - Organize TOTP entries
- 🏷️ **Tags** - Label and filter entries
- 🔍 **Advanced search** - Regex and filters
- 📤 **Auto-backup** - Scheduled exports
- 🎨 **Themes** - Custom color schemes

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
