const { io } = require('socket.io-client');

const URL = process.env.API_URL || 'http://localhost:5000';
const CLIENTS_COUNT = 100;
const EXAM_ID = 1; // Assuming exam 1 exists for monitoring

let connectedClients = 0;
let failedConnections = 0;
const clients = [];

console.log(`Starting Socket.io load test with ${CLIENTS_COUNT} clients...`);

for (let i = 0; i < CLIENTS_COUNT; i++) {
  const socket = io(URL, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    connectedClients++;
    socket.emit('join_exam_monitor', EXAM_ID);
    
    if (connectedClients === CLIENTS_COUNT) {
      console.log(`✅ Successfully connected and joined room for ${CLIENTS_COUNT} clients.`);
      console.log('Waiting for incoming events for 10 seconds...');
      
      // Keep them alive for 10 seconds then disconnect
      setTimeout(() => {
        console.log('Disconnecting clients...');
        clients.forEach(c => c.disconnect());
        console.log('Test completed successfully.');
        process.exit(0);
      }, 10000);
    }
  });

  socket.on('connect_error', (err) => {
    failedConnections++;
    console.error(`Client ${i} connection error:`, err.message);
  });

  socket.on('new_proctoring_flag', (flag) => {
    console.log(`Client ${i} received flag:`, flag.flag_type);
  });

  clients.push(socket);
}

// Timeout failsafe
setTimeout(() => {
  if (connectedClients < CLIENTS_COUNT) {
    console.error(`❌ Load test failed. Only connected ${connectedClients}/${CLIENTS_COUNT} clients.`);
    console.error(`Failed connections: ${failedConnections}`);
    process.exit(1);
  }
}, 15000);
