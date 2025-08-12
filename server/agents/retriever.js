import z from "zod";
import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { llm } from "./configs/llm.js";

import { searchDreams, storeDream } from "../lib/vectordb.js";

const agent = async (state) => {

  const filter = (doc) => doc.metadata.uid===state.session.userId && doc.metadata.id!==state.added.id;
  const docs = []//await searchDreams({ query:state.text, filter, k: 3 });
  
  return { next:"analysis", docs };

}

export default agent;