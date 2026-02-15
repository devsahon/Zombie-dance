/**
 * Agent Buffer Memory Test Script
 * Tests individual agents with the same question multiple times
 * to verify buffer memory and conversation history work correctly
 * 
 * Usage: node test-agent-memory.js
 */

const WebSocket = require('ws');

// Test configuration
const CONFIG = {
    serverUrl: 'ws://localhost:8000',
    model: 'llama3.1:latest',
    timeout: 30000,
    iterationsPerAgent: 3
};

// Agent configurations
const AGENTS = [
    { 
        id: 1, 
        name: 'Code Editor Agent (ZombieCoder Dev Agent)',
        persona: 'ZombieCoder Dev Agent',
        firstQuestion: 'What is your name?',
        followUpQuestion: 'What was my first question to you?'
    },
    { 
        id: 2, 
        name: 'Master Orchestrator', 
        persona: 'System Master',
        firstQuestion: 'What is your name?',
        followUpQuestion: 'What did I ask you first?'
    },
    { 
        id: 3, 
        name: 'Chat Assistant', 
        persona: 'Friendly Assistant',
        firstQuestion: 'What is your name?',
        followUpQuestion: 'Can you tell me what I asked earlier?'
    }
];

// Results storage
const results = {
    timestamp: new Date().toISOString(),
    model: CONFIG.model,
    agents: []
};

/**
 * Send a question to an agent via WebSocket
 */
function askAgent(agentId, question, iteration) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(CONFIG.serverUrl);
        let response = '';
        let startTime = Date.now();
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.close();
                resolve({
                    success: false,
                    response: response || '[TIMEOUT]',
                    latency: Date.now() - startTime,
                    iteration,
                    error: 'timeout'
                });
            }
        }, CONFIG.timeout);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'agent_stream',
                data: {
                    agentId,
                    action: 'generate',
                    prompt: question,
                    model: CONFIG.model
                }
            }));
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.type === 'agent_stream_chunk') {
                    response += message.data.chunk;
                } else if (message.type === 'agent_stream_complete') {
                    clearTimeout(timer);
                    if (!resolved) {
                        resolved = true;
                        ws.close();
                        const latency = Date.now() - startTime;
                        resolve({
                            success: true,
                            response: response.trim(),
                            latency,
                            iteration
                        });
                    }
                }
            } catch (e) {
                // Skip invalid messages
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timer);
            if (!resolved) {
                resolved = true;
                resolve({
                    success: false,
                    response: '',
                    latency: Date.now() - startTime,
                    iteration,
                    error: err.message
                });
            }
        });
    });
}

/**
 * Test a single agent with multiple iterations
 */
async function testAgent(agent) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${agent.name} (Persona: ${agent.persona})`);
    console.log('='.repeat(60));

    const agentResults = {
        id: agent.id,
        name: agent.name,
        persona: agent.persona,
        iterations: []
    };

    // First question - establish context
    console.log(`\n📝 Iteration 1: "${agent.firstQuestion}"`);
    const result1 = await askAgent(agent.id, agent.firstQuestion, 1);
    console.log(`   Latency: ${result1.latency}ms`);
    console.log(`   Response: ${result1.response.substring(0, 100)}...`);
    agentResults.iterations.push(result1);

    // Small delay between questions
    await new Promise(r => setTimeout(r, 500));

    // Follow-up question - test if agent remembers context
    console.log(`\n📝 Iteration 2: "${agent.followUpQuestion}"`);
    const result2 = await askAgent(agent.id, agent.followUpQuestion, 2);
    console.log(`   Latency: ${result2.latency}ms`);
    console.log(`   Response: ${result2.response.substring(0, 100)}...`);
    agentResults.iterations.push(result2);

    // Third iteration - another follow-up to test memory
    await new Promise(r => setTimeout(r, 500));
    
    console.log(`\n📝 Iteration 3: "What is my name? (You should not know)"`);
    const result3 = await askAgent(agent.id, 'What is my name?', 3);
    console.log(`   Latency: ${result3.latency}ms`);
    console.log(`   Response: ${result3.response.substring(0, 100)}...`);
    agentResults.iterations.push(result3);

    // Calculate statistics
    const latencies = agentResults.iterations.map(i => i.latency);
    agentResults.stats = {
        avgLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        minLatency: Math.min(...latencies),
        maxLatency: Math.max(...latencies),
        totalTime: latencies.reduce((a, b) => a + b, 0),
        successCount: agentResults.iterations.filter(i => i.success).length
    };

    console.log(`\n📊 Stats for ${agent.name}:`);
    console.log(`   Avg Latency: ${agentResults.stats.avgLatency}ms`);
    console.log(`   Min/Max: ${agentResults.stats.minLatency}ms / ${agentResults.stats.maxLatency}ms`);
    console.log(`   Success Rate: ${agentResults.stats.successCount}/${CONFIG.iterationsPerAgent}`);

    return agentResults;
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n' + '█'.repeat(60));
    console.log('🧪 Agent Buffer Memory Test Suite');
    console.log('█'.repeat(60));
    console.log(`\nModel: ${CONFIG.model}`);
    console.log(`Server: ${CONFIG.serverUrl}`);
    console.log(`Iterations per agent: ${CONFIG.iterationsPerAgent}`);

    // Test each agent
    for (const agent of AGENTS) {
        const agentResults = await testAgent(agent);
        results.agents.push(agentResults);
        
        // Delay between agents
        await new Promise(r => setTimeout(r, 1000));
    }

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(60));

    results.summary = {
        totalTests: AGENTS.length * CONFIG.iterationsPerAgent,
        totalLatency: 0,
        avgLatency: 0,
        agentsResponding: 0
    };

    for (const agent of results.agents) {
        results.summary.totalLatency += agent.stats.totalTime;
        if (agent.stats.successCount > 0) {
            results.summary.agentsResponding++;
        }
        
        console.log(`\n${agent.name}:`);
        console.log(`  - Persona: ${agent.persona}`);
        console.log(`  - Avg Latency: ${agent.stats.avgLatency}ms`);
        console.log(`  - Success Rate: ${agent.stats.successCount}/${CONFIG.iterationsPerAgent}`);
        
        // Check memory indicators
        const iter2Response = agent.iterations[1]?.response?.toLowerCase() || '';
        const hasMemory = iter2Response.includes('first') || 
                        iter2Response.includes('name') ||
                        iter2Response.includes('asked') ||
                        iter2Response.includes('question');
        
        console.log(`  - Memory Test: ${hasMemory ? '✅ PASS' : '❌ FAIL'}`);
    }

    results.summary.avgLatency = Math.round(results.summary.totalLatency / results.summary.totalTests);

    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total Tests: ${results.summary.totalTests}`);
    console.log(`   Overall Avg Latency: ${results.summary.avgLatency}ms`);
    console.log(`   Agents Responding: ${results.summary.agentsResponding}/${AGENTS.length}`);

    // Output final JSON
    console.log('\n' + '='.repeat(60));
    console.log('📄 JSON OUTPUT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));

    // Save to file
    const fs = require('fs');
    const outputFile = '/home/sahon/Zombie-dance/work/test-results.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputFile}`);

    process.exit(0);
}

// Run tests
runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
