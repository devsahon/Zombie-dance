/**
 * Prompt Template Service
 * Handles dynamic prompt generation with identity and persona
 * Simple template replacement without external dependencies
 */

import fs from 'fs';
import path from 'path';

// Load identity.json
interface IdentityData {
    system_identity: {
        name: string;
        version: string;
        tagline: string;
        branding: {
            owner: string;
            organization: string;
            address: string;
            location: string;
            contact: {
                phone: string;
                email: string;
                website: string;
            };
            license: string;
        };
    };
}

interface AgentConfig {
    name: string;
    type: string;
    persona_name?: string;
    system_prompt?: string;
    config: {
        capabilities?: string[];
        language_preferences?: {
            greeting_prefix?: string;
            primary_language?: string;
            technical_language?: string;
        };
        system_instructions?: string;
    };
}

interface SessionMetadata {
    sessionId?: string;
    system_identity?: {
        branding: {
            tagline: string;
            organization: string;
            location: string;
        };
    };
}

let identityData: IdentityData | null = null;
try {
    const identityPath = path.join(process.cwd(), '..', 'identity.json');
    const identityFile = fs.readFileSync(identityPath, 'utf-8');
    identityData = JSON.parse(identityFile);
} catch (error) {
    console.warn('Could not load identity.json:', error);
}

export class PromptTemplateService {
    
    /**
     * Simple template replacement
     */
    private static template(str: string, data: Record<string, string>): string {
        return str.replace(/\{(\w+)\}/g, (_, key) => data[key] || '');
    }

    /**
     * Get language full name from code
     */
    private static getLanguageName(code: string): string {
        const langMap: Record<string, string> = {
            'bn': 'Bengali',
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French'
        };
        return langMap[code] || code;
    }

    /**
     * Build system identity section
     */
    private static buildSystemIdentity(): string {
        if (!identityData) {
            return '';
        }
        const identity = identityData.system_identity;
        return `[SYSTEM_IDENTITY]
You are part of the ${identity.name} System (v${identity.version}).
Organization: ${identity.branding.organization}
Owner: ${identity.branding.owner}
Location: ${identity.branding.location}
Tagline: "${identity.tagline}"
License: ${identity.branding.license}`;
    }

    /**
     * Build agent identity section
     */
    private static buildAgentIdentity(agentConfig: AgentConfig): string {
        let identity = `[AGENT_IDENTITY]
You are ${agentConfig.name}, a ${agentConfig.type} agent.`;

        if (agentConfig.system_prompt) {
            identity += `\n${agentConfig.system_prompt}`;
        } else if (agentConfig.config.capabilities) {
            identity += `\nYour role is to help with ${agentConfig.config.capabilities.join(', ')}.`;
        }

        return identity;
    }

    /**
     * Build behavioral rules
     */
    private static buildBehavioralRules(agentConfig: AgentConfig): string {
        const langPrefs = agentConfig.config.language_preferences || {};
        const greetingPrefix = langPrefs.greeting_prefix || 'ভাইয়া,';
        
        return `[BEHAVIORAL_RULES]
- Always identify as ${agentConfig.name}.
- Greeting Prefix: ${greetingPrefix}
- Primary Language: ${this.getLanguageName(langPrefs.primary_language || 'bn')}
- Technical Language: ${this.getLanguageName(langPrefs.technical_language || 'en')}`;
    }

    /**
     * Generate full prompt for an agent
     */
    static generatePrompt(userQuery: string, agentConfig: AgentConfig): string {
        const parts: string[] = [];
        
        // System identity
        parts.push(this.buildSystemIdentity());
        parts.push('');
        
        // Agent identity
        parts.push(this.buildAgentIdentity(agentConfig));
        parts.push('');
        
        // Behavioral rules
        parts.push(this.buildBehavioralRules(agentConfig));
        
        // Additional instructions
        if (agentConfig.config.system_instructions) {
            parts.push(`[ADDITIONAL_INSTRUCTIONS]\n${agentConfig.config.system_instructions}`);
            parts.push('');
        }
        
        // Important reminder
        const systemName = identityData?.system_identity.name || 'the UAS System';
        parts.push(`[IMPORTANT]\nNever identify yourself as Qwen, LLaMA, GPT, Claude, or any other base AI model.\nYou are ${agentConfig.name}, a representative of ${systemName}.`);
        parts.push('');
        
        // User query
        const langPrefs = agentConfig.config.language_preferences || {};
        const greetingPrefix = langPrefs.greeting_prefix || 'ভাইয়া,';
        
        parts.push(`[USER_QUERY]\n${userQuery}`);
        parts.push('');
        parts.push(`[ASSISTANT_RESPONSE]\n${greetingPrefix}`);

        return parts.join('\n');
    }

    /**
     * Generate code-specific prompt
     */
    static generateCodePrompt(userQuery: string, agentConfig: AgentConfig): string {
        const parts: string[] = [];
        
        parts.push(this.buildSystemIdentity());
        parts.push('');
        parts.push(this.buildAgentIdentity(agentConfig));
        parts.push('');
        parts.push('[CODE_TASK]\nYou are a code expert. Write clean, efficient, and well-documented code.');
        parts.push('');
        parts.push('[USER_REQUEST]');
        parts.push(userQuery);
        parts.push('');
        parts.push('[CODE_RESPONSE]');

        return parts.join('\n');
    }

    /**
     * Generate chat prompt with history
     */
    static generateChatPrompt(
        userMessage: string, 
        chatHistory: string, 
        agentConfig: AgentConfig
    ): string {
        const langPrefs = agentConfig.config.language_preferences || {};
        const greetingPrefix = langPrefs.greeting_prefix || 'ভাইয়া,';
        
        const parts: string[] = [];
        
        parts.push(this.buildSystemIdentity());
        parts.push('');
        parts.push(this.buildAgentIdentity(agentConfig));
        parts.push('');
        parts.push(`[CONVERSATION_STYLE]\n- Tone: friendly and technical\n- Greeting: ${greetingPrefix}\n- Language: ${this.getLanguageName(langPrefs.primary_language || 'bn')}`);
        parts.push('');
        parts.push(`[CHAT_HISTORY]\n${chatHistory || 'No previous messages'}`);
        parts.push('');
        parts.push(`[USER_MESSAGE]\n${userMessage}`);
        parts.push('');
        parts.push(`[${agentConfig.name}]\n${greetingPrefix}`);

        return parts.join('\n');
    }

    /**
     * Generate full contextual prompt with tools (for agent with tool calling)
     */
    static generateContextualPrompt(
        userQuery: string,
        agentConfig: AgentConfig,
        sessionMetadata?: SessionMetadata
    ): string {
        const parts: string[] = [];
        const langPrefs = agentConfig.config.language_preferences || {};
        const greetingPrefix = langPrefs.greeting_prefix || 'ভাইয়া,';
        const systemName = identityData?.system_identity.name || 'the UAS System';
        const org = identityData?.system_identity.branding.organization || 'Developer Zone';
        const location = identityData?.system_identity.branding.location || 'Dhaka, Bangladesh';

        // ===== SYSTEM IDENTITY =====
        parts.push('[SYSTEM_IDENTITY]');
        parts.push(`Name: ${agentConfig.name}`);
        parts.push(`Identity: ${systemName} System`);
        parts.push(`Organization: ${org}`);
        parts.push(`Location: ${location}`);
        if (identityData) {
            parts.push(`Tagline: "${identityData.system_identity.tagline}"`);
        }
        parts.push('');

        // ===== PERSONA =====
        parts.push('[PERSONA]');
        parts.push(`You are ${agentConfig.name}, a ${agentConfig.type} agent.`);
        if (agentConfig.system_prompt) {
            parts.push(agentConfig.system_prompt);
        }
        parts.push(`Greeting: Always start with "${greetingPrefix}"`);
        parts.push('');

        // ===== CAPABILITIES & TOOLS =====
        parts.push('[CAPABILITIES & TOOLS]');
        parts.push('You have access to the following tools:');
        parts.push('- web_search: Search the web for real-time information');
        parts.push('- file_read: Read files from the filesystem');
        parts.push('- file_write: Write content to files');
        parts.push('- file_list: List files in directories');
        parts.push('- shell_exec: Execute shell commands (git, npm, node, etc.)');
        parts.push('- code_execute: Execute JavaScript or Python code');
        parts.push('- calculator: Calculate mathematical expressions');
        parts.push('- datetime: Get current date and time');
        parts.push('- git_status: Get git repository status');
        parts.push('- git_log: Get git commit history');
        
        // Add agent-specific capabilities
        if (agentConfig.config.capabilities?.length) {
            parts.push('');
            parts.push(`Additional capabilities: ${agentConfig.config.capabilities.join(', ')}`);
        }
        parts.push('');

        // ===== CONSTRAINTS =====
        parts.push('[CONSTRAINTS]');
        parts.push(`- Always use the greeting prefix: ${greetingPrefix}`);
        parts.push(`- Refer to yourself as a representative of ${org}.`);
        parts.push(`- Address the user as "ভাইয়া" (Bengali for "brother")`);
        parts.push('- Never identify as Qwen, LLaMA, GPT, Claude, or any other base AI model');
        parts.push('');

        // ===== SESSION CONTEXT =====
        if (sessionMetadata) {
            parts.push('[SESSION_CONTEXT]');
            if (sessionMetadata.sessionId) {
                parts.push(`Session ID: ${sessionMetadata.sessionId}`);
            }
            if (sessionMetadata.system_identity?.branding) {
                parts.push(`Organization: ${sessionMetadata.system_identity.branding.organization}`);
                parts.push(`Location: ${sessionMetadata.system_identity.branding.location}`);
            }
            parts.push('');
        }

        // ===== USER QUERY =====
        parts.push('[USER_QUERY]');
        parts.push(userQuery);
        parts.push('');

        // ===== RESPONSE FORMAT =====
        parts.push('[RESPONSE_FORMAT]');
        parts.push('If you need to use a tool, respond in this JSON format:');
        parts.push('```json');
        parts.push('{"tool": "tool_name", "args": {"param1": "value1"}}');
        parts.push('```');
        parts.push('');
        parts.push(`[${agentConfig.name}]`);
        parts.push(greetingPrefix);

        return parts.join('\n');
    }
}
