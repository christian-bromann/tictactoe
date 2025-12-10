import { remote, Key } from "webdriverio"

/**
 * WebdriverIO browser instance
 * @type {WebdriverIO.Browser | undefined}
 */
let browser: WebdriverIO.Browser | undefined = undefined

interface BrowserOptions {
    browserName: "firefox" | "chrome"
    windowWidth: number
    windowHeight: number
}

const DEFAULT_BROWSER_NAME = "firefox"
const DEFAULT_WINDOW_WIDTH = 1200
const DEFAULT_WINDOW_HEIGHT = 900

/**
 * Get the browser instance
 * @returns {Promise<WebdriverIO.Browser>}
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
        await browser.url("http://localhost:3000/")
        await browser.setViewport({ width: windowWidth, height: windowHeight})
    }
    return browser
}

/**
 * Close the browser instance
 * @returns {Promise<void>}
 */
export async function closeBrowser(): Promise<void> {
    if (browser) {
        await browser.deleteSession()
        browser = undefined
    }
}
