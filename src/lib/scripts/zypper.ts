// Zypper script generator for openSUSE
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate Zypper installation script for openSUSE
 * Requirements: 5.1
 */
export function generateZypperScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'zypper');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for Zypper
echo "No packages selected"
exit 0
`;
  }

  const installCalls = packages
    .map(({ app, pkg }) => `install_pkg "${escapeShellString(app.name)}" "${pkg}"`)
    .join('\n');

  return (
    generateAsciiHeader('Zypper (openSUSE)', packages.length) +
    generateSharedUtils(packages.length) +
    `
# Check if package is already installed
is_installed() {
    rpm -q "$1" &>/dev/null
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
    if output=$(with_retry sudo zypper --non-interactive install --auto-agree-with-licenses "$pkg" 2>&1); then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        if echo "$output" | grep -q "not found"; then
            echo -e "    \${DIM}Package not found\${NC}"
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
command -v zypper &>/dev/null || {
    error "Zypper not found. This script is for openSUSE-based systems."
    exit 1
}

# Wait for zypper lock
while [ -f /var/run/zypp.pid ]; do
    warn "Waiting for zypper..."
    sleep 2
done

info "Refreshing repos..."
with_retry sudo zypper --non-interactive refresh >/dev/null && success "Refreshed" || warn "Refresh failed, continuing..."

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
 * Generate simple one-liner command for Zypper
 */
export function generateZypperCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'zypper');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const packageNames = packages.map(p => p.pkg).join(' ');
  return `sudo zypper install -y ${packageNames}`;
}
