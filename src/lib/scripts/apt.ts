// APT script generator for Debian/Ubuntu
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate APT installation script for Debian/Ubuntu
 * Requirements: 5.1
 */
export function generateAptScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'apt');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for APT
echo "No packages selected"
exit 0
`;
  }

  const installCalls = packages
    .map(({ app, pkg }) => `install_pkg "${escapeShellString(app.name)}" "${pkg}"`)
    .join('\n');

  return (
    generateAsciiHeader('APT (Debian/Ubuntu)', packages.length) +
    generateSharedUtils(packages.length) +
    `
# Check if package is already installed
is_installed() {
    dpkg -l "$1" 2>/dev/null | grep -q "^ii"
}

# Fix broken dependencies
fix_deps() {
    if sudo apt-get --fix-broken install -y >/dev/null 2>&1; then
        success "Dependencies fixed"
        return 0
    fi
    return 1
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
    if output=$(with_retry sudo apt-get install -y "$pkg" 2>&1); then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        if echo "$output" | grep -q "Unable to locate"; then
            echo -e "    \${DIM}Package not found\${NC}"
        elif echo "$output" | grep -q "unmet dependencies"; then
            echo -e "    \${DIM}Fixing dependencies...\${NC}"
            if fix_deps; then
                if sudo apt-get install -y "$pkg" >/dev/null 2>&1; then
                    timing "$name" "$(($(date +%s) - start))"
                    SUCCEEDED+=("$name")
                    return 0
                fi
            fi
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
command -v apt-get &>/dev/null || {
    error "APT not found. This script is for Debian/Ubuntu-based systems."
    exit 1
}

# Wait for package manager lock
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    warn "Waiting for package manager..."
    sleep 2
done

info "Updating package lists..."
with_retry sudo apt-get update -qq >/dev/null && success "Updated" || warn "Update failed, continuing..."

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
 * Generate simple one-liner command for APT
 */
export function generateAptCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'apt');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const packageNames = packages.map(p => p.pkg).join(' ');
  return `sudo apt install -y ${packageNames}`;
}
