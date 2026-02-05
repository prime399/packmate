<p align="center">
  <img src="https://api.iconify.design/mdi/package-variant-closed.svg?color=%230ea5e9&width=80&height=80" alt="Packmate Logo" width="80" height="80">
</p>

<h1 align="center">Packmate</h1>

<p align="center">
  Cross-platform package installation script generator for Windows, macOS, and Linux
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js 16"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/React-19-61DAFB.svg" alt="React 19"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg" alt="TypeScript 5"></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Tailwind-4-06B6D4.svg" alt="Tailwind CSS 4"></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Supported Package Managers](#supported-package-managers)
- [Package Verification System](#package-verification-system)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Packmate is a web application that generates ready-to-run installation scripts for software packages across multiple operating systems and package managers. Users select applications from a curated catalog of 180+ apps across 15 categories, choose their preferred OS and package manager, and receive optimized shell commands for batch installation.

---

## Features

- Multi-OS Support: Windows, macOS, and Linux with native package manager integration
- 11 Package Managers: Winget, Chocolatey, Scoop, Homebrew, MacPorts, APT, DNF, Pacman, Zypper, Flatpak, and Snap
- 180+ Applications: Curated catalog across 15 categories including browsers, development tools, media, gaming, and more
- Package Verification: Automated verification system with MongoDB backend to validate package availability
- Terminal Preview: Copy or download generated scripts with syntax highlighting
- Keyboard Navigation: Full keyboard support with vim-style shortcuts
- Dark/Light Theme: System-aware theming with manual toggle
- Accessibility: WCAG-compliant with focus management and screen reader support
- Admin Panel: Review and manage flagged packages through a dedicated interface

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion, GSAP |
| Icons | Lucide React |
| Database | MongoDB |
| Testing | Vitest, Testing Library, fast-check |
| Linting | ESLint 9 |

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher
- MongoDB instance (local or Atlas) for verification features

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/packmate.git
cd packmate
```

2. Install dependencies:

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB connection string (required for verification features)
MONGODB_URI=mongodb://localhost:27017/packmate

# Optional: Admin authentication
ADMIN_SECRET=your-admin-secret
```

<details>
<summary>Environment Variable Reference</summary>

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string for package verification storage |
| `ADMIN_SECRET` | No | Secret key for admin panel authentication |
| `CRON_SECRET` | No | Secret for scheduled verification jobs |

</details>

### Running the Application

<details>
<summary>Development Server</summary>

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

</details>

<details>
<summary>Production Build</summary>

```bash
pnpm build
pnpm start
```

</details>

<details>
<summary>Linting</summary>

```bash
pnpm lint
```

</details>

---

## Project Structure

```
packmate/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Main application page
│   │   ├── admin/              # Admin review panel
│   │   └── api/                # API routes
│   │       ├── admin/          # Admin endpoints
│   │       ├── cron/           # Scheduled verification
│   │       ├── verification-status/
│   │       └── verify/         # Package verification
│   ├── components/             # React components
│   │   ├── admin/              # Admin panel components
│   │   ├── app/                # App cards and categories
│   │   ├── command/            # Command footer and terminal
│   │   ├── common/             # Shared UI components
│   │   ├── header/             # Header navigation
│   │   ├── os/                 # OS selector
│   │   ├── packageManager/     # Package manager selector
│   │   ├── search/             # Search functionality
│   │   ├── ui/                 # Theme toggle
│   │   └── verification/       # Verification badges
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Business logic
│   │   ├── data.ts             # App catalog and configuration
│   │   ├── db/                 # MongoDB connection
│   │   ├── scripts/            # Per-manager script generators
│   │   ├── search.ts           # Search algorithm
│   │   └── verification/       # Verification service
│   └── __tests__/              # Test files
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── docker-compose.yml
```

---

## Supported Package Managers

### Windows

| Manager | Description |
|---------|-------------|
| Winget | Microsoft's official package manager |
| Chocolatey | Community-driven package manager |
| Scoop | Command-line installer for Windows |

### macOS

| Manager | Description |
|---------|-------------|
| Homebrew | The missing package manager for macOS |
| MacPorts | Open-source package management system |

### Linux

| Manager | Distribution |
|---------|--------------|
| APT | Debian, Ubuntu |
| DNF | Fedora, RHEL |
| Pacman | Arch Linux |
| Zypper | openSUSE |
| Flatpak | Universal (sandboxed) |
| Snap | Universal (Canonical) |

---

## Package Verification System

Packmate includes an automated verification system that checks package availability across all supported package managers.

### How It Works

1. Verification jobs run on a scheduled basis via cron endpoints
2. Each package manager has a dedicated verifier that queries the respective repository
3. Results are stored in MongoDB with timestamps and status information
4. The UI displays verification badges indicating package availability

### Verification Statuses

| Status | Description |
|--------|-------------|
| Verified | Package confirmed available in repository |
| Unverified | Package not yet checked or check pending |
| Flagged | Package reported as unavailable or problematic |

---

## Testing

Packmate uses Vitest for unit and integration testing with Testing Library for component tests.

<details>
<summary>Run All Tests</summary>

```bash
pnpm test
```

</details>

<details>
<summary>Watch Mode</summary>

```bash
pnpm test:watch
```

</details>

<details>
<summary>Test Coverage</summary>

Tests are organized to mirror the source structure:

- `src/__tests__/components/` - Component tests
- `src/__tests__/hooks/` - Hook tests
- `src/__tests__/lib/` - Library and utility tests
- `src/__tests__/api/` - API route tests

</details>

---

## Docker Deployment

<details>
<summary>Using Docker Compose</summary>

```bash
docker-compose up -d
```

This starts the application with a MongoDB instance.

</details>

<details>
<summary>Building the Image</summary>

```bash
docker build -t packmate .
docker run -p 3000:3000 -e MONGODB_URI=your-mongodb-uri packmate
```

</details>

---

## FAQ

<details>
<summary>What operating systems are supported?</summary>

Packmate supports Windows, macOS, and Linux. Each OS has multiple package manager options to choose from based on your preference and system configuration.

</details>

<details>
<summary>How do I add a new application to the catalog?</summary>

Applications are defined in `src/lib/data.ts`. Each app requires:
- Unique ID
- Name and description
- Category assignment
- Icon URL
- Target mappings for each supported package manager

Submit a pull request with your additions following the existing data structure.

</details>

<details>
<summary>Why is a package showing as unavailable for my package manager?</summary>

Not all packages are available in every repository. When a package is unavailable, Packmate displays an explanation with alternative installation methods such as direct downloads or alternative package managers.

</details>

<details>
<summary>How does the verification system work?</summary>

The verification system periodically queries package repositories to confirm package availability. Results are cached in MongoDB and displayed as badges in the UI. Packages that fail verification are flagged for admin review.

</details>

<details>
<summary>Can I use Packmate offline?</summary>

The main application requires an internet connection to load. However, once you generate an installation script, you can save it locally and run it offline (assuming the package manager can access its repositories).

</details>

<details>
<summary>How do I report an incorrect package mapping?</summary>

If you find a package that is incorrectly mapped or no longer available, please open an issue on GitHub with:
- The application name
- The package manager
- The expected vs actual behavior

</details>

<details>
<summary>Is there keyboard navigation support?</summary>

Yes. Packmate supports full keyboard navigation:
- `Tab` / `Shift+Tab` - Navigate between elements
- `Enter` / `Space` - Select items
- `Escape` - Close modals
- Arrow keys - Navigate within lists

</details>

<details>
<summary>How do I access the admin panel?</summary>

The admin panel is available at `/admin` and requires authentication via the `ADMIN_SECRET` environment variable. It provides tools for reviewing flagged packages and managing verification status.

</details>

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Ensure all tests pass (`pnpm test`)
5. Run linting (`pnpm lint`)
6. Submit a pull request

For major changes, please open an issue first to discuss the proposed changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with Next.js, React, and TypeScript
</p>
