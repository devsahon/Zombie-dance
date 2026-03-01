import express from 'express';
import { Logger } from '../utils/logger';
import ToolRegistry, { LangChainToolFactory } from '../services/toolRegistry';

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

router.get('/tools', async (req, res) => {
  try {
    const agentIdRaw = req.query.agentId;
    const numericAgentId = typeof agentIdRaw === 'string' ? parseInt(agentIdRaw, 10) : NaN;

    if (!Number.isNaN(numericAgentId)) {
      const tools = await ToolRegistry.getToolCatalogForAgent(numericAgentId);
      res.json({
        success: true,
        agentId: numericAgentId,
        tools,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const tools = ToolRegistry.getAllTools().map(t => ({
      name: t.name,
      category: t.category,
      description: t.description,
      isActive: false,
      config: t.config,
      source: 'built_in'
    }));

    res.json({
      success: true,
      tools,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to list MCP tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tools',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

router.post('/execute', requireApiKey, async (req, res) => {
  try {
    const { agentId, toolName, input, configOverride } = req.body || {};

    const numericAgentId = typeof agentId === 'number' ? agentId : parseInt(String(agentId || ''), 10);
    if (Number.isNaN(numericAgentId)) {
      res.status(400).json({
        success: false,
        error: 'agentId is required and must be a numeric ID',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!toolName || typeof toolName !== 'string') {
      res.status(400).json({
        success: false,
        error: 'toolName is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const toolConfig = ToolRegistry.getTool(toolName);
    const agentTool = await ToolRegistry.getAgentToolEffectiveConfig(numericAgentId, toolName);
    if (!agentTool || !agentTool.isActive) {
      res.status(404).json({
        success: false,
        error: 'Tool not found or inactive',
        toolName,
        agentId: numericAgentId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!toolConfig) {
      res.status(400).json({
        success: false,
        error: 'Tool is not a built-in executable tool',
        toolName,
        agentId: numericAgentId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const sensitiveTools = new Set(['shell_exec', 'file_read', 'file_write']);
    if (sensitiveTools.has(toolName) && configOverride) {
      res.status(400).json({
        success: false,
        error: 'configOverride is not allowed for this tool',
        toolName,
        agentId: numericAgentId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const mergedConfig = {
      ...(toolConfig.config || {}),
      ...(agentTool.config || {}),
      ...(configOverride && typeof configOverride === 'object' ? configOverride : {})
    };

    const tool = LangChainToolFactory.createTool(toolName, mergedConfig);
    if (!tool) {
      res.status(400).json({
        success: false,
        error: 'Tool is not executable',
        toolName,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const dyn: any = tool as any;
    if (typeof dyn.func !== 'function') {
      res.status(400).json({
        success: false,
        error: 'Tool is missing executable handler',
        toolName,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const startedAt = Date.now();
    const output = await dyn.func(typeof input === 'string' ? input : JSON.stringify(input ?? ''));

    res.json({
      success: true,
      toolName,
      agentId: numericAgentId,
      output,
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to execute MCP tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute tool',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
