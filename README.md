# TikTakTo - Computer Use Demo with LangChainJS

A demonstration project showcasing **Computer Use** capabilities of OpenAI and Anthropic AI models through [LangChainJS](https://docs.langchain.com/). Watch AI agents play Tic-Tac-Toe by seeing the screen and controlling a browser!

## What is Computer Use?

Computer Use is a capability that allows AI models to:

- **See** - Capture and interpret screenshots
- **Think** - Analyze visual information and make decisions
- **Act** - Control mouse movements, clicks, and keyboard input

This project demonstrates both **OpenAI** and **Anthropic** implementations of this technology, using LangChainJS as the orchestration layer.

## Project Structure

```txt
tiktakto/
├── game/              # Next.js Tic-Tac-Toe web app
├── player-anthropic/  # Anthropic Claude computer use agent
├── player-openai/     # OpenAI computer use agent
└── README.md
```

### Components

| Directory | Description |
|-----------|-------------|
| `game/` | A Next.js web application hosting the Tic-Tac-Toe game at `localhost:3000` |
| `player-anthropic/` | AI agent using Anthropic's Claude with `computer_20250124` tool |
| `player-openai/` | AI agent using OpenAI's `computer-use-preview` model |

## How It Works

```txt
┌─────────────────────────────────────────────────────────┐
│                    LangChainJS Agent                    │
│  ┌───────────────────┐    ┌───────────────────────────┐ │
│  │  OpenAI/Anthropic │    │     Computer Use Tool     │ │
│  │       Model       │◄──►│  screenshot, click, type  │ │
│  └───────────────────┘    └─────────────┬─────────────┘ │
└─────────────────────────────────────────┼───────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────┐
                           │   WebDriverIO Browser    │
                           │  ┌────────────────────┐  │
                           │  │  Tic-Tac-Toe Game  │  │
                           │  │  localhost:3000    │  │
                           │  └────────────────────┘  │
                           └──────────────────────────┘
```

1. **Agent receives a task** - Play Tic-Tac-Toe and try to win
2. **Takes screenshot** - Captures the browser viewport
3. **Analyzes the board** - Uses vision to identify X's, O's, and empty cells
4. **Makes a move** - Clicks on an empty cell to place an X
5. **Verifies result** - Takes another screenshot to confirm the move
6. **Detects game end** - Recognizes win/loss/draw messages on screen

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- API keys for OpenAI and/or Anthropic

### Installation

```bash
# Clone the repository
git clone git@github.com:christian-bromann/tictactoe.git
cd tiktakto

# Install dependencies
pnpm install

# Set up API keys
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key
```

### Running the Demo

Run an AI player via:

```bash
# For Anthropic Claude
pnpm play:anthropic

# OR for OpenAI
pnpm play:openai
```

**Play against the AI!** The AI plays as "X" and goes first. Make your moves as "O" by clicking on the game board.

## Key Technologies

- **[LangChainJS](https://docs.langchain.com/)** - AI orchestration framework
- **[WebDriverIO](https://webdriver.io/)** - Browser automation
- **[Next.js](https://nextjs.org/)** - React framework for the game UI
- **OpenAI Computer Use** - `computer-use-preview` model
- **Anthropic Computer Use** - `computer_20250124` tool

## Learn More

- [OpenAI Computer Use Guide](https://platform.openai.com/docs/guides/tools-computer-use)
- [Anthropic Computer Use Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use)
- [LangChainJS Documentation](https://js.langchain.com/docs/)
- [WebDriverIO BiDi Protocol](https://webdriver.io/docs/api/webdriverBidi)

## License

MIT
