// Flatpak script generator for Linux
// Requirements: 4.4, 5.1

import {
  escapeShellString,
  getSelectedPackages,
  generateAsciiHeader,
  generateSharedUtils,
} from './shared';

/**
 * Generate Flatpak installation script
 * Requirements: 5.1
 * 
 * Uses parallel installation when 3+ packages are selected for faster installs.
 */
export function generateFlatpakScript(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'flatpak');

  if (packages.length === 0) {
    return `#!/bin/bash
# No packages selected for Flatpak
echo "No packages selected"
exit 0
`;
  }

  const parallel = packages.length >= 3;

  const installLogic = parallel
    ? `install_parallel ${packages.map(({ app, pkg }) => `"${escapeShellString(app.name)}|${pkg}"`).join(' ')}`
    : packages.map(({ app, pkg }) => `install_pkg "${escapeShellString(app.name)}" "${pkg}"`).join('\n');

  return (
    generateAsciiHeader('Flatpak', packages.length) +
    generateSharedUtils(packages.length) +
    `
# Check if app is already installed
is_installed() {
    flatpak list --app 2>/dev/null | grep -q "$1"
}

${parallel ? `
# Parallel install for Flatpak (faster for multiple packages)
install_parallel() {
    local pids=()
    local names=()
    local start=$(date +%s)

    for pair in "$@"; do
        local name="\${pair%%|*}"
        local appid="\${pair##*|}"

        if is_installed "$appid"; then
            skip "$name"
            SKIPPED+=("$name")
            continue
        fi

        (flatpak install flathub -y "$appid" >/dev/null 2>&1) &
        pids+=($!)
        names+=("$name")
    done

    local total=\${#pids[@]}
    local done_count=0

    if [ $total -eq 0 ]; then
        return
    fi

    info "Installing $total apps in parallel..."

    for i in "\${!pids[@]}"; do
        wait \${pids[$i]}
        local status=$?
        done_count=$((done_count + 1))

        if [ $status -eq 0 ]; then
            SUCCEEDED+=("\${names[$i]}")
            success "\${names[$i]}"
        else
            FAILED+=("\${names[$i]}")
            error "\${names[$i]} failed"
        fi
    done

    local elapsed=$(($(date +%s) - start))
    echo -e "\${DIM}Parallel install took \${elapsed}s\${NC}"
}
` : `
install_pkg() {
    local name=$1 appid=$2
    CURRENT=$((CURRENT + 1))

    if is_installed "$appid"; then
        skip "$name"
        SKIPPED+=("$name")
        return 0
    fi

    show_progress $CURRENT $TOTAL "$name"
    local start=$(date +%s)

    if with_retry flatpak install flathub -y "$appid" >/dev/null 2>&1; then
        local elapsed=$(($(date +%s) - start))
        update_avg_time $elapsed
        printf "\\r\\033[K"
        timing "$name" "$elapsed"
        SUCCEEDED+=("$name")
    else
        printf "\\r\\033[K\${RED}✗\${NC} %s\\n" "$name"
        FAILED+=("$name")
    fi
}
`}

# ─────────────────────────────────────────────────────────────────────────────
#  Pre-flight
# ─────────────────────────────────────────────────────────────────────────────

# Requirement 5.8: Check if package manager is installed
command -v flatpak &>/dev/null || {
    error "Flatpak not installed"
    info "Install: sudo apt/dnf/pacman install flatpak"
    exit 1
}

# Ensure Flathub is added
if ! flatpak remotes 2>/dev/null | grep -q flathub; then
    info "Adding Flathub..."
    flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
    success "Flathub added"
fi

# ─────────────────────────────────────────────────────────────────────────────
#  Installation
# ─────────────────────────────────────────────────────────────────────────────

echo
info "Installing $TOTAL packages"
echo

${installLogic}

print_summary
echo
info "Restart session for apps to appear in menu."
`
  );
}

/**
 * Generate simple one-liner command for Flatpak
 */
export function generateFlatpakCommand(selectedAppIds: Set<string>): string {
  const packages = getSelectedPackages(selectedAppIds, 'flatpak');

  if (packages.length === 0) {
    return '# No packages selected';
  }

  const appIds = packages.map(p => p.pkg).join(' ');
  return `flatpak install flathub -y ${appIds}`;
}
