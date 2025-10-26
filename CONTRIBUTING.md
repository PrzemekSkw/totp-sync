# 🤝 Contributing to TOTP Sync

Thank you for your interest in contributing to TOTP Sync!

## 🌟 How Can You Help?

### 1. Bug Reports

If you found a bug:
- Check if it hasn't been reported in [Issues](https://github.com/PrzemekSkw/totp-sync/issues)
- Open a new issue with:
  - What happened (actual behavior)
  - What should happen (expected behavior)
  - Steps to reproduce
  - Your environment (OS, Node.js version, browser)
  - Screenshots if possible

### 2. Feature Requests

Have an idea for a new feature?
- Open an issue with `enhancement` tag
- Describe in detail:
  - What problem does this feature solve
  - How should it work
  - Is this a breaking change

### 3. Pull Requests

Want to contribute code?

#### Before you start:
1. Fork the repository
2. Create a branch for your change: `git checkout -b feature/feature-name`
3. Check if there isn't a similar PR already

#### Requirements:
- Code must be readable and well-commented
- Follow existing code style
- Test your changes
- Update documentation if needed

#### Process:
1. Make changes in your branch
2. Commit with clear message: `git commit -m "feat: add PDF export"`
3. Push: `git push origin feature/feature-name`
4. Open a Pull Request with description of changes

### 4. Documentation

Help improve documentation:
- README.md
- Code comments
- Usage examples
- Translations

### 5. Testing

- Test the app on different platforms
- Report compatibility issues
- Suggest UX improvements

## 📋 Conventions

### Git Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation changes
- `style:` - formatting, semicolons, etc.
- `refactor:` - code refactoring
- `test:` - adding tests
- `chore:` - maintenance (dependency updates, etc.)

Examples:
```
feat: add export to JSON
fix: resolve sync conflict on Android
docs: update installation guide
```

### Code Style

- **JavaScript/Node.js**: Standard ES6+ conventions
- **React**: Functional components + hooks
- **CSS**: BEM or utility-first (Tailwind)
- Indentation: 2 spaces (no tabs)

## 🔧 Development Environment Setup
```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/totp-sync.git
cd totp-sync

# 2. Install dependencies
npm install

# 3. Backend
cd backend
npm install
npm run dev

# 4. Frontend (new terminal window)
cd web
npm install
npm run dev

# 5. Open http://localhost:5173
```

## 🧪 Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd web
npm test

# Integration tests
npm run test:e2e
```

## 🏗️ Project Structure
```
totp-sync/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── middleware/
├── web/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
├── docs/             # GitHub Pages
└── docker-compose.yml
```

## 🔒 Security

If you discover a security vulnerability:
- **DO NOT** open a public issue
- Email directly: [your-email@example.com]
- We'll respond within 48 hours

## 📞 Questions?

- Open a [Discussion](https://github.com/PrzemekSkw/totp-sync/discussions)
- Create an issue with `question` tag
- Check the [README](README.md)

## ✅ Code Review Process

1. Automated checks (linting, tests) must pass
2. At least one maintainer review required
3. Changes requested? Update your PR
4. Approved? We'll merge it!

## 🎯 Good First Issues

New to the project? Look for issues tagged with:
- `good first issue`
- `help wanted`
- `beginner-friendly`

## 📜 License

Your contribution will be licensed under MIT - same as the project.

## 🙏 Thank You!

Every contribution, no matter how small, is valuable and appreciated!

---

**Thanks for helping improve TOTP Sync!** 🚀
