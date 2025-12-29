# SlackTeams

A lightweight, fast Microsoft Teams client with a Slack-inspired user interface. Built with Tauri, React, and TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Why SlackTeams?

Microsoft Teams is powerful but can be slow and resource-heavy. SlackTeams provides a streamlined experience with:

- **Fast startup** - Native desktop app, not Electron
- **Low memory usage** - Tauri uses system webview
- **Clean UI** - Slack-inspired interface that's easy to navigate
- **Real-time updates** - Messages appear instantly

## Features

- View and navigate Teams channels and direct messages
- Send and receive messages with real-time updates
- Thread support for channel conversations
- User presence indicators
- Dark/light mode toggle
- Collapsible sidebar
- Cross-platform (Windows, macOS, Linux)
- Secure Microsoft authentication

## Prerequisites

1. **Node.js** v18 or later
2. **Rust** (for Tauri builds) - [Install Rust](https://rustup.rs/)
3. **Azure AD App Registration** (see setup below)

### Platform-Specific Requirements

**Linux:**
```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev
```

**macOS:** Xcode Command Line Tools
```bash
xcode-select --install
```

**Windows:** WebView2 (usually pre-installed on Windows 10/11)

## Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App registrations
2. Click **New registration**
3. Configure:
   - **Name**: SlackTeams
   - **Supported account types**: Accounts in any organizational directory (Multitenant)
   - **Redirect URI**: Single-page application (SPA) → `http://localhost:5173`
4. Note your **Application (client) ID**
5. Go to **API permissions** and add these Microsoft Graph delegated permissions:
   - `User.Read`
   - `Team.ReadBasic.All`
   - `Channel.ReadBasic.All`
   - `ChannelMessage.Read.All`
   - `ChannelMessage.Send`
   - `Chat.Read`
   - `Chat.ReadWrite`
   - `Presence.Read.All`
6. Click **Grant admin consent** (requires admin rights, or users will consent individually)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/slackteams.git
cd slackteams

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your Azure Client ID
```

## Configuration

Edit `.env` with your Azure AD settings:

```env
# Required: Your Azure AD Application (client) ID
VITE_AZURE_CLIENT_ID=your-client-id-here

# Optional: Azure AD Authority (default: multi-tenant)
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/common

# Optional: Redirect URI (default: localhost:5173)
VITE_REDIRECT_URI=http://localhost:5173
```

## Development

```bash
# Run web development server
npm run dev

# Run as desktop app
npm run tauri:dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build for production
npm run build
```

## Building Desktop App

```bash
# Build for current platform
npm run tauri:build

# Debug build (faster, includes devtools)
npm run tauri:build:debug
```

Output locations:
- **Windows**: `src-tauri/target/release/bundle/msi/` and `nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` and `macos/`
- **Linux**: `src-tauri/target/release/bundle/appimage/` and `deb/`

## Project Structure

```
slackteams/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── MainContent/      # Message area
│   │   ├── MessageInput/     # Message composer
│   │   ├── MessageList/      # Message display
│   │   ├── Sidebar/          # Teams/channels navigation
│   │   ├── ThreadView/       # Thread panel
│   │   ├── Toast/            # Notifications
│   │   └── UserPresence/     # Avatar and presence
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services (auth, graph)
│   ├── stores/               # Zustand state management
│   ├── test/                 # Test setup
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utilities (logger, api, sanitize)
├── src-tauri/                # Tauri backend (Rust)
│   ├── src/                  # Rust source
│   ├── icons/                # App icons
│   └── tauri.conf.json       # Tauri config
├── .env.example              # Environment template
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| State | Zustand |
| Desktop | Tauri 2 (Rust) |
| Auth | MSAL (Microsoft Authentication Library) |
| API | Microsoft Graph |
| Testing | Vitest |

## Troubleshooting

### "No access token available"
- Clear browser localStorage/cookies
- Click "Switch Account" to re-authenticate
- Verify Azure AD app permissions are granted

### Messages not updating
- Check browser console for errors
- Ensure you have `ChannelMessage.Read.All` permission
- Try switching to a different channel and back

### Build fails on Linux
```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev
```

### Tauri dev command hangs
Ensure Rust is properly installed:
```bash
rustc --version
cargo --version
```

## Security

- All authentication handled via Microsoft's official MSAL library
- No credentials stored locally (uses secure token cache)
- Content Security Policy configured for Tauri
- HTML content sanitized to prevent XSS
- API calls use rate limiting and retry logic

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linter (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop framework
- [Microsoft Graph](https://developer.microsoft.com/graph) - Teams API
- [Tailwind CSS](https://tailwindcss.com/) - Styling
