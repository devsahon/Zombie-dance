import { initializeDatabase, executeQuery } from '../src/database/connection';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function populateAgents() {
  try {
    // Initialize database connection using environment variables
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'u-root',
      password: process.env.DB_PASSWORD || 'p-105585',
      database: process.env.DB_NAME || 'uas_admin',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    await initializeDatabase(config);
    console.log('Database connection initialized');

    // Create different types of agents
    const agents = [
      {
        name: 'Code Editor Agent',
        type: 'editor',
        persona_name: 'Code Assistant',
        description: 'Helps with code editing, debugging, and development tasks in the editor',
        status: 'active',
        config: JSON.stringify({
          capabilities: ['code_completion', 'debugging', 'refactoring', 'explanation'],
          supported_languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'],
          max_tokens: 2000,
          temperature: 0.7
        }),
        metadata: JSON.stringify({
          version: '1.0',
          created_by: 'system',
          purpose: 'editor_integration'
        })
      },
      {
        name: 'Master Orchestrator',
        type: 'master',
        persona_name: 'System Master',
        description: 'Orchestrates and manages all other agents, handles complex multi-step tasks',
        status: 'active',
        config: JSON.stringify({
          capabilities: ['orchestration', 'task_planning', 'resource_management', 'decision_making'],
          max_tokens: 3000,
          temperature: 0.5
        }),
        metadata: JSON.stringify({
          version: '1.0',
          created_by: 'system',
          purpose: 'system_management'
        })
      },
      {
        name: 'Chat Assistant',
        type: 'chatbot',
        persona_name: 'Friendly Assistant',
        description: 'General purpose chat assistant for answering questions and providing help',
        status: 'active',
        config: JSON.stringify({
          capabilities: ['conversation', 'question_answering', 'information_retrieval', 'help_guidance'],
          max_tokens: 1500,
          temperature: 0.8
        }),
        metadata: JSON.stringify({
          version: '1.0',
          created_by: 'system',
          purpose: 'user_interaction'
        })
      },
      {
        name: 'Documentation Writer',
        type: 'editor',
        persona_name: 'Doc Writer',
        description: 'Specialized in writing and maintaining documentation',
        status: 'active',
        config: JSON.stringify({
          capabilities: ['documentation', 'technical_writing', 'formatting', 'explanation'],
          max_tokens: 2500,
          temperature: 0.6
        }),
        metadata: JSON.stringify({
          version: '1.0',
          created_by: 'system',
          purpose: 'documentation'
        })
      },
      {
        name: 'Code Reviewer',
        type: 'editor',
        persona_name: 'Code Reviewer',
        description: 'Reviews code for quality, security, and best practices',
        status: 'active',
        config: JSON.stringify({
          capabilities: ['code_review', 'security_analysis', 'best_practices', 'suggestions'],
          max_tokens: 2000,
          temperature: 0.4
        }),
        metadata: JSON.stringify({
          version: '1.0',
          created_by: 'system',
          purpose: 'code_quality'
        })
      }
    ];

    // Insert agents into database
    for (const agent of agents) {
      const result = await executeQuery(
        `INSERT INTO agents (name, type, persona_name, description, status, config, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          agent.name,
          agent.type,
          agent.persona_name,
          agent.description,
          agent.status,
          agent.config,
          agent.metadata
        ]
      );
      console.log(`Created agent: ${agent.name} (ID: ${(result as any).insertId})`);
    }

    console.log('All agents created successfully!');
  } catch (error) {
    console.error('Error creating agents:', error);
  }
}

populateAgents();
