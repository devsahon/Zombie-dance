import express, { Request, Response } from 'express';
import axios from 'axios';
import { executeQuery } from '../database/connection';
import { Logger } from '../utils/logger';

const router = express.Router();
const logger = new Logger();

// GET /providers - Get all AI providers
router.get('/', async (req: Request, res: Response) => {
    try {
        if (!(global as any).connection) {
            logger.warn('Database not available, cannot fetch providers');
            return res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot fetch providers when running in offline mode'
            });
        }

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

        const sanitizedConfig = (() => {
            if (!config || typeof config !== 'object') return {};
            const copy = { ...(config as any) };
            if (typeof (copy as any).apiKey === 'string') {
                delete (copy as any).apiKey;
            }
            return copy;
        })();

        if ((global as any).connection) {
            const query = `
                INSERT INTO ai_providers (name, type, api_endpoint, config_json, is_active)
                VALUES (?, ?, ?, ?, ?)
            `;
            const result: any = await executeQuery(query, [name, type, endpoint, JSON.stringify(sanitizedConfig), isActive]);

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

        if (!(global as any).connection) {
            logger.warn('Database not available, cannot fetch provider');
            return res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot fetch provider when running in offline mode'
            });
        }

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

// POST /providers/:id/test - Test provider connectivity
router.post('/:id/test', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!(global as any).connection) {
            logger.warn('Database not available, cannot test provider');
            return res.status(503).json({
                success: false,
                error: 'Database not available',
                message: 'Cannot test provider when running in offline mode'
            });
        }

        const results: any[] = await executeQuery(
            `
                SELECT 
                    id,
                    name,
                    type,
                    api_endpoint as endpoint,
                    is_active as isActive
                FROM ai_providers
                WHERE id = ?
            `,
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Provider not found'
            });
        }

        const provider = results[0];
        const endpoint = String(provider.endpoint || '').replace(/\/+$/, '');

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Provider endpoint is missing'
            });
        }

        const candidates = [`${endpoint}/v1/models`, `${endpoint}/models`];
        const start = Date.now();

        let lastError: any = null;
        for (const url of candidates) {
            try {
                const response = await axios.get(url, {
                    timeout: 8000,
                    validateStatus: () => true,
                    headers: {
                        Accept: 'application/json'
                    }
                });

                if (response.status >= 200 && response.status < 300) {
                    const responseTime = Date.now() - start;
                    return res.json({
                        success: true,
                        provider: {
                            id: provider.id,
                            name: provider.name,
                            type: provider.type,
                            endpoint
                        },
                        testedUrl: url,
                        statusCode: response.status,
                        responseTime,
                        timestamp: new Date().toISOString()
                    });
                }

                lastError = new Error(`Non-2xx status: ${response.status}`);
            } catch (e: any) {
                lastError = e;
            }
        }

        const responseTime = Date.now() - start;
        return res.status(502).json({
            success: false,
            error: 'Provider test failed',
            responseTime,
            message: lastError?.message || 'Unknown error',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error testing provider:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to test provider',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// PUT /providers/:id - Update provider
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, endpoint, config, isActive } = req.body;

        const sanitizedConfig = (() => {
            if (!config || typeof config !== 'object') return undefined;
            const copy = { ...(config as any) };
            if (typeof (copy as any).apiKey === 'string') {
                delete (copy as any).apiKey;
            }
            return copy;
        })();

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

            // Update provider
            const updateQuery = `
                UPDATE ai_providers 
                SET 
                    name = COALESCE(?, name),
                    type = COALESCE(?, type),
                    api_endpoint = COALESCE(?, api_endpoint),
                    config_json = COALESCE(?, config_json),
                    is_active = COALESCE(?, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await executeQuery(updateQuery, [
                name,
                type,
                endpoint,
                sanitizedConfig ? JSON.stringify(sanitizedConfig) : null,
                isActive,
                id
            ]);

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
