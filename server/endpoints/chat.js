import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { authenticateFirebaseToken } from "../middlewares/authenticate.js"

import { buildContextBlock } from "../prompts/context-builder.js"
import { jungPrompt } from "../prompts/junguian.js"
import { narrativePrompt } from "../prompts/narrative.js"
import { cognitivePrompt } from "../prompts/cognitive.js"

import { app } from '../workflow.js';

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });

export default function registerChatEndpoint(server) {

  server.post('/chat', authenticateFirebaseToken, async (req, res) => {
    try {

      const user = req.user;
    
      const { messages = [], /*threadId,*/ mode, persona } = req.body || {};

      // por enquanto um usuário não pode ter conversas separadas
      const threadId = user.uid

      const mapped = messages.map((m) => {
        if (m.role === 'system') return new SystemMessage(m.content);
        if (m.role === 'assistant') return new AIMessage(m.content);
        return new HumanMessage(m.content);
      });

      const userText =
        [...mapped].reverse().find((m) => m._getType?.() === 'human')?.content || '';

      const result = await app.invoke(
        { messages: mapped, mode: mode || 'auto', persona, _userText: userText },
        { configurable: { thread_id: threadId || uuidv4() } }
      );

      // Se ação não for analyze, resposta já veio
      if (result.action === 'store' || result.action === 'search') {
        const last = result.messages[result.messages.length - 1];
        return res.json({
          threadId: result.configurable?.thread_id || threadId,
          message: { role: 'assistant', content: last.content },
          persona: result.persona || persona || 'auto',
          mode: result.mode || mode || 'auto',
        });
      }

      // analyze: gerar resposta por persona única
      const ctxBlock = buildContextBlock(result.contextDocs || []);
      const chosen = result.persona === 'ensemble' ? 'jung' : result.persona || 'jung';
      const promptBy = { jung: jungPrompt, narrative: narrativePrompt, cognitive: cognitivePrompt }[chosen];

      const out = await llm.invoke(promptBy(userText, ctxBlock));

      res.json({
        threadId: result.configurable?.thread_id || threadId,
        message: { role: 'assistant', content: out.content },
        persona: chosen,
        mode: result.persona === 'ensemble' ? 'ensemble' : result.mode || mode || 'auto',
      });
    } 
    catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  });
}
