import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import dayjs from 'dayjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';
import {
  StateGraph,
  START,
  END,
  MessagesAnnotation,
  MemorySaver,
  Annotation,
} from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Multi-Agente de análise de sonhos com PERSONAS + Streaming (SSE)
 * Personae: Jungian, Narrative, Cognitive
 * Modos: auto (roteador escolhe), specific (força uma), ensemble (3 personae + síntese)
 *
 * Endpoints:
 * POST /chat      -> resposta única (JSON)
 * POST /chat/stream -> streaming SSE (text/event-stream)
 */

// ===== infra =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DREAMS_JSON = path.join(DATA_DIR, 'dreams.json');
const INDEX_DIR = path.join(DATA_DIR, 'dreams.index');
await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
try { await fs.access(DREAMS_JSON); } catch { await fs.writeFile(DREAMS_JSON, '[]'); }

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';

const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });
const embeddings = new OpenAIEmbeddings({ model: EMBED_MODEL });

let vectorStore;
async function loadVectorStore() {
  try {
    vectorStore = await HNSWLib.load(INDEX_DIR, embeddings);
  } catch (e) {
    console.log('Index not found. Trying to build from dreams.json...');
    const dreams = await readDreams();
    if (dreams.length > 0) {
      console.log(`Found ${dreams.length} dreams. Building index...`);
      const dreamDocs = dreams.map(d => new Document({
        pageContent: d.text,
        metadata: { id: d.id, date: d.date, tags: d.tags }
      }));
      vectorStore = await HNSWLib.fromDocuments(dreamDocs, embeddings);
      await vectorStore.save(INDEX_DIR);
      console.log('Index built and saved.');
    } else {
      console.log('No dreams found in dreams.json. Vector store will be created on first addition.');
    }
  }
}
await loadVectorStore();

async function readDreams() { return JSON.parse(await fs.readFile(DREAMS_JSON, 'utf8')); }
async function writeDreams(arr) { await fs.writeFile(DREAMS_JSON, JSON.stringify(arr, null, 2)); }

// ===== Tools: salvar e buscar sonhos =====
const storeDreamSchema = z.object({
  text: z.string().describe('Texto do sonho'),
  date: z.string().optional().describe('AAAA-MM-DD'),
  tags: z.array(z.string()).optional(),
});
async function storeDream({ text, date, tags }) {
  const dreams = await readDreams();
  const id = uuidv4();
  const record = { id, text, date: date || dayjs().format('YYYY-MM-DD'), tags: tags || [], createdAt: new Date().toISOString() };
  dreams.push(record);
  await writeDreams(dreams);

  const doc = new Document({ pageContent: text, metadata: { id, date: record.date, tags: record.tags } });

  if (vectorStore) {
    await vectorStore.addDocuments([doc]);
  } else {
    vectorStore = await HNSWLib.fromDocuments([doc], embeddings);
  }

  await vectorStore.save(INDEX_DIR);
  return record;
}

async function searchDreams({ query, k = 3 }) {
  if (!vectorStore) {
    return [];
  }
  const results = await vectorStore.similaritySearch(query, k);
  return results.map(r => ({ text: r.pageContent, ...r.metadata }));
}

// ===== Estado do grafo (modo JSON) =====
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation(),
  action: Annotation(),
  mode: Annotation(),        // 'auto' | 'specific' | 'ensemble'
  persona: Annotation(),     // 'jung' | 'narrative' | 'cognitive'
  contextDocs: Annotation(), // resultados de busca
});

function lastUser(state) {
  const last = [...(state.messages || [])].reverse().find(m => m._getType?.() === 'human');
  return last?.content || '';
}

// ===== Roteador de intenção (store/search/analyze) =====
async function routerNode(state) {
  const txt = lastUser(state).toLowerCase();
  let action = 'analyze';
  if (/(salvar|guardar|registrar|armazenar|gravar|adicionar)/.test(txt)) action = 'store';
  if (/(busca|buscar|procurar|achar|similar|encontrar|listar)/.test(txt)) action = 'search';
  return { action };
}

// ===== Pré-busca de contexto (para análise) =====
async function retrieveNode(state) {
  const q = lastUser(state);
  const docs = await searchDreams({ query: q, k: 3 });
  return { contextDocs: docs };
}

// ===== Roteador de PERSONA =====
const PersonaChoiceSchema = z.object({ persona: z.enum(['jung','narrative','cognitive']) });
async function personaRouterNode(state) {
  const mode = state.mode || 'auto';
  if (mode === 'specific' && state.persona) return { persona: state.persona };
  if (mode === 'ensemble') return { persona: 'ensemble' };

  // auto -> deixar o LLM decidir
  const system = new SystemMessage(`Você é um roteador que escolhe a melhor PERSONA para analisar um sonho.
  Regras:
  - 'jung' quando o foco for símbolos, arquétipos, sombra, anima/animus, individuação, mitologia.
  - 'narrative' quando o foco for enredo, personagem, conflito, transformação, ponto de vista.
  - 'cognitive' quando o foco for emoção, ansiedade, memória, aprendizagem, problemas cotidianos, regulação.
  Responda APENAS com JSON: {"persona":"jung|narrative|cognitive"}`);
  const input = new HumanMessage(`SONHO: ${state._userText || ''}`);
  const choice = await llm.withStructuredOutput(PersonaChoiceSchema).invoke([system, input]);
  return { persona: choice.persona };
}

// ===== Prompts por PERSONA =====
function buildContextBlock(ctx = []) {
  if (!ctx.length) return '(sem similares)';
  return ctx.map((c, i) => `— Similar #${i+1} (${c?.date || 's/ data'}; id=${c?.id||'n/a'}):
${c?.text}`).join(`

`);
}

function jungPrompt(userText, ctxBlock) {
  return [
    new SystemMessage(`Persona: ANALISTA JUNGIANO. Estilo: simbólico, arquétipos, mitopoiese, sombra, anima/animus.
- Forneça múltiplas hipóteses, sem determinismo.
- Não faça diagnósticos médicos.
Estrutura:
1) Símbolos centrais e arquétipos possíveis
2) Relação com processo de individuação e tensões psíquicas
3) Ecos mitológicos e culturais (se houver)
4) Relações com sonhos similares
5) Perguntas para aprofundar`),
    new HumanMessage(`SONHO: ${userText}`),
    new HumanMessage(`SIMILARES:
${ctxBlock}`),
  ];
}

function narrativePrompt(userText, ctxBlock) {
  return [
    new SystemMessage(`Persona: ANALISTA NARRATIVO. Foco: enredo, personagens, conflito, viradas, metáforas vividas.
- Destacar estrutura (setup → conflito → clímax → resolução/abertura).
- Sugerir reescritas simbólicas.
Estrutura:
1) Mapa de enredo (setup/conflito/clímax/desfecho)
2) Personagens e forças em jogo
3) Metáforas e temas recorrentes
4) Relações com sonhos similares
5) Experimentos narrativos (se o sonhador revisitasse a cena…)`),
    new HumanMessage(`SONHO: ${userText}`),
    new HumanMessage(`SIMILARES:
${ctxBlock}`),
  ];
}

function cognitivePrompt(userText, ctxBlock) {
  return [
    new SystemMessage(`Persona: ANALISTA COGNITIVO-AFETIVO. Foco: emoção, ansiedade, memória, aprendizagem, regulação.
- Linguagem prática, hipóteses parcimoniosas, vieses cognitivos, pistas de estresse.
- Oferecer exercícios leves de autorreflexão (não clínicos).
Estrutura:
1) Emoções predominantes e gatilhos prováveis
2) Hipóteses de função do sonho (consolidação/ensaio/gestão de ameaça)
3) Relações com rotina/estressores atuais
4) Relações com sonhos similares
5) Pequenos experimentos/diário de bordo para próximos dias`),
    new HumanMessage(`SONHO: ${userText}`),
    new HumanMessage(`SIMILARES:
${ctxBlock}`),
  ];
}

// ===== Nós store/search (modo não-stream) — reutilizam grafo JSON =====
async function storeNode(state) {
  const prompt = [
    new SystemMessage(`Extraia JSON do pedido do usuário. Campos: text, date (opcional AAAA-MM-DD), tags (opcional array). Responda APENAS JSON.`),
    new HumanMessage(state._userText || ''),
  ];
  const parsed = await llm.withStructuredOutput(storeDreamSchema).invoke(prompt);
  const rec = await storeDream(parsed);
  return { messages: [ new AIMessage(`✅ Sonho salvo (id ${rec.id}, ${rec.date}). Tags: ${(rec.tags||[]).join(', ')||'—'}`) ] };
}

async function searchNode(state) {
  const qPrompt = [ new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`), new HumanMessage(state._userText || '') ];
  const q = (await llm.invoke(qPrompt)).content;
  const hits = await searchDreams({ query: q, k: 3 });
  const out = hits.length
    ? hits.map((h,i)=> `#${i+1} (${h.date||'s/ data'}; id=${h.id||'n/a'})
${h.text.slice(0,400)}${h.text.length>400?'…':''}`).join(`

`)
    : 'Nenhum similar encontrado.';
  return { messages: [ new AIMessage(`🔎 Similares

${out}`) ] };
}

// ===== Graph (modo JSON, /chat) =====
const graph = new StateGraph(GraphAnnotation)
  .addNode('router', routerNode)
  .addNode('retrieve', retrieveNode)
  .addNode('personaRouter', personaRouterNode)
  .addNode('store', storeNode)
  .addNode('search', searchNode)
  // Dummies: nós finais da análise serão tratados no endpoint stream; no /chat simples, usamos persona=cada e llm.invoke
  .addEdge(START, 'router')
  .addConditionalEdges('router', (s)=> s.action || 'analyze', {
    store: 'store',
    search: 'search',
    analyze: 'retrieve',
  })
  .addEdge('store', END)
  .addEdge('search', END)
  .addEdge('retrieve', 'personaRouter')
  .addEdge('personaRouter', END);

const memory = new MemorySaver();
const app = graph.compile({ checkpointer: memory });

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
    const userText = [...mapped].reverse().find(m => m._getType?.() === 'human')?.content || '';

    const result = await app.invoke(
      { messages: mapped, mode: mode || 'auto', persona, _userText: userText },
      { configurable: { thread_id: threadId || uuidv4() } }
    );

    // Se ação não for analyze, resposta já veio
    if (result.action === 'store' || result.action === 'search') {
      const last = result.messages[result.messages.length - 1];
      return res.json({
        threadId: (result.configurable && result.configurable.thread_id) || threadId,
        message: { role: 'assistant', content: last.content },
        persona: result.persona || persona || 'auto',
        mode: result.mode || mode || 'auto',
      });
    }

    // analyze: gerar resposta por persona única
    const ctxBlock = buildContextBlock(result.contextDocs || []);
    const chosen = (result.persona === 'ensemble') ? 'jung' : (result.persona || 'jung');
    const promptBy = { jung: jungPrompt, narrative: narrativePrompt, cognitive: cognitivePrompt }[chosen];
    const out = await llm.invoke(promptBy(userText, ctxBlock));
    res.json({
      threadId: (result.configurable && result.configurable.thread_id) || threadId,
      message: { role: 'assistant', content: out.content },
      persona: chosen,
      mode: result.persona === 'ensemble' ? 'ensemble' : (result.mode || mode || 'auto'),
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
      res.write(`data: ${JSON.stringify(obj)}

`);
    };

    const mapped = messages.map((m) => {
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });
    const userText = [...mapped].reverse().find(m => m._getType?.() === 'human')?.content || '';

    const result = await app.invoke(
      { messages: mapped, mode: mode || 'auto', persona, _userText: userText },
      { configurable: { thread_id: threadId || uuidv4() } }
    );

    const finalThread = (result.configurable && result.configurable.thread_id) || threadId;
    send({ event: 'meta', threadId: finalThread, mode: result.mode || mode || 'auto', persona: result.persona || persona || 'auto' });

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
        const text = typeof chunk?.content === 'string' ? chunk.content : Array.isArray(chunk?.content) ? chunk.content.join('') : '';
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
        new SystemMessage(`Você é um sintetizador. Combine análises de três especialistas (Jung, Narrativo, Cognitivo).
- Destacar convergências e divergências.
- Fechar com 3 a 5 perguntas úteis ao sonhador.
Responda de forma concisa e estruturada.`),
        new HumanMessage([p1, p2, p3].join(`

— — —

`)),
      ];
      await streamPrompt(synthPrompt, 'synthesis');
      send({ event: 'done' });
      return res.end();
    } else {
      const chosen = (result.persona || persona || 'jung');
      const promptBy = { jung: jungPrompt, narrative: narrativePrompt, cognitive: cognitivePrompt }[chosen];
      await streamPrompt(promptBy(userText, ctxBlock), chosen);
      send({ event: 'done' });
      return res.end();
    }
  } catch (e) {
    // Em caso de erro, ainda tenta enviar pelo canal SSE
    try { res.write(`data: ${JSON.stringify({ event: 'error', error: String(e?.message || e) })}

`); } catch {}
    try { res.end(); } catch {}
  }
});

const PORT = process.env.PORT || 3031;
server.listen(PORT, () => {
  console.log(`🟢 Personas server (SSE) on http://localhost:${PORT}`);
});
