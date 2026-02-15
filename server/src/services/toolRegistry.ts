/**
 * Tool Registry
 * Centralized tool management for agents
 * Based on the Architecture.md specification
 */

import { executeQuery } from '../database/connection';

export interface ToolConfig {
    name: string;
    category: string;
    description: string;
    isActive: boolean;
    config: Record<string, any>;
}

export interface AgentTool {
    id: number;
    agentId: number;
    toolName: string;
    toolCategory: string;
    isActive: boolean;
    config: Record<string, any>;
}

/**
 * Tool Registry - Manages available tools for agents
 */
export class ToolRegistry {
    // Static tool definitions
    private static tools: Map<string, ToolConfig> = new Map([
        ['web_search', {
            name: 'web_search',
            category: 'search',
            description: 'Search the web for real-time information using DuckDuckGo',
            isActive: true,
            config: { provider: 'duckduckgo' }
        }],
        ['code_execution', {
            name: 'code_execution',
            category: 'code',
            description: 'Execute code in a sandboxed environment',
            isActive: true,
            config: { timeout: 30000, allowed_languages: ['javascript', 'python', 'typescript'] }
        }],
        ['file_read', {
            name: 'file_read',
            category: 'filesystem',
            description: 'Read files from the filesystem',
            isActive: true,
            config: { allowed_dirs: ['~/Zombie-dance'] }
        }],
        ['file_write', {
            name: 'file_write',
            category: 'filesystem',
            description: 'Write content to files',
            isActive: true,
            config: { allowed_dirs: ['~/Zombie-dance'] }
        }],
        ['shell_exec', {
            name: 'shell_exec',
            category: 'system',
            description: 'Execute shell commands',
            isActive: true,
            config: { allowed_commands: ['git', 'npm', 'node', 'python'] }
        }],
        ['calculator', {
            name: 'calculator',
            category: 'utility',
            description: 'Calculate mathematical expressions',
            isActive: true,
            config: {}
        }],
        ['datetime', {
            name: 'datetime',
            category: 'utility',
            description: 'Get current date and time',
            isActive: true,
            config: {}
        }],
        ['agent_coordination', {
            name: 'agent_coordination',
            category: 'orchestration',
            description: 'Coordinate multiple agents for complex tasks',
            isActive: true,
            config: { max_agents: 5 }
        }],
        ['task_planning', {
            name: 'task_planning',
            category: 'orchestration',
            description: 'Plan and decompose complex tasks',
            isActive: true,
            config: {}
        }],
        ['code_analysis', {
            name: 'code_analysis',
            category: 'analysis',
            description: 'Analyze code for issues, security, and best practices',
            isActive: true,
            config: { security_check: true, best_practices: true }
        }],
        ['markdown_formatter', {
            name: 'markdown_formatter',
            category: 'formatting',
            description: 'Format content as markdown',
            isActive: true,
            config: {}
        }]
    ]);

    /**
     * Get all available tools
     */
    static getAllTools(): ToolConfig[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tool by name
     */
    static getTool(name: string): ToolConfig | undefined {
        return this.tools.get(name);
    }

    /**
     * Get tools by category
     */
    static getToolsByCategory(category: string): ToolConfig[] {
        return Array.from(this.tools.values()).filter(t => t.category === category);
    }

    /**
     * Load tools for a specific agent from database
     */
    static async getAgentTools(agentId: number): Promise<AgentTool[]> {
        try {
            const result = await executeQuery(
                'SELECT id, agent_id, tool_name, tool_category, is_active, config FROM agent_tools WHERE agent_id = ? AND is_active = TRUE',
                [agentId]
            );
            
            if (Array.isArray(result)) {
                return result.map((row: any) => ({
                    id: row.id,
                    agentId: row.agent_id,
                    toolName: row.tool_name,
                    toolCategory: row.tool_category,
                    isActive: row.is_active,
                    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to load agent tools:', error);
            return [];
        }
    }

    /**
     * Get tools as formatted string for prompt injection
     */
    static async getToolsForPrompt(agentId: number): Promise<string> {
        const tools = await this.getAgentTools(agentId);
        
        if (tools.length === 0) {
            return 'No tools available.';
        }

        const toolList = tools.map(t => {
            const staticTool = this.tools.get(t.toolName);
            return `- ${t.toolName}: ${staticTool?.description || 'Custom tool'} (${t.toolCategory})`;
        });

        return `[AVAILABLE_TOOLS]\n${toolList.join('\n')}\n\nUse these tools when needed to help the user.`;
    }

    /**
     * Enable a tool for an agent
     */
    static async enableTool(agentId: number, toolName: string): Promise<boolean> {
        try {
            await executeQuery(
                'UPDATE agent_tools SET is_active = TRUE WHERE agent_id = ? AND tool_name = ?',
                [agentId, toolName]
            );
            return true;
        } catch (error) {
            console.error('Failed to enable tool:', error);
            return false;
        }
    }

    /**
     * Disable a tool for an agent
     */
    static async disableTool(agentId: number, toolName: string): Promise<boolean> {
        try {
            await executeQuery(
                'UPDATE agent_tools SET is_active = FALSE WHERE agent_id = ? AND tool_name = ?',
                [agentId, toolName]
            );
            return true;
        } catch (error) {
            console.error('Failed to disable tool:', error);
            return false;
        }
    }

    /**
     * Add a new tool to an agent
     */
    static async addTool(agentId: number, toolName: string, toolCategory: string, config: Record<string, any> = {}): Promise<boolean> {
        try {
            await executeQuery(
                'INSERT INTO agent_tools (agent_id, tool_name, tool_category, is_active, config) VALUES (?, ?, ?, TRUE, ?)',
                [agentId, toolName, toolCategory, JSON.stringify(config)]
            );
            return true;
        } catch (error) {
            console.error('Failed to add tool:', error);
            return false;
        }
    }

    /**
     * Remove a tool from an agent
     */
    static async removeTool(agentId: number, toolName: string): Promise<boolean> {
        try {
            await executeQuery(
                'DELETE FROM agent_tools WHERE agent_id = ? AND tool_name = ?',
                [agentId, toolName]
            );
            return true;
        } catch (error) {
            console.error('Failed to remove tool:', error);
            return false;
        }
    }
}

export default ToolRegistry;
