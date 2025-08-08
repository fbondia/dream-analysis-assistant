import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import registerChatEndpoint from './endpoints/chat.js';
import registerChatStreamEndpoint from './endpoints/chat_stream.js';

// ===== HTTP =====

const server = express();

// CORS Configuration
if (process.env.CORS_DISABLED !== 'true') {
  const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  server.use(cors(corsOptions));
  console.log('CORS enabled.');
} 
else {
  console.log('CORS disabled by environment variable.');
}

server.use(express.json());

registerChatEndpoint(server);
registerChatStreamEndpoint(server);

const PORT = process.env.PORT || 3031;
server.listen(PORT, () => {
  console.log(`🟢 Dream Analysis Server on http://localhost:${PORT}`);
});
