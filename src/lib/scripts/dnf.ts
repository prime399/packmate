// DNF script generator for Fedora
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate DNF installation script for Fedora
 * Requirements: 5.1
 */
export function generateDnfScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'dnf');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for DNF
echo "No packages selected"
exit 0
`;
  }

  // Check if any packages need RPM Fusion
  const rpmFusionPkgs = ['steam', 'vlc', 'ffmpeg', 'obs-studio'];
  const needsRpmFusion = packages.some(p => rpmFusionPkgs.includes(p.pkg));

  const installCalls = packages
    .map(({ app, pkg }) => `install_pkg "${escapeShellString(app.name)}" "${pkg}"`)
    .join('\n');

  return (
    generateAsciiHeader('DNF (Fedora)', packages.length) +
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
    if output=$(with_retry sudo dnf install -y "$pkg" 2>&1); then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        if echo "$output" | grep -q "No match"; then
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
command -v dnf &>/dev/null || {
    error "DNF not found. This script is for Fedora-based systems."
    exit 1
}

${needsRpmFusion ? `
# Enable RPM Fusion for multimedia packages
if ! dnf repolist 2>/dev/null | grep -q rpmfusion; then
    info "Enabling RPM Fusion..."
    sudo dnf install -y \\
        "https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm" \\
        "https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm" \\
        >/dev/null 2>&1 && success "RPM Fusion enabled" || warn "RPM Fusion setup failed"
fi
` : ''}

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
 * Generate simple one-liner command for DNF
 */
export function generateDnfCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'dnf');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const packageNames = packages.map(p => p.pkg).join(' ');
  return `sudo dnf install -y ${packageNames}`;
}
