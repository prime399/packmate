// MacPorts script generator for macOS
// Requirements: 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate MacPorts installation script
 * Requirement 5.1: Generate downloadable shell scripts for each package manager type
 */
export function generateMacPortsScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'macports');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for MacPorts
echo "No packages selected"
exit 0
`;
  }

  const installCalls = packages
    .map(
      ({ app, pkg }) =>
        `install_package "${escapeShellString(app.name)}" "${pkg}"`
    )
    .join('\n');

  return (
    generateAsciiHeader('MacPorts', packages.length) +
    generateSharedUtils(packages.length) +
    `
# MacPorts requires root for installation
if [ "$EUID" -ne 0 ]; then
    error "MacPorts requires root privileges. Please run with sudo."
    exit 1
fi

# Requirement 5.4: Check if package is already installed
is_installed() {
    local pkg=$1
    # port installed returns 0 if installed, 1 if not
    port installed "$pkg" 2>/dev/null | grep -q "is installed"
}

install_package() {
    local name=$1
    local pkg=$2

    CURRENT=$((CURRENT + 1))

    if is_installed "$pkg"; then
        skip "$name"
        SKIPPED+=("$name")
        return 0
    fi

    show_progress $CURRENT $TOTAL "$name"
    local start=$(date +%s)

    local output
    if output=$(with_retry port install "$pkg" 2>&1); then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"

        # Friendly error messages
        if echo "$output" | grep -q "Error: Port .* not found"; then
            echo -e "    \${DIM}Port not found\${NC}"
        elif echo "$output" | grep -q "Error: Unable to execute port"; then
            echo -e "    \${DIM}Port execution failed\${NC}"
        fi

        FAILED+=("$name")
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
#  Pre-flight
# ─────────────────────────────────────────────────────────────────────────────

# Requirement 5.8: Check if package manager is installed
command -v port &>/dev/null || {
    error "MacPorts not found."
    info "Install from https://www.macports.org/install.php"
    exit 1
}

info "MacPorts found"

info "Updating MacPorts..."
# Run selfupdate silently; on error warn but continue
port selfupdate >/dev/null 2>&1 && success "Updated" || warn "Update failed, continuing..."

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
 * Generate simple one-liner command for MacPorts
 */
export function generateMacPortsCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'macports');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const packageNames = packages.map((p) => p.pkg).join(' ');
  return `sudo port install ${packageNames}`;
}
