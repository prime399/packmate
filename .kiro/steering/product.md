# Product Overview

This workspace contains two Next.js projects for generating package installation scripts.

## TuxMate
Linux-focused package installer generator. Users select apps from 180+ options across 15 categories, choose their distro, and get ready-to-run install commands.

Key features:
- Multi-distro: Ubuntu, Debian, Arch, Fedora, openSUSE, Nix, Flatpak, Snap, Homebrew
- AUR helper detection for Arch, Nix unfree package handling
- Keyboard navigation (vim-style), dark/light theme, PWA support

## Packmate
Cross-platform package installer generator supporting Windows, macOS, and Linux.

Key features:
- OS support: Windows (Winget, Chocolatey, Scoop), macOS (Homebrew, MacPorts), Linux (APT, DNF, Pacman, Zypper, Flatpak, Snap)
- Package verification system with MongoDB backend
- Admin panel for reviewing flagged packages
- Modal-based OS and package manager selection
- Terminal preview with copy/download functionality
- GSAP animations for header reveal
- Keyboard shortcuts and accessibility features
