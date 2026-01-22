// Requirements: 4.2, 8.1, 8.2, 8.3 - App catalog types and sample data

// Operating System Types
export type OSId = 'macos' | 'linux' | 'windows';

export interface OS {
  id: OSId;
  name: string;
  iconUrl: string;
  color: string;
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

// App Data Type - Requirement 8.2
export interface AppData {
  id: string;
  name: string;
  description: string;
  category: Category;
  iconUrl: string;
  availability: {
    macos: boolean;
    linux: boolean;
    windows: boolean;
  };
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

// Sample App Data - Requirement 8.1 (50+ apps across all categories)
export const apps: AppData[] = [
  // Web Browsers
  { id: 'firefox', name: 'Firefox', description: 'Privacy-focused open-source browser by Mozilla', category: 'Web Browsers', iconUrl: 'https://api.iconify.design/logos/firefox.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'chrome', name: 'Chrome', description: 'Fast and popular browser by Google', category: 'Web Browsers', iconUrl: 'https://api.iconify.design/logos/chrome.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'brave', name: 'Brave', description: 'Privacy-first browser with built-in ad blocking', category: 'Web Browsers', iconUrl: 'https://api.iconify.design/simple-icons/brave.svg?color=%23FB542B', availability: { macos: true, linux: true, windows: true } },
  { id: 'edge', name: 'Edge', description: 'Microsoft Chromium-based browser', category: 'Web Browsers', iconUrl: 'https://api.iconify.design/logos/microsoft-edge.svg', availability: { macos: true, linux: true, windows: true } },
  
  // Communication
  { id: 'discord', name: 'Discord', description: 'Voice, video, and text chat for communities', category: 'Communication', iconUrl: 'https://api.iconify.design/logos/discord-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'slack', name: 'Slack', description: 'Team collaboration and messaging platform', category: 'Communication', iconUrl: 'https://api.iconify.design/logos/slack-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'zoom', name: 'Zoom', description: 'Video conferencing and meetings', category: 'Communication', iconUrl: 'https://api.iconify.design/simple-icons/zoom.svg?color=%232D8CFF', availability: { macos: true, linux: true, windows: true } },
  { id: 'telegram', name: 'Telegram', description: 'Fast and secure messaging app', category: 'Communication', iconUrl: 'https://api.iconify.design/logos/telegram.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'signal', name: 'Signal', description: 'End-to-end encrypted messaging', category: 'Communication', iconUrl: 'https://api.iconify.design/simple-icons/signal.svg?color=%233A76F0', availability: { macos: true, linux: true, windows: true } },

  // Media
  { id: 'vlc', name: 'VLC', description: 'Free and open-source media player', category: 'Media', iconUrl: 'https://api.iconify.design/simple-icons/vlcmediaplayer.svg?color=%23FF8800', availability: { macos: true, linux: true, windows: true } },
  { id: 'spotify', name: 'Spotify', description: 'Music streaming service', category: 'Media', iconUrl: 'https://api.iconify.design/logos/spotify-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'obs', name: 'OBS Studio', description: 'Open-source streaming and recording', category: 'Media', iconUrl: 'https://api.iconify.design/simple-icons/obsstudio.svg?color=%23302E31', availability: { macos: true, linux: true, windows: true } },
  { id: 'handbrake', name: 'HandBrake', description: 'Open-source video transcoder', category: 'Media', iconUrl: 'https://api.iconify.design/simple-icons/handbrake.svg?color=%23FF5733', availability: { macos: true, linux: true, windows: true } },
  
  // Gaming
  { id: 'steam', name: 'Steam', description: 'Digital game distribution platform', category: 'Gaming', iconUrl: 'https://api.iconify.design/simple-icons/steam.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  { id: 'lutris', name: 'Lutris', description: 'Open gaming platform for Linux', category: 'Gaming', iconUrl: 'https://api.iconify.design/simple-icons/lutris.svg?color=%23FF9900', availability: { macos: false, linux: true, windows: false } },
  { id: 'heroic', name: 'Heroic', description: 'Epic Games and GOG launcher', category: 'Gaming', iconUrl: 'https://api.iconify.design/simple-icons/heroicgameslauncher.svg?color=%23FF6B00', availability: { macos: true, linux: true, windows: true } },
  { id: 'retroarch', name: 'RetroArch', description: 'Multi-system emulator frontend', category: 'Gaming', iconUrl: 'https://api.iconify.design/simple-icons/retroarch.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  
  // Office
  { id: 'libreoffice', name: 'LibreOffice', description: 'Free and open-source office suite', category: 'Office', iconUrl: 'https://api.iconify.design/simple-icons/libreoffice.svg?color=%2318A303', availability: { macos: true, linux: true, windows: true } },
  { id: 'notion', name: 'Notion', description: 'All-in-one workspace for notes and docs', category: 'Office', iconUrl: 'https://api.iconify.design/simple-icons/notion.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  { id: 'obsidian', name: 'Obsidian', description: 'Knowledge base and note-taking app', category: 'Office', iconUrl: 'https://api.iconify.design/simple-icons/obsidian.svg?color=%237C3AED', availability: { macos: true, linux: true, windows: true } },
  { id: 'logseq', name: 'Logseq', description: 'Privacy-first knowledge management', category: 'Office', iconUrl: 'https://api.iconify.design/simple-icons/logseq.svg?color=%2385C8C8', availability: { macos: true, linux: true, windows: true } },

  // Creative
  { id: 'gimp', name: 'GIMP', description: 'Free and open-source image editor', category: 'Creative', iconUrl: 'https://api.iconify.design/simple-icons/gimp.svg?color=%235C5543', availability: { macos: true, linux: true, windows: true } },
  { id: 'inkscape', name: 'Inkscape', description: 'Professional vector graphics editor', category: 'Creative', iconUrl: 'https://api.iconify.design/simple-icons/inkscape.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  { id: 'blender', name: 'Blender', description: '3D creation suite', category: 'Creative', iconUrl: 'https://api.iconify.design/logos/blender.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'figma', name: 'Figma', description: 'Collaborative design tool', category: 'Creative', iconUrl: 'https://api.iconify.design/logos/figma.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'audacity', name: 'Audacity', description: 'Free audio editor and recorder', category: 'Creative', iconUrl: 'https://api.iconify.design/simple-icons/audacity.svg?color=%230000CC', availability: { macos: true, linux: true, windows: true } },
  
  // Dev: Editors
  { id: 'vscode', name: 'VS Code', description: 'Popular extensible code editor by Microsoft', category: 'Dev: Editors', iconUrl: 'https://api.iconify.design/logos/visual-studio-code.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'cursor', name: 'Cursor', description: 'AI-powered code editor', category: 'Dev: Editors', iconUrl: 'https://api.iconify.design/simple-icons/cursor.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  { id: 'zed', name: 'Zed', description: 'High-performance code editor', category: 'Dev: Editors', iconUrl: 'https://api.iconify.design/simple-icons/zedindustries.svg?color=%23084CCF', availability: { macos: true, linux: true, windows: false } },
  { id: 'neovim', name: 'Neovim', description: 'Hyperextensible Vim-based editor', category: 'Dev: Editors', iconUrl: 'https://api.iconify.design/simple-icons/neovim.svg?color=%2357A143', availability: { macos: true, linux: true, windows: true } },
  { id: 'sublime', name: 'Sublime Text', description: 'Sophisticated text editor', category: 'Dev: Editors', iconUrl: 'https://api.iconify.design/simple-icons/sublimetext.svg?color=%23FF9800', availability: { macos: true, linux: true, windows: true } },

  // Dev: Tools
  { id: 'docker', name: 'Docker', description: 'Container platform for developers', category: 'Dev: Tools', iconUrl: 'https://api.iconify.design/logos/docker-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'postman', name: 'Postman', description: 'API development and testing platform', category: 'Dev: Tools', iconUrl: 'https://api.iconify.design/simple-icons/postman.svg?color=%23FF6C37', availability: { macos: true, linux: true, windows: true } },
  { id: 'insomnia', name: 'Insomnia', description: 'API client for REST and GraphQL', category: 'Dev: Tools', iconUrl: 'https://api.iconify.design/simple-icons/insomnia.svg?color=%234000BF', availability: { macos: true, linux: true, windows: true } },
  { id: 'dbeaver', name: 'DBeaver', description: 'Universal database tool', category: 'Dev: Tools', iconUrl: 'https://api.iconify.design/simple-icons/dbeaver.svg?color=%23382923', availability: { macos: true, linux: true, windows: true } },
  
  // Dev: Languages
  { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime environment', category: 'Dev: Languages', iconUrl: 'https://api.iconify.design/logos/nodejs-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'python', name: 'Python', description: 'Popular programming language', category: 'Dev: Languages', iconUrl: 'https://api.iconify.design/logos/python.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'rust', name: 'Rust', description: 'Systems programming language', category: 'Dev: Languages', iconUrl: 'https://api.iconify.design/simple-icons/rust.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },
  { id: 'go', name: 'Go', description: 'Fast compiled language by Google', category: 'Dev: Languages', iconUrl: 'https://api.iconify.design/logos/go.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'java', name: 'Java', description: 'Enterprise programming language', category: 'Dev: Languages', iconUrl: 'https://api.iconify.design/logos/java.svg', availability: { macos: true, linux: true, windows: true } },

  // Terminal
  { id: 'iterm2', name: 'iTerm2', description: 'Terminal emulator for macOS', category: 'Terminal', iconUrl: 'https://api.iconify.design/simple-icons/iterm2.svg?color=%23000000', availability: { macos: true, linux: false, windows: false } },
  { id: 'alacritty', name: 'Alacritty', description: 'GPU-accelerated terminal emulator', category: 'Terminal', iconUrl: 'https://api.iconify.design/simple-icons/alacritty.svg?color=%23F46D01', availability: { macos: true, linux: true, windows: true } },
  { id: 'wezterm', name: 'WezTerm', description: 'GPU-accelerated terminal with Lua config', category: 'Terminal', iconUrl: 'https://api.iconify.design/simple-icons/wezterm.svg?color=%234E49EE', availability: { macos: true, linux: true, windows: true } },
  { id: 'kitty', name: 'Kitty', description: 'Fast GPU-based terminal emulator', category: 'Terminal', iconUrl: 'https://api.iconify.design/simple-icons/kitty.svg?color=%23000000', availability: { macos: true, linux: true, windows: false } },
  
  // CLI Tools
  { id: 'git', name: 'Git', description: 'Distributed version control system', category: 'CLI Tools', iconUrl: 'https://api.iconify.design/logos/git-icon.svg', availability: { macos: true, linux: true, windows: true } },
  { id: 'gh', name: 'GitHub CLI', description: 'GitHub from the command line', category: 'CLI Tools', iconUrl: 'https://api.iconify.design/simple-icons/github.svg?color=%23181717', availability: { macos: true, linux: true, windows: true } },
  { id: 'fzf', name: 'fzf', description: 'Command-line fuzzy finder', category: 'CLI Tools', iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25', availability: { macos: true, linux: true, windows: true } },
  { id: 'ripgrep', name: 'ripgrep', description: 'Fast recursive search tool', category: 'CLI Tools', iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25', availability: { macos: true, linux: true, windows: true } },
  { id: 'jq', name: 'jq', description: 'Command-line JSON processor', category: 'CLI Tools', iconUrl: 'https://api.iconify.design/simple-icons/json.svg?color=%23000000', availability: { macos: true, linux: true, windows: true } },

  // VPN & Network
  { id: 'tailscale', name: 'Tailscale', description: 'Zero-config VPN built on WireGuard', category: 'VPN & Network', iconUrl: 'https://api.iconify.design/simple-icons/tailscale.svg?color=%23242424', availability: { macos: true, linux: true, windows: true } },
  { id: 'wireguard', name: 'WireGuard', description: 'Fast and modern VPN protocol', category: 'VPN & Network', iconUrl: 'https://api.iconify.design/simple-icons/wireguard.svg?color=%2388171A', availability: { macos: true, linux: true, windows: true } },
  { id: 'wireshark', name: 'Wireshark', description: 'Network protocol analyzer', category: 'VPN & Network', iconUrl: 'https://api.iconify.design/simple-icons/wireshark.svg?color=%231679A7', availability: { macos: true, linux: true, windows: true } },
  
  // Security
  { id: 'bitwarden', name: 'Bitwarden', description: 'Open-source password manager', category: 'Security', iconUrl: 'https://api.iconify.design/simple-icons/bitwarden.svg?color=%23175DDC', availability: { macos: true, linux: true, windows: true } },
  { id: '1password', name: '1Password', description: 'Premium password manager', category: 'Security', iconUrl: 'https://api.iconify.design/simple-icons/1password.svg?color=%230094F5', availability: { macos: true, linux: true, windows: true } },
  { id: 'keepassxc', name: 'KeePassXC', description: 'Cross-platform password manager', category: 'Security', iconUrl: 'https://api.iconify.design/simple-icons/keepassxc.svg?color=%236CAC4D', availability: { macos: true, linux: true, windows: true } },
  { id: 'gpg', name: 'GPG Suite', description: 'OpenPGP encryption tools', category: 'Security', iconUrl: 'https://api.iconify.design/simple-icons/gnuprivacyguard.svg?color=%230093DD', availability: { macos: true, linux: true, windows: true } },
  
  // File Sharing
  { id: 'syncthing', name: 'Syncthing', description: 'Continuous file synchronization', category: 'File Sharing', iconUrl: 'https://api.iconify.design/simple-icons/syncthing.svg?color=%230891D1', availability: { macos: true, linux: true, windows: true } },
  { id: 'qbittorrent', name: 'qBittorrent', description: 'Free and open-source BitTorrent client', category: 'File Sharing', iconUrl: 'https://api.iconify.design/simple-icons/qbittorrent.svg?color=%232F67BA', availability: { macos: true, linux: true, windows: true } },
  { id: 'filezilla', name: 'FileZilla', description: 'FTP, FTPS and SFTP client', category: 'File Sharing', iconUrl: 'https://api.iconify.design/simple-icons/filezilla.svg?color=%23BF0000', availability: { macos: true, linux: true, windows: true } },

  // System
  { id: 'htop', name: 'htop', description: 'Interactive process viewer', category: 'System', iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25', availability: { macos: true, linux: true, windows: false } },
  { id: 'btop', name: 'btop', description: 'Resource monitor with graphs', category: 'System', iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25', availability: { macos: true, linux: true, windows: false } },
  { id: 'neofetch', name: 'Neofetch', description: 'System information tool', category: 'System', iconUrl: 'https://api.iconify.design/simple-icons/gnubash.svg?color=%234EAA25', availability: { macos: true, linux: true, windows: false } },
  { id: 'timeshift', name: 'Timeshift', description: 'System restore utility', category: 'System', iconUrl: 'https://api.iconify.design/simple-icons/linux.svg?color=%23FCC624', availability: { macos: false, linux: true, windows: false } },
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
 * Check if an app is available for a given OS
 */
export function isAppAvailableForOS(app: AppData, osId: OSId): boolean {
  return app.availability[osId];
}

// LocalStorage Keys
export const STORAGE_KEYS = {
  SELECTED_OS: 'packmate-os',
  SELECTED_APPS: 'packmate-apps',
  THEME: 'packmate-theme'
} as const;
