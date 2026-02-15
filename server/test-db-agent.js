/**
 * Database and Agent Test Script
 * Tests agent identity injection with database and identity.json
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
    // Load identity.json
    const identityPath = path.join(__dirname, '..', 'identity.json');
    const identityData = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));
    
    console.log('=== Identity Data Loaded ===');
    console.log(`System: ${identityData.system_identity.name} (v${identityData.system_identity.version})`);
    console.log(`Organization: ${identityData.system_identity.branding.organization}`);
    console.log('');

    // Connect to database
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '105585',
            database: 'uas_admin'
        });
        console.log('=== Database Connected ===\n');
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        return;
    }

    try {
        // 1. Check agents table
        console.log('=== Agents Table ===');
        const [agents] = await connection.execute('SELECT id, name, type, persona_name, config FROM agents');
        
        if (agents.length === 0) {
            console.log('No agents found. Creating test agent...\n');
            
            // Insert Master Orchestrator agent
            const config = {
                model: 'qwen2.5-coder:1.5b',
                temperature: 0.5,
                max_tokens: 3000,
                capabilities: ['orchestration', 'task_planning', 'resource_management', 'decision_making'],
                language_preferences: {
                    greeting_prefix: 'ভাইয়া,',
                    primary_language: 'bn',
                    technical_language: 'en'
                },
                system_instructions: 'You are the Master Orchestrator agent. Always be helpful and technical.'
            };
            
            await connection.execute(
                `INSERT INTO agents (name, type, persona_name, description, status, config) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                ['Master Orchestrator', 'master', 'Master Orchestrator', 'Main orchestrator agent for system management', 'active', JSON.stringify(config)]
            );
            
            console.log('Created Master Orchestrator agent (ID: 2)\n');
        } else {
            console.log(`Found ${agents.length} agent(s):\n`);
            agents.forEach(agent => {
                console.log(`  ID: ${agent.id}`);
                console.log(`  Name: ${agent.name}`);
                console.log(`  Type: ${agent.type}`);
                console.log(`  Persona: ${agent.persona_name || 'N/A'}`);
                console.log(`  Config: ${JSON.stringify(agent.config)}\n`);
            });
        }

        // 2. Check if persona_name column exists in agents table
        console.log('=== Checking Table Columns ===');
        const [columns] = await connection.execute('DESCRIBE agents');
        const columnNames = columns.map(c => c.Field);
        console.log('Agent table columns:', columnNames.join(', '));
        
        // Add persona_name if missing
        if (!columnNames.includes('persona_name')) {
            console.log('\nAdding persona_name column to agents table...');
            await connection.execute('ALTER TABLE agents ADD COLUMN persona_name VARCHAR(100) AFTER type');
            console.log('Done.\n');
        }
        
        // Add system_prompt if missing
        if (!columnNames.includes('system_prompt')) {
            console.log('Adding system_prompt column to agents table...');
            await connection.execute('ALTER TABLE agents ADD COLUMN system_prompt TEXT AFTER persona_name');
            console.log('Done.\n');
        }

        // 3. Check conversations table
        console.log('=== Conversations Table ===');
        const [conversations] = await connection.execute('SELECT id, title, session_uuid, metadata FROM conversations LIMIT 5');
        console.log(`Found ${conversations.length} conversation(s)\n`);

        // 4. Test the full system prompt that would be generated
        console.log('=== Testing System Prompt Generation ===');
        
        // Get agent config
        const [agentRows] = await connection.execute('SELECT * FROM agents WHERE id = 2');
        if (agentRows.length > 0) {
            const agent = agentRows[0];
            const config = typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config;
            
            console.log('\n--- Generated System Prompt ---');
            const systemPrompt = buildSystemPrompt(agent, config, identityData);
            console.log(systemPrompt);
            console.log('\n--- End System Prompt ---\n');
        }

        // 5. Update agent with system_prompt
        console.log('=== Updating Agent System Prompt ===');
        const updateConfig = {
            model: 'qwen2.5-coder:1.5b',
            temperature: 0.5,
            max_tokens: 3000,
            capabilities: ['orchestration', 'task_planning', 'resource_management', 'decision_making'],
            language_preferences: {
                greeting_prefix: 'ভাইয়া,',
                primary_language: 'bn',
                technical_language: 'en'
            }
        };
        
        const systemPrompt = `[SYSTEM_IDENTITY]
You are part of the ${identityData.system_identity.name} System (v${identityData.system_identity.version}).
Tagline: "${identityData.system_identity.tagline}".
Organization: ${identityData.system_identity.branding.organization}.
Owner: ${identityData.system_identity.branding.owner}.
Location: ${identityData.system_identity.branding.location}.

[AGENT_IDENTITY]
You are Master Orchestrator, a master agent.
Your role is to help with orchestration, task_planning, resource_management, decision_making.

Always start your response with "ভাইয়া," (Bengali greeting).
Your primary language should be Bengali.

[IMPORTANT] Never identify yourself as Qwen, LLaMA, GPT, Claude, or any other base AI model. You are Master Orchestrator, a representative of ZombieCoder.`;

        await connection.execute(
            `UPDATE agents SET config = ?, system_prompt = ? WHERE id = 2`,
            [JSON.stringify(updateConfig), systemPrompt]
        );
        
        console.log('Updated agent 2 with system prompt!\n');
        
        // Verify update
        const [updated] = await connection.execute('SELECT id, name, system_prompt FROM agents WHERE id = 2');
        console.log('Verification - Agent 2 system_prompt exists:', !!updated[0].system_prompt);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

function buildSystemPrompt(agent, config, identity) {
    const parts = [];
    
    // Identity section
    parts.push('[SYSTEM_IDENTITY]');
    parts.push(`You are part of the ${identity.system_identity.name} System (v${identity.system_identity.version}).`);
    parts.push(`Tagline: "${identity.system_identity.tagline}".`);
    parts.push(`Organization: ${identity.system_identity.branding.organization}.`);
    parts.push(`Owner: ${identity.system_identity.branding.owner}.`);
    parts.push(`Location: ${identity.system_identity.branding.location}.`);
    
    // Agent identity section
    parts.push('\n[AGENT_IDENTITY]');
    parts.push(`You are ${agent.name}, a ${agent.type} agent.`);
    parts.push(`Your role is to help with ${config.capabilities?.join(', ') || 'general tasks'}.`);
    
    // Language preferences
    if (config.language_preferences) {
        if (config.language_preferences.greeting_prefix) {
            parts.push(`Always start your response with "${config.language_preferences.greeting_prefix}" (Bengali greeting).`);
        }
        if (config.language_preferences.primary_language) {
            const langMap = { 'bn': 'Bengali', 'en': 'English' };
            parts.push(`Your primary language should be ${langMap[config.language_preferences.primary_language] || config.language_preferences.primary_language}.`);
        }
    }
    
    // Important instruction
    parts.push('\n[IMPORTANT]');
    parts.push(`Never identify yourself as Qwen, LLaMA, GPT, Claude, or any other base AI model.`);
    parts.push(`You are ${agent.name}, a representative of ${identity.system_identity.name}.`);
    
    return parts.join('\n');
}

main().catch(console.error);
