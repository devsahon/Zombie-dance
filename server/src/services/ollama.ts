import axios, { AxiosResponse } from 'axios';
import { Logger } from '../utils/logger';
import { PromptTemplateService } from './promptTemplate';
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

let identityData: IdentityData | null = null;
try {
    const identityPath = path.join(process.cwd(), '..', 'identity.json');
    const identityFile = fs.readFileSync(identityPath, 'utf-8');
    identityData = JSON.parse(identityFile);
} catch (error) {
    console.warn('Could not load identity.json:', error);
}

export interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Agent configuration from database
export interface AgentConfig {
    id: number;
    name: string;
    type: string;
    status: string;
    persona_name?: string;
    system_prompt?: string;
    config: {
        max_tokens?: number;
        temperature?: number;
        capabilities?: string[];
        language_preferences?: {
            greeting_prefix?: string;
            primary_language?: string;
            technical_language?: string;
        };
        system_instructions?: string;
        model?: string;
    };
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface GenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export class OllamaService {
    private baseURL: string;
    private defaultModel: string;
    private logger: Logger;
    public isConnected: boolean = false;

    constructor() {
        this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.defaultModel = process.env.OLLAMA_DEFAULT_MODEL || 'qwen2.5:1.5b';
        this.logger = new Logger();
    }

    // Build system prompt from agent configuration
    private buildSystemPrompt(agentConfig?: AgentConfig): string {
        const parts: string[] = [];

        // If agent has a custom system_prompt from database, use it first
        if (agentConfig?.system_prompt) {
            // Prepend identity info
            if (identityData) {
                const identity = identityData.system_identity;
                parts.push(`[SYSTEM_IDENTITY]`);
                parts.push(`You are part of the ${identity.name} System (v${identity.version}).`);
                parts.push(`Tagline: "${identity.tagline}".`);
                parts.push(`Organization: ${identity.branding.organization}.`);
                parts.push(`Owner: ${identity.branding.owner}.`);
                parts.push(`Location: ${identity.branding.location}.`);
                parts.push('');
            }
            // Add the database system prompt
            parts.push(agentConfig.system_prompt);
            return parts.join('\n');
        }

        // Add identity information from identity.json if available
        if (identityData) {
            const identity = identityData.system_identity;
            parts.push(`[SYSTEM_IDENTITY]`);
            parts.push(`You are part of the ${identity.name} System (v${identity.version}).`);
            parts.push(`Tagline: "${identity.tagline}".`);
            parts.push(`Organization: ${identity.branding.organization}.`);
            parts.push(`Owner: ${identity.branding.owner}.`);
            parts.push(`Location: ${identity.branding.location}.`);
        }

        if (!agentConfig) {
            return parts.join('\n');
        }

        const config = agentConfig.config || {};
        const langPrefs = config.language_preferences || {};
        const capabilities = config.capabilities?.join(', ') || 'general tasks';

        parts.push(`[AGENT_IDENTITY]`);
        parts.push(`You are ${agentConfig.name}, a ${agentConfig.type} agent.`);
        parts.push(`Your role is to help with ${capabilities}.`);

        // Add greeting prefix if available
        if (langPrefs.greeting_prefix) {
            parts.push(`Always start your response with "${langPrefs.greeting_prefix}" (Bengali greeting).`);
        }

        // Add primary language preference
        if (langPrefs.primary_language) {
            const langMap: Record<string, string> = {
                'bn': 'Bengali',
                'en': 'English',
                'hi': 'Hindi',
                'es': 'Spanish',
                'fr': 'French'
            };
            const langName = langMap[langPrefs.primary_language] || langPrefs.primary_language;
            parts.push(`Your primary language should be ${langName}.`);
        }

        // Add custom system instructions if available
        if (config.system_instructions) {
            parts.push(`[CUSTOM_INSTRUCTIONS] ${config.system_instructions}`);
        }

        // Important: Never identify as the underlying model
        parts.push(`[IMPORTANT] Never identify yourself as Qwen, LLaMA, GPT, Claude, or any other base AI model. You are ${agentConfig.name}, a representative of ${identityData?.system_identity.name || 'the UAS System'}.`);

        return parts.join('\n\n');
    }

    // Build full prompt with system instructions for generate endpoint
    private buildFullPrompt(userPrompt: string, agentConfig?: AgentConfig): string {
        const systemPrompt = this.buildSystemPrompt(agentConfig);
        const greetingPrefix = agentConfig?.config?.language_preferences?.greeting_prefix || '';
        
        if (systemPrompt) {
            if (greetingPrefix) {
                return `${systemPrompt}\n\nUser: ${userPrompt}\n${agentConfig?.name}: ${greetingPrefix}`;
            }
            return `${systemPrompt}\n\nUser: ${userPrompt}\n${agentConfig?.name}:`;
        }
        return userPrompt;
    }

    // Build messages array with system message for chat endpoint
    private buildMessages(userPrompt: string, agentConfig?: AgentConfig): ChatMessage[] {
        const messages: ChatMessage[] = [];
        
        const systemPrompt = this.buildSystemPrompt(agentConfig);
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        // Add greeting prefix to user message if available
        const greetingPrefix = agentConfig?.config?.language_preferences?.greeting_prefix || '';
        const finalUserMessage = greetingPrefix 
            ? `${greetingPrefix} ${userPrompt}` 
            : userPrompt;
        
        messages.push({ role: 'user', content: finalUserMessage });
        
        return messages;
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 5000
            });
            this.isConnected = response.status === 200;
            return this.isConnected;
        } catch (error) {
            this.logger.error('Ollama connection test failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    async getModels(): Promise<OllamaModel[]> {
        try {
            const response: AxiosResponse<{ models: OllamaModel[] }> = await axios.get(
                `${this.baseURL}/api/tags`
            );
            return response.data.models || [];
        } catch (error) {
            this.logger.error('Failed to fetch models:', error);
            throw new Error('Failed to fetch models from Ollama');
        }
    }

    async generate(prompt: string, model?: string, agentConfig?: AgentConfig): Promise<string> {
        try {
            // Use PromptTemplateService for better prompt generation
            let fullPrompt: string;
            if (agentConfig) {
                fullPrompt = PromptTemplateService.generatePrompt(prompt, agentConfig);
            } else {
                fullPrompt = this.buildFullPrompt(prompt, agentConfig);
            }
            
            const response: AxiosResponse<GenerateResponse> = await axios.post(
                `${this.baseURL}/api/generate`,
                {
                    model: model || agentConfig?.config?.model || this.defaultModel,
                    prompt: fullPrompt,
                    stream: false
                },
                {
                    timeout: 180000 // 180 seconds timeout for complex prompts
                }
            );

            return response.data.response || 'No response generated';
        } catch (error) {
            this.logger.error('Failed to generate response:', error);
            throw new Error('Failed to generate response from Ollama');
        }
    }

    async chat(messages: ChatMessage[], model?: string, agentConfig?: AgentConfig): Promise<string> {
        try {
            // Use PromptTemplateService for better chat prompt
            let allMessages = messages;
            if (agentConfig) {
                // Get the last user message
                const lastUserMessage = messages[messages.length - 1]?.content || '';
                const chatHistory = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
                
                const systemPrompt = PromptTemplateService.generatePrompt('', agentConfig);
                const userPrompt = PromptTemplateService.generateChatPrompt(lastUserMessage, chatHistory, agentConfig);
                
                allMessages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];
            }
            
            const response: AxiosResponse<ChatResponse> = await axios.post(
                `${this.baseURL}/api/chat`,
                {
                    model: model || agentConfig?.config?.model || this.defaultModel,
                    messages: allMessages,
                    stream: true
                },
                {
                    timeout: 60000
                }
            );

            return response.data.message?.content || 'No response generated';
        } catch (error) {
            this.logger.error('Failed to chat:', error);
            throw new Error('Failed to chat with Ollama');
        }
    }

    async streamGenerate(prompt: string, model?: string, onChunk?: (chunk: string) => void): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/generate`,
                {
                    model: model || this.defaultModel,
                    prompt: prompt,
                    stream: true
                },
                {
                    responseType: 'stream',
                    timeout: 60000
                }
            );

            let fullResponse = '';

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter((line: string) => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                fullResponse += data.response;
                                if (onChunk) {
                                    onChunk(data.response);
                                }
                            }
                            if (data.done) {
                                resolve(fullResponse);
                                return;
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines
                        }
                    }
                });

                response.data.on('error', (error: any) => {
                    this.logger.error('Stream error:', error);
                    reject(error);
                });

                response.data.on('end', () => {
                    if (fullResponse) {
                        resolve(fullResponse);
                    }
                });
            });
        } catch (error) {
            this.logger.error('Failed to stream generate:', error);
            throw new Error('Failed to stream generate from Ollama');
        }
    }

    async pullModel(modelName: string): Promise<boolean> {
        try {
            await axios.post(`${this.baseURL}/api/pull`, {
                name: modelName,
                stream: false
            }, {
                timeout: 300000 // 5 minutes timeout for model pulling
            });
            return true;
        } catch (error) {
            this.logger.error('Failed to pull model:', error);
            return false;
        }
    }

    async getModelInfo(modelName: string): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/api/show`, {
                name: modelName
            });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to get model info:', error);
            throw new Error('Failed to get model information');
        }
    }

    // Health check for Ollama service
    async healthCheck(): Promise<{ status: string; models: number; defaultModel: string }> {
        try {
            const models = await this.getModels();
            return {
                status: 'healthy',
                models: models.length,
                defaultModel: this.defaultModel
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                models: 0,
                defaultModel: this.defaultModel
            };
        }
    }
}
