# Tech Stack

## Core Framework
- Next.js 16 (App Router)
- React 19
- TypeScript 5 (strict mode)

## Styling
- Tailwind CSS 4
- CSS custom properties for theming (`--bg-primary`, `--text-primary`, etc.)
- `clsx` + `tailwind-merge` for conditional classes

## Animation
- Framer Motion - React animations
- GSAP - Complex timeline animations (header reveal)

## UI
- Lucide React - Icon library
- Custom tooltip system with delay support
- Keyboard navigation hooks
- Modal system with focus trapping

## Database (Packmate only)
- MongoDB - Package verification storage
- Environment variable: `MONGODB_URI`

## Testing
- Vitest - Test runner
- Testing Library (React + jest-dom)
- fast-check - Property-based testing
- jsdom environment
- Tests in `src/__tests__/`

## Build & Lint
- ESLint 9 with Next.js config
- PostCSS with Tailwind plugin

## Deployment
- Docker support with multi-stage builds
- Cloudflare Workers (TuxMate)

---

## Common Commands

### TuxMate (in `tuxmate/` directory)
```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm test             # Run tests (vitest run)
npm run test:watch   # Watch mode
npm run lint         # ESLint check
```

### Packmate (in `packmate/` directory)
```bash
pnpm dev             # Dev server
pnpm build           # Production build
pnpm test            # Run tests (vitest run)
pnpm test:watch      # Watch mode (vitest)
pnpm lint            # ESLint check
```

### Docker
```bash
docker-compose up -d  # Start with docker-compose
```
