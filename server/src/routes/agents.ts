import express from 'express';
import { OllamaService, AgentConfig } from '../services/ollama';
import { Logger } from '../utils/logger';
import { executeQuery } from '../database/connection';

const router = express.Router();
const ollamaService = new OllamaService();
const logger = new Logger();

// Get all agents
router.get('/', async (req, res) => {
  try {
    // Try to fetch from database first
    const agents = await executeQuery(`
      SELECT 
        id,
        name,
        type,
        status,
        config AS configuration,
        request_count,
        active_sessions,
        created_at,
        updated_at
      FROM agents
      ORDER BY name
    `);

    // If database query succeeds, return agents from database
    if (Array.isArray(agents)) {
      res.json({
        success: true,
        agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          config: agent.configuration || {},
          requestCount: agent.request_count || 0,
          activeSessions: agent.active_sessions || 0,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at
        })),
        total: agents.length,
        source: 'database',
        timestamp: new Date().toISOString()
      });
      return;
    }
  } catch (dbError) {
    logger.warn('Failed to fetch agents from database, falling back to defaults:', dbError);
  }

  // Fallback to default agents if database fails
  try {
    const ollamaHealth = await ollamaService.healthCheck();
    
    const defaultAgents = [
      {
        id: 'ollama-agent',
        name: 'Ollama Agent',
        type: 'ai_model',
        status: ollamaHealth.status === 'healthy' ? 'active' : 'inactive',
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        priority: 1,
        capabilities: ['text_generation', 'chat', 'streaming', 'code_generation'],
        metrics: {
          requestCount: 0, // This would be tracked in a real implementation
          avgResponseTime: 0,
          errorRate: 0
        },
        config: {
          defaultModel: ollamaHealth.defaultModel,
          availableModels: ollamaHealth.models,
          maxTokens: 2048,
          temperature: 0.7
        }
      },
      {
        id: 'memory-agent',
        name: 'Memory Agent',
        type: 'memory',
        status: process.env.MEMORY_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
        endpoint: 'http://localhost:8001',
        priority: 2,
        capabilities: ['conversation_history', 'context_management', 'data_persistence'],
        metrics: {
          requestCount: 0,
          avgResponseTime: 0,
          errorRate: 0
        },
        config: {
          storageType: 'file',
          maxHistoryLength: 100,
          autoCleanup: true
        }
      },
      {
        id: 'cli-agent',
        name: 'CLI Agent',
        type: 'command',
        status: process.env.CLI_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
        endpoint: 'http://localhost:8000/v1',
        priority: 3,
        capabilities: ['command_execution', 'file_operations', 'system_monitoring'],
        metrics: {
          requestCount: 0,
          avgResponseTime: 0,
          errorRate: 0
        },
        config: {
          allowedCommands: ['ls', 'cd', 'mkdir', 'touch', 'cat', 'grep'],
          workingDirectory: process.cwd(),
          timeout: 30000
        }
      }
    ];

    res.json({
      success: true,
      agents: defaultAgents,
      total: defaultAgents.length,
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error('Failed to get agents:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific agent status
router.get('/:agentId/status', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    let agentStatus;
    
    switch (agentId) {
      case 'ollama-agent':
        const ollamaHealth = await ollamaService.healthCheck();
        agentStatus = {
          id: agentId,
          name: 'Ollama Agent',
          status: ollamaHealth.status === 'healthy' ? 'active' : 'inactive',
          uptime: process.uptime(),
          lastRequest: new Date().toISOString(),
          health: {
            status: ollamaHealth.status,
            models: ollamaHealth.models,
            defaultModel: ollamaHealth.defaultModel,
            responseTime: 0
          }
        };
        break;
        
      case 'memory-agent':
        agentStatus = {
          id: agentId,
          name: 'Memory Agent',
          status: process.env.MEMORY_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
          uptime: process.uptime(),
          lastRequest: new Date().toISOString(),
          health: {
            status: 'healthy',
            storageAvailable: true,
            responseTime: 0
          }
        };
        break;
        
      case 'cli-agent':
        agentStatus = {
          id: agentId,
          name: 'CLI Agent',
          status: process.env.CLI_AGENT_ENABLED === 'true' ? 'active' : 'inactive',
          uptime: process.uptime(),
          lastRequest: new Date().toISOString(),
          health: {
            status: 'healthy',
            commandsAvailable: true,
            responseTime: 0
          }
        };
        break;
        
      default:
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
          agentId
        });
    }

    res.json({
      success: true,
      agent: agentStatus,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error(`Failed to get agent status for ${req.params.agentId}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get agent status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Start agent
router.post('/:agentId/start', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // In a real implementation, this would start the actual agent service
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: `Agent ${agentId} started successfully`,
      agentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to start agent ${req.params.agentId}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to start agent',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Stop agent
router.post('/:agentId/stop', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // In a real implementation, this would stop the actual agent service
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: `Agent ${agentId} stopped successfully`,
      agentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to stop agent ${req.params.agentId}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to stop agent',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Call agent
router.post('/:agentId/call', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action, payload } = req.body;
    
    let result;
    let dbAgent = null;
    let modelName = 'qwen2.5-coder:1.5b'; // Default model
    let agentConfig: AgentConfig | undefined = undefined;
    
    // Check if agentId is a numeric ID (database agent)
    const isNumericId = !isNaN(Number(agentId));
    
    if (isNumericId) {
      // It's a numeric ID - check database (convert to integer)
      const numericId = parseInt(agentId, 10);
      
      const agentData = await executeQuery(
        'SELECT id, name, type, status, persona_name, description, config, metadata FROM agents WHERE id = ?',
        [numericId]
      );
      
      if (!Array.isArray(agentData) || agentData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found in database',
          agentId
        });
      }
      
      dbAgent = agentData[0];
      
      // Extract model and build agent config from dbAgent
      try {
        const config = typeof dbAgent.config === 'string' 
          ? JSON.parse(dbAgent.config) 
          : dbAgent.config;
        
        const metadata = typeof dbAgent.metadata === 'string'
          ? JSON.parse(dbAgent.metadata)
          : dbAgent.metadata;
        
        // Build agent config for Ollama service
        agentConfig = {
          id: dbAgent.id,
          name: dbAgent.name,
          type: dbAgent.type,
          status: dbAgent.status,
          persona_name: dbAgent.persona_name,
          system_prompt: dbAgent.system_prompt,
          config: config || {},
          metadata: metadata || {}
        };
        
        if (config?.model) {
          modelName = config.model;
        }
      } catch (parseError) {
        console.error('Failed to parse agent config:', parseError);
      }
    }
    
    // Handle different agent types
    switch (agentId) {
      case 'ollama-agent':
        // Validate action
        const validActions = ['generate_code', 'chat', 'generate'];
        if (!validActions.includes(action)) {
          return res.status(400).json({
            success: false,
            error: `Invalid action for Ollama agent. Valid actions: ${validActions.join(', ')}`,
            action,
            agentId
          });
        }
        
        if (!payload || !payload.prompt) {
          return res.status(400).json({
            success: false,
            error: 'Payload with prompt is required for Ollama agent'
          });
        }
        
        // Handle different actions
        switch (action) {
          case 'generate_code':
          case 'generate':
            const response = await ollamaService.generate(payload.prompt, payload.model || modelName);
            result = {
              response: response,
              explanation: `${action === 'generate_code' ? 'Code' : 'Text'} generated successfully`,
              model: payload.model || modelName
            };
            break;
            
          case 'chat':
            if (!Array.isArray(payload.messages)) {
              return res.status(400).json({
                success: false,
                error: 'Messages array is required for chat action'
              });
            }
            const chatResponse = await ollamaService.chat(payload.messages, payload.model || modelName);
            result = {
              response: chatResponse,
              explanation: 'Chat response generated successfully',
              model: payload.model || modelName
            };
            break;
          
          default:
            return res.status(400).json({
              success: false,
              error: 'Unsupported action for Ollama agent'
            });
        }
        break;
        
      case 'memory-agent':
        if (action === 'store_conversation') {
          if (!payload.conversation_id || !payload.messages) {
            return res.status(400).json({
              success: false,
              error: 'conversation_id and messages are required for storing conversation'
            });
          }
          // In a real implementation, this would store in database
          result = {
            stored: true,
            conversation_id: payload.conversation_id,
            message: 'Conversation stored successfully'
          };
        } else if (action === 'retrieve_conversation') {
          if (!payload.conversation_id) {
            return res.status(400).json({
              success: false,
              error: 'conversation_id is required for retrieving conversation'
            });
          }
          // In a real implementation, this would retrieve from database
          result = {
            conversation_id: payload.conversation_id,
            messages: [],
            message: 'Conversation retrieved successfully'
          };
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid action for Memory agent. Supported: store_conversation, retrieve_conversation'
          });
        }
        break;
        
      case 'cli-agent':
        if (action === 'execute_command') {
          if (!payload.command) {
            return res.status(400).json({
              success: false,
              error: 'command is required for CLI agent'
            });
          }
          // In a real implementation, this would execute the command
          result = {
            command: payload.command,
            output: 'Command execution simulated',
            exitCode: 0,
            message: 'Command executed successfully'
          };
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid action for CLI agent. Supported: execute_command'
          });
        }
        break;
        
      default:
        // For database agents (numeric ID) or unknown string IDs
        if (dbAgent) {
          // Database agent - use Ollama with config model
          if (action === 'generate_code' || action === 'generate') {
            if (!payload || !payload.prompt) {
              return res.status(400).json({
                success: false,
                error: 'Payload with prompt is required for generate action'
              });
            }
            
            const dbResponse = await ollamaService.generate(payload.prompt, payload.model || modelName, agentConfig);
            result = {
              response: dbResponse,
              explanation: `Code/text generated successfully using agent: ${dbAgent.name}`,
              model: payload.model || modelName,
              agent: {
                id: dbAgent.id,
                name: dbAgent.name,
                type: dbAgent.type
              }
            };
          } else if (action === 'chat') {
            if (!Array.isArray(payload?.messages)) {
              return res.status(400).json({
                success: false,
                error: 'Messages array is required for chat action'
              });
            }
            
            const dbChatResponse = await ollamaService.chat(payload.messages, payload.model || modelName, agentConfig);
            result = {
              response: dbChatResponse,
              explanation: `Chat response generated successfully using agent: ${dbAgent.name}`,
              model: payload.model || modelName,
              agent: {
                id: dbAgent.id,
                name: dbAgent.name,
                type: dbAgent.type
              }
            };
          } else {
            return res.status(400).json({
              success: false,
              error: 'Invalid action for database agent. Valid actions: generate_code, generate, chat',
              agentId,
              agentName: dbAgent.name
            });
          }
        } else {
          // Unknown string agent
          const defaultAgents = ['ollama-agent', 'memory-agent', 'cli-agent'];
          return res.status(404).json({
            success: false,
            error: 'Agent not found or not callable',
            agentId,
            availableAgents: defaultAgents,
            hint: 'Use numeric ID for database agents (e.g., /agents/1/call)'
          });
        }
    }

    res.json({
      success: true,
      result,
      executionTime: Date.now(),
      agentId,
      action,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    logger.error(`Failed to call agent ${req.params.agentId}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to call agent',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return;
  }
});

export default router;
