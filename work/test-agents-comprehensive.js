/**
 * Comprehensive Agent Test Script
 * Tests each agent with Bengali questions, shows session info, memory, tools, metadata
 * 
 * Usage: node test-agents-comprehensive.js
 */

const WebSocket = require('ws');
const readline = require('readline');

const CONFIG = {
    serverUrl: 'ws://localhost:8000',
    model: 'llama3.1:latest',
    timeout: 60000
};

// Agent configurations with Bengali test questions
const AGENTS = [
    {
        id: 1,
        name: 'Code Editor Agent',
        persona: 'ZombieCoder Dev Agent',
        questions: [
            'তুমি কে?',
            'আমার জন্য একটি simple JavaScript function লিখো যা দুই সংখ্যা যোগ করে।',
            'আমার শেষ প্রশ্নটা কী ছিল?'
        ]
    },
    {
        id: 2,
        name: 'Master Orchestrator',
        persona: 'System Master',
        questions: [
            'তোমার কাজ কী?',
            'আমাকে একটি প্রজেক্টের প্ল্যান করে দাও।',
            'তুমি কতগুলো এজেন্ট নিয়ন্ত্রণ করো?'
        ]
    },
    {
        id: 3,
        name: 'Chat Assistant',
        persona: 'Friendly Assistant',
        questions: [
            'তুমি কারা?',
            'বাংলাদেশের রাজধানী কোথায়?',
            'আমার সাথে তুমি কথা বলতে পারো?'
        ]
    }
];

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m'
};

function colorize(text, color) {
    return `${color}${text}${colors.reset}`;
}

function printHeader(title) {
    console.log('\n' + colorize('═'.repeat(70), colors.cyan));
    console.log(colorize(`  ${title}`, colors.bright + colors.cyan));
    console.log(colorize('═'.repeat(70), colors.cyan));
}

function printAgentInfo(agent) {
    console.log(colorize('\n📋 Agent Information:', colors.yellow));
    console.log(`   ID:        ${colorize(agent.id.toString(), colors.white)}`);
    console.log(`   Name:      ${colorize(agent.name, colors.green)}`);
    console.log(`   Persona:   ${colorize(agent.persona, colors.magenta)}`);
    console.log(`   Model:     ${colorize(CONFIG.model, colors.blue)}`);
}

function printSessionInfo(sessionId, agentId) {
    console.log(colorize('\n🔗 Session Information:', colors.yellow));
    console.log(`   Session ID: ${colorize(sessionId, colors.cyan)}`);
    console.log(`   Agent ID:  ${colorize(agentId.toString(), colors.white)}`);
    console.log(`   Timestamp: ${colorize(new Date().toISOString(), colors.dim)}`);
}

/**
 * Send question to agent via WebSocket with real-time streaming
 */
function askAgentStreaming(agentId, question) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(CONFIG.serverUrl);
        let response = '';
        let sessionId = '';
        let startTime = Date.now();
        let metadata = {};
        let tools = [];
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.close();
                resolve({
                    success: false,
                    response: response || '[TIMEOUT]',
                    sessionId,
                    latency: Date.now() - startTime,
                    metadata,
                    tools,
                    error: 'timeout'
                });
            }
        }, CONFIG.timeout);

        ws.on('open', () => {
            console.log(colorize('\n   📤 Sending question...', colors.blue));
            
            // Send message with session tracking
            ws.send(JSON.stringify({
                type: 'agent_stream',
                data: {
                    agentId,
                    action: 'generate',
                    prompt: question,
                    model: CONFIG.model,
                    sessionId: `test-${agentId}-${Date.now()}`,
                    trackMetadata: true
                }
            }));
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                // Capture session ID from start message first
                if (message.type === 'agent_stream_start' && message.data?.sessionId) {
                    sessionId = message.data.sessionId;
                    printSessionInfo(sessionId, agentId);
                    
                    // Also capture metadata from start
                    if (message.data.persona) metadata.persona = message.data.persona;
                    if (message.data.model) metadata.model = message.data.model;
                }

                // Capture metadata from any message
                if (message.metadata) {
                    metadata = { ...metadata, ...message.metadata };
                }

                // Capture tools info
                if (message.tools) {
                    tools = message.tools;
                }

                // Handle streaming chunks
                if (message.type === 'agent_stream_chunk') {
                    const chunk = message.data?.chunk || message.chunk || '';
                    response += chunk;
                    
                    // Print in real-time with typing effect
                    process.stdout.write(colorize(chunk, colors.white));
                } 
                else if (message.type === 'agent_stream_complete' || message.type === 'complete') {
                    clearTimeout(timer);
                    if (!resolved) {
                        resolved = true;
                        ws.close();
                        
                        // Print metadata after completion
                        if (Object.keys(metadata).length > 0) {
                            console.log(colorize('\n\n📊 Response Metadata:', colors.yellow));
                            console.log(`   Latency: ${colorize((Date.now() - startTime).toString() + 'ms', colors.green)}`);
                            if (metadata.persona) console.log(`   Persona: ${colorize(metadata.persona, colors.magenta)}`);
                            if (metadata.model) console.log(`   Model:   ${colorize(metadata.model, colors.blue)}`);
                        }
                        
                        resolve({
                            success: true,
                            response: response.trim(),
                            sessionId,
                            latency: Date.now() - startTime,
                            metadata,
                            tools
                        });
                    }
                }
                else if (message.type === 'error') {
                    clearTimeout(timer);
                    if (!resolved) {
                        resolved = true;
                        ws.close();
                        resolve({
                            success: false,
                            response: message.error || 'Unknown error',
                            sessionId,
                            latency: Date.now() - startTime,
                            error: message.error
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
                    error: err.message
                });
            }
        });
    });
}

/**
 * Test a single agent with multiple questions
 */
async function testAgent(agent) {
    printHeader(`Testing: ${agent.name} (${agent.persona})`);
    printAgentInfo(agent);

    const results = {
        agentId: agent.id,
        agentName: agent.name,
        persona: agent.persona,
        questions: []
    };

    for (let i = 0; i < agent.questions.length; i++) {
        const question = agent.questions[i];
        
        console.log(colorize(`\n\n${'─'.repeat(70)}`, colors.dim));
        console.log(colorize(`❓ প্রশ্ন ${i + 1}: `, colors.yellow) + colorize(question, colors.bright + colors.white));
        console.log(colorize('─'.repeat(70), colors.dim));
        
        // Add small delay between questions
        if (i > 0) {
            await new Promise(r => setTimeout(r, 500));
        }

        const result = await askAgentStreaming(agent.id, question);
        
        results.questions.push({
            question,
            answer: result.response,
            latency: result.latency,
            sessionId: result.sessionId,
            success: result.success,
            metadata: result.metadata
        });

        console.log(colorize('\n\n✓ Response received', colors.green));
        console.log(colorize(`   Latency: ${result.latency}ms`, colors.dim));
    }

    return results;
}

/**
 * Print final summary
 */
function printSummary(allResults) {
    printHeader('📋 টেস্ট সারাংশ / Test Summary');

    for (const result of allResults) {
        const successCount = result.questions.filter(q => q.success).length;
        const avgLatency = Math.round(
            result.questions.reduce((sum, q) => sum + q.latency, 0) / result.questions.length
        );

        console.log(colorize(`\n${result.agentName}:`, colors.bright + colors.green));
        console.log(`   Persona:     ${colorize(result.persona, colors.magenta)}`);
        console.log(`   Questions:  ${colorize(result.questions.length.toString(), colors.white)}`);
        console.log(`   Success:    ${colorize(`${successCount}/${result.questions.length}`, colors.green)}`);
        console.log(`   Avg Latency:${colorize(` ${avgLatency}ms`, colors.blue)}`);

        // Show session IDs
        console.log(colorize('   Sessions:', colors.yellow));
        result.questions.forEach((q, idx) => {
            console.log(`      Q${idx + 1}: ${q.sessionId || 'N/A'}`);
        });
    }

    console.log(colorize('\n' + '═'.repeat(70), colors.cyan));
    console.log(colorize('  টেস্ট সম্পন্ন! / Test Complete!', colors.bright + colors.green));
    console.log(colorize('═'.repeat(70), colors.cyan));
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n');
    console.log(colorize('╔' + '═'.repeat(68) + '╗', colors.bgMagenta + colors.white));
    console.log(colorize('║' + ' '.repeat(10) + '🔬 এজেন্ট পরীক্ষা স্ক্রিপ্ট' + ' '.repeat(21) + '║', colors.bgMagenta + colors.white));
    console.log(colorize('║' + ' '.repeat(20) + 'Agent Test Suite' + ' '.repeat(26) + '║', colors.bgMagenta + colors.white));
    console.log(colorize('╚' + '═'.repeat(68) + '╝', colors.bgMagenta + colors.white));
    
    console.log(colorize('\n⚙️  Configuration:', colors.yellow));
    console.log(`   Server:    ${CONFIG.serverUrl}`);
    console.log(`   Model:    ${CONFIG.model}`);
    console.log(`   Timeout:  ${CONFIG.timeout / 1000}s`);
    console.log(`   Agents:   ${AGENTS.length}`);

    const allResults = [];

    // Test each agent
    for (const agent of AGENTS) {
        const result = await testAgent(agent);
        allResults.push(result);
        
        // Delay between agents
        await new Promise(r => setTimeout(r, 1000));
    }

    // Print summary
    printSummary(allResults);

    // Save results to file
    const fs = require('fs');
    const outputFile = '/home/sahon/Zombie-dance/work/test-comprehensive-results.json';
    fs.writeFileSync(outputFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        model: CONFIG.model,
        results: allResults
    }, null, 2));
    console.log(colorize(`\n💾 Results saved to: ${outputFile}`, colors.dim));

    process.exit(0);
}

// Run tests
runTests().catch(err => {
    console.error(colorize('❌ Test failed:', colors.red), err);
    process.exit(1);
});
