# AI Interview Platform

A desktop application for conducting voice-based technical interviews with 3 AI agents, live coding challenges, video conferencing, and post-interview reporting. Built with Tauri 2, React 19, and Ollama.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Systems](#key-systems)

---

## Features

### 3 AI Interview Agents

Three distinct AI personas conduct the interview simultaneously, each with their own voice and questioning style:

| Agent | Name | Role | Voice | Focus |
|-------|------|------|-------|-------|
| Peer | Alex Chen | Junior Developer | Fast, higher pitch (friendly) | Fundamentals, communication, day-to-day dev work |
| Team Lead | Sarah Mitchell | Tech Lead | Medium pace (professional) | Architecture decisions, trade-offs, team collaboration |
| Veteran | James Rodriguez | Principal Engineer | Slow, deeper (authoritative) | Edge cases, production experience, deep technical |

All three agents share conversation history to avoid repeating questions. A random agent responds to the candidate, with a 30% chance of a follow-up from a different agent.

### Voice Interview System

- **Speech Recognition**: Web Speech API with continuous mode, interim results, and grammar hints for technical terms
- **Voice Activity Detection**: User speaking interrupts the agent mid-sentence automatically
- **Silence Detection**: 1.5 seconds of silence after the user starts speaking triggers AI response processing
- **Distinct TTS Voices**: Each agent uses a different OS voice with adjusted rate/pitch for maximum distinguishability
- **Session Logging**: All transcript entries (candidate and agents) are logged with timestamps to the Tauri backend

### Resume & Project Parsing

Upload a PDF or paste resume text. The platform automatically extracts:
- Skills across 6 categories (languages, frontend, backend, database, devops, tools)
- Up to 5 projects with name, description, and detected technologies
- Experience level (junior/mid/senior) and years of experience

This context is injected into the AI agents' prompts so they ask relevant, personalized questions.

### No DSA / LeetCode Questions

All questions are **project-based and experience-focused**:
- Project-deep-dive questions (based on candidate's actual projects)
- Skill-based questions (React, Node.js, Python, PostgreSQL, Docker, AWS, TypeScript)
- Architecture questions (for mid/senior candidates)
- Problem-solving and teamwork questions

### Coding Workspace

- **Monaco Editor** (VS Code's editor) with syntax highlighting for 7 languages: JavaScript, TypeScript, Python, Java, C++, Go, Rust
- **Resizable panels**: drag to resize the questions sidebar and output panel
- **Code execution**: JavaScript runs in a sandboxed environment with console output capture
- **Test runner**: Predefined test cases run against the user's code with pass/fail results
- **AI code review**: Ollama-powered feedback on correctness, efficiency, and code quality

### Video Call Mode

- Live camera feed with toggle controls for video and microphone
- Screen sharing capability
- Draggable picture-in-picture self-view
- 20-minute countdown timer with last-minute warning banner
- Graceful transition to coding mode (waits for agent to finish speaking before switching)

### Interview Report

After the session ends, a comprehensive report is generated:
- Summary cards: average score, questions asked, strengths, areas to improve
- Per-question analysis: question, candidate answer, preferred answer, feedback, quality score (1-10)
- Downloadable as a self-contained HTML file with print styles

### Proctor / Lockdown Mode

Activated by the Rust backend on startup:
- Window opens maximized with no decorations, always-on-top
- On Windows: `SetWindowDisplayAffinity` with `WDA_EXCLUDEFROMCAPTURE` hides the window from screen recordings
- On macOS: panel-level window for the same effect

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19.1 + Vite 7 |
| Desktop | Tauri 2 (Rust backend) |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| AI / LLM | Ollama (local or cloud) via REST API |
| Speech | Web Speech API + Web Speech Synthesis API (browser-native) |
| PDF Parsing | pdfjs-dist |
| Icons | lucide-react |
| Fonts | JetBrains Mono (editor), system sans-serif (UI) |

---

## Architecture

The app has **4 modes** controlled from a single root component:

```
setup → video → coding → report
```

| Mode | Description |
|------|-------------|
| `setup` | Landing screen: enter name, upload resume, generate/join interview code |
| `video` | Full-screen video view with 3 AI agents asking questions via voice |
| `coding` | Monaco editor workspace with questions sidebar, output panel, and agent panel |
| `report` | Post-interview analysis with scores, Q&A breakdown, and downloadable HTML |

### Voice System

Two independent speech systems exist in the codebase:

1. **`useAgentVoice`** (core interview engine): Handles the continuous voice interview — agents speak and listen continuously. Starts when "Start Interview" is clicked in video mode. Pauses when switching to coding mode to free the microphone for other uses.

2. **`useVoice`** (general-purpose): A lightweight STT/TTS hook. Currently returns `null` in the UI since voice controls were removed — the interview is fully voice-driven.

### Backend

Tauri (Rust) backend manages:
- Session file creation and transcript appending
- Report generation from completed sessions
- Window-level proctoring (screen capture exclusion)

When running outside Tauri (pure Vite dev), all backend calls fall back to `localStorage`.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ with **pnpm** (or npm)
- **Rust** 1.70+
- **Ollama** running locally (or a cloud Ollama endpoint)

### Setup

```bash
# Install dependencies
pnpm install

# Start Ollama (if local)
ollama serve
ollama pull llama3
# Or use any Ollama-compatible endpoint via .env.local
```

### Development

```bash
# Run the full Tauri dev environment (Vite + Tauri)
pnpm tauri dev
```

### Production Build

```bash
pnpm tauri build
```

Outputs:
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/`

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Ollama connection (defaults to localhost:11434 if not set)
VITE_OLLAMA_BASE_URL=http://localhost:11434

# Optional: API key for cloud Ollama endpoints
VITE_OLLAMA_API_KEY=

# Model name (defaults to llama3 if not set)
VITE_OLLAMA_MODEL=llama3
```

---

## Project Structure

```
INTERVIEW/
├── index.html              # Entry HTML
├── package.json            # Frontend dependencies and scripts
├── vite.config.js          # Vite + Tauri configuration
│
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component: mode controller, all screens
│   ├── App.css             # Global styles
│   │
│   ├── components/
│   │   ├── AgentPanel.jsx       # 3-agent panel with status indicators
│   │   ├── AIChat.jsx           # Chat UI backed by useOllama hook
│   │   ├── InterviewSetup.jsx    # Setup/join screen with resume upload
│   │   ├── VoiceControls.jsx    # Returns null (voice handled automatically)
│   │   └── Overlay.jsx          # Proctor/lockdown overlay
│   │
│   ├── hooks/
│   │   ├── useAgentVoice.js     # Core voice interview engine (STT + TTS + multi-agent)
│   │   ├── useOllama.js         # Ollama chat session management
│   │   ├── useVoice.js          # General-purpose STT/TTS hook
│   │   ├── useInterviewFlow.js  # Interview phase state machine
│   │   └── useResize.js         # Resizable panel dimensions
│   │
│   ├── services/
│   │   ├── ollama.js            # Ollama API client (chat, streaming, code review)
│   │   ├── agents.js            # 3 agent personas + system prompts + introductions
│   │   ├── codeRunner.js        # JS execution engine + test runner
│   │   ├── interviewBackend.js  # Tauri command wrapper (localStorage fallback)
│   │   ├── resumeParser.js       # Resume text extraction (skills, projects, experience)
│   │   └── questionGenerator.js  # Project-based question bank (NOT DSA)
│   │
│   └── styles/
│       ├── tokens.css     # Design tokens (CSS variables)
│       ├── typography.css
│       ├── base.css       # Reset + globals
│       ├── components.css
│       └── layout.css     # Workspace layout + resize handles
│
└── src-tauri/
    ├── Cargo.toml          # Rust dependencies
    ├── tauri.conf.json     # Tauri app config
    ├── build.rs           # Build script
    ├── capabilities/
    │   └── default.json   # Window permissions (always-on-top, no decorations)
    ├── icons/
    └── src/
        ├── main.rs       # Window creation + all Tauri commands
        └── lib.rs        # Re-export for mobile support
```

---

## Key Systems

### How the Interview Flow Works

1. **Setup**: Candidate enters name, uploads resume (PDF or text), adds projects
2. **Video Mode**: 20-minute countdown starts. "Start Interview" triggers `useAgentVoice.startInterview()` — Alex (peer agent) introduces first, then continuous speech recognition begins
3. **Agent Response Loop**: User speaks → 1.5s silence → transcript sent to Ollama → agent responds → TTS speaks → repeat
4. **Mode Switch**: Clicking "Start Coding" waits for current agent speech to finish, then pauses voice recognition and switches mode
5. **Coding**: Candidate writes code in Monaco Editor, can run and get test results, AI code review available
6. **Report**: After 20 minutes (or manual end), transcript is analyzed and a report is generated with scores and feedback

### Code Execution

JavaScript code is executed locally in the browser using a sandboxed `new Function()` wrapper that captures `console.log`, `console.error`, and `console.warn` output. Other languages (Python, Go, Rust, etc.) show simulated output since true cross-language execution requires a backend execution service.

### Session Persistence

Sessions are keyed by a 6-character alphanumeric interview code stored in `localStorage`. This enables the "join by code" flow without authentication. Reports are stored in `%APPDATA%/com.phiwa.interview/reports/` when running in Tauri.

---

## Screenshots / UI Layout

### Video Mode
```
┌─────────────────────────────────────────────────────────┐
│ Interview                            Live  19:45  [Bot] [⛶]│
├───────────────────────────────────┬─────────────────────┤
│                                   │  Interview Panel     │
│                                   │  ┌────────────────┐ │
│         Candidate Camera          │  │ Alex  ● Listen │ │
│         + Name Label              │  │ Sarah ○ Idle   │ │
│                                   │  │ James ○ Idle   │ │
│                                   │  └────────────────┘ │
│                                   │  [Start Interview]   │
├───────────────────────────────────┴─────────────────────┤
│  [🎤] [📹] [🖥️]  │ [Start Coding]  │  [End]            │
└─────────────────────────────────────────────────────────┘
```

### Coding Mode (resizable panels)
```
┌─────────────────────────────────────────────────────────┐
│ AI Interview  │ JavaScript │ Live │ 19:12 │ [Bot] [⛶] │
├──────────┬───────────────────────────┬──────────────────┤
│ Problems │                           │                  │
│ ┌──────┐ │  Monaco Editor            │  Agent Panel     │
│ │ Q1 ● │ │  function twoSum(...)     │  Alex ● Speaking │
│ │ Q2   │ │                           │  Sarah ○ Idle    │
│ │ Q3   │ ├───────────────────────────┤  James ○ Idle    │
│ └──────┘ │  [Output] [Test Results]  │                  │
├──────────┤  > Run your code...       │                  │
│ Q1 Title │                           │                  │
│ Desc...  │                           │                  │
└──────────┴───────────────────────────┴──────────────────┘
```
*(Drag the vertical bar to resize the sidebar, drag the horizontal bar to resize the output panel)*
