/**
 * LangChain Agent Service
 * Handles agent execution with memory, tools, and OpenAI-compatible response format
 * 
 * Features:
 * - Session-based BufferWindowMemory (custom implementation)
 * - Dynamic tool loading from ToolRegistry
 * - Real-time streaming responses
 * - OpenAI-standard output format
 */

import { DynamicTool, Tool } from '@langchain/core/tools';
import { OllamaService } from './ollama';
import { ToolRegistry, LangChainToolFactory } from './toolRegistry';
import { executeQuery } from '../database/connection';
import { Logger } from '../utils/logger';

// Custom simple memory implementation
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

class SimpleBufferMemory {
    private messages: ChatMessage[] = [];
    private k: number;

    constructor(k: number = 5) {
        this.k = k;
    }

    addUserMessage(content: string): void {
        this.messages.push({ role: 'user', content, timestamp: Date.now() });
        this.prune();
    }

    addAssistantMessage(content: string): void {
        this.messages.push({ role: 'assistant', content, timestamp: Date.now() });
        this.prune();
    }

    private prune(): void {
        if (this.messages.length > this.k * 2) {
            this.messages = this.messages.slice(-this.k * 2);
        }
    }

    getHistory(): ChatMessage[] {
        return [...this.messages];
    }

    getHistoryText(): string {
        return this.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }

    clear(): void {
        this.messages = [];
    }
}

// Session memories storage
const sessionMemories: Map<string, SimpleBufferMemory> = new Map();

// Default system prompt for LangChain agents
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Always respond in the same language as the user's question.
If the user asks in Bengali/Bangla, respond in Bengali. If in English, respond in English.`;

export interface AgentExecutionInput {
    agentId: number;
    sessionId: string;
    query: string;
    model?: string;
}

export interface AgentExecutionResult {
    success: boolean;
    output: string;
    sessionId: string;
    agentId: number;
    model: string;
    persona: string;
    latency: number;
    toolsUsed: string[];
    error?: string;
}

/**
 * LangChain Agent Executor
 * Manages agent execution with memory and tools
 */
export class LangChainAgentService {
    private ollamaService: OllamaService;
    private logger: Logger;

    constructor() {
        this.ollamaService = new OllamaService();
        this.logger = new Logger();
    }

    private async getDefaultModel(): Promise<string> {
        try {
            const rows = await executeQuery(
                'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
                ['default_model']
            );
            if (Array.isArray(rows) && rows.length > 0 && (rows[0] as any).setting_value) {
                return (rows[0] as any).setting_value;
            }
        } catch (error) {
            this.logger.warn('Failed to load default_model from system_settings, falling back to env/default:', error);
        }

        return process.env.OLLAMA_DEFAULT_MODEL || 'llama3.1:latest';
    }

    /**
     * Get or create memory for a session
     */
    private getSessionMemory(sessionId: string, k: number = 5): SimpleBufferMemory {
        if (!sessionMemories.has(sessionId)) {
            sessionMemories.set(sessionId, new SimpleBufferMemory(k));
        }
        return sessionMemories.get(sessionId)!;
    }

    /**
     * Get agent configuration from database
     */
    private async getAgentConfig(agentId: number): Promise<any> {
        try {
            const result = await executeQuery(
                'SELECT * FROM agents WHERE id = ?',
                [agentId]
            );

            if (Array.isArray(result) && result.length > 0) {
                const agent = result[0];

                // Parse config and metadata
                let config: Record<string, any> = {};
                let metadata: Record<string, any> = {};

                if (agent.config) {
                    config = typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config;
                }
                if (agent.metadata) {
                    metadata = typeof agent.metadata === 'string' ? JSON.parse(agent.metadata) : agent.metadata;
                }

                const defaultModel = await this.getDefaultModel();

                const bufferMemorySize =
                    (typeof config?.buffer_memory_size === 'number' ? config.buffer_memory_size : undefined) ||
                    (typeof metadata?.buffer_memory_size === 'number' ? metadata.buffer_memory_size : undefined) ||
                    5;

                const resolvedSystemPrompt =
                    (typeof metadata?.system_prompt === 'string' ? metadata.system_prompt : undefined) ||
                    (typeof config?.system_instructions === 'string' ? config.system_instructions : undefined) ||
                    DEFAULT_SYSTEM_PROMPT;

                const resolvedModel =
                    (typeof config?.model === 'string' && config.model.trim() ? config.model : undefined) ||
                    defaultModel;

                return {
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    status: agent.status,
                    persona_name: agent.persona_name,
                    system_prompt: resolvedSystemPrompt,
                    model_name: resolvedModel,
                    buffer_memory_size: bufferMemorySize,
                    config,
                    metadata
                };
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to get agent config:', error);
            return null;
        }
    }

    /**
     * Get available tools for an agent
     */
    private async getAgentTools(agentId: number): Promise<Tool[]> {
        try {
            const tools = await LangChainToolFactory.getAgentLangChainTools(agentId);
            return tools;
        } catch (error) {
            this.logger.error('Failed to get agent tools:', error);
            return [];
        }
    }

    /**
     * Build system prompt from agent config
     */
    private buildSystemPrompt(agentConfig: any): string {
        const parts: string[] = [];

        // Add identity info
        parts.push('[SYSTEM_IDENTITY]');
        parts.push('You are part of the ZombieCoder System.');
        parts.push('');

        // Add agent-specific system prompt
        if (agentConfig.system_prompt) {
            parts.push('[AGENT_PERSONA]');
            parts.push(agentConfig.system_prompt);
            parts.push('');
        }

        // Add tools info
        parts.push('[TOOLS]');
        parts.push('You have access to various tools to help the user. Use them when needed.');

        return parts.join('\n');
    }

    /**
     * Execute agent with query
     * Uses simple prompt-based approach since we don't have OpenAI model
     */
    async executeAgent(input: AgentExecutionInput): Promise<AgentExecutionResult> {
        const startTime = Date.now();
        const { agentId, sessionId, query, model } = input;

        try {
            // Get agent config
            const agentConfig = await this.getAgentConfig(agentId);
            if (!agentConfig) {
                throw new Error(`Agent ${agentId} not found`);
            }

            // Get session memory
            const memory = this.getSessionMemory(sessionId, agentConfig.buffer_memory_size);

            // Get available tools
            const tools = await this.getAgentTools(agentId);
            const toolsUsed: string[] = [];

            // Build system prompt
            let systemPrompt = this.buildSystemPrompt(agentConfig);

            // Add tool descriptions to prompt if tools available
            if (tools.length > 0) {
                const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
                systemPrompt += `\n\n[AVAILABLE_TOOLS]\n${toolDescriptions}\n\nUse these tools when appropriate to answer the user's question.`;
            }

            // Get conversation history from memory
            const chatHistory = memory.getHistory();
            let historyText = '';
            if (chatHistory.length > 0) {
                historyText = '\n\n[CONVERSATION_HISTORY]\n';
                chatHistory.forEach((msg: ChatMessage) => {
                    if (msg.role === 'user') {
                        historyText += `User: ${msg.content}\n`;
                    } else if (msg.role === 'assistant') {
                        historyText += `Assistant: ${msg.content}\n`;
                    }
                });
            }

            // Check if query requires tool use
            let finalQuery = query;
            let toolResponse = '';

            // Simple tool detection based on keywords
            const queryLower = query.toLowerCase();

            for (const tool of tools) {
                let shouldUseTool = false;

                // Web search keywords
                if (tool.name === 'web_search' && (
                    queryLower.includes('search') ||
                    queryLower.includes('what is') ||
                    queryLower.includes('who is') ||
                    queryLower.includes('latest') ||
                    queryLower.includes('find')
                )) {
                    shouldUseTool = true;
                }

                // Calculator keywords
                if (tool.name === 'calculator' && (
                    queryLower.includes('calculate') ||
                    queryLower.includes('+') ||
                    queryLower.includes('-') ||
                    queryLower.includes('*') ||
                    queryLower.includes('/') ||
                    queryLower.includes('math')
                )) {
                    shouldUseTool = true;
                }

                // Datetime keywords
                if (tool.name === 'datetime' && (
                    queryLower.includes('time') ||
                    queryLower.includes('date') ||
                    queryLower.includes('today') ||
                    queryLower.includes('now')
                )) {
                    shouldUseTool = true;
                }

                if (shouldUseTool) {
                    try {
                        this.logger.info(`Using tool: ${tool.name}`);
                        toolsUsed.push(tool.name);
                        // DynamicTool has func property
                        const dynamicTool = tool as unknown as DynamicTool;
                        if (dynamicTool.func) {
                            toolResponse = await dynamicTool.func(query);
                        } else {
                            toolResponse = `Tool ${tool.name} is not executable`;
                        }
                        break; // Use first matching tool
                    } catch (toolError: any) {
                        this.logger.error(`Tool ${tool.name} failed:`, toolError);
                        toolResponse = `Tool error: ${toolError.message}`;
                    }
                }
            }

            // Build final prompt with history and tools
            let fullPrompt = systemPrompt;
            if (historyText) {
                fullPrompt += historyText;
            }
            fullPrompt += `\n\n[USER_QUERY]\n${query}`;

            if (toolResponse) {
                fullPrompt += `\n\n[TOOL_RESULT]\n${toolResponse}`;
            }

            fullPrompt += `\n\n[INSTRUCTIONS]\nProvide a clear, helpful response.`;

            // Call Ollama
            const modelToUse = model || agentConfig.model_name;
            const response = await this.ollamaService.generate(
                fullPrompt,
                modelToUse,
                {
                    id: agentId,
                    name: agentConfig.name,
                    type: agentConfig.type,
                    status: agentConfig.status,
                    persona_name: agentConfig.persona_name,
                    system_prompt: agentConfig.system_prompt,
                    config: agentConfig.config
                }
            );

            // Save to memory
            memory.addUserMessage(query);
            memory.addAssistantMessage(response);

            // Clean old memories if too many
            if (sessionMemories.size > 100) {
                // Clear oldest memories (keep last 50)
                const keys = Array.from(sessionMemories.keys()).slice(0, 50);
                sessionMemories.forEach((_, key) => {
                    if (!keys.includes(key)) {
                        sessionMemories.delete(key);
                    }
                });
            }

            const latency = Date.now() - startTime;

            return {
                success: true,
                output: response,
                sessionId,
                agentId,
                model: modelToUse,
                persona: agentConfig.persona_name || agentConfig.name,
                latency,
                toolsUsed
            };

        } catch (error: any) {
            this.logger.error('Agent execution failed:', error);

            return {
                success: false,
                output: '',
                sessionId,
                agentId: agentId,
                model: model || 'unknown',
                persona: 'Unknown',
                latency: Date.now() - startTime,
                toolsUsed: [],
                error: error.message
            };
        }
    }

    /**
     * Clear session memory
     */
    clearSessionMemory(sessionId: string): boolean {
        return sessionMemories.delete(sessionId);
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): string[] {
        return Array.from(sessionMemories.keys());
    }

    /**
     * Get memory info for a session
     */
    async getSessionInfo(sessionId: string): Promise<any> {
        const memory = sessionMemories.get(sessionId);
        if (!memory) {
            return null;
        }

        const chatHistory = memory.getHistory();
        return {
            sessionId,
            messageCount: chatHistory.length,
            messages: chatHistory.map((msg: ChatMessage) => ({
                role: msg.role,
                content: msg.content?.substring(0, 100) || ''
            }))
        };
    }
}

// Export singleton instance
export const langChainAgentService = new LangChainAgentService();
export default LangChainAgentService;
