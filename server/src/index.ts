import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from './routes/health';
import statusRoutes from './routes/status';
import chatRoutes from './routes/chat';
import modelsRoutes from './routes/models';
import agentsRoutes from './routes/agents';
import memoryRoutes from './routes/memory-new';
import cliRoutes from './routes/cli';
import editorRoutes from './routes/editor';
import providersRoutes from './routes/providers';
import serversRoutes from './routes/servers';
import settingsRoutes from './routes/settings';
import metricsRoutes from './routes/metrics';
import promptTemplatesRoutes from './routes/prompt-templates';
import { initializeMemoryRoutes } from './routes/memory-new';
import { initializeCLIRoutes } from './routes/cli-new';

import { apiAuditMiddleware } from './middleware/apiAudit';

// Import services
import { OllamaService } from './services/ollama';
import { WebSocketService } from './services/websocket';
import { Logger } from './utils/logger';
import { initializeDatabase } from './database/connection';
import { MemoryService } from './services/memory';
import { EmbeddingService } from './services/embedding';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8000;

// Initialize services
const ollamaService = new OllamaService();
const logger = new Logger();
const memoryService = new MemoryService();
const embeddingService = new EmbeddingService(ollamaService, memoryService);

// WebSocket setup
const wss = new WebSocketServer({ server });
const wsService = new WebSocketService(wss);

// Middleware
app.use(helmet());
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'ZombieCoder-by-SahonSrabon');
    next();
});
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API audit logging (DB)
app.use(apiAuditMiddleware);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/status', statusRoutes);
app.use('/chat', chatRoutes);
app.use('/models', modelsRoutes);
app.use('/agents', agentsRoutes);
app.use('/memory', memoryRoutes);
app.use('/cli-agent', cliRoutes);
app.use('/editor', editorRoutes);
app.use('/providers', providersRoutes);
app.use('/servers', serversRoutes);
app.use('/settings', settingsRoutes);
app.use('/metrics', metricsRoutes);
app.use('/prompt-templates', promptTemplatesRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'UAS TypeScript Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            status: '/status',
            chat: '/chat',
            models: '/models',
            agents: '/agents',
            memory: '/memory-new',
            cli: '/cli-agent',
            editor: '/editor',
            providers: '/providers',
            servers: '/servers'
        }
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Start server
server.listen(port, async () => {
    logger.info(`🚀 UAS TypeScript Server running on port ${port}`);
    logger.info(`📡 WebSocket server ready for real-time updates`);
    logger.info(`🔗 Ollama integration: ${ollamaService.isConnected ? 'Connected' : 'Disconnected'}`);

    // Initialize database
    try {
        await initializeDatabase({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'uas_admin',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.warn('⚠️ Database connection failed - running in offline mode', error);
    }

    // Initialize memory service
    try {
        await memoryService.initialize();
        initializeMemoryRoutes(memoryService, embeddingService, ollamaService);
        initializeCLIRoutes();
        logger.info('✅ Memory service initialized successfully');
    } catch (error) {
        logger.error('❌ Failed to initialize memory service:', error);
    }

    // Test Ollama connection
    ollamaService.testConnection().then(connected => {
        if (connected) {
            logger.info('✅ Ollama service connected successfully');
        } else {
            logger.warn('⚠️ Ollama service not available - some features may not work');
        }
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

export { app, server, wsService, ollamaService };