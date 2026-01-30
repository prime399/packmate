# Project Structure

## Workspace Layout
```
/
├── tuxmate/          # Linux-focused installer generator
├── packmate/         # Cross-platform installer generator
└── .kiro/            # Kiro configuration & specs
```

## TuxMate Structure
```
tuxmate/src/
├── app/                      # Next.js App Router
├── components/               # React components by domain
│   ├── app/                  # App cards & category sections
│   ├── command/              # Footer command bar & drawer
│   ├── common/               # Shared UI (Tooltip, LoadingSkeleton)
│   ├── distro/               # Distribution selector
│   ├── header/               # Header links
│   ├── search/               # Search overlay
│   └── ui/                   # Theme toggle
├── hooks/                    # useLinuxInit, useKeyboardNavigation, useTheme
├── lib/                      # Business logic
│   ├── data.ts               # App catalog, distros, categories
│   ├── scripts/              # Per-distro script generators
│   └── utils.ts
└── __tests__/
```

## Packmate Structure
```
packmate/src/
├── app/
│   ├── page.tsx              # Main page
│   ├── admin/page.tsx        # Admin review panel
│   └── api/                  # API routes
│       ├── admin/flagged/    # Flagged packages endpoint
│       ├── cron/verify/      # Scheduled verification
│       ├── verification-status/
│       └── verify/[appId]/
├── components/
│   ├── admin/                # AdminReviewPanel
│   ├── app/                  # AppItem, AppIcon, CategorySection
│   ├── command/              # CommandFooter, ShortcutsBar, TerminalPreviewModal
│   ├── common/               # Modal, Tooltip, LoadingSkeleton
│   ├── header/               # GitHubLink, HowItWorks, ContributeLink
│   ├── os/                   # OSSelector, OSSelectorModal
│   ├── packageManager/       # PackageManagerSelector, PackageManagerSelectorModal
│   ├── ui/                   # ThemeToggle
│   └── verification/         # VerificationBadge, VerificationTooltip
├── hooks/
│   ├── usePackmateInit.ts    # Main app state (OS, package manager, apps)
│   ├── useFocusTrap.ts       # Modal focus management
│   ├── useKeyboardNavigation.ts
│   ├── useTheme.tsx
│   ├── useTooltip.ts
│   └── useVerificationStatus.ts
├── lib/
│   ├── data.ts               # OS, package managers, apps catalog
│   ├── generateInstallScript.ts
│   ├── scripts/              # Per-package-manager generators
│   │   ├── apt.ts, dnf.ts, pacman.ts, zypper.ts
│   │   ├── homebrew.ts, macports.ts
│   │   ├── winget.ts, chocolatey.ts, scoop.ts
│   │   ├── flatpak.ts, snap.ts
│   │   └── shared.ts         # Shell escaping utilities
│   ├── db/                   # MongoDB connection
│   ├── verification/         # Package verification system
│   │   ├── service.ts
│   │   ├── types.ts
│   │   └── verifiers/        # Per-manager verifiers
│   └── utils.ts
└── __tests__/                # Mirrors src structure
```

## Key Patterns

### Path Aliases
Use `@/` for imports from `src/`:
```typescript
import { usePackmateInit } from '@/hooks/usePackmateInit';
import { apps, packageManagers } from '@/lib/data';
```

### Component Organization
- Components grouped by feature domain
- Each domain folder has `index.ts` barrel export
- Memoize expensive components with `memo()`

### State Management
- TuxMate: `useLinuxInit` hook
- Packmate: `usePackmateInit` hook
- localStorage persistence for user preferences
- Hydration check (`isHydrated`) prevents flash

### Data Flow
- `data.ts` defines apps with `targets` mapping package managers to package names
- `scripts/` folder contains per-manager script generators
- `generateInstallScript.ts` routes to correct generator
