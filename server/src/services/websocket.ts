import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from '../utils/logger';
import { OllamaService } from './ollama';
import { executeQuery } from '../database/connection';

interface WebSocketMessage {
    type: string;
    data?: any;
    timestamp?: string;
}

export class WebSocketService {
    private wss: WebSocketServer;
    private clients: Map<WebSocket, any>;
    private logger: Logger;
    private ollamaService: OllamaService;

    constructor(wss: WebSocketServer) {
        this.wss = wss;
        this.clients = new Map();
        this.logger = new Logger();
        this.ollamaService = new OllamaService();

        this.setupWebSocketServer();
    }

    private setupWebSocketServer(): void {
        this.wss.on('connection', (ws: WebSocket, req) => {
            this.logger.info('New WebSocket connection', {
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Store client information
            this.clients.set(ws, {
                connectedAt: new Date(),
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Send welcome message
            this.sendMessage(ws, {
                type: 'connected',
                data: {
                    message: 'Connected to UAS WebSocket server',
                    serverTime: new Date().toISOString()
                }
            });

            // Handle incoming messages
            ws.on('message', (data: Buffer) => {
                try {
                    const message: WebSocketMessage = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                } catch (error) {
                    this.logger.error('Invalid WebSocket message:', error);
                    this.sendMessage(ws, {
                        type: 'error',
                        data: {
                            message: 'Invalid message format'
                        }
                    });
                }
            });

            // Handle client disconnect
            ws.on('close', (code: number, reason: Buffer) => {
                this.logger.info('WebSocket connection closed', {
                    code,
                    reason: reason.toString(),
                    clientCount: this.clients.size - 1
                });
                this.clients.delete(ws);
            });

            // Handle errors
            ws.on('error', (error: Error) => {
                this.logger.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Send periodic heartbeat
            const heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendMessage(ws, {
                        type: 'heartbeat',
                        data: {
                            timestamp: new Date().toISOString()
                        }
                    });
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000); // Send heartbeat every 30 seconds

            ws.on('close', () => {
                clearInterval(heartbeat);
            });
        });

        this.logger.info('WebSocket server initialized');
    }

    private async handleMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
        const clientInfo = this.clients.get(ws);

        this.logger.info('WebSocket message received', {
            type: message.type,
            clientIp: clientInfo?.ip
        });

        switch (message.type) {
            case 'ping':
                this.sendMessage(ws, {
                    type: 'pong',
                    data: {
                        timestamp: new Date().toISOString()
                    }
                });
                break;

            case 'subscribe':
                // Handle subscription to specific events
                this.sendMessage(ws, {
                    type: 'subscribed',
                    data: {
                        events: message.data?.events || [],
                        message: 'Successfully subscribed to events'
                    }
                });
                break;

            case 'unsubscribe':
                // Handle unsubscription from events
                this.sendMessage(ws, {
                    type: 'unsubscribed',
                    data: {
                        events: message.data?.events || [],
                        message: 'Successfully unsubscribed from events'
                    }
                });
                break;

            case 'agent_stream':
                // Handle streaming agent call via WebSocket
                await this.handleAgentStream(ws, message.data);
                break;

            default:
                this.sendMessage(ws, {
                    type: 'error',
                    data: {
                        message: `Unknown message type: ${message.type}`
                    }
                });
        }
    }

    private async handleAgentStream(ws: WebSocket, data: any): Promise<void> {
        const { agentId, action, prompt, messages, model } = data;
        
        this.logger.info(`WebSocket agent stream request`, { agentId, action });
        
        try {
            // Check if agentId is a numeric ID (database agent)
            const isNumericId = !isNaN(Number(agentId));
            let dbAgent = null;
            let agentConfig = null;
            let modelName = model || 'qwen2.5-coder:1.5b';
            
            if (isNumericId) {
                const numericId = parseInt(agentId, 10);
                const agentData = await executeQuery(
                    'SELECT id, name, type, status, config, metadata FROM agents WHERE id = ?',
                    [numericId]
                );
                
                if (Array.isArray(agentData) && agentData.length > 0) {
                    dbAgent = agentData[0];
                    try {
                        const config = typeof dbAgent.config === 'string' 
                            ? JSON.parse(dbAgent.config) 
                            : dbAgent.config;
                        
                        // Parse metadata if exists
                        let metadata: any = {};
                        if (dbAgent.metadata) {
                            metadata = typeof dbAgent.metadata === 'string' 
                                ? JSON.parse(dbAgent.metadata) 
                                : dbAgent.metadata;
                        }
                        
                        // Build agent config for Ollama service
                        agentConfig = {
                            id: dbAgent.id,
                            name: dbAgent.name,
                            type: dbAgent.type,
                            status: dbAgent.status,
                            persona_name: dbAgent.persona_name,
                            system_prompt: metadata?.system_prompt || '',
                            config: config || {},
                            metadata: metadata
                        };
                        
                        if (config?.model) {
                            modelName = config.model;
                        }
                    } catch (parseError) {
                        console.error('Failed to parse agent config:', parseError);
                    }
                }
            }
            
            // Send start message
            this.sendMessage(ws, {
                type: 'agent_stream_start',
                data: {
                    agentId,
                    action,
                    agentName: agentConfig?.name || (isNumericId ? `Agent ${agentId}` : agentId),
                    message: `Starting ${action} with ${agentConfig?.name || agentId}...`
                }
            });
            
            let response = '';
            
            // Handle different actions
            if (action === 'generate' || action === 'generate_code') {
                if (!prompt) {
                    this.sendMessage(ws, {
                        type: 'agent_stream_error',
                        data: { error: 'prompt is required' }
                    });
                    return;
                }
                
                // Stream the response word by word for effect - pass agentConfig for system prompt
                const fullResponse = await this.ollamaService.generate(prompt, modelName, agentConfig || undefined);
                
                // Split response into chunks for streaming effect
                const words = fullResponse.split(/\s+/);
                for (let i = 0; i < words.length; i++) {
                    response += (i > 0 ? ' ' : '') + words[i];
                    this.sendMessage(ws, {
                        type: 'agent_stream_chunk',
                        data: {
                            chunk: words[i] + ' ',
                            progress: Math.round(((i + 1) / words.length) * 100),
                            partial: response
                        }
                    });
                    // Small delay for streaming effect
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
                
            } else if (action === 'chat') {
                if (!Array.isArray(messages)) {
                    this.sendMessage(ws, {
                        type: 'agent_stream_error',
                        data: { error: 'messages array is required for chat action' }
                    });
                    return;
                }
                
                // chat() returns a string directly - pass agentConfig for system prompt
                const responseText = await this.ollamaService.chat(messages, modelName, agentConfig || undefined);
                
                const words = responseText.split(/\s+/);
                for (let i = 0; i < words.length; i++) {
                    response += (i > 0 ? ' ' : '') + words[i];
                    this.sendMessage(ws, {
                        type: 'agent_stream_chunk',
                        data: {
                            chunk: words[i] + ' ',
                            progress: Math.round(((i + 1) / words.length) * 100),
                            partial: response
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            } else {
                this.sendMessage(ws, {
                    type: 'agent_stream_error',
                    data: { error: `Unsupported action: ${action}. Supported: generate, generate_code, chat` }
                });
                return;
            }
            
            // Send complete message
            this.sendMessage(ws, {
                type: 'agent_stream_complete',
                data: {
                    response,
                    agentId,
                    action,
                    model: modelName,
                    agentName: dbAgent?.name || (isNumericId ? `Agent ${agentId}` : agentId),
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error: any) {
            this.logger.error('WebSocket agent stream error:', error);
            this.sendMessage(ws, {
                type: 'agent_stream_error',
                data: {
                    error: error.message || 'Unknown error occurred',
                    agentId,
                    action
                }
            });
        }
    }

    private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            const messageWithTimestamp = {
                ...message,
                timestamp: new Date().toISOString()
            };

            ws.send(JSON.stringify(messageWithTimestamp));
        }
    }

    // Broadcast message to all connected clients
    public broadcast(message: WebSocketMessage): void {
        const messageWithTimestamp = {
            ...message,
            timestamp: new Date().toISOString()
        };

        this.clients.forEach((clientInfo, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(messageWithTimestamp));
            }
        });

        this.logger.info('Broadcasted message to all clients', {
            type: message.type,
            clientCount: this.clients.size
        });
    }

    // Send message to specific client
    public sendToClient(ws: WebSocket, message: WebSocketMessage): void {
        this.sendMessage(ws, message);
    }

    // Broadcast agent status update
    public broadcastAgentStatus(agentId: string, status: string): void {
        this.broadcast({
            type: 'agent.status',
            data: {
                agentId,
                status,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Broadcast metrics update
    public broadcastMetrics(metrics: any): void {
        this.broadcast({
            type: 'metrics.update',
            data: {
                ...metrics,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Broadcast new log entry
    public broadcastLog(level: string, message: string, metadata?: any): void {
        this.broadcast({
            type: 'logs.new',
            data: {
                level,
                message,
                metadata,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Broadcast chat message
    public broadcastChatMessage(userMessage: string, aiResponse: string, model?: string): void {
        this.broadcast({
            type: 'chat.message',
            data: {
                user: userMessage,
                assistant: aiResponse,
                model: model || 'default',
                timestamp: new Date().toISOString()
            }
        });
    }

    // Get connected clients count
    public getClientCount(): number {
        return this.clients.size;
    }

    // Get client information
    public getClients(): Map<WebSocket, any> {
        return this.clients;
    }
}
