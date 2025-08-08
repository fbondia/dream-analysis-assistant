import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  app,
  llm,
  buildContextBlock,
  jungPrompt,
  narrativePrompt,
  cognitivePrompt,
} from './workflow.js';

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
} else {
  console.log('CORS disabled by environment variable.');
}

server.use(express.json());

// Resposta única (JSON), útil para fallback sem streaming
server.post('/chat', async (req, res) => {
  try {
    const { messages = [], threadId, mode, persona } = req.body || {};

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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ===== Streaming SSE =====
server.post('/chat/stream', async (req, res) => {
  try {
    const { messages = [], threadId, mode, persona } = req.body || {};

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (obj) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

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

    const finalThread = result.configurable?.thread_id || threadId;

    send({
      event: 'meta',
      threadId: finalThread,
      mode: result.mode || mode || 'auto',
      persona: result.persona || persona || 'auto',
    });

    // store/search -> não faz sentido tokenizar; envia uma mensagem única
    if (result.action === 'store' || result.action === 'search') {
      const last = result.messages[result.messages.length - 1];
      send({ event: 'message', content: last.content });
      send({ event: 'done' });
      return res.end();
    }

    // analyze -> stream persona(s)
    const ctxBlock = buildContextBlock(result.contextDocs || []);

    async function streamPrompt(prompt, label) {
      send({ event: 'persona', persona: label });
      let acc = '';

      for await (const chunk of llm.stream(prompt)) {
        const text =
          typeof chunk?.content === 'string'
            ? chunk.content
            : Array.isArray(chunk?.content)
            ? chunk.content.join('')
            : '';

        if (text) {
          acc += text;
          send({ event: 'token', text });
        }
      }

      send({ event: 'section_end', persona: label });
      return acc;
    }

    if ((result.persona || persona) === 'ensemble') {
      // 1) stream das três
      const p1 = await streamPrompt(jungPrompt(userText, ctxBlock), 'jung');
      const p2 = await streamPrompt(narrativePrompt(userText, ctxBlock), 'narrative');
      const p3 = await streamPrompt(cognitivePrompt(userText, ctxBlock), 'cognitive');

      // 2) síntese
      send({ event: 'persona', persona: 'synthesis' });

      const synthPrompt = [
        new SystemMessage(`Você é um sintetizador.
Combine análises de três especialistas (Jung, Narrativo, Cognitivo).
- Destacar convergências e divergências.
- Fechar com 3 a 5 perguntas úteis ao sonhador.
Responda de forma concisa e estruturada.`),
        new HumanMessage([p1, p2, p3].join(`— — —`)),
      ];

      await streamPrompt(synthPrompt, 'synthesis');
      send({ event: 'done' });
      return res.end();
    } else {
      const chosen = result.persona || persona || 'jung';
      const promptBy = { jung: jungPrompt, narrative: narrativePrompt, cognitive: cognitivePrompt }[chosen];
      await streamPrompt(promptBy(userText, ctxBlock), chosen);
      send({ event: 'done' });
      return res.end();
    }
  } catch (e) {
    // Em caso de erro, ainda tenta enviar pelo canal SSE
    try {
      res.write(
        `data: ${JSON.stringify({ event: 'error', error: String(e?.message || e) })}\n\n`
      );
    } catch {}
    try {
      res.end();
    } catch {}
  }
});

const PORT = process.env.PORT || 3031;
server.listen(PORT, () => {
  console.log(`🟢 Personas server (SSE) on http://localhost:${PORT}`);
});
