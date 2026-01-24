// Requirements: 4.2, 8.1, 8.2, 8.3 - App catalog types and sample data

// Operating System Types
export type OSId = 'macos' | 'linux' | 'windows';

export interface OS {
  id: OSId;
  name: string;
  iconUrl: string;
  color: string;
}

// Package Manager Types - Requirements 1.1, 1.2, 2.1
export type PackageManagerId =
  // Windows
  | 'winget'
  | 'chocolatey'
  | 'scoop'
  // macOS
  | 'homebrew'
  | 'macports'
  // Linux
  | 'apt'
  | 'dnf'
  | 'pacman'
  | 'zypper'
  | 'flatpak'
  | 'snap';

export interface PackageManager {
  id: PackageManagerId;
  name: string;
  iconUrl: string;
  color: string;
  installPrefix: string;
  osId: OSId;
  isPrimary?: boolean; // Default package manager for the OS
}

// Category Type - 15 categories as per Requirement 4.2
export type Category =
  | 'Web Browsers'
  | 'Communication'
  | 'Dev: Languages'
  | 'Dev: Editors'
  | 'Dev: Tools'
  | 'Terminal'
  | 'CLI Tools'
  | 'Media'
  | 'Creative'
  | 'Gaming'
  | 'Office'
  | 'VPN & Network'
  | 'Security'
  | 'File Sharing'
  | 'System';

// App Data Type - Requirements 1.3, 1.4, 1.5, 8.2
export interface AppData {
  id: string;
  name: string;
  description: string;
  category: Category;
  iconUrl: string;
  // Maps package manager to package name/command
  targets: Partial<Record<PackageManagerId, string>>;
  // Markdown shown when app unavailable for a package manager
  unavailableReason?: string;
}

// Operating Systems Data
export const operatingSystems: OS[] = [
  {
    id: 'macos',
    name: 'MacOS',
    iconUrl: 'https://api.iconify.design/simple-icons/apple.svg?color=%23999999',
    color: '#999999'
  },
  {
    id: 'linux',
    name: 'Linux',
    iconUrl: 'https://api.iconify.design/simple-icons/linux.svg?color=%23FCC624',
    color: '#FCC624'
  },
  {
    id: 'windows',
    name: 'Windows',
    iconUrl: 'https://api.iconify.design/simple-icons/windows.svg?color=%230078D4',
    color: '#0078D4'
  }
];

// Package Managers Data - Requirements 1.1, 1.2, 2.1
export const packageManagers: PackageManager[] = [
  // Windows
  {
    id: 'winget',
    name: 'Winget',
    iconUrl: 'https://api.iconify.design/simple-icons/windows.svg?color=%230078D4',
    color: '#0078D4',
    installPrefix: 'winget install -e --id',
    osId: 'windows',
    isPrimary: true,
  },
  {
    id: 'chocolatey',
    name: 'Chocolatey',
    iconUrl: 'https://api.iconify.design/simple-icons/chocolatey.svg?color=%2380B5E3',
    color: '#80B5E3',
    installPrefix: 'choco install -y',
    osId: 'windows',
  },
  {
    id: 'scoop',
    name: 'Scoop',
    iconUrl: 'https://api.iconify.design/simple-icons/scoop.svg?color=%23B5E853',
    color: '#B5E853',
    installPrefix: 'scoop install',
    osId: 'windows',
  },
  // macOS
  {
    id: 'homebrew',
    name: 'Homebrew',
    iconUrl: 'https://api.iconify.design/simple-icons/homebrew.svg?color=%23FBB040',
    color: '#FBB040',
    installPrefix: 'brew install',
    osId: 'macos',
    isPrimary: true,
  },
  {
    id: 'macports',
    name: 'MacPorts',
    iconUrl: 'https://api.iconify.design/simple-icons/apple.svg?color=%23999999',
    color: '#999999',
    installPrefix: 'sudo port install',
    osId: 'macos',
  },
  // Linux
  {
    id: 'apt',
    name: 'APT (Debian/Ubuntu)',
    iconUrl: 'https://api.iconify.design/simple-icons/debian.svg?color=%23A81D33',
    color: '#A81D33',
    installPrefix: 'sudo apt install -y',
    osId: 'linux',
    isPrimary: true,
  },
  {
    id: 'dnf',
    name: 'DNF (Fedora)',
    iconUrl: 'https://api.iconify.design/simple-icons/fedora.svg?color=%2351A2DA',
    color: '#51A2DA',
    installPrefix: 'sudo dnf install -y',
    osId: 'linux',
  },
  {
    id: 'pacman',
    name: 'Pacman (Arch)',
    iconUrl: 'https://api.iconify.design/simple-icons/archlinux.svg?color=%231793D1',
    color: '#1793D1',
    installPrefix: 'sudo pacman -S --needed --noconfirm',
    osId: 'linux',
  },
  {
    id: 'zypper',
    name: 'Zypper (openSUSE)',
    iconUrl: 'https://api.iconify.design/simple-icons/opensuse.svg?color=%2373BA25',
    color: '#73BA25',
    installPrefix: 'sudo zypper install -y',
    osId: 'linux',
  },
  {
    id: 'flatpak',
    name: 'Flatpak',
    iconUrl: 'https://api.iconify.design/simple-icons/flatpak.svg?color=%234A90D9',
    color: '#4A90D9',
    installPrefix: 'flatpak install flathub -y',
    osId: 'linux',
  },
  {
    id: 'snap',
    name: 'Snap',
    iconUrl: 'https://api.iconify.design/simple-icons/snapcraft.svg?color=%2382BEA0',
    color: '#82BEA0',
    installPrefix: 'sudo snap install',
    osId: 'linux',
  },
];

// Category Colors for styling
export const categoryColors: Record<Category, string> = {
  'Web Browsers': '#f97316',    // orange
  'Communication': '#3b82f6',   // blue
  'Media': '#eab308',           // yellow
  'Gaming': '#a855f7',          // purple
  'Office': '#6366f1',          // indigo
  'Creative': '#06b6d4',        // cyan
  'System': '#ef4444',          // red
  'File Sharing': '#14b8a6',    // teal
  'Security': '#22c55e',        // green
  'VPN & Network': '#10b981',   // emerald
  'Dev: Editors': '#0ea5e9',    // sky
  'Dev: Languages': '#f43f5e',  // rose
  'Dev: Tools': '#64748b',      // slate
  'Terminal': '#71717a',        // zinc
  'CLI Tools': '#6b7280'        // gray
};

// All categories in display order
export const categories: Category[] = [
  'Web Browsers',
  'Communication',
  'Media',
  'Gaming',
  'Office',
  'Creative',
  'Dev: Editors',
  'Dev: Tools',
  'Dev: Languages',
  'Terminal',
  'CLI Tools',
  'VPN & Network',
  'Security',
  'File Sharing',
  'System'
];

// App Data - Requirements 7.1, 7.2, 7.3, 7.4 - Migrated to targets model
export const apps: AppData[] = [
  // Web Browsers
  {
    id: 'firefox',
    name: 'Firefox',
    description: 'Privacy-focused open-source browser by Mozilla',
    category: 'Web Browsers',
    iconUrl: 'https://api.iconify.design/logos/firefox.svg',
    targets: {
      // Windows
      winget: 'Mozilla.Firefox',
      chocolatey: 'firefox',
      scoop: 'firefox',
      // macOS
      homebrew: '--cask firefox',
      macports: 'firefox',
      // Linux
      apt: 'firefox',
      dnf: 'firefox',
      pacman: 'firefox',
      zypper: 'MozillaFirefox',
      flatpak: 'org.mozilla.firefox',
      snap: 'firefox',
    },
  },
  {
    id: 'chrome',
    name: 'Chrome',
    description: 'Fast and popular browser by Google',
    category: 'Web Browsers',
    iconUrl: 'https://api.iconify.design/logos/chrome.svg',
    targets: {
      winget: 'Google.Chrome',
      chocolatey: 'googlechrome',
      scoop: 'googlechrome',
      homebrew: '--cask google-chrome',
      flatpak: 'com.google.Chrome',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.google.Chrome) or download from [google.com/chrome](https://www.google.com/chrome/).',
  },
  {
    id: 'brave',
    name: 'Brave',
    description: 'Privacy-first browser with built-in ad blocking',
    category: 'Web Browsers',
    iconUrl: 'https://api.iconify.design/simple-icons/brave.svg?color=%23FB542B',
    targets: {
      winget: 'Brave.Brave',
      chocolatey: 'brave',
      scoop: 'brave',
      homebrew: '--cask brave-browser',
      flatpak: 'com.brave.Browser',
      snap: 'brave',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.brave.Browser), [Snap](https://snapcraft.io/brave), or download from [brave.com](https://brave.com/download/).',
  },
  {
    id: 'edge',
    name: 'Edge',
    description: 'Microsoft Chromium-based browser',
    category: 'Web Browsers',
    iconUrl: 'https://api.iconify.design/logos/microsoft-edge.svg',
    targets: {
      winget: 'Microsoft.Edge',
      chocolatey: 'microsoft-edge',
      homebrew: '--cask microsoft-edge',
      flatpak: 'com.microsoft.Edge',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, or Scoop. Use [Flatpak](https://flathub.org/apps/com.microsoft.Edge) or download from [microsoft.com/edge](https://www.microsoft.com/edge).',
  },
  
  // Communication
  {
    id: 'discord',
    name: 'Discord',
    description: 'Voice, video, and text chat for communities',
    category: 'Communication',
    iconUrl: 'https://api.iconify.design/logos/discord-icon.svg',
    targets: {
      winget: 'Discord.Discord',
      chocolatey: 'discord',
      scoop: 'discord',
      homebrew: '--cask discord',
      flatpak: 'com.discordapp.Discord',
      snap: 'discord',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.discordapp.Discord), [Snap](https://snapcraft.io/discord), or download from [discord.com](https://discord.com/download).',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team collaboration and messaging platform',
    category: 'Communication',
    iconUrl: 'https://api.iconify.design/logos/slack-icon.svg',
    targets: {
      winget: 'SlackTechnologies.Slack',
      chocolatey: 'slack',
      scoop: 'slack',
      homebrew: '--cask slack',
      flatpak: 'com.slack.Slack',
      snap: 'slack --classic',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.slack.Slack), [Snap](https://snapcraft.io/slack), or download from [slack.com](https://slack.com/downloads).',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and meetings',
    category: 'Communication',
    iconUrl: 'https://api.iconify.design/simple-icons/zoom.svg?color=%232D8CFF',
    targets: {
      winget: 'Zoom.Zoom',
      chocolatey: 'zoom',
      scoop: 'zoom',
      homebrew: '--cask zoom',
      flatpak: 'us.zoom.Zoom',
      snap: 'zoom-client',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/us.zoom.Zoom), [Snap](https://snapcraft.io/zoom-client), or download from [zoom.us](https://zoom.us/download).',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Fast and secure messaging app',
    category: 'Communication',
    iconUrl: 'https://api.iconify.design/logos/telegram.svg',
    targets: {
      winget: 'Telegram.TelegramDesktop',
      chocolatey: 'telegram',
      scoop: 'telegram',
      homebrew: '--cask telegram',
      macports: 'telegram-desktop',
      apt: 'telegram-desktop',
      dnf: 'telegram-desktop',
      pacman: 'telegram-desktop',
      flatpak: 'org.telegram.desktop',
      snap: 'telegram-desktop',
    },
  },
  {
    id: 'signal',
    name: 'Signal',
    description: 'End-to-end encrypted messaging',
    category: 'Communication',
    iconUrl: 'https://api.iconify.design/simple-icons/signal.svg?color=%233A76F0',
    targets: {
      winget: 'OpenWhisperSystems.Signal',
      chocolatey: 'signal',
      homebrew: '--cask signal',
      flatpak: 'org.signal.Signal',
      snap: 'signal-desktop',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, or Scoop. Use [Flatpak](https://flathub.org/apps/org.signal.Signal), [Snap](https://snapcraft.io/signal-desktop), or download from [signal.org](https://signal.org/download/).',
  },

  // Media
  {
    id: 'vlc',
    name: 'VLC',
    description: 'Free and open-source media player',
    category: 'Media',
    iconUrl: 'https://api.iconify.design/simple-icons/vlcmediaplayer.svg?color=%23FF8800',
    targets: {
      winget: 'VideoLAN.VLC',
      chocolatey: 'vlc',
      scoop: 'vlc',
      homebrew: '--cask vlc',
      macports: 'VLC',
      apt: 'vlc',
      dnf: 'vlc',
      pacman: 'vlc',
      zypper: 'vlc',
      flatpak: 'org.videolan.VLC',
      snap: 'vlc',
    },
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Music streaming service',
    category: 'Media',
    iconUrl: 'https://api.iconify.design/logos/spotify-icon.svg',
    targets: {
      winget: 'Spotify.Spotify',
      chocolatey: 'spotify',
      scoop: 'spotify',
      homebrew: '--cask spotify',
      flatpak: 'com.spotify.Client',
      snap: 'spotify',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.spotify.Client), [Snap](https://snapcraft.io/spotify), or download from [spotify.com](https://www.spotify.com/download/).',
  },
  {
    id: 'obs',
    name: 'OBS Studio',
    description: 'Open-source streaming and recording',
    category: 'Media',
    iconUrl: 'https://api.iconify.design/simple-icons/obsstudio.svg?color=%23302E31',
    targets: {
      winget: 'OBSProject.OBSStudio',
      chocolatey: 'obs-studio',
      scoop: 'obs-studio',
      homebrew: '--cask obs',
      macports: 'obs-studio',
      apt: 'obs-studio',
      dnf: 'obs-studio',
      pacman: 'obs-studio',
      zypper: 'obs-studio',
      flatpak: 'com.obsproject.Studio',
      snap: 'obs-studio',
    },
  },
  {
    id: 'handbrake',
    name: 'HandBrake',
    description: 'Open-source video transcoder',
    category: 'Media',
    iconUrl: 'https://api.iconify.design/simple-icons/handbrake.svg?color=%23FF5733',
    targets: {
      winget: 'HandBrake.HandBrake',
      chocolatey: 'handbrake',
      scoop: 'handbrake',
      homebrew: '--cask handbrake',
      macports: 'HandBrake',
      apt: 'handbrake',
      dnf: 'HandBrake',
      pacman: 'handbrake',
      zypper: 'handbrake',
      flatpak: 'fr.handbrake.ghb',
      snap: 'handbrake-jz',
    },
  },
  
  // Gaming
  {
    id: 'steam',
    name: 'Steam',
    description: 'Digital game distribution platform',
    category: 'Gaming',
    iconUrl: 'https://api.iconify.design/simple-icons/steam.svg?color=%23000000',
    targets: {
      winget: 'Valve.Steam',
      chocolatey: 'steam',
      scoop: 'steam',
      homebrew: '--cask steam',
      apt: 'steam',
      dnf: 'steam',
      pacman: 'steam',
      zypper: 'steam',
      flatpak: 'com.valvesoftware.Steam',
      snap: 'steam',
    },
  },
  {
    id: 'lutris',
    name: 'Lutris',
    description: 'Open gaming platform for Linux',
    category: 'Gaming',
    iconUrl: 'https://api.iconify.design/simple-icons/lutris.svg?color=%23FF9900',
    targets: {
      apt: 'lutris',
      dnf: 'lutris',
      pacman: 'lutris',
      zypper: 'lutris',
      flatpak: 'net.lutris.Lutris',
    },
    unavailableReason: 'Linux-only application. Not available for Windows or macOS.',
  },
  {
    id: 'heroic',
    name: 'Heroic',
    description: 'Epic Games and GOG launcher',
    category: 'Gaming',
    iconUrl: 'https://api.iconify.design/simple-icons/heroicgameslauncher.svg?color=%23FF6B00',
    targets: {
      winget: 'HeroicGamesLauncher.HeroicGamesLauncher',
      chocolatey: 'heroic-games-launcher',
      homebrew: '--cask heroic',
      flatpak: 'com.heroicgameslauncher.hgl',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, or Scoop. Use [Flatpak](https://flathub.org/apps/com.heroicgameslauncher.hgl) or download from [heroicgameslauncher.com](https://heroicgameslauncher.com/).',
  },
  {
    id: 'retroarch',
    name: 'RetroArch',
    description: 'Multi-system emulator frontend',
    category: 'Gaming',
    iconUrl: 'https://api.iconify.design/simple-icons/retroarch.svg?color=%23000000',
    targets: {
      winget: 'Libretro.RetroArch',
      chocolatey: 'retroarch',
      scoop: 'retroarch',
      homebrew: '--cask retroarch',
      macports: 'RetroArch',
      apt: 'retroarch',
      dnf: 'retroarch',
      pacman: 'retroarch',
      zypper: 'retroarch',
      flatpak: 'org.libretro.RetroArch',
      snap: 'retroarch',
    },
  },
  
  // Office
  {
    id: 'libreoffice',
    name: 'LibreOffice',
    description: 'Free and open-source office suite',
    category: 'Office',
    iconUrl: 'https://api.iconify.design/simple-icons/libreoffice.svg?color=%2318A303',
    targets: {
      winget: 'TheDocumentFoundation.LibreOffice',
      chocolatey: 'libreoffice-fresh',
      scoop: 'libreoffice',
      homebrew: '--cask libreoffice',
      macports: 'libreoffice',
      apt: 'libreoffice',
      dnf: 'libreoffice',
      pacman: 'libreoffice-fresh',
      zypper: 'libreoffice',
      flatpak: 'org.libreoffice.LibreOffice',
      snap: 'libreoffice',
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes and docs',
    category: 'Office',
    iconUrl: 'https://api.iconify.design/simple-icons/notion.svg?color=%23000000',
    targets: {
      winget: 'Notion.Notion',
      chocolatey: 'notion',
      homebrew: '--cask notion',
      snap: 'notion-snap-reborn',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, Scoop, or Flatpak. Use [Snap](https://snapcraft.io/notion-snap-reborn) or the [web app](https://www.notion.so/).',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Knowledge base and note-taking app',
    category: 'Office',
    iconUrl: 'https://api.iconify.design/simple-icons/obsidian.svg?color=%237C3AED',
    targets: {
      winget: 'Obsidian.Obsidian',
      chocolatey: 'obsidian',
      scoop: 'obsidian',
      homebrew: '--cask obsidian',
      flatpak: 'md.obsidian.Obsidian',
      snap: 'obsidian --classic',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/md.obsidian.Obsidian), [Snap](https://snapcraft.io/obsidian), or download from [obsidian.md](https://obsidian.md/).',
  },
  {
    id: 'logseq',
    name: 'Logseq',
    description: 'Privacy-first knowledge management',
    category: 'Office',
    iconUrl: 'https://api.iconify.design/simple-icons/logseq.svg?color=%2385C8C8',
    targets: {
      winget: 'Logseq.Logseq',
      chocolatey: 'logseq',
      scoop: 'logseq',
      homebrew: '--cask logseq',
      flatpak: 'com.logseq.Logseq',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.logseq.Logseq) or download from [logseq.com](https://logseq.com/).',
  },

  // Creative
  {
    id: 'gimp',
    name: 'GIMP',
    description: 'Free and open-source image editor',
    category: 'Creative',
    iconUrl: 'https://api.iconify.design/simple-icons/gimp.svg?color=%235C5543',
    targets: {
      winget: 'GIMP.GIMP',
      chocolatey: 'gimp',
      scoop: 'gimp',
      homebrew: '--cask gimp',
      macports: 'gimp',
      apt: 'gimp',
      dnf: 'gimp',
      pacman: 'gimp',
      zypper: 'gimp',
      flatpak: 'org.gimp.GIMP',
      snap: 'gimp',
    },
  },
  {
    id: 'inkscape',
    name: 'Inkscape',
    description: 'Professional vector graphics editor',
    category: 'Creative',
    iconUrl: 'https://api.iconify.design/simple-icons/inkscape.svg?color=%23000000',
    targets: {
      winget: 'Inkscape.Inkscape',
      chocolatey: 'inkscape',
      scoop: 'inkscape',
      homebrew: '--cask inkscape',
      macports: 'inkscape',
      apt: 'inkscape',
      dnf: 'inkscape',
      pacman: 'inkscape',
      zypper: 'inkscape',
      flatpak: 'org.inkscape.Inkscape',
      snap: 'inkscape',
    },
  },
  {
    id: 'blender',
    name: 'Blender',
    description: '3D creation suite',
    category: 'Creative',
    iconUrl: 'https://api.iconify.design/logos/blender.svg',
    targets: {
      winget: 'BlenderFoundation.Blender',
      chocolatey: 'blender',
      scoop: 'blender',
      homebrew: '--cask blender',
      macports: 'blender',
      apt: 'blender',
      dnf: 'blender',
      pacman: 'blender',
      zypper: 'blender',
      flatpak: 'org.blender.Blender',
      snap: 'blender --classic',
    },
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Collaborative design tool',
    category: 'Creative',
    iconUrl: 'https://api.iconify.design/logos/figma.svg',
    targets: {
      winget: 'Figma.Figma',
      chocolatey: 'figma',
      homebrew: '--cask figma',
      flatpak: 'io.github.nickvision.figma',
      snap: 'figma-linux',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, or Scoop. Use [Flatpak](https://flathub.org/apps/io.github.nickvision.figma), [Snap](https://snapcraft.io/figma-linux), or the [web app](https://www.figma.com/).',
  },
  {
    id: 'audacity',
    name: 'Audacity',
    description: 'Free audio editor and recorder',
    category: 'Creative',
    iconUrl: 'https://api.iconify.design/simple-icons/audacity.svg?color=%230000CC',
    targets: {
      winget: 'Audacity.Audacity',
      chocolatey: 'audacity',
      scoop: 'audacity',
      homebrew: '--cask audacity',
      macports: 'audacity',
      apt: 'audacity',
      dnf: 'audacity',
      pacman: 'audacity',
      zypper: 'audacity',
      flatpak: 'org.audacityteam.Audacity',
      snap: 'audacity',
    },
  },
  
  // Dev: Editors
  {
    id: 'vscode',
    name: 'VS Code',
    description: 'Popular extensible code editor by Microsoft',
    category: 'Dev: Editors',
    iconUrl: 'https://api.iconify.design/logos/visual-studio-code.svg',
    targets: {
      winget: 'Microsoft.VisualStudioCode',
      chocolatey: 'vscode',
      scoop: 'vscode',
      homebrew: '--cask visual-studio-code',
      flatpak: 'com.visualstudio.code',
      snap: 'code --classic',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.visualstudio.code), [Snap](https://snapcraft.io/code), or download from [code.visualstudio.com](https://code.visualstudio.com/Download).',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor',
    category: 'Dev: Editors',
    iconUrl: 'https://api.iconify.design/simple-icons/cursor.svg?color=%23000000',
    targets: {
      winget: 'Anysphere.Cursor',
      chocolatey: 'cursor',
      homebrew: '--cask cursor',
    },
    unavailableReason: 'Not in official Linux distro repos, MacPorts, Scoop, Flatpak, or Snap. Download from [cursor.sh](https://cursor.sh/).',
  },
  {
    id: 'zed',
    name: 'Zed',
    description: 'High-performance code editor',
    category: 'Dev: Editors',
    iconUrl: 'https://api.iconify.design/simple-icons/zedindustries.svg?color=%23084CCF',
    targets: {
      homebrew: '--cask zed',
      flatpak: 'dev.zed.Zed',
    },
    unavailableReason: 'Currently only available for macOS and Linux. Not available for Windows. Use [Homebrew](https://formulae.brew.sh/cask/zed) on macOS or [Flatpak](https://flathub.org/apps/dev.zed.Zed) on Linux.',
  },
  {
    id: 'neovim',
    name: 'Neovim',
    description: 'Hyperextensible Vim-based editor',
    category: 'Dev: Editors',
    iconUrl: 'https://api.iconify.design/simple-icons/neovim.svg?color=%2357A143',
    targets: {
      winget: 'Neovim.Neovim',
      chocolatey: 'neovim',
      scoop: 'neovim',
      homebrew: 'neovim',
      macports: 'neovim',
      apt: 'neovim',
      dnf: 'neovim',
      pacman: 'neovim',
      zypper: 'neovim',
      flatpak: 'io.neovim.nvim',
      snap: 'nvim --classic',
    },
  },
  {
    id: 'sublime',
    name: 'Sublime Text',
    description: 'Sophisticated text editor',
    category: 'Dev: Editors',
    iconUrl: 'https://api.iconify.design/simple-icons/sublimetext.svg?color=%23FF9800',
    targets: {
      winget: 'SublimeHQ.SublimeText.4',
      chocolatey: 'sublimetext4',
      scoop: 'sublime-text',
      homebrew: '--cask sublime-text',
      macports: 'sublime-text',
      flatpak: 'com.sublimetext.three',
      snap: 'sublime-text --classic',
    },
    unavailableReason: 'Not in official Linux distro repos. Use [Flatpak](https://flathub.org/apps/com.sublimetext.three), [Snap](https://snapcraft.io/sublime-text), or download from [sublimetext.com](https://www.sublimetext.com/).',
  },

  // Dev: Tools
  {
    id: 'docker',
    name: 'Docker',
    description: 'Container platform for developers',
    category: 'Dev: Tools',
    iconUrl: 'https://api.iconify.design/logos/docker-icon.svg',
    targets: {
      winget: 'Docker.DockerDesktop',
      chocolatey: 'docker-desktop',
      scoop: 'docker',
      homebrew: '--cask docker',
      apt: 'docker.io',
      dnf: 'docker',
      pacman: 'docker',
      zypper: 'docker',
      snap: 'docker',
    },
    unavailableReason: 'Docker Desktop is proprietary. On Linux, use the open-source Docker Engine from official repos. On macOS, use [Homebrew](https://formulae.brew.sh/cask/docker) or download from [docker.com](https://www.docker.com/products/docker-desktop/).',
  },
  {
    id: 'postman',
    name: 'Postman',
    description: 'API development and testing platform',
    category: 'Dev: Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/postman.svg?color=%23FF6C37',
    targets: {
      winget: 'Postman.Postman',
      chocolatey: 'postman',
      scoop: 'postman',
      homebrew: '--cask postman',
      flatpak: 'com.getpostman.Postman',
      snap: 'postman',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.getpostman.Postman), [Snap](https://snapcraft.io/postman), or download from [postman.com](https://www.postman.com/downloads/).',
  },
  {
    id: 'insomnia',
    name: 'Insomnia',
    description: 'API client for REST and GraphQL',
    category: 'Dev: Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/insomnia.svg?color=%234000BF',
    targets: {
      winget: 'Insomnia.Insomnia',
      chocolatey: 'insomnia-rest-api-client',
      scoop: 'insomnia',
      homebrew: '--cask insomnia',
      flatpak: 'rest.insomnia.Insomnia',
      snap: 'insomnia',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/rest.insomnia.Insomnia), [Snap](https://snapcraft.io/insomnia), or download from [insomnia.rest](https://insomnia.rest/download).',
  },
  {
    id: 'dbeaver',
    name: 'DBeaver',
    description: 'Universal database tool',
    category: 'Dev: Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/dbeaver.svg?color=%23382923',
    targets: {
      winget: 'dbeaver.dbeaver',
      chocolatey: 'dbeaver',
      scoop: 'dbeaver',
      homebrew: '--cask dbeaver-community',
      macports: 'dbeaver-community',
      flatpak: 'io.dbeaver.DBeaverCommunity',
      snap: 'dbeaver-ce',
    },
    unavailableReason: 'Not in official Linux distro repos. Use [Flatpak](https://flathub.org/apps/io.dbeaver.DBeaverCommunity), [Snap](https://snapcraft.io/dbeaver-ce), or download from [dbeaver.io](https://dbeaver.io/download/).',
  },
  
  // Dev: Languages
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'JavaScript runtime environment',
    category: 'Dev: Languages',
    iconUrl: 'https://api.iconify.design/logos/nodejs-icon.svg',
    targets: {
      winget: 'OpenJS.NodeJS.LTS',
      chocolatey: 'nodejs-lts',
      scoop: 'nodejs-lts',
      homebrew: 'node',
      macports: 'nodejs18',
      apt: 'nodejs',
      dnf: 'nodejs',
      pacman: 'nodejs',
      zypper: 'nodejs',
      snap: 'node --classic',
    },
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Popular programming language',
    category: 'Dev: Languages',
    iconUrl: 'https://api.iconify.design/logos/python.svg',
    targets: {
      winget: 'Python.Python.3.12',
      chocolatey: 'python',
      scoop: 'python',
      homebrew: 'python@3.12',
      macports: 'python312',
      apt: 'python3',
      dnf: 'python3',
      pacman: 'python',
      zypper: 'python3',
    },
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Systems programming language',
    category: 'Dev: Languages',
    iconUrl: 'https://api.iconify.design/simple-icons/rust.svg?color=%23000000',
    targets: {
      winget: 'Rustlang.Rustup',
      chocolatey: 'rustup.install',
      scoop: 'rustup',
      homebrew: 'rustup-init',
      macports: 'rust',
      apt: 'rustc',
      dnf: 'rust',
      pacman: 'rust',
      zypper: 'rust',
    },
  },
  {
    id: 'go',
    name: 'Go',
    description: 'Fast compiled language by Google',
    category: 'Dev: Languages',
    iconUrl: 'https://api.iconify.design/logos/go.svg',
    targets: {
      winget: 'GoLang.Go',
      chocolatey: 'golang',
      scoop: 'go',
      homebrew: 'go',
      macports: 'go',
      apt: 'golang',
      dnf: 'golang',
      pacman: 'go',
      zypper: 'go',
      snap: 'go --classic',
    },
  },
  {
    id: 'java',
    name: 'Java',
    description: 'Enterprise programming language',
    category: 'Dev: Languages',
    iconUrl: 'https://api.iconify.design/logos/java.svg',
    targets: {
      winget: 'EclipseAdoptium.Temurin.21.JDK',
      chocolatey: 'temurin21',
      scoop: 'temurin-lts-jdk',
      homebrew: 'openjdk',
      macports: 'openjdk21',
      apt: 'default-jdk',
      dnf: 'java-21-openjdk-devel',
      pacman: 'jdk-openjdk',
      zypper: 'java-21-openjdk-devel',
    },
  },

  // Terminal
  {
    id: 'iterm2',
    name: 'iTerm2',
    description: 'Terminal emulator for macOS',
    category: 'Terminal',
    iconUrl: 'https://api.iconify.design/simple-icons/iterm2.svg?color=%23000000',
    targets: {
      homebrew: '--cask iterm2',
      macports: 'iTerm2',
    },
    unavailableReason: 'macOS-only application. Not available for Windows or Linux.',
  },
  {
    id: 'alacritty',
    name: 'Alacritty',
    description: 'GPU-accelerated terminal emulator',
    category: 'Terminal',
    iconUrl: 'https://api.iconify.design/simple-icons/alacritty.svg?color=%23F46D01',
    targets: {
      winget: 'Alacritty.Alacritty',
      chocolatey: 'alacritty',
      scoop: 'alacritty',
      homebrew: '--cask alacritty',
      macports: 'alacritty',
      apt: 'alacritty',
      dnf: 'alacritty',
      pacman: 'alacritty',
      zypper: 'alacritty',
      flatpak: 'org.alacritty.Alacritty',
      snap: 'alacritty --classic',
    },
  },
  {
    id: 'wezterm',
    name: 'WezTerm',
    description: 'GPU-accelerated terminal with Lua config',
    category: 'Terminal',
    iconUrl: 'https://api.iconify.design/simple-icons/wezterm.svg?color=%234E49EE',
    targets: {
      winget: 'wez.wezterm',
      chocolatey: 'wezterm',
      scoop: 'wezterm',
      homebrew: '--cask wezterm',
      macports: 'wezterm',
      flatpak: 'org.wezfurlong.wezterm',
    },
    unavailableReason: 'Not in official Linux distro repos. Use [Flatpak](https://flathub.org/apps/org.wezfurlong.wezterm) or download from [wezfurlong.org/wezterm](https://wezfurlong.org/wezterm/install/linux.html).',
  },
  {
    id: 'kitty',
    name: 'Kitty',
    description: 'Fast GPU-based terminal emulator',
    category: 'Terminal',
    iconUrl: 'https://api.iconify.design/simple-icons/kitty.svg?color=%23000000',
    targets: {
      homebrew: '--cask kitty',
      macports: 'kitty',
      apt: 'kitty',
      dnf: 'kitty',
      pacman: 'kitty',
      zypper: 'kitty',
      flatpak: 'net.kovidgoyal.kitty',
    },
    unavailableReason: 'Not available for Windows. Use on macOS or Linux.',
  },
  
  // CLI Tools
  {
    id: 'git',
    name: 'Git',
    description: 'Distributed version control system',
    category: 'CLI Tools',
    iconUrl: 'https://api.iconify.design/logos/git-icon.svg',
    targets: {
      winget: 'Git.Git',
      chocolatey: 'git',
      scoop: 'git',
      homebrew: 'git',
      macports: 'git',
      apt: 'git',
      dnf: 'git',
      pacman: 'git',
      zypper: 'git',
    },
  },
  {
    id: 'gh',
    name: 'GitHub CLI',
    description: 'GitHub from the command line',
    category: 'CLI Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/github.svg?color=%23181717',
    targets: {
      winget: 'GitHub.cli',
      chocolatey: 'gh',
      scoop: 'gh',
      homebrew: 'gh',
      macports: 'gh',
      apt: 'gh',
      dnf: 'gh',
      pacman: 'github-cli',
      zypper: 'gh',
      snap: 'gh',
    },
  },
  {
    id: 'fzf',
    name: 'fzf',
    description: 'Command-line fuzzy finder',
    category: 'CLI Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25',
    targets: {
      winget: 'junegunn.fzf',
      chocolatey: 'fzf',
      scoop: 'fzf',
      homebrew: 'fzf',
      macports: 'fzf',
      apt: 'fzf',
      dnf: 'fzf',
      pacman: 'fzf',
      zypper: 'fzf',
    },
  },
  {
    id: 'ripgrep',
    name: 'ripgrep',
    description: 'Fast recursive search tool',
    category: 'CLI Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25',
    targets: {
      winget: 'BurntSushi.ripgrep.MSVC',
      chocolatey: 'ripgrep',
      scoop: 'ripgrep',
      homebrew: 'ripgrep',
      macports: 'ripgrep',
      apt: 'ripgrep',
      dnf: 'ripgrep',
      pacman: 'ripgrep',
      zypper: 'ripgrep',
    },
  },
  {
    id: 'jq',
    name: 'jq',
    description: 'Command-line JSON processor',
    category: 'CLI Tools',
    iconUrl: 'https://api.iconify.design/simple-icons/json.svg?color=%23000000',
    targets: {
      winget: 'jqlang.jq',
      chocolatey: 'jq',
      scoop: 'jq',
      homebrew: 'jq',
      macports: 'jq',
      apt: 'jq',
      dnf: 'jq',
      pacman: 'jq',
      zypper: 'jq',
    },
  },

  // VPN & Network
  {
    id: 'tailscale',
    name: 'Tailscale',
    description: 'Zero-config VPN built on WireGuard',
    category: 'VPN & Network',
    iconUrl: 'https://api.iconify.design/simple-icons/tailscale.svg?color=%23242424',
    targets: {
      winget: 'Tailscale.Tailscale',
      chocolatey: 'tailscale',
      scoop: 'tailscale',
      homebrew: '--cask tailscale',
      macports: 'tailscale',
      apt: 'tailscale',
      dnf: 'tailscale',
      pacman: 'tailscale',
      zypper: 'tailscale',
    },
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    description: 'Fast and modern VPN protocol',
    category: 'VPN & Network',
    iconUrl: 'https://api.iconify.design/simple-icons/wireguard.svg?color=%2388171A',
    targets: {
      winget: 'WireGuard.WireGuard',
      chocolatey: 'wireguard',
      scoop: 'wireguard',
      homebrew: 'wireguard-tools',
      macports: 'wireguard-tools',
      apt: 'wireguard',
      dnf: 'wireguard-tools',
      pacman: 'wireguard-tools',
      zypper: 'wireguard-tools',
    },
  },
  {
    id: 'wireshark',
    name: 'Wireshark',
    description: 'Network protocol analyzer',
    category: 'VPN & Network',
    iconUrl: 'https://api.iconify.design/simple-icons/wireshark.svg?color=%231679A7',
    targets: {
      winget: 'WiresharkFoundation.Wireshark',
      chocolatey: 'wireshark',
      scoop: 'wireshark',
      homebrew: '--cask wireshark',
      macports: 'wireshark',
      apt: 'wireshark',
      dnf: 'wireshark',
      pacman: 'wireshark-qt',
      zypper: 'wireshark',
      flatpak: 'org.wireshark.Wireshark',
    },
  },
  
  // Security
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    description: 'Open-source password manager',
    category: 'Security',
    iconUrl: 'https://api.iconify.design/simple-icons/bitwarden.svg?color=%23175DDC',
    targets: {
      winget: 'Bitwarden.Bitwarden',
      chocolatey: 'bitwarden',
      scoop: 'bitwarden',
      homebrew: '--cask bitwarden',
      macports: 'bitwarden-cli',
      flatpak: 'com.bitwarden.desktop',
      snap: 'bitwarden',
    },
    unavailableReason: 'Not in official Linux distro repos. Use [Flatpak](https://flathub.org/apps/com.bitwarden.desktop), [Snap](https://snapcraft.io/bitwarden), or download from [bitwarden.com](https://bitwarden.com/download/).',
  },
  {
    id: '1password',
    name: '1Password',
    description: 'Premium password manager',
    category: 'Security',
    iconUrl: 'https://api.iconify.design/simple-icons/1password.svg?color=%230094F5',
    targets: {
      winget: 'AgileBits.1Password',
      chocolatey: '1password',
      scoop: '1password',
      homebrew: '--cask 1password',
      flatpak: 'com.onepassword.OnePassword',
      snap: '1password',
    },
    unavailableReason: 'Not in official Linux distro repos or MacPorts. Use [Flatpak](https://flathub.org/apps/com.onepassword.OnePassword), [Snap](https://snapcraft.io/1password), or download from [1password.com](https://1password.com/downloads/).',
  },
  {
    id: 'keepassxc',
    name: 'KeePassXC',
    description: 'Cross-platform password manager',
    category: 'Security',
    iconUrl: 'https://api.iconify.design/simple-icons/keepassxc.svg?color=%236CAC4D',
    targets: {
      winget: 'KeePassXCTeam.KeePassXC',
      chocolatey: 'keepassxc',
      scoop: 'keepassxc',
      homebrew: '--cask keepassxc',
      macports: 'KeePassXC',
      apt: 'keepassxc',
      dnf: 'keepassxc',
      pacman: 'keepassxc',
      zypper: 'keepassxc',
      flatpak: 'org.keepassxc.KeePassXC',
      snap: 'keepassxc',
    },
  },
  {
    id: 'gpg',
    name: 'GPG Suite',
    description: 'OpenPGP encryption tools',
    category: 'Security',
    iconUrl: 'https://api.iconify.design/simple-icons/gnuprivacyguard.svg?color=%230093DD',
    targets: {
      winget: 'GnuPG.Gpg4win',
      chocolatey: 'gpg4win',
      scoop: 'gpg',
      homebrew: 'gnupg',
      macports: 'gnupg2',
      apt: 'gnupg',
      dnf: 'gnupg2',
      pacman: 'gnupg',
      zypper: 'gpg2',
    },
  },
  
  // File Sharing
  {
    id: 'syncthing',
    name: 'Syncthing',
    description: 'Continuous file synchronization',
    category: 'File Sharing',
    iconUrl: 'https://api.iconify.design/simple-icons/syncthing.svg?color=%230891D1',
    targets: {
      winget: 'Syncthing.Syncthing',
      chocolatey: 'syncthing',
      scoop: 'syncthing',
      homebrew: 'syncthing',
      macports: 'syncthing',
      apt: 'syncthing',
      dnf: 'syncthing',
      pacman: 'syncthing',
      zypper: 'syncthing',
      flatpak: 'me.kozec.syncthingtk',
      snap: 'syncthing',
    },
  },
  {
    id: 'qbittorrent',
    name: 'qBittorrent',
    description: 'Free and open-source BitTorrent client',
    category: 'File Sharing',
    iconUrl: 'https://api.iconify.design/simple-icons/qbittorrent.svg?color=%232F67BA',
    targets: {
      winget: 'qBittorrent.qBittorrent',
      chocolatey: 'qbittorrent',
      scoop: 'qbittorrent',
      homebrew: '--cask qbittorrent',
      macports: 'qBittorrent',
      apt: 'qbittorrent',
      dnf: 'qbittorrent',
      pacman: 'qbittorrent',
      zypper: 'qbittorrent',
      flatpak: 'org.qbittorrent.qBittorrent',
      snap: 'qbittorrent-arnatious',
    },
  },
  {
    id: 'filezilla',
    name: 'FileZilla',
    description: 'FTP, FTPS and SFTP client',
    category: 'File Sharing',
    iconUrl: 'https://api.iconify.design/simple-icons/filezilla.svg?color=%23BF0000',
    targets: {
      winget: 'TimKosse.FileZilla.Client',
      chocolatey: 'filezilla',
      scoop: 'filezilla',
      homebrew: '--cask filezilla',
      macports: 'filezilla',
      apt: 'filezilla',
      dnf: 'filezilla',
      pacman: 'filezilla',
      zypper: 'filezilla',
      flatpak: 'org.filezillaproject.Filezilla',
    },
  },

  // System
  {
    id: 'htop',
    name: 'htop',
    description: 'Interactive process viewer',
    category: 'System',
    iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25',
    targets: {
      homebrew: 'htop',
      macports: 'htop',
      apt: 'htop',
      dnf: 'htop',
      pacman: 'htop',
      zypper: 'htop',
      snap: 'htop',
    },
    unavailableReason: 'Unix/Linux-only application. Not available for Windows.',
  },
  {
    id: 'btop',
    name: 'btop',
    description: 'Resource monitor with graphs',
    category: 'System',
    iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25',
    targets: {
      homebrew: 'btop',
      macports: 'btop',
      apt: 'btop',
      dnf: 'btop',
      pacman: 'btop',
      zypper: 'btop',
      snap: 'btop',
    },
    unavailableReason: 'Unix/Linux-only application. Not available for Windows.',
  },
  {
    id: 'neofetch',
    name: 'Neofetch',
    description: 'System information tool',
    category: 'System',
    iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25',
    targets: {
      homebrew: 'neofetch',
      macports: 'neofetch',
      apt: 'neofetch',
      dnf: 'neofetch',
      pacman: 'neofetch',
      zypper: 'neofetch',
      snap: 'neofetch',
    },
    unavailableReason: 'Unix/Linux-only application. Not available for Windows.',
  },
  {
    id: 'timeshift',
    name: 'Timeshift',
    description: 'System restore utility',
    category: 'System',
    iconUrl: 'https://api.iconify.design/simple-icons/linux.svg?color=%23FCC624',
    targets: {
      apt: 'timeshift',
      dnf: 'timeshift',
      pacman: 'timeshift',
      zypper: 'timeshift',
    },
    unavailableReason: 'Linux-only application. Not available for Windows or macOS.',
  },
];

// Helper Functions

/**
 * Get apps filtered by category
 */
export function getAppsByCategory(category: Category): AppData[] {
  return apps.filter(app => app.category === category);
}

/**
 * Get the color for a category
 */
export function getCategoryColor(category: Category): string {
  return categoryColors[category] || '#6b7280';
}

/**
 * Get OS by ID
 */
export function getOSById(id: OSId): OS | undefined {
  return operatingSystems.find(os => os.id === id);
}

/**
 * Check if an app is available for a given package manager
 */
export function isAppAvailableForPackageManager(app: AppData, packageManagerId: PackageManagerId): boolean {
  const target = app.targets[packageManagerId];
  return target !== undefined && target !== '';
}

/**
 * Check if an app is available for a given OS (has at least one package manager target for that OS)
 * @deprecated Use isAppAvailableForPackageManager instead for more precise availability checking
 */
export function isAppAvailableForOS(app: AppData, osId: OSId): boolean {
  const osPackageManagers = getPackageManagersByOS(osId);
  return osPackageManagers.some(pm => isAppAvailableForPackageManager(app, pm.id));
}

// Package Manager Helper Functions - Requirements 1.1, 1.2, 2.1

/**
 * Get package managers filtered by operating system
 */
export function getPackageManagersByOS(osId: OSId): PackageManager[] {
  return packageManagers.filter(pm => pm.osId === osId);
}

/**
 * Get a package manager by its ID
 */
export function getPackageManagerById(id: PackageManagerId): PackageManager | undefined {
  return packageManagers.find(pm => pm.id === id);
}

/**
 * Get the primary (default) package manager for an operating system
 */
export function getPrimaryPackageManager(osId: OSId): PackageManager {
  const primary = packageManagers.find(pm => pm.osId === osId && pm.isPrimary);
  if (primary) {
    return primary;
  }
  // Fallback to first package manager for the OS if no primary is set
  const fallback = packageManagers.find(pm => pm.osId === osId);
  if (!fallback) {
    throw new Error(`No package manager found for OS: ${osId}`);
  }
  return fallback;
}

// LocalStorage Keys
export const STORAGE_KEYS = {
  SELECTED_OS: 'packmate-os',
  SELECTED_APPS: 'packmate-apps',
  THEME: 'packmate-theme',
  // New: per-OS package manager selection - Requirements 2.3
  PACKAGE_MANAGER_WINDOWS: 'packmate-pm-windows',
  PACKAGE_MANAGER_MACOS: 'packmate-pm-macos',
  PACKAGE_MANAGER_LINUX: 'packmate-pm-linux',
} as const;
