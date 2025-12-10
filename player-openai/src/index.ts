import { createAgent, createMiddleware, HumanMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

import { computerUseTool, gameEndedTool, hasGameEnded } from "./tools.js";
import { closeBrowser } from "./browser.js";
import { systemPrompt, userPrompt } from "./prompts.js";

/**
 * Create the agent
 */
const agent = createAgent({
    model: new ChatOpenAI({
        model: "computer-use-preview",
    }),
    /**
     * Define a middleware to set the truncation parameter to "auto".
     * 
     * According to the documentation:
     * > To be able to use the computer_use_preview tool, you need to set the
     *   truncation parameter to "auto" (by default, truncation is disabled).
     * 
     * @see https://platform.openai.com/docs/guides/tools-computer-use#1-send-a-request-to-the-model
     */
    middleware: [createMiddleware({
        name: "setModelOptions",
        wrapModelCall: (options, request) => {
            return request({
                ...options,
                modelSettings: {
                    truncation: "auto"
                }
            })
        }
    })],
    tools: [computerUseTool, gameEndedTool],
    systemPrompt,
})

console.log("🎮 Starting Tic-Tac-Toe game...")
console.log("⏳ Waiting for agent to play...\n")

/**
 * initial invocation of the agent
 */
let result = await agent.invoke({ messages: userPrompt }, {
    recursionLimit: 100
})

/**
 * Keep invoking the agent until the game ends (checked via state flag)
 */
while (!hasGameEnded()) {
    console.log(`🤖 AI: ${result.messages.at(-1)?.content}`)
    result = await agent.invoke({
        messages: new HumanMessage("Continue playing. Take a screenshot to see the current state and make your next move. Remember to call 'game_ended' when the game is over.")
    }, {
        recursionLimit: 100
    })
}

console.log(`\n🏁 Game finished: ${result.messages.at(-1)?.content}`)
await closeBrowser()