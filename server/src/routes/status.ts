import express from 'express';
import { OllamaService } from '../services/ollama';
import { Logger } from '../utils/logger';

const router = express.Router();
const ollamaService = new OllamaService();
const logger = new Logger();

// System status endpoint
router.get('/', async (req, res) => {
    try {
        const startTime = Date.now();

        // Get comprehensive status
        const [ollamaHealth, models] = await Promise.all([
            ollamaService.healthCheck(),
            ollamaService.getModels().catch(() => [])
        ]);

        const responseTime = Date.now() - startTime;

        const systemStatus = {
            server: {
                name: 'UAS TypeScript Server',
                version: '1.0.0',
                status: 'running',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                responseTime
            },
            models: models.map(model => ({
                name: model.name,
                size: model.size,
                modified: model.modified_at,
                digest: model.digest,
                status: 'available'
            })),
            agents: [
                {
                    id: 'ollama-agent',
                    name: 'Ollama Agent',
                    type: 'ai_model',
                    status: ollamaHealth.status === 'healthy' ? 'active' : 'inactive',
                    endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
                    model: ollamaHealth.defaultModel,
                    capabilities: ['text_generation', 'chat', 'streaming']
                },
                {
                    id: 'memory-agent',
                    name: 'Memory Agent',
                    type: 'memory',
                    status: process.env.MEMORY_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
                    endpoint: 'http://localhost:8001',
                    capabilities: ['conversation_history', 'context_management']
                },
                {
                    id: 'cli-agent',
                    name: 'CLI Agent',
                    type: 'command',
                    status: process.env.CLI_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
                    endpoint: 'http://localhost:8000/v1',
                    capabilities: ['command_execution', 'file_operations']
                }
            ],
            stats: {
                activeConnections: 1, // WebSocket connection
                totalRequests: 0, // This would be tracked in a real implementation
                memoryUsage: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                },
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime()
            },
            features: {
                ollama: {
                    available: ollamaHealth.status === 'healthy',
                    modelsCount: ollamaHealth.models,
                    defaultModel: ollamaHealth.defaultModel
                },
                memory: {
                    enabled: process.env.MEMORY_AGENT_ENABLED === 'true'
                },
                cli: {
                    enabled: process.env.CLI_AGENT_ENABLED === 'true'
                },
                loadBalancer: {
                    enabled: process.env.LOAD_BALANCER_ENABLED === 'true'
                },
                audioChat: {
                    enabled: process.env.AUDIO_CHAT_ENABLED === 'true'
                }
            }
        };

        res.json(systemStatus);
    } catch (error) {
        logger.error('Status check failed:', error);

        res.status(500).json({
            error: 'Failed to get system status',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Agent-specific status
router.get('/agents', async (req, res) => {
    try {
        const ollamaHealth = await ollamaService.healthCheck();

        const agentsStatus = {
            agents: [
                {
                    id: 'ollama-agent',
                    name: 'Ollama Agent',
                    status: ollamaHealth.status === 'healthy' ? 'active' : 'inactive',
                    health: {
                        status: ollamaHealth.status,
                        models: ollamaHealth.models,
                        defaultModel: ollamaHealth.defaultModel,
                        responseTime: 0
                    },
                    metrics: {
                        requests: 0,
                        avgResponseTime: 0,
                        errorRate: 0
                    }
                }
            ],
            timestamp: new Date().toISOString()
        };

        res.json(agentsStatus);
    } catch (error) {
        logger.error('Agent status check failed:', error);
        res.status(500).json({
            error: 'Failed to get agent status',
            timestamp: new Date().toISOString()
        });
    }
});

// Models status
router.get('/models', async (req, res) => {
    try {
        const models = await ollamaService.getModels();

        const modelsStatus = {
            models: models.map(model => ({
                name: model.name,
                status: 'available',
                size: model.size,
                modified: model.modified_at,
                details: model.details
            })),
            total: models.length,
            timestamp: new Date().toISOString()
        };

        res.json(modelsStatus);
    } catch (error) {
        logger.error('Models status check failed:', error);
        res.status(500).json({
            error: 'Failed to get models status',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
