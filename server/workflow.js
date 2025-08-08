import { StateGraph, START, END, MessagesAnnotation, MemorySaver, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

import { routerNode } from './agents/router.js';
import { retrieverNode } from './agents/retriever.js';
import { personaRouterNode } from './agents/persona.js';
import { storeNode } from './agents/store.js';
import { searchNode } from './agents/search.js';

// ===== Estado do grafo (modo JSON) =====
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation(),
  action: Annotation(),
  mode: Annotation(), // 'auto' | 'specific' | 'ensemble'
  persona: Annotation(), // 'jung' | 'narrative' | 'cognitive'
  contextDocs: Annotation(), // resultados de busca
});

// ===== Graph (modo JSON, /chat) =====
const graph = new StateGraph(GraphAnnotation)
  .addNode('router', routerNode)
  .addNode('retrieve', retrieverNode)
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
