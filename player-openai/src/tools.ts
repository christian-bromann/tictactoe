import { z } from "zod"
import { Key } from "webdriverio"

import { BaseMessage } from "@langchain/core/messages"
import { tools, type ComputerUseInput } from "@langchain/openai"
import { AIMessage, ToolMessage } from "@langchain/core/messages"
import { ToolRuntime, tool, type DynamicStructuredTool } from "@langchain/core/tools"

import { getBrowser } from "./browser.js"

export type { DynamicStructuredTool, ToolMessage, ComputerUseInput }

/**
 * Take a screenshot of the browser and return a tool message
 * @param browser - The browser instance
 * @param lastCallId - The last call ID
 * @returns - The screenshot tool message
 */
async function takeScreenshot(
    browser: WebdriverIO.Browser,
    lastCallId: string
): Promise<ToolMessage> {
    const context = await browser.browsingContextGetTree({
        maxDepth: 1,
    }).then((res) => res.contexts[0].context)
    const result = await browser.browsingContextCaptureScreenshot({
        context,
        origin: "viewport",
    })
    return new ToolMessage({
        tool_call_id: lastCallId,
        content: [
          {
            type: "image_url",
            image_url: `data:image/png;base64,${result.data}`,
          },
        ]
    })
}

/**
 * Tool to automate the browser using OpenAI's computer use capability.
 */
export const computerUseTool = tools.computerUse({
    environment: "browser",
    displayWidth: 1200,
    displayHeight: 900,
    execute: async (action, runtime: ToolRuntime<{ messages: BaseMessage[] }>): Promise<ToolMessage> => {
        const browser = await getBrowser()
        const lastMessage = runtime.state.messages.at(-1) as AIMessage
        const lastCallId = lastMessage.tool_calls?.at(-1)?.id
        if (!lastCallId) {
            throw new Error("No computer_use call ID found")
        }

        switch (action.type) {
            case "screenshot": {
                // Just return a screenshot
                return takeScreenshot(browser, lastCallId)
            }

            case "click": {
                // Click at specific coordinates (clamped to display bounds)
                const { x, y, button: buttonType } = action
                const button = buttonType === 'right' ? 2 : 0
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button },
                        { type: 'pointerMove', x, y, duration: 50 },
                        { type: 'pointerUp', button }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "double_click": {
                // Double-click at specific coordinates (clamped to display bounds)
                const { x, y } = action
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerUp', button: 0 },
                        { type: 'pause', duration: 50 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerUp', button: 0 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "scroll": {
                // Scroll at specific coordinates (clamped to display bounds)
                const { x, y } = action
                const { scroll_x, scroll_y } = action
                await browser.performActions([{
                    type: 'wheel',
                    id: 'wheel',
                    actions: [{
                        type: 'scroll',
                        x,
                        y,
                        deltaX: scroll_x,
                        deltaY: scroll_y,
                        duration: 100
                    }]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "type": {
                // Type text
                await browser.keys(action.text.split(''))
                return takeScreenshot(browser, lastCallId)
            }

            case "keypress": {
                for (const key of action.keys) {
                    await browser.keys(Key[key as keyof typeof Key])
                }
                return takeScreenshot(browser, lastCallId)
            }

            case "move": {
                // Move mouse to specific coordinates (clamped to display bounds)
                const { x, y } = action
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "drag": {
                // Drag from start to end coordinates (clamped to display bounds)
                const { path } = action
                if (path.length < 2) {
                    return takeScreenshot(browser, lastCallId)
                }

                // Clamp all path points
                const actions: {
                    type: 'pointerMove' | 'pointerDown' | 'pointerUp',
                    x?: number,
                    y?: number,
                    duration?: number,
                    button?: number
                }[] = []

                // Move to start position and press
                actions.push({ type: 'pointerMove', x: path[0].x, y: path[0].y, duration: 100 })
                actions.push({ type: 'pointerDown', button: 0 })

                // Move through all path points
                for (let j = 1; j < path.length; j++) {
                    actions.push({ type: 'pointerMove', x: path[j].x, y: path[j].y, duration: 100 })
                }

                // Release
                actions.push({ type: 'pointerUp', button: 0 })

                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "wait": {
                return takeScreenshot(browser, lastCallId)
            }

            default: {
                console.warn(`Unknown action type: ${action}`)
                return takeScreenshot(browser, lastCallId)
            }
        }
    }
})

/**
 * Track game state
 */
let gameEnded = false

/**
 * Check if the game has ended
 * @returns - True if the game has ended, false otherwise
 */
export function hasGameEnded(): boolean {
    return gameEnded
}

/**
 * Tool to allow the agent to end the game
 * @param result - The game result
 * @param winner - The winner of the game
 * @returns - The game ended tool message
 */
export const gameEndedTool = tool(
    async ({ result, winner }) => {
        gameEnded = true
        console.log(`\n🎮 GAME ENDED: ${result}${winner ? ` - Winner: ${winner}` : ''}\n`)
        return `Game has ended. Result: ${result}${winner ? `. Winner: ${winner}` : ''}`
    },
    {
        name: "game_ended",
        description: "Call this tool ONLY when the Tic-Tac-Toe game has finished. Use this when you detect a winner (3 in a row) or a draw (all 9 squares filled with no winner).",
        schema: z.object({
            result: z.enum(["win", "loss", "draw"]).describe("The game result from your perspective (X). 'win' if X won, 'loss' if O won, 'draw' if the board is full with no winner."),
            winner: z.enum(["X", "O"]).optional().describe("The winner of the game, if any. Only set if result is 'win' or 'loss'.")
        })
    }
)
