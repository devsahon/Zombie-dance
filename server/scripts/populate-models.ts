import { initializeDatabase, executeQuery } from '../src/database/connection';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function populateModels() {
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

    // Check if provider exists
    const providers = await executeQuery(
      `SELECT id FROM ai_providers WHERE name = ?`,
      ['Ollama Local']
    );

    let providerId;
    if (providers.length > 0) {
      providerId = providers[0].id;
      console.log(`Provider already exists: Ollama Local (ID: ${providerId})`);
    } else {
      // Create a provider for Ollama
      const providerResult = await executeQuery(
        `INSERT INTO ai_providers (name, type, api_endpoint, is_active) 
         VALUES (?, ?, ?, ?)`,
        ['Ollama Local', 'ollama', 'http://localhost:11434', true]
      );
      providerId = (providerResult as any).insertId;
      console.log(`Created provider: Ollama Local (ID: ${providerId})`);
    }

    // Check if model already exists
    const models = await executeQuery(
      `SELECT id FROM ai_models WHERE provider_id = ? AND model_name = ?`,
      [providerId, 'qwen2.5:1.5b']
    );

    if (models.length > 0) {
      console.log('Model already exists: qwen2.5:1.5b');
    } else {
      // Create models
      const modelData = {
        model_name: 'qwen2.5:1.5b',
        model_version: '1.5b',
        status: 'running',
        cpu_usage: 0.00,
        memory_usage: 0.00,
        requests_handled: 0,
        last_response_time: 0,
        total_tokens_used: 0,
        metadata: JSON.stringify({
          family: 'qwen2',
          parameter_size: '1.5B',
          quantization_level: 'Q4_K_M',
          size: 986061892
        })
      };

      const result = await executeQuery(
        `INSERT INTO ai_models (provider_id, model_name, model_version, status, cpu_usage, memory_usage, requests_handled, last_response_time, total_tokens_used, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          providerId,
          modelData.model_name,
          modelData.model_version,
          modelData.status,
          modelData.cpu_usage,
          modelData.memory_usage,
          modelData.requests_handled,
          modelData.last_response_time,
          modelData.total_tokens_used,
          modelData.metadata
        ]
      );
      console.log(`Created model: ${modelData.model_name} (ID: ${(result as any).insertId})`);
    }

    console.log('All models created successfully!');
  } catch (error) {
    console.error('Error creating models:', error);
  }
}

populateModels();
