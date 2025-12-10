# Anthropic Computer Use Agent - Tic-Tac-Toe Player

An autonomous AI agent that uses **Anthropic's Computer Use** capability to play Tic-Tac-Toe by visually interpreting screenshots and controlling a browser through mouse clicks.

## Overview

This project demonstrates Anthropic's Claude model with computer use playing Tic-Tac-Toe against a human opponent. The agent:

1. **Sees** the game board through browser screenshots
2. **Analyzes** the current game state using vision capabilities
3. **Acts** by clicking on empty cells to place X marks
4. **Verifies** its moves by taking follow-up screenshots
5. **Detects** game end conditions (win/loss/draw) from on-screen messages

## Architecture

```txt
┌─────────────────────────────────────────────────────────────────┐
│                         LangChain Agent                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Anthropic      │    │  Computer Use   │    │  Game End   │  │
│  │  Claude Sonnet  │◄──►│     Tool        │    │    Tool     │  │
│  │                 │    │                 │    │             │  │
│  └─────────────────┘    └────────┬────────┘    └─────────────┘  │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   WebDriverIO (BiDi)     │
                    │  ┌────────────────────┐  │
                    │  │  Screenshots       │  │
                    │  │  Mouse Actions     │  │
                    │  │  Keyboard Input    │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Browser (Chrome)       │
                    │  ┌────────────────────┐  │
                    │  │  Tic-Tac-Toe Game  │  │
                    │  │  localhost:3000    │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
```

## Key Components

### 1. Agent Setup (`src/index.ts`)

The agent is created using LangChain's `createAgent` with Anthropic's Claude model:

```typescript
const agent = createAgent({
    model: "anthropic:claude-sonnet-4-5",
    tools: [computerUseTool, gameEndedTool],
    middleware: [contextEditingMiddleware({
        edits: [
            new ClearToolUsesEdit({
                trigger: [{ messages: 2 }],
                keep: { messages: 1 }
            })
        ]
    })],
    systemPrompt,
})
```

**Important**: The `ClearToolUsesEdit` middleware is used to manage context window by clearing old tool uses (screenshots) to prevent overflow.

### 2. Computer Use Tool (`src/tools.ts`)

The `computerUseTool` wraps Anthropic's computer use capability (`computer_20250124`) and implements browser automation:

```typescript
export const computerUseTool = tools.computer_20250124({
    displayWidthPx: 1024,
    displayHeightPx: 768,
    displayNumber: 1,
    execute: async (action) => {
        // Handle: screenshot, left_click, right_click, double_click,
        //         scroll, type, key, mouse_move, wait, etc.
    }
})
```

**Coordinate Scaling**: The model works with 1024x768 coordinates, which are scaled up to actual CSS coordinates when clicking.

### 3. Browser Automation (`src/browser.ts`)

Uses [**WebDriverIO**](https://webdriver.io) for:

- Fast viewport screenshots via `browsingContextCaptureScreenshot`
- Mouse actions via `performActions`
- Keyboard input via `keys`

### 4. Prompts (`src/prompts.ts`)

Carefully crafted system and user prompts that:

- Explain the screen layout (scoreboard vs game board)
- Provide cell labels and clicking instructions
- Define game end detection criteria
- Guide optimal strategy

## Installation

```bash
# Install dependencies
pnpm install

# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-api-key
```

## Usage

1. **Start the Tic-Tac-Toe game** (in the `../game` directory):

   ```bash
   cd ../game
   pnpm dev
   ```

2. **Run the AI player**:

   ```bash
   pnpm dev
   ```

3. **Play against the AI**: The AI plays as "X" and goes first. Make your moves as "O" by clicking on the game board.

## How It Works

### Game Loop

```txt
1. Agent takes initial screenshot
2. Agent analyzes board, identifies empty cells
3. Agent clicks on chosen cell (CENTER first, then corners)
4. Agent takes verification screenshot
5. Agent checks for win/draw message
6. If game continues, waits for human move
7. Repeat from step 1
```

### Action Types Supported

| Action | Description |
|--------|-------------|
| `screenshot` | Capture current viewport |
| `left_click` | Left click at coordinate |
| `right_click` | Right click at coordinate |
| `middle_click` | Middle click at coordinate |
| `double_click` | Double-click at coordinate |
| `triple_click` | Triple-click at coordinate |
| `left_click_drag` | Drag from start to end |
| `left_mouse_down` | Press mouse button down |
| `left_mouse_up` | Release mouse button |
| `mouse_move` | Move mouse to position |
| `scroll` | Scroll at position |
| `type` | Type text characters |
| `key` | Press key combinations |
| `hold_key` | Hold a key |
| `wait` | Wait for duration |

## License

MIT
