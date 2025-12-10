# OpenAI Computer Use Agent - Tic-Tac-Toe Player

An autonomous AI agent that uses **OpenAI's Computer Use** capability to play Tic-Tac-Toe by visually interpreting screenshots and controlling a browser through mouse clicks.

## Overview

This project demonstrates OpenAI's `computer-use-preview` model playing Tic-Tac-Toe against a human opponent. The agent:

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
│  │  OpenAI Model   │    │  Computer Use   │    │  Game End   │  │
│  │  (computer-use- │◄──►│     Tool        │    │    Tool     │  │
│  │    preview)     │    │                 │    │             │  │
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
                    │   Browser (Firefox)      │
                    │  ┌────────────────────┐  │
                    │  │  Tic-Tac-Toe Game  │  │
                    │  │  localhost:3000    │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
```

## Key Components

### 1. Agent Setup (`src/index.ts`)

The agent is created using LangChain's `createAgent` with OpenAI's `computer-use-preview` model:

```typescript
const agent = createAgent({
    model: new ChatOpenAI({
        model: "computer-use-preview",
    }),
    middleware: [createMiddleware({
        name: "setModelOptions",
        wrapModelCall: (options, request) => {
            return request({
                ...options,
                modelSettings: {
                    truncation: "auto"  // Required for computer use
                }
            })
        }
    })],
    tools: [computerUseTool, gameEndedTool],
    systemPrompt,
})
```

**Important**: The `truncation: "auto"` setting is required by OpenAI for the computer use tool to function properly.

### 2. Computer Use Tool (`src/tools.ts`)

The `computerUseTool` wraps OpenAI's computer use capability and implements browser automation:

```typescript
export const computerUseTool = tools.computerUse({
    environment: "browser",
    displayWidth: 1200,
    displayHeight: 900,
    execute: async (action, runtime) => {
        // Handle: screenshot, click, double_click, scroll, 
        //         type, keypress, move, drag, wait
    }
})
```

**Screenshot Return Format**: Screenshots must be returned as `ToolMessage` objects with the image in the correct format:

```typescript
return new ToolMessage({
    tool_call_id: lastCallId,
    content: [
      {
        type: "image_url",
        image_url: `data:image/png;base64,${result.data}`,
      },
    ]
})
```

### 3. Browser Automation (`src/browser.ts`)

Uses [**WebDriverIO**](https://webdriver.io) for:

- Fast viewport screenshots via `browsingContextCaptureScreenshot`
- Mouse actions via `performActions`
- Keyboard input via `keys`

### 4. Prompts (`src/prompts.ts`)

Carefully crafted system and user prompts that:

- Explain the game rules and board layout
- Provide clicking instructions (cells have labels like TOP-LEFT, CENTER, etc.)
- Define game end detection criteria
- Guide optimal strategy

## Installation

```bash
# Install dependencies
pnpm install

# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key
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
| `click` | Left/right click at (x, y) |
| `double_click` | Double-click at (x, y) |
| `scroll` | Scroll at position with delta |
| `type` | Type text characters |
| `keypress` | Press specific keys |
| `move` | Move mouse to position |
| `drag` | Drag along a path |
| `wait` | Wait (returns screenshot) |

## License

MIT
