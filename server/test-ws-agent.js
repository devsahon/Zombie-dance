const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8000');

// Connection opened
ws.on('open', function open() {
  console.log('Connected to WebSocket server');
  
  // Send agent stream request for agent ID 2
  ws.send(JSON.stringify({
    type: 'agent_stream',
    data: {
      agentId: 2,
      action: 'generate',
      prompt: 'Imagine you are an engineer with 15 years of experience. Your client has come to you to create an AI system that uses local models to edit code and handle daily special conversations. His computer is limited to 8 GB or 16 GB of RAM. Explain in detail what advice you would give him',
      model: 'qwen2.5-coder:1.5b'
    }
  }));
});

// Listen for messages
ws.on('message', function incoming(data) {
  const message = JSON.parse(data.toString());
  
  switch (message.type) {
    case 'connected':
      console.log('Server:', message.data.message);
      break;
      
    case 'agent_stream_start':
      console.log('\n🚀 Starting:', message.data.message);
      break;
      
    case 'agent_stream_chunk':
      // Print each chunk to terminal
      process.stdout.write(message.data.chunk);
      break;
      
    case 'agent_stream_complete':
      console.log('\n\n✅ Complete!', {
        agentId: message.data.agentId,
        action: message.data.action,
        model: message.data.model,
        agentName: message.data.agentName
      });
      ws.close();
      break;
      
    case 'agent_stream_error':
      console.error('\n❌ Error:', message.data.error);
      ws.close();
      break;
      
    default:
      console.log('Received:', message.type);
  }
});

// Handle errors
ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

// Handle close
ws.on('close', function close() {
  console.log('\nDisconnected from server');
  process.exit(0);
});
