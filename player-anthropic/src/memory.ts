import fs from "node:fs"
import path from "node:path"

import { tools } from "@langchain/anthropic"
import { type DynamicStructuredTool } from "@langchain/core/tools"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Directory for storing memory files
 * Located at project root for persistence across games
 */
const MEMORY_DIR = path.join(__dirname, "..", "..", "memory")
/**
 * Ensure the memory directory exists
 */
function ensureMemoryDir(): void {
    if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true })
    }
}

/**
 * Get full file path from a relative path
 */
function getFullPath(relativePath: string): string {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath
    return path.join(MEMORY_DIR, cleanPath)
}

/**
 * List all files in a directory recursively
 */
function listFiles(dirPath: string, prefix = ""): string[] {
    const files: string[] = []
    
    if (!fs.existsSync(dirPath)) {
        return files
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            files.push(...listFiles(path.join(dirPath, entry.name), relativePath))
        } else {
            files.push(relativePath)
        }
    }
    
    return files
}

/**
 * Anthropic Memory Tool for persisting game learnings
 * 
 * This tool allows Claude to:
 * - Store game strategies and learnings
 * - Remember past mistakes and successful moves
 * - Build knowledge over multiple games
 * 
 * Memory is stored as files in the /memory directory at the project root
 */
export const memoryTool = tools.memory_20250818({
    execute: async (command) => {
        ensureMemoryDir()
        
        switch (command.command) {
            case "view": {
                // View directory listing or file contents
                if (!command.path || command.path === "/") {
                    const files = listFiles(MEMORY_DIR)
                    if (files.length === 0) {
                        return "Memory directory is empty. No game learnings stored yet."
                    }
                    return "Memory files:\n" + files.map(f => `/${f}`).join("\n")
                }
                
                const fullPath = getFullPath(command.path)
                
                // Check if it's a directory
                if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                    const files = listFiles(fullPath)
                    if (files.length === 0) {
                        return `Directory ${command.path} is empty.`
                    }
                    return `Contents of ${command.path}:\n` + files.map(f => `/${f}`).join("\n")
                }
                
                // Read file contents
                if (fs.existsSync(fullPath)) {
                    return fs.readFileSync(fullPath, "utf-8")
                }
                
                return `Error: File not found: ${command.path}`
            }
            
            case "create": {
                if (!command.path) {
                    return "Error: Path is required for create command"
                }
                
                const fullPath = getFullPath(command.path)
                const dir = path.dirname(fullPath)
                
                // Ensure parent directory exists
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true })
                }
                
                fs.writeFileSync(fullPath, command.file_text ?? "")
                console.log(`📝 Memory: Created ${command.path}`)
                return `Successfully created file: ${command.path}`
            }
            
            case "str_replace": {
                if (!command.path) {
                    return "Error: Path is required for str_replace command"
                }
                
                const fullPath = getFullPath(command.path)
                
                if (!fs.existsSync(fullPath)) {
                    return `Error: File not found: ${command.path}`
                }
                
                const content = fs.readFileSync(fullPath, "utf-8")
                
                if (command.old_str && !content.includes(command.old_str)) {
                    return `Error: String not found in file: "${command.old_str}"`
                }
                
                if (command.old_str) {
                    const newContent = content.replace(command.old_str, command.new_str ?? "")
                    fs.writeFileSync(fullPath, newContent)
                    console.log(`📝 Memory: Updated ${command.path}`)
                }
                
                return `Successfully replaced text in: ${command.path}`
            }
            
            case "insert": {
                if (!command.path) {
                    return "Error: Path is required for insert command"
                }
                
                const fullPath = getFullPath(command.path)
                
                if (!fs.existsSync(fullPath)) {
                    return `Error: File not found: ${command.path}`
                }
                
                const content = fs.readFileSync(fullPath, "utf-8")
                const lines = content.split("\n")
                const insertLine = command.insert_line ?? 0
                
                if (insertLine < 0 || insertLine > lines.length) {
                    return `Error: Invalid line number: ${insertLine}`
                }
                
                lines.splice(insertLine, 0, command.insert_text ?? "")
                fs.writeFileSync(fullPath, lines.join("\n"))
                console.log(`📝 Memory: Inserted into ${command.path}`)
                
                return `Successfully inserted text at line ${insertLine} in: ${command.path}`
            }
            
            case "rename": {
                if (!command.old_path || !command.new_path) {
                    return "Error: Both old_path and new_path are required for rename command"
                }
                
                const oldFullPath = getFullPath(command.old_path)
                const newFullPath = getFullPath(command.new_path)
                
                if (!fs.existsSync(oldFullPath)) {
                    return `Error: File not found: ${command.old_path}`
                }
                
                const newDir = path.dirname(newFullPath)
                if (!fs.existsSync(newDir)) {
                    fs.mkdirSync(newDir, { recursive: true })
                }
                
                fs.renameSync(oldFullPath, newFullPath)
                console.log(`📝 Memory: Renamed ${command.old_path} to ${command.new_path}`)
                
                return `Successfully renamed ${command.old_path} to ${command.new_path}`
            }
            
            case "delete": {
                if (!command.path) {
                    return "Error: Path is required for delete command"
                }
                
                const fullPath = getFullPath(command.path)
                
                if (!fs.existsSync(fullPath)) {
                    return `Error: File not found: ${command.path}`
                }
                
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true })
                } else {
                    fs.unlinkSync(fullPath)
                }
                console.log(`📝 Memory: Deleted ${command.path}`)
                
                return `Successfully deleted: ${command.path}`
            }
            
            default: {
                return `Unknown memory command: ${(command as { command: string }).command}`
            }
        }
    }
})

