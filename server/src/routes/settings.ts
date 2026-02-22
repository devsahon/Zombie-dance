import express from 'express';
import { executeQuery } from '../database/connection';
import { Logger } from '../utils/logger';
import { applyGuardrailsToSystemPrompt, ZOMBIECODER_GUARDRAILS_VERSION } from '../utils/ethics';

const router = express.Router();
const logger = new Logger();

function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const configuredKey = process.env.UAS_API_KEY || process.env.API_KEY;
  if (!configuredKey) {
    logger.warn('UAS_API_KEY/API_KEY is not set; rejecting protected request');
    res.status(500).json({
      success: false,
      error: 'Server misconfiguration',
      message: 'UAS_API_KEY/API_KEY is not set',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const providedKey = req.header('X-API-Key') || '';
  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid API key',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
}

async function getSystemSetting(key: string): Promise<string | null> {
  const rows = await executeQuery(
    'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
    [key]
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (rows[0] as any).setting_value ?? null;
}

async function upsertSystemSetting(key: string, value: string, type: 'string' | 'integer' | 'boolean' | 'json' = 'string') {
  await executeQuery(
    `INSERT INTO system_settings (setting_key, setting_value, setting_type)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), setting_type = VALUES(setting_type), updated_at = CURRENT_TIMESTAMP`,
    [key, value, type]
  );
}

// Get default model
router.get('/default-model', async (req, res) => {
  try {
    const dbValue = await getSystemSetting('default_model');
    const envValue = process.env.OLLAMA_DEFAULT_MODEL || null;

    res.json({
      success: true,
      defaultModel: dbValue || envValue || null,
      sources: {
        database: dbValue,
        env: envValue
      },
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to get default model setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get default model setting',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Update default model
router.put('/default-model', requireApiKey, async (req, res) => {
  try {
    const { model } = req.body;

    if (!model || typeof model !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'model is required and must be a string',
        timestamp: new Date().toISOString()
      });
    }

    await upsertSystemSetting('default_model', model, 'string');

    res.json({
      success: true,
      message: 'Default model updated successfully',
      defaultModel: model,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to update default model setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update default model setting',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Update agent persona/system prompt (stored in agents.metadata.system_prompt)
router.put('/agents/:agentId/persona', requireApiKey, async (req, res) => {
  try {
    const { agentId } = req.params;
    const numericId = parseInt(agentId, 10);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        error: 'agentId must be a numeric ID',
        timestamp: new Date().toISOString()
      });
    }

    const { persona_name, system_prompt } = req.body;

    const agentRows = await executeQuery('SELECT id, metadata FROM agents WHERE id = ? LIMIT 1', [numericId]);
    if (!Array.isArray(agentRows) || agentRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        agentId: numericId,
        timestamp: new Date().toISOString()
      });
    }

    let metadata: Record<string, any> = {};
    const existingMetadata = (agentRows[0] as any).metadata;
    if (existingMetadata) {
      metadata = typeof existingMetadata === 'string' ? JSON.parse(existingMetadata) : existingMetadata;
    }

    if (typeof system_prompt === 'string') {
      metadata.system_prompt = applyGuardrailsToSystemPrompt(system_prompt);
      metadata.guardrails_version = ZOMBIECODER_GUARDRAILS_VERSION;
    }

    await executeQuery(
      `UPDATE agents
       SET persona_name = COALESCE(?, persona_name),
           metadata = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [typeof persona_name === 'string' ? persona_name : null, JSON.stringify(metadata), numericId]
    );

    res.json({
      success: true,
      message: 'Agent persona updated successfully',
      agentId: numericId,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to update agent persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent persona',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
