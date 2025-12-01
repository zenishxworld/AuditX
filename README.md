# AuditX

> A comprehensive blockchain audit and wallet security platform built with modern web technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-blue)](https://vitejs.dev/)

## Overview

AuditX is a full-stack blockchain security platform designed to help users audit smart contracts, scan blockchain addresses, and inspect cryptocurrency wallets. The application provides an intuitive dashboard with real-time analytics and comprehensive security reports.

## Features

- **Smart Contract Audit** - Analyze and audit smart contracts for vulnerabilities
- **Blockchain Scanner** - Scan blockchain addresses and transactions
- **Wallet Inspector** - Inspect and validate cryptocurrency wallets
- **Security Dashboard** - Real-time security metrics and analytics
- **User Authentication** - Secure authentication with protected routes
- **Responsive Design** - Mobile-friendly interface with dark mode support

## Live Demo

🌐 **Visit:** [https://auditx.netlify.app/](https://auditx.netlify.app/)

## Tech Stack

### Frontend
- **React 18.3** - Modern UI library
- **TypeScript 5.5** - Type-safe development
- **Vite 6.3** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Efficient form handling

### Backend & Services
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Database

### Development Tools
- **ESLint** - Code linting
- **Node.js** - JavaScript runtime
- **npm/Bun** - Package management

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Layout          # Main layout wrapper
│   ├── ProtectedRoute  # Authentication wrapper
│   └── ui/             # shadcn/ui components
├── pages/              # Route components
│   ├── Index           # Home page
│   ├── Audit           # Smart contract audit page
│   ├── Scanner         # Blockchain scanner
│   ├── WalletInspector # Wallet inspection tool
│   ├── Dashboard       # User dashboard
│   ├── Pricing         # Pricing page
│   ├── Docs            # Documentation
│   └── NotFound        # 404 page
├── contexts/           # React context providers
│   └── AuthContext     # Authentication context
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── integrations/       # External integrations
│   └── supabase/       # Supabase client
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or Bun package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zenishxworld/AuditX.git
   cd AuditX
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   
   The application will be available at `http://localhost:5173`

## Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## Deployment

AuditX is configured for deployment on multiple platforms:

### Netlify (Current)
The project is deployed on Netlify with automatic builds from the main branch.

- **Live URL:** https://auditx.netlify.app/
- **Configuration:** `vercel.json` (compatible with Netlify)

### Local Preview
```bash
npm run build
npm run preview
```

## API Routes

- `GET /` - Home page
- `GET /audit` - Smart contract audit (protected)
- `GET /scanner` - Blockchain scanner (protected)
- `GET /wallet-inspector` - Wallet inspection (protected)
- `GET /dashboard` - User dashboard (protected)
- `GET /dashboard/:tab` - Dashboard with specific tab (protected)
- `GET /pricing` - Pricing page
- `GET /docs` - Documentation

## Authentication

AuditX uses Supabase authentication to manage user access:

- Protected routes require user authentication
- Authentication context is available throughout the app
- User sessions are persisted in browser storage

## Development Workflow

### Editing Code

**Using your IDE:**
1. Clone the repository
2. Make changes locally
3. Push to GitHub
4. Changes are reflected on Lovable and deployed to production

**Using GitHub Web Editor:**
1. Navigate to desired file
2. Click the edit (pencil) icon
3. Make changes and commit

**Using GitHub Codespaces:**
1. Go to Code > Codespaces > New codespace
2. Edit files in the web-based VS Code
3. Commit changes directly

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Zenish Patel** - [@zenishxworld](https://github.com/zenishxworld)

## Acknowledgments

- [Lovable](https://lovable.dev/) - Initial project scaffold
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Backend services

## Support

For support, reach out through:
- GitHub Issues
- GitHub Discussions
- Email: contact@auditx.app

## Roadmap

- [ ] Advanced vulnerability detection
- [ ] Multi-chain support
- [ ] API endpoints
- [ ] Mobile application
- [ ] Real-time notifications
- [ ] AI-powered analysis

---

**Last Updated:** December 2025
