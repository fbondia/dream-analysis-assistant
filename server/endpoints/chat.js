import { v4 as uuidv4 } from 'uuid';
import { authenticateFirebaseToken } from "../middlewares/authenticate.js";
import { app } from '../agents/workflow.js';
import { lastAIMessage } from '../agents/configs/llm.js';
import { Command, INTERRUPT, isInterrupted } from '@langchain/langgraph';

export default function registerChatEndpoint(server) {
  server.post('/chat', authenticateFirebaseToken, async (req, res) => {
    try {
      const user = req.user;
      const { text } = req.body || {};

      const threadId = user.uid;
 
      const config = { configurable: { thread_id: threadId || uuidv4() } }

      const state = await app.getState(config)

      let result = {}

      if (state.tasks?.[0]?.interrupts?.length>0) {
        result = await app.invoke(new Command({ resume:text }), config)
      }
      else {
        result = await app.invoke({ 
          text: text,
          session:{userId: user.uid}
        },
        config
      );
      }

      let reply = null

      if (isInterrupted(result)) {  
        const interrupt = result[INTERRUPT][0].value;
        reply = interrupt.content
      }
      else {
        reply = lastAIMessage(result)
      }

      return res.json({
        message: { role: 'assistant', content:reply || '' },
        context: result.context
      });

    } 
    catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
