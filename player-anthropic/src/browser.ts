import { remote } from "webdriverio"

/**
 * WebdriverIO browser instance
 */
let browser: WebdriverIO.Browser | undefined = undefined

/**
 * Browser configuration options
 */
interface BrowserOptions {
    browserName: "firefox" | "chrome"
    windowWidth: number
    windowHeight: number
}

const DEFAULT_BROWSER_NAME = "firefox"
const DEFAULT_WINDOW_WIDTH = 1200
const DEFAULT_WINDOW_HEIGHT = 900

/**
 * Get the browser instance, creating one if it doesn't exist
 * @param options - Browser configuration options
 * @returns The WebdriverIO browser instance
 */
export async function getBrowser({
    browserName = DEFAULT_BROWSER_NAME,
    windowWidth = DEFAULT_WINDOW_WIDTH,
    windowHeight = DEFAULT_WINDOW_HEIGHT,
}: BrowserOptions = {
    browserName: DEFAULT_BROWSER_NAME,
    windowWidth: DEFAULT_WINDOW_WIDTH,
    windowHeight: DEFAULT_WINDOW_HEIGHT,
}): Promise<WebdriverIO.Browser> {
    if (!browser) {
        browser = await remote({
            capabilities: {
                browserName,
            },
            logLevel: "error",
        })
        await browser.url("https://tictactoe.bromann.dev/")
        await browser.setViewport({ width: windowWidth, height: windowHeight })
    }
    return browser
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
    if (browser) {
        await browser.deleteSession()
        browser = undefined
    }
}

