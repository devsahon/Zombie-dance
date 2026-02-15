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
        const systemName = identityData?.system_identity.name || 'the UAS System';
        const org = identityData?.system_identity.branding.organization || 'Developer Zone';
        const location = identityData?.system_identity.branding.location || 'Dhaka, Bangladesh';
        const owner = identityData?.system_identity.branding.owner || 'Sahon Srabon';
        
        // ===== SYSTEM IDENTITY =====
        parts.push('[SYSTEM_IDENTITY]');
        parts.push(`You are ${agentConfig.name}.`);
        parts.push(`You are part of ${systemName}.`);
        parts.push(`Organization: ${org}`);
        parts.push(`Location: ${location}`);
        parts.push(`Owner: ${owner}`);
        parts.push('');
        
        // ===== RESPONSE RULES =====
        parts.push('[RESPONSE RULES]');
        parts.push('- Reply in English only.');
        parts.push('- Keep your response short (2-3 sentences).');
        parts.push('- Never make up words or hallucinate.');
        parts.push('');
        
        // ===== USER QUESTION =====
        parts.push(`[QUESTION]\n${userQuery}`);
        parts.push('');
        parts.push('[ANSWER]');

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
        const parts: string[] = [];
        const systemName = identityData?.system_identity.name || 'the UAS System';
        const org = identityData?.system_identity.branding.organization || 'Developer Zone';
        const location = identityData?.system_identity.branding.location || 'Dhaka, Bangladesh';
        const owner = identityData?.system_identity.branding.owner || 'Sahon Srabon';
        
        // ===== SYSTEM IDENTITY =====
        parts.push('[SYSTEM_IDENTITY]');
        parts.push(`You are ${agentConfig.name}.`);
        parts.push(`Part of ${systemName}.`);
        parts.push(`Organization: ${org}`);
        parts.push(`Location: ${location}`);
        parts.push(`Owner: ${owner}`);
        parts.push('');
        
        // ===== RULES =====
        parts.push('[RULES]');
        parts.push('- Reply in English only.');
        parts.push('- Keep it short (2-3 sentences).');
        parts.push('');
        
        parts.push(`[QUESTION]\n${userMessage}`);
        parts.push('');
        parts.push('[ANSWER]');

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
        const systemName = identityData?.system_identity.name || 'the UAS System';
        const org = identityData?.system_identity.branding.organization || 'Developer Zone';
        const location = identityData?.system_identity.branding.location || 'Dhaka, Bangladesh';
        const owner = identityData?.system_identity.branding.owner || 'Sahon Srabon';

        // ===== SYSTEM IDENTITY =====
        parts.push('[SYSTEM_IDENTITY]');
        parts.push(`You are ${agentConfig.name}.`);
        parts.push(`Part of ${systemName}.`);
        parts.push(`Organization: ${org}`);
        parts.push(`Location: ${location}`);
        parts.push(`Owner: ${owner}`);
        parts.push('');

        // ===== RULES =====
        parts.push('[RULES]');
        parts.push('- Reply in English only.');
        parts.push('- Keep it short (2-3 sentences).');
        parts.push('- Never hallucinate or make up words.');
        parts.push('');

        // ===== QUESTION =====
        parts.push(`[QUESTION]\n${userQuery}`);
        parts.push('');
        parts.push('[ANSWER]');

        return parts.join('\n');
    }
}
