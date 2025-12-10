import fs from "fs"
import { Key } from "webdriverio"
import { z } from "zod"

import { tool, type ToolRuntime } from "langchain"
import { tools, type Computer20250124Action } from "@langchain/anthropic"
import { AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages"

import { getBrowser } from "./browser.js"

let screenshotCounter = 0

/**
 * Take a screenshot of the browser viewport
 * Screenshots are resized to match the dimensions reported to the model
 * @param browser - The WebdriverIO browser instance
 * @returns Base64-encoded PNG screenshot
 */
async function takeScreenshot(browser: WebdriverIO.Browser, lastCallId: string): Promise<ToolMessage> {
    const context = await browser.browsingContextGetTree({
        maxDepth: 1,
    }).then((res) => res.contexts[0].context)
    
    const result = await browser.browsingContextCaptureScreenshot({
        context,
        origin: "viewport",
    })

    fs.writeFileSync(`screenshot-${screenshotCounter}.png`, Buffer.from(result.data, "base64"))
    screenshotCounter++
    
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
 * Computer use tool for Anthropic's Claude model.
 * Enables the model to control a browser through screenshots and mouse/keyboard actions.
 */
export const computerUseTool = tools.computer_20250124({
    displayWidthPx: 1200,
    displayHeightPx: 900,
    displayNumber: 1,
    execute: async (action, runtime: ToolRuntime<{ messages: BaseMessage[] }>): Promise<ToolMessage> => {
        const browser = await getBrowser()
        const lastMessage = runtime.state.messages.at(-1) as AIMessage
        const lastCallId = lastMessage.tool_calls?.at(-1)?.id
        if (!lastCallId) {
            throw new Error("No computer_use call ID found")
        }
        
        switch (action.action) {
            case "screenshot": {
                return takeScreenshot(browser, lastCallId)
            }

            case "left_click": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Click: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerMove', x, y, duration: 50 },
                        { type: 'pointerUp', button: 0 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "right_click": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Right Click: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 2 },
                        { type: 'pointerMove', x, y, duration: 50 },
                        { type: 'pointerUp', button: 2 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "middle_click": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Middle Click: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 1 },
                        { type: 'pointerMove', x, y, duration: 50 },
                        { type: 'pointerUp', button: 1 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "double_click": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Double Click: Model (${x}, ${y})`)
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

            case "triple_click": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Triple Click: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerUp', button: 0 },
                        { type: 'pause', duration: 30 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerUp', button: 0 },
                        { type: 'pause', duration: 30 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerUp', button: 0 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "left_click_drag": {
                const [ startX, startY ] = action.start_coordinate
                const [ endX, endY ] = action.end_coordinate
                console.log(`📍 Left Click Drag: Model (${startX}, ${startY}) → (${endX}, ${endY})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x: startX, y: startY, duration: 100 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pointerMove', x: endX, y: endY, duration: 200 },
                        { type: 'pointerUp', button: 0 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "left_mouse_down": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Left Mouse Down: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerDown', button: 0 }
                    ]
                }])
                return takeScreenshot(browser, lastCallId)
            }

            case "left_mouse_up": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Left Mouse Up: Model (${x}, ${y})`)
                await browser.performActions([{
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'mouse' },
                    actions: [
                        { type: 'pointerMove', x, y, duration: 100 },
                        { type: 'pointerUp', button: 0 }
                    ]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "mouse_move": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Mouse Move: Model (${x}, ${y})`)
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

            case "scroll": {
                const [ x, y ] = action.coordinate
                console.log(`📍 Scroll: Model (${x}, ${y})`)
                const scrollAmount = action.scroll_amount || 100
                let deltaX = 0
                let deltaY = 0
                
                switch (action.scroll_direction) {
                    case "up": deltaY = -scrollAmount; break
                    case "down": deltaY = scrollAmount; break
                    case "left": deltaX = -scrollAmount; break
                    case "right": deltaX = scrollAmount; break
                }
                
                await browser.performActions([{
                    type: 'wheel',
                    id: 'wheel',
                    actions: [{
                        type: 'scroll',
                        x,
                        y,
                        deltaX,
                        deltaY,
                        duration: 100
                    }]
                }])
                await browser.releaseActions()
                return takeScreenshot(browser, lastCallId)
            }

            case "type": {
                console.log(`📍 Type: Model (${action.text})`)
                await browser.keys(action.text.split(''))
                return takeScreenshot(browser, lastCallId)
            }

            case "key": {
                console.log(`📍 Key: Model (${action.key})`)
                const keys = action.key.split('+').map(k => k.trim())
                for (const key of keys) {
                    const mappedKey = Key[key as keyof typeof Key] || key
                    await browser.keys(mappedKey)
                }
                return takeScreenshot(browser, lastCallId)
            }

            case "hold_key": {
                console.log(`📍 Hold Key: Model (${action.key})`)
                const mappedKey = Key[action.key as keyof typeof Key] || action.key
                await browser.keys(mappedKey)
                return takeScreenshot(browser, lastCallId)
            }

            case "wait": {
                console.log(`📍 Wait: Model (${action.duration || 1} seconds)`)
                await new Promise(resolve => setTimeout(resolve, (action.duration || 1) * 1000))
                return takeScreenshot(browser, lastCallId)
            }

            default: {
                console.warn(`Unknown action type: ${(action as {action: string}).action}`)
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
 * @returns True if the game has ended
 */
export function hasGameEnded(): boolean {
    return gameEnded
}

/**
 * Tool to allow the agent to signal that the game has ended.
 * Should only be called when a win/loss/draw message is visible on screen.
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
