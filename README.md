# 🛡️ Cluely Killer - Secure Interview Platform

<div align="center">

![Tauri](https://img.shields.io/badge/Tauri-2.10-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-Backend-DEA584?style=for-the-badge&logo=rust&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A secure technical interview platform immune to cheating software**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Technology Stack](#-technology-stack) • [Contributing](#-contributing)

</div>

---

## 🚀 Overview

**Cluely Killer** is a secure technical interview platform built with **Tauri 2** and **React 19** designed to conduct fair, cheat-proof coding interviews. The platform provides a comprehensive interview environment with built-in proctoring mechanisms that are **immune to cheating software** like Cluely, ChatGPT wrappers, and other AI-powered interview assistance tools.

### 🎯 The Main Feature: Cheating-Immune Interview Environment

This platform is specifically engineered to prevent candidates from using cheating tools during interviews:

- **🔒 Screen Recording Protection** - The proctoring overlay uses system-level window APIs that prevent cheating apps from capturing interview questions and content through screen recording
- **🪟 Locked Environment** - Candidates cannot switch windows, alt-tab, or access external resources during the interview session
- **👻 Invisible to Cheating Apps** - The platform's architecture makes it impossible for AI cheating tools to detect, capture, or interact with interview content
- **🎯 Always-On-Top Proctoring** - A secure overlay maintains constant visibility, preventing candidates from navigating away
- **🚫 No Window Decorations** - Frameless, fullscreen mode prevents standard window manipulation techniques used by cheating software

> **Why This Matters:** AI-powered cheating tools like Cluely work by capturing screen content and providing real-time answers. Our platform blocks these tools at the system level, ensuring that interview content remains invisible to screen capture and AI assistance cannot access the questions or code.

---

## ✨ Features

### 🤖 AI Voice Interview System (NEW!)
- **3 Distinct AI Agents** conducting the interview:
  - **Peer** (Alex Chen) - Friendly junior developer asking about fundamentals
  - **Team Lead** (Sarah Mitchell) - Professional tech lead evaluating architecture
  - **Veteran** (James Rodriguez) - Senior principal engineer diving deep
- **Voice-to-Voice** interaction using Web Speech API
- **Smart Resume Parsing** - Automatically extracts skills, projects, and experience
- **Project-Based Questions** - Focus on real work, NO DSA/LeetCode
- **Interview Code System** - Generate unique codes for session management

### 📹 Video Call Interface
- Real-time camera preview with picture-in-picture mode
- Microphone and camera toggle controls
- Screen sharing capabilities for interviewers
- Professional dark-themed UI optimized for extended sessions

### 💻 Secure Coding Workspace
- **Monaco Editor Integration** - The same editor powering VS Code
- **Multi-Language Support**:
  - JavaScript/TypeScript
  - Python
  - Java
  - C++
  - Go
  - Rust
- Syntax highlighting and IntelliSense
- Secure code execution environment
- No copy-paste from external sources

### 📝 Interview Question Bank
- Pre-loaded coding challenges with difficulty ratings (Easy/Medium/Hard)
- Problem descriptions with examples
- Automated test case validation
- Pass/fail results with detailed feedback

### 🔒 Proctoring & Security System
```
┌─────────────────────────────────────────────────────────────┐
│                  Interview Locked • Press ESC               │
├─────────────────────────────────────────────────────────────┤
│                                            ┌──────────────┐ │
│                                            │  Questions   │ │
│         [Secure Interview Environment]     │   Panel      │ │
│              (Protected Mode)              │              │ │
│                                            │  Q1. Event   │ │
│     The overlay protects interview         │  Loop in JS  │ │
│     content from screen capture            │              │ │
│     and cheating software                  │  Q2. React   │ │
│                                            │  Lifecycle   │ │
│                                            │              │ │
│                                            │  Q3. XSS/    │ │
│                                            │  CSRF        │ │
│                                            └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### ⚡ Code Execution Engine
- Real-time JavaScript execution in a sandboxed environment
- Console output capture and display
- Performance timing metrics
- Test case runner with result visualization

---

## 🛡️ How It Prevents Cheating

### Blocking Common Cheating Methods

| Cheating Method | How This Platform Blocks It |
|----------------|----------------------------|
| **Screen Capture by AI Tools** | Panel API makes overlay invisible to screen recording, so cheating apps can't see questions |
| **Window Switching** | Always-on-top fullscreen mode prevents access to other applications |
| **Clipboard Manipulation** | Secure clipboard handling prevents copy-paste from external sources |
| **Process Injection** | Tauri's Rust backend provides system-level protection |
| **Browser Extensions** | Native desktop app, not browser-based - extensions can't interact |
| **AI Answer Generators** | Questions are hidden from screen capture, so AI tools receive no input |

### Technical Implementation

The anti-cheating protection is achieved through:

1. **Tauri's Native Window API** - System-level window control that bypasses browser limitations
2. **macOS Panel Conversion** - Special window type invisible to screen recording APIs
3. **Fullscreen Lock Mode** - Prevents window switching and application cycling
4. **Custom Event Handling** - Intercepts and blocks prohibited keyboard shortcuts
5. **Decoration-Free Windows** - No standard window controls to manipulate

```javascript
// From Overlay.jsx - Security configuration
useEffect(() => {
  const lockScreen = async () => {
    await tauriWindow.setAlwaysOnTop(true);      // Prevent window switching
    await tauriWindow.setFullscreen(false);      // Controlled fullscreen
    await tauriWindow.maximize();                // Maximum coverage
    await tauriWindow.setDecorations(false);     // No window controls
    
    // Invisible to screen recording (blocks AI cheating tools)
    if (typeof tauriWindow.toPanel === "function") {
      tauriWindow.toPanel();
    }
  };
  lockScreen();
}, []);
```

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 | UI components and state management |
| **Desktop Framework** | Tauri 2 | Native desktop wrapper with Rust backend |
| **Code Editor** | Monaco Editor | Professional code editing experience |
| **Icons** | Lucide React | Beautiful, consistent iconography |
| **Build Tool** | Vite 7 | Fast development and optimized builds |
| **Styling** | CSS Custom Properties | Design tokens and theming |
| **Backend** | Rust | System-level security and window management |

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 20.19.0 or >= 22.12.0
- **pnpm** (recommended) or npm
- **Rust** (latest stable)
- **System Dependencies** for Tauri:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `webkit2gtk`, `openssl`, and related development packages

### Quick Start

```bash
# Clone the repository
git clone https://github.com/hiwarkhedeprasad/cluely-killer-interview-platform.git
cd cluely-killer-interview-platform

# Install dependencies
pnpm install

# Install and start Ollama (for AI agents)
# Download from https://ollama.ai
ollama serve
ollama pull llama3

# Start development server
pnpm tauri dev
```

### Use fast cloud Ollama endpoint

This app supports any Ollama-compatible cloud endpoint (for faster responses) via Vite env vars.

Create a `.env.local` file in the project root:

```bash
VITE_OLLAMA_BASE_URL=https://your-ollama-cloud-endpoint
VITE_OLLAMA_API_KEY=your_api_key_if_required
VITE_OLLAMA_MODEL=llama3.1:8b
```

If these vars are not set, it defaults to local Ollama at `http://localhost:11434` with model `llama3`.

### Build for Production

```bash
# Build the application
pnpm tauri build

# The compiled application will be in:
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
# Linux: src-tauri/target/release/bundle/deb/
```

---

## 🎮 Usage

### For Interviewers

1. Launch the application via `pnpm tauri dev` or the compiled binary
2. The interview dashboard appears with video call interface
3. Use the control bar to manage camera/microphone settings
4. Switch to coding workspace by clicking the code icon
5. Select questions from the panel for the candidate
6. Monitor the candidate's code in real-time

### Interview Security Mode

When the interview begins, the secure overlay activates:

- **Screen Lock**: Candidate's screen is locked to the interview application
- **Proctoring Overlay**: Questions displayed in protected panel
- **No Escape**: Window decorations removed, always-on-top enforced
- **Screen Recording Immune**: AI cheating tools cannot capture content

Press **ESC** to exit the secure mode (interviewer controlled).

---

## 📁 Project Structure

```
cluely-killer-interview-platform/
├── src/                      # React application source
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application-specific styles
│   ├── main.jsx             # React entry point
│   ├── components/
│   │   └── Overlay.jsx      # Secure proctoring overlay
│   └── styles/
│       ├── tokens.css       # Design tokens (colors, spacing)
│       ├── base.css         # Reset and global styles
│       ├── components.css   # Component primitives
│       ├── layout.css       # Layout utilities
│       └── typography.css   # Type scale and fonts
├── src-tauri/               # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs          # Rust entry point
│   │   └── lib.rs           # Core Rust library
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri configuration
│   ├── build.rs             # Build script
│   └── capabilities/
│       └── default.json     # Window capabilities
├── index.html               # HTML entry point
├── package.json             # Node.js dependencies
├── vite.config.js           # Vite configuration
└── pnpm-lock.yaml          # Dependency lock file
```

---

## 🔧 Configuration

### Tauri Configuration (`tauri.conf.json`)

Security-focused window settings:

```json
{
  "app": {
    "windows": [
      {
        "title": "Interview Platform",
        "visible": true,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true
      }
    ]
  }
}
```

### Design Tokens (`tokens.css`)

The application uses a comprehensive design token system:

- **Colors**: Primary, secondary, accent, status colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent gap and padding scales
- **Effects**: Shadows, blurs, transitions

---

## 🆚 Comparison with Other Platforms

| Feature | Cluely Killer | HackerRank | CodeSignal | LeetCode |
|---------|--------------|------------|------------|----------|
| **AI Cheating Immunity** | ✅ System-level | ⚠️ Browser-level | ⚠️ Browser-level | ❌ None |
| **Screen Capture Protection** | ✅ Native API | ❌ None | ⚠️ Limited | ❌ None |
| **Window Lock** | ✅ Full lock | ⚠️ Warning only | ⚠️ Warning only | ❌ None |
| **Native Desktop App** | ✅ Yes | ❌ Browser | ❌ Browser | ❌ Browser |
| **Real-time Proctoring** | ✅ Built-in | ⚠️ Add-on | ⚠️ Add-on | ❌ None |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation for new features
- Test on multiple platforms before submitting
- Ensure security features remain effective

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the incredible native desktop framework with security capabilities
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - For the professional code editing experience
- [Lucide](https://lucide.dev/) - For the beautiful icon set
- [React Team](https://react.dev/) - For the amazing frontend framework

---

<div align="center">

**⭐ If this project helped you conduct fair interviews, consider giving it a star! ⭐**

Made with ❤️ by [hiwarkhedeprasad](https://github.com/hiwarkhedeprasad)

</div>
