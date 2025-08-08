import { v4 as uuidv4 } from 'uuid';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { authenticateFirebaseToken } from "../middlewares/authenticate.js";
import { app } from '../agents/workflow.js';
import { lastAIMessage } from '../agents/llm.js';

export default function registerChatEndpoint(server) {
  server.post('/chat', authenticateFirebaseToken, async (req, res) => {
    try {
      const user = req.user;
      const { text, mode, persona } = req.body || {};

      const threadId = user.uid;
 
      const config = { configurable: { thread_id: threadId || uuidv4() } }

      /*

      const state = await this.agent.getState(this.config)
      let response = {}

      if (state.tasks?.[0]?.interrupts?.length>0) {
        response = await this.agent.invoke(new Command({ resume:message, session:{userId: this.userId} }), this.config)
      }
      else {
        this.messages.push(new HumanMessage({content:message}))
        response = await this.agent.invoke({ messages: this.messages, session:{userId: this.userId} }, this.config);
      }



      if (isInterrupted(response)) {  
        const interrupt = response[INTERRUPT][0].value;
        return { messages: [interrupt.question] }
      }
      else {
        const last = response.messages[response.messages.length - 1]
        return { ...response, messages: [last.content] }
      }

      */
      const result = await app.invoke({ 
          text: text,
          mode: mode || 'auto', 
          persona,
          session:{userId: user.uid}
        },
        config
      );

      
      // Apenas devolve o que o app gerou
      const lastAssistant = lastAIMessage(result)

      return res.json({
        message: { role: 'assistant', content: lastAssistant?.content ?? '' },
        persona: result.persona || persona || 'auto',
        mode: result.mode || mode || 'auto',
      });
    } 
    catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
