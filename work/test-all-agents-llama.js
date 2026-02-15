const WebSocket = require('ws');

// Test all 3 agents with llama3.1 model
const tests = [
  { id: 1, name: 'Code Editor Agent', question: 'Who are you?' },
  { id: 2, name: 'Master Orchestrator', question: 'Who are you?' },
  { id: 3, name: 'Chat Assistant', question: 'Who are you?' },
  { id: 1, name: 'Code Editor Agent', question: 'Where are you located?' },
  { id: 2, name: 'Master Orchestrator', question: 'Where are you located?' },
  { id: 3, name: 'Chat Assistant', question: 'Where are you located?' },
  { id: 1, name: 'Code Editor Agent', question: 'Who is your owner?' },
  { id: 2, name: 'Master Orchestrator', question: 'Who is your owner?' },
  { id: 3, name: 'Chat Assistant', question: 'Who is your owner?' }
];

let testIndex = 0;

function runTest() {
  if (testIndex >= tests.length) {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  }

  const test = tests[testIndex];
  console.log(`\n📋 Test ${testIndex + 1}/${tests.length}: ${test.name} - "${test.question}"`);

  const ws = new WebSocket('ws://localhost:8000');
  let response = '';

  const timeout = setTimeout(() => {
    console.log('⏱️ Response (timeout):', response || '[empty]');
    ws.close();
    testIndex++;
    setTimeout(runTest, 300);
  }, 30000);

  ws.on('open', function open() {
    ws.send(JSON.stringify({
      type: 'agent_stream',
      data: {
        agentId: test.id,
        action: 'generate',
        prompt: test.question,
        model: 'llama3.1:latest'
      }
    }));
  });

  ws.on('message', function incoming(data) {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'agent_stream_chunk') {
      response += message.data.chunk;
    } else if (message.type === 'agent_stream_complete') {
      clearTimeout(timeout);
      console.log('📝 Response:', response.trim());
      ws.close();
      testIndex++;
      setTimeout(runTest, 300);
    }
  });

  ws.on('error', function error(err) {
    clearTimeout(timeout);
    console.log('❌ Error:', err.message);
    ws.close();
    testIndex++;
    setTimeout(runTest, 300);
  });
}

runTest();
