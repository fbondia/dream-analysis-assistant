import { z } from 'zod';
import { StateGraph, START, END, MessagesAnnotation, MemorySaver, Annotation } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { storeDream, searchDreams } from './database.js';

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });

// ===== Estado do grafo (modo JSON) =====
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation(),
  action: Annotation(),
  mode: Annotation(), // 'auto' | 'specific' | 'ensemble'
  persona: Annotation(), // 'jung' | 'narrative' | 'cognitive'
  contextDocs: Annotation(), // resultados de busca
});

function lastUser(state) {
  const last = [...(state.messages || [])].reverse().find((m) => m._getType?.() === 'human');
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
const PersonaChoiceSchema = z.object({ persona: z.enum(['jung', 'narrative', 'cognitive']) });
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
export function buildContextBlock(ctx = []) {
  if (!ctx.length) return '(sem similares)';
  return ctx
    .map((c, i) => `— Similar #${i + 1} (${c?.date || 's/ data'}; id=${c?.id || 'n/a'}):
${c?.text}`)
    .join(`

`);
}

export function jungPrompt(userText, ctxBlock) {
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

export function narrativePrompt(userText, ctxBlock) {
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

export function cognitivePrompt(userText, ctxBlock) {
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
const storeDreamSchema = z.object({
  text: z.string().describe('Texto do sonho'),
  date: z.string().optional().describe('AAAA-MM-DD'),
  tags: z.array(z.string()).optional(),
});

async function storeNode(state) {
  const prompt = [
    new SystemMessage(
      `Extraia JSON do pedido do usuário. Campos: text, date (opcional AAAA-MM-DD), tags (opcional array). Responda APENAS JSON.`
    ),
    new HumanMessage(state._userText || ''),
  ];
  const parsed = await llm.withStructuredOutput(storeDreamSchema).invoke(prompt);
  const rec = await storeDream(parsed);
  return { messages: [new AIMessage(`✅ Sonho salvo (id ${rec.id}, ${rec.date}). Tags: ${(rec.tags || []).join(', ') || '—'}`)] };
}

async function searchNode(state) {
  const qPrompt = [
    new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`),
    new HumanMessage(state._userText || ''),
  ];
  const q = (await llm.invoke(qPrompt)).content;
  const hits = await searchDreams({ query: q, k: 3 });
  const out = hits.length
    ? hits.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})
${h.text.slice(0, 400)}${h.text.length > 400 ? '…' : ''}`).join(`

`)
    : 'Nenhum similar encontrado.';
  return { messages: [new AIMessage(`🔎 Similares

${out}`)] };
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
  .addConditionalEdges('router', (s) => s.action || 'analyze', {
    store: 'store',
    search: 'search',
    analyze: 'retrieve',
  })
  .addEdge('store', END)
  .addEdge('search', END)
  .addEdge('retrieve', 'personaRouter')
  .addEdge('personaRouter', END);

const memory = new MemorySaver();
export const app = graph.compile({ checkpointer: memory });
export { llm };
