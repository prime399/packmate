// Pacman script generator for Arch Linux
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate Pacman installation script for Arch Linux
 * Requirements: 5.1
 */
export function generatePacmanScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'pacman');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for Pacman
echo "No packages selected"
exit 0
`;
  }

  const installCalls = packages
    .map(({ app, pkg }) => `install_pkg "${escapeShellString(app.name)}" "${pkg}"`)
    .join('\n');

  return (
    generateAsciiHeader('Pacman (Arch Linux)', packages.length) +
    generateSharedUtils(packages.length) +
    `
# Check if package is already installed
is_installed() {
    pacman -Qi "$1" &>/dev/null
}

install_pkg() {
    local name=$1 pkg=$2
    CURRENT=$((CURRENT + 1))

    if is_installed "$pkg"; then
        skip "$name"
        SKIPPED+=("$name")
        return 0
    fi

    show_progress $CURRENT $TOTAL "$name"
    local start=$(date +%s)

    local output
    if output=$(with_retry sudo pacman -S --needed --noconfirm "$pkg" 2>&1); then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        if echo "$output" | grep -q "target not found"; then
            echo -e "    \${DIM}Package not found\${NC}"
        elif echo "$output" | grep -q "signature"; then
            echo -e "    \${DIM}GPG issue - try: sudo pacman-key --refresh-keys\${NC}"
        fi
        FAILED+=("$name")
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
#  Pre-flight
# ─────────────────────────────────────────────────────────────────────────────

# Safety check: Don't run as root
[ "$EUID" -eq 0 ] && { error "Run as regular user, not root."; exit 1; }

# Requirement 5.8: Check if package manager is installed
command -v pacman &>/dev/null || {
    error "Pacman not found. This script is for Arch-based systems."
    exit 1
}

# Wait for pacman lock
while [ -f /var/lib/pacman/db.lck ]; do
    warn "Waiting for pacman lock..."
    sleep 2
done

info "Syncing databases..."
with_retry sudo pacman -Sy --noconfirm >/dev/null && success "Synced" || warn "Sync failed, continuing..."

# ─────────────────────────────────────────────────────────────────────────────
#  Installation
# ─────────────────────────────────────────────────────────────────────────────

echo
info "Installing $TOTAL packages"
echo

${installCalls}

print_summary
`
  );
}

/**
 * Generate simple one-liner command for Pacman
 */
export function generatePacmanCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'pacman');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const packageNames = packages.map(p => p.pkg).join(' ');
  return `sudo pacman -S --needed --noconfirm ${packageNames}`;
}
