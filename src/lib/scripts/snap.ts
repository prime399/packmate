// Snap script generator for Linux
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate Snap installation script
 * Requirements: 4.4, 5.1
 * 
 * Handles --classic flags appropriately for packages that require it.
 * Packages with --classic suffix in their target will have the flag included.
 */
export function generateSnapScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'snap');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for Snap
echo "No packages selected"
exit 0
`;
  }

  // Generate install calls, handling --classic flag
  const installCalls = packages
    .map(({ app, pkg }) => {
      // Check if package has --classic flag
      if (pkg.includes('--classic')) {
        const snapName = pkg.replace(' --classic', '').replace('--classic ', '').trim();
        return `install_pkg "${escapeShellString(app.name)}" "${snapName}" "--classic"`;
      }
      return `install_pkg "${escapeShellString(app.name)}" "${pkg}" ""`;
    })
    .join('\n');

  return (
    generateAsciiHeader('Snap', packages.length) +
    generateSharedUtils(packages.length) +
    `
# Check if snap is already installed
is_installed() {
    local snap_name=$(echo "$1" | awk '{print $1}')
    snap list 2>/dev/null | grep -q "^$snap_name "
}

install_pkg() {
    local name=$1 pkg=$2 flags=$3
    CURRENT=$((CURRENT + 1))

    if is_installed "$pkg"; then
        skip "$name"
        SKIPPED+=("$name")
        return 0
    fi

    show_progress $CURRENT $TOTAL "$name"
    local start=$(date +%s)

    local output
    # Requirement 4.4: Handle --classic flags appropriately
    if [ -n "$flags" ]; then
        output=$(with_retry sudo snap install "$pkg" $flags 2>&1)
    else
        output=$(with_retry sudo snap install "$pkg" 2>&1)
    fi

    if [ $? -eq 0 ]; then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        if echo "$output" | grep -q "not found"; then
            echo -e "    \${DIM}Snap not found\${NC}"
        elif echo "$output" | grep -q "classic"; then
            echo -e "    \${DIM}Requires --classic flag\${NC}"
        fi
        FAILED+=("$name")
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
#  Pre-flight
# ─────────────────────────────────────────────────────────────────────────────

# Requirement 5.8: Check if package manager is installed
command -v snap &>/dev/null || {
    error "Snap not installed"
    info "Install: sudo apt/dnf/pacman install snapd"
    exit 1
}

# Ensure snapd service is running
if command -v systemctl &>/dev/null && ! systemctl is-active --quiet snapd; then
    info "Starting snapd..."
    sudo systemctl enable --now snapd.socket
    sudo systemctl start snapd
    sleep 2
    success "snapd started"
fi

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
 * Generate simple one-liner command for Snap
 * Requirement 4.4: Handle --classic flags appropriately
 * 
 * Groups classic and non-classic packages into separate commands.
 */
export function generateSnapCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'snap');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  // Separate classic and non-classic packages
  const classicPackages: string[] = [];
  const regularPackages: string[] = [];

  for (const { pkg } of packages) {
    if (pkg.includes('--classic')) {
      // Extract snap name without --classic flag
      const snapName = pkg.replace(' --classic', '').replace('--classic ', '').trim();
      classicPackages.push(snapName);
    } else {
      regularPackages.push(pkg);
    }
  }

  const commands: string[] = [];

  if (regularPackages.length > 0) {
    commands.push(`sudo snap install ${regularPackages.join(' ')}`);
  }

  // Classic packages need to be installed one at a time with --classic flag
  for (const pkg of classicPackages) {
    commands.push(`sudo snap install ${pkg} --classic`);
  }

  return commands.join(' && ');
}
