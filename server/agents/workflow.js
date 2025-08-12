import { StateGraph, START, END, MessagesAnnotation, MemorySaver, Annotation } from '@langchain/langgraph';

import routerNode from './router.js';
import searchNode from './search.js';
import storeNode from './store.js';
import retrieverNode from './retriever.js';
import analysisNode from './analysis.js';
import hitlNode from "./hitl.js"

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  text: Annotation(),
  mode: Annotation(),
  persona: Annotation(),
  added: Annotation(),
  docs: Annotation(),
  
  context: Annotation(),

  next: Annotation(),
  session: Annotation(),

});

const workflow = new StateGraph(GraphAnnotation)
  .addNode("router", routerNode)
  .addNode("search", searchNode)
  .addNode("store", storeNode)
  .addNode("retriever", retrieverNode)
  .addNode("analysis", analysisNode)
  .addNode("hitl", hitlNode)

  .addEdge(START, "router")
  
  .addConditionalEdges('router', (state)=>state.next, {
      search: 'search',
      store: 'store',
      end: END
    }
  )

  .addEdge("store", "retriever")
  .addEdge("retriever", "analysis")
  .addEdge("analysis", "hitl")
  
  .addConditionalEdges('hitl', (state)=>state.next, {
      analysis: 'analysis',
      end: END
    }

  )


const memory = new MemorySaver();

export const app = workflow.compile({ checkpointer: memory });
