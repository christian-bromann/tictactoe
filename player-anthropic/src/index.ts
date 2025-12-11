import { createAgent, HumanMessage, ClearToolUsesEdit, contextEditingMiddleware } from "langchain"

import { computerUseTool, gameEndedTool, hasGameEnded, memoryTool } from "./tools.js"
import { closeBrowser } from "./browser.js"
import { systemPrompt, userPrompt, continuePrompt, memoryReviewPrompt, gameEndPrompt } from "./prompts.js"

/**
 * Create the Anthropic agent with computer use and memory capabilities
 */
const agent = createAgent({
    model: "anthropic:claude-sonnet-4-5",
    tools: [computerUseTool, gameEndedTool, memoryTool],
    /**
     * Middleware to manage context window by clearing old tool uses.
     * This prevents context overflow from accumulated screenshots.
     */
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

console.log("🎮 Starting Tic-Tac-Toe game...")
console.log("🧠 Reviewing past game memories...\n")

/**
 * First, have the agent review past game memories
 */
let result = await agent.invoke(
    { messages: memoryReviewPrompt },
    { recursionLimit: 100 }
)

console.log("⏳ Starting gameplay...\n")

/**
 * Start the actual game
 */
result = await agent.invoke(
    { messages: [...result.messages, new HumanMessage(userPrompt)] },
    { recursionLimit: 100 }
)

/**
 * Keep invoking the agent until the game ends (checked via state flag)
 */
while (!hasGameEnded()) {
    console.log(`🤖 AI: ${result.messages.at(-1)?.text}`)
    
    // Pass the conversation history so the agent knows what moves have been made
    const previousMessages = result.messages
    result = await agent.invoke({
        messages: [...previousMessages, new HumanMessage(continuePrompt)]
    }, { recursionLimit: 100 })
}

console.log(`\n🏁 Game finished: ${result.messages.at(-1)?.text}`)

/**
 * After the game ends, have the agent save learnings to memory
 */
console.log("\n🧠 Saving game learnings to memory...")
result = await agent.invoke(
    { messages: [...result.messages, new HumanMessage(gameEndPrompt)] },
    { recursionLimit: 100 }
)

console.log("✅ Memory updated!")
await closeBrowser()
