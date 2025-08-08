import { StateGraph, START, END, MessagesAnnotation, MemorySaver, Annotation } from '@langchain/langgraph';

import routerNode from './router.js';
//import intentNode from './intent.js';
//import confirmationNode from './confirmation.js';
import searchNode from './search.js';
import storeNode from './store.js';
import retrieverNode from './retriever.js';
import analysisNode from './analysis.js';


const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  text: Annotation(),
  mode: Annotation(),
  persona: Annotation(),

  next: Annotation(),
  session: Annotation(),

  //approved: Annotation(),
  //confirmations: Annotation(),
  //options: Annotation()

});

const workflow = new StateGraph(GraphAnnotation)
  .addNode("router", routerNode)
  .addNode("search", searchNode)
  .addNode("store", storeNode)
  .addNode("retriever", retrieverNode)
  .addNode("analysis", analysisNode)
  //.addNode("intent", intentNode)
  //.addNode("confirmation", confirmationNode)
  .addEdge(START, "router")
  
  .addConditionalEdges('router', (state)=>state.next, {
      //intent: 'intent',
      search: 'search',
      store: 'store',
      end: END
    }
  )
  .addEdge("store", "retriever")
  .addEdge("retriever", "analysis")
  /*
  .addConditionalEdges('intent', (state)=>state.next, {
      confirmation: 'confirmation',
      end: END
    }
  )
  .addConditionalEdges('confirmation', (state)=>state.next, {
      intent: 'intent',
      end: END
    }
  )
    */


const memory = new MemorySaver();

export const app = workflow.compile({ checkpointer: memory });

//import { retrieverNode } from './retriever.js';
//import { personaRouterNode } from './persona.js';
//import { storeNode } from './store.js';
//import { searchNode } from './search.js';

// ===== Estado do grafo (modo JSON) =====
//const GraphAnnotation = Annotation.Root({
//  ...MessagesAnnotation.spec,
//  intent: Annotation(),
//  action: Annotation(),
//  mode: Annotation(), // 'auto' | 'specific' | 'ensemble'
//  persona: Annotation(), // 'jung' | 'narrative' | 'cognitive'
//  contextDocs: Annotation(), // resultados de busca
//});
//
//// ===== Graph (modo JSON, /chat) =====
//const graph = new StateGraph(GraphAnnotation)
//  .addNode('router', routerNode)
//  .addNode('retrieve', retrieverNode)
//  .addNode('personaRouter', personaRouterNode)
//  .addNode('store', storeNode)
//  .addNode('search', searchNode)
//
//  .addEdge(START, 'router')
//  .addConditionalEdges('router', (s) => s.action || 'analyze', {
//    store: 'store',
//    search: 'search',
//    analyze: 'retrieve',
//  })
//  .addEdge('store', END)
//  .addEdge('search', END)
//  .addEdge('retrieve', 'personaRouter')
//  .addEdge('personaRouter', END);
//
  /*
  ROUTER ===> SEARCH ===> RETRIEVE ===> END
  ROUTER ===> STORE ===> END
  ROUTER ===> ANALYZE ===> SEARCH ===> RETRIEVE | STORE ===> PERSONA-ROUTER ===> END
  */
//
//const memory = new MemorySaver();
//
//export const app = graph.compile({ checkpointer: memory });
