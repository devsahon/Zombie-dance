import express, { Request, Response } from 'express';
import { executeQuery } from '../database/connection';
import { Logger } from '../utils/logger';

const router = express.Router();
const logger = new Logger();

// GET /providers - Get all AI providers
router.get('/', async (req: Request, res: Response) => {
    try {
        // If database is available, fetch from database
        if ((global as any).connection) {
            const query = `
                SELECT 
                    id,
                    name,
                    type,
                    api_endpoint as endpoint,
                    is_active as isActive,
                    created_at as createdAt
                FROM ai_providers
                ORDER BY created_at DESC
            `;
            const results: any = await executeQuery(query);
            
            res.json({
                success: true,
                data: results,
                count: results.length
            });
        } else {
            // Fallback data when running in offline mode
            logger.warn('Database not available, serving fallback data');
            res.json({
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Ollama Local',
                        type: 'ollama',
                        endpoint: 'http://localhost:11434',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: 'OpenAI',
                        type: 'openai',
                        endpoint: 'https://api.openai.com/v1',
                        isActive: false,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 3,
                        name: 'Google',
                        type: 'google',
                        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
                        isActive: false,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 4,
                        name: 'Anthropic',
                        type: 'anthropic',
                        endpoint: 'https://api.anthropic.com/v1',
                        isActive: false,
                        createdAt: new Date().toISOString()
                    }
                ],
                count: 4
            });
        }
    } catch (error) {
        logger.error('Error fetching providers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch providers',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return; // Add explicit return
});

// POST /providers - Create new provider
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, type, endpoint, config, isActive = true } = req.body;

        if (!name || !type || !endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, type, and endpoint are required'
            });
        }

        if ((global as any).connection) {
            const query = `
                INSERT INTO ai_providers (name, type, api_endpoint, config_json, is_active)
                VALUES (?, ?, ?, ?, ?)
            `;
            const result: any = await executeQuery(query, [name, type, endpoint, JSON.stringify(config || {}), isActive]);
            
            res.status(201).json({
                success: true,
                message: 'Provider created successfully',
                data: {
                    id: result.insertId,
                    name,
                    type,
                    endpoint,
                    isActive
                }
            });
        } else {
            logger.warn('Database not available, cannot create provider');
            res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot create provider when running in offline mode'
            });
        }
    } catch (error) {
        logger.error('Error creating provider:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create provider',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return; // Add explicit return
});

// GET /providers/:id - Get specific provider
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if ((global as any).connection) {
            const query = `
                SELECT 
                    id,
                    name,
                    type,
                    api_endpoint as endpoint,
                    config_json as config,
                    is_active as isActive,
                    created_at as createdAt
                FROM ai_providers
                WHERE id = ?
            `;
            const results: any[] = await executeQuery(query, [id]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Provider not found'
                });
            }

            res.json({
                success: true,
                data: results[0]
            });
        } else {
            // Return fallback data for the specific ID
            const providers = [
                {
                    id: 1,
                    name: 'Ollama Local',
                    type: 'ollama',
                    endpoint: 'http://localhost:11434',
                    config: {},
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];
            
            const provider = providers.find(p => String(p.id) === String(id)); // Fix comparison
            if (!provider) {
                return res.status(404).json({
                    success: false,
                    error: 'Provider not found'
                });
            }

            res.json({
                success: true,
                data: provider
            });
        }
    } catch (error) {
        logger.error('Error fetching provider:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch provider',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return; // Add explicit return
});

// PUT /providers/:id - Update provider
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, endpoint, config, isActive } = req.body;

        if ((global as any).connection) {
            // Check if provider exists
            const checkQuery = 'SELECT id FROM ai_providers WHERE id = ?';
            const existing: any[] = await executeQuery(checkQuery, [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Provider not found'
                });
            }

            // Update the provider
            const updateQuery = `
                UPDATE ai_providers 
                SET 
                    name = COALESCE(?, name),
                    type = COALESCE(?, type),
                    api_endpoint = COALESCE(?, api_endpoint),
                    config_json = COALESCE(?, config_json),
                    is_active = COALESCE(?, is_active)
                WHERE id = ?
            `;
            
            await executeQuery(updateQuery, [name, type, endpoint, JSON.stringify(config || {}), isActive, id]);

            res.json({
                success: true,
                message: 'Provider updated successfully'
            });
        } else {
            logger.warn('Database not available, cannot update provider');
            res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot update provider when running in offline mode'
            });
        }
    } catch (error) {
        logger.error('Error updating provider:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update provider',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return; // Add explicit return
});

// DELETE /providers/:id - Delete provider
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if ((global as any).connection) {
            // Check if provider exists
            const checkQuery = 'SELECT id FROM ai_providers WHERE id = ?';
            const existing: any[] = await executeQuery(checkQuery, [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Provider not found'
                });
            }

            // Delete the provider
            const deleteQuery = 'DELETE FROM ai_providers WHERE id = ?';
            await executeQuery(deleteQuery, [id]);

            res.json({
                success: true,
                message: 'Provider deleted successfully'
            });
        } else {
            logger.warn('Database not available, cannot delete provider');
            res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot delete provider when running in offline mode'
            });
        }
    } catch (error) {
        logger.error('Error deleting provider:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete provider',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return; // Add explicit return
});

export default router;
