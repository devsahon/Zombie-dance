import express, { Request, Response } from 'express';
import { OllamaService, ChatMessage } from '../services/ollama';
import { Logger } from '../utils/logger';
import { executeQuery } from '../database/connection';

const router = express.Router();
const ollamaService = new OllamaService();
const logger = new Logger();

// Chat endpoint
router.post('/message', async (req, res) => {
    try {
        const { message, model, conversation_id, agent_id } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        // Prepare messages array
        const messages: ChatMessage[] = [];

        // If conversation_id is provided, fetch conversation history
        if (conversation_id) {
            if ((global as any).connection) {
                try {
                    const query = `
                        SELECT sender_type as role, content
                        FROM messages
                        WHERE conversation_id = ?
                        ORDER BY created_at ASC
                    `;
                    const history: any[] = await executeQuery(query, [conversation_id]);
                    
                    for (const msg of history) {
                        messages.push({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        });
                    }
                } catch (err) {
                    logger.warn('Could not fetch conversation history:', err);
                }
            }
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: message
        });

        // Generate response
        const response = await ollamaService.chat(messages, model);

        // Save the conversation if database is available
        if ((global as any).connection) {
            try {
                let convId = conversation_id;
                
                // Create conversation if it doesn't exist
                if (!convId) {
                    const convQuery = `
                        INSERT INTO conversations (title, status, created_at, updated_at)
                        VALUES (?, ?, NOW(), NOW())
                    `;
                    const convResult: any = await executeQuery(convQuery, [`Conversation ${new Date().toISOString()}`, 'active']);
                    convId = convResult.insertId;
                }

                // Save user message
                const userMsgQuery = `
                    INSERT INTO messages (conversation_id, sender_type, model_used, content, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `;
                await executeQuery(userMsgQuery, [convId, 'user', model || 'default', message]);

                // Save assistant response
                const assistantMsgQuery = `
                    INSERT INTO messages (conversation_id, sender_type, model_used, content, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `;
                await executeQuery(assistantMsgQuery, [convId, 'agent', model || 'default', response]);

                // Update conversation timestamp
                const updateConvQuery = `
                    UPDATE conversations SET updated_at = NOW() WHERE id = ?
                `;
                await executeQuery(updateConvQuery, [convId]);
            } catch (err) {
                logger.error('Error saving conversation:', err);
            }
        }

        // Log the interaction
        logger.info('Chat interaction', {
            userMessage: message.substring(0, 100),
            responseLength: response.length,
            model: model || 'default'
        });

        res.json({
            success: true,
            response: response,
            conversationId: conversation_id || ((global as any).connection ? 'new_conversation_id_placeholder' : undefined),
            model: model || process.env.OLLAMA_DEFAULT_MODEL,
            timestamp: new Date().toISOString(),
            conversation: {
                user: message,
                assistant: response
            }
        });
    } catch (error) {
        logger.error('Chat error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
    return; // Explicit return
});

// Stream chat endpoint
router.post('/stream', async (req, res) => {
    try {
        const { message, model, conversation_id } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial message
        res.write(`data: ${JSON.stringify({
            type: 'start',
            message: 'Starting response generation...',
            timestamp: new Date().toISOString()
        })}\n\n`);

        let fullResponse = '';

        // Generate streaming response
        await ollamaService.streamGenerate(
            message,
            model,
            (chunk: string) => {
                fullResponse += chunk;

                // Send chunk to client
                res.write(`data: ${JSON.stringify({
                    type: 'chunk',
                    content: chunk,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
        );

        // Save the conversation if database is available
        if ((global as any).connection && conversation_id) {
            try {
                // Save user message
                const userMsgQuery = `
                    INSERT INTO messages (conversation_id, sender_type, model_used, content, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `;
                await executeQuery(userMsgQuery, [conversation_id, 'user', model || 'default', message]);

                // Save assistant response
                const assistantMsgQuery = `
                    INSERT INTO messages (conversation_id, sender_type, model_used, content, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `;
                await executeQuery(assistantMsgQuery, [conversation_id, 'agent', model || 'default', fullResponse]);

                // Update conversation timestamp
                const updateConvQuery = `
                    UPDATE conversations SET updated_at = NOW() WHERE id = ?
                `;
                await executeQuery(updateConvQuery, [conversation_id]);
            } catch (err) {
                logger.error('Error saving stream conversation:', err);
            }
        }

        // Send completion message
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            fullResponse: fullResponse,
            timestamp: new Date().toISOString()
        })}\n\n`);

        res.end();

        logger.info('Stream chat completed', {
            userMessage: message.substring(0, 100),
            responseLength: fullResponse.length,
            model: model || 'default'
        });

    } catch (error) {
        logger.error('Stream chat error:', error);

        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to generate streaming response',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        })}\n\n`);

        res.end();
    }
    return; // Explicit return
});

// Simple generate endpoint (for prompt generation)
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                error: 'Prompt is required and must be a string'
            });
        }

        const response = await ollamaService.generate(prompt, model);
        res.json({
            success: true,
            prompt: prompt,
            response: response,
            model: model || process.env.OLLAMA_DEFAULT_MODEL,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Generate error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
    return; // Explicit return
});

// Get chat history (mock implementation)
router.get('/history', async (req, res) => {
    try {
        // If database is available, fetch from database
        if ((global as any).connection) {
            try {
                const { conversationId } = req.query;
                let query = '';
                let params: any[] = [];

                if (conversationId) {
                    // Get messages for specific conversation
                    query = `
                        SELECT m.id, m.conversation_id, m.sender_type as role, m.content, m.created_at
                        FROM messages m
                        WHERE m.conversation_id = ?
                        ORDER BY m.created_at ASC
                    `;
                    params = [conversationId];
                } else {
                    // Get recent conversations
                    query = `
                        SELECT c.id as conversationId, c.title, c.status, c.created_at, c.updated_at,
                               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as messageCount
                        FROM conversations c
                        ORDER BY c.updated_at DESC
                        LIMIT 20
                    `;
                }

                const results = await executeQuery(query, params);
                
                res.json({
                    success: true,
                    data: results,
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                logger.error('Database error in chat history:', err);
                // Fall back to mock data
                throw err;
            }
        } else {
            // In a real implementation, this would fetch from a database
            const mockHistory = [
                {
                    id: '1',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    messages: [
                        { role: 'user', content: 'Hello, how are you?' },
                        { role: 'assistant', content: 'I am doing well, thank you for asking!' }
                    ]
                }
            ];

            res.json({
                success: true,
                conversations: mockHistory,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Get chat history error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get chat history',
            timestamp: new Date().toISOString()
        });
    }
    return; // Explicit return
});

// Get all conversations (NEW endpoint)
router.get('/conversations', async (req, res) => {
    try {
        // If database is available, fetch from database
        if ((global as any).connection) {
            try {
                const query = `
                    SELECT 
                        c.id,
                        c.title,
                        c.status,
                        c.created_at,
                        c.updated_at,
                        COUNT(m.id) as message_count
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    GROUP BY c.id, c.title, c.status, c.created_at, c.updated_at
                    ORDER BY c.updated_at DESC
                `;
                const results = await executeQuery(query);
                
                res.json({
                    success: true,
                    data: results,
                    count: results.length,
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                logger.error('Database error in conversations:', err);
                // Fall back to mock data
                throw err;
            }
        } else {
            // Fallback to mock data when running in offline mode
            const mockConversations = [
                {
                    id: 1,
                    title: 'Initial Conversation',
                    status: 'active',
                    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                    message_count: 5
                },
                {
                    id: 2,
                    title: 'Project Discussion',
                    status: 'active',
                    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    updated_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                    message_count: 12
                },
                {
                    id: 3,
                    title: 'Technical Support',
                    status: 'closed',
                    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                    updated_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                    message_count: 8
                }
            ];

            res.json({
                success: true,
                data: mockConversations,
                count: mockConversations.length,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Get conversations error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get conversations',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
    return; // Explicit return
});

// Get specific conversation
router.get('/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // If database is available, fetch from database
        if ((global as any).connection) {
            try {
                const query = `
                    SELECT 
                        c.id,
                        c.title,
                        c.status,
                        c.created_at,
                        c.updated_at,
                        m.id as message_id,
                        m.sender_type as role,
                        m.content,
                        m.created_at as message_created_at
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    WHERE c.id = ?
                    ORDER BY m.created_at ASC
                `;
                const results: any[] = await executeQuery(query, [id]);

                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Conversation not found'
                    });
                }

                // Extract conversation info from the first row
                const conversation = {
                    id: results[0].id,
                    title: results[0].title,
                    status: results[0].status,
                    created_at: results[0].created_at,
                    updated_at: results[0].updated_at,
                    messages: results.filter(r => r.message_id).map(r => ({
                        id: r.message_id,
                        role: r.role,
                        content: r.content,
                        created_at: r.message_created_at
                    }))
                };

                res.json({
                    success: true,
                    data: conversation,
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                logger.error('Database error in specific conversation:', err);
                // Fall back to mock data
                throw err;
            }
        } else {
            // Fallback to mock data when running in offline mode
            const mockConversation = {
                id,
                title: `Conversation ${id}`,
                status: 'active',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                updated_at: new Date().toISOString(),
                messages: [
                    {
                        id: 1,
                        role: 'user',
                        content: 'Hello, can you help me with something?',
                        created_at: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
                    },
                    {
                        id: 2,
                        role: 'assistant',
                        content: 'Of course! What do you need help with?',
                        created_at: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
                    },
                    {
                        id: 3,
                        role: 'user',
                        content: 'I need to understand how this system works.',
                        created_at: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
                    },
                    {
                        id: 4,
                        role: 'assistant',
                        content: 'This system provides AI assistance through various integrations and tools.',
                        created_at: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
                    }
                ]
            };

            res.json({
                success: true,
                data: mockConversation,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Get specific conversation error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get conversation',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
    return; // Explicit return
});

export default router;
