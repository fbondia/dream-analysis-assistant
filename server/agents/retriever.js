import z from "zod";
import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { llm } from "./llm.js";

import { searchDreams, storeDream } from "../lib/vectordb.js";

const agent = async (state) => {

  const docs = await searchDreams({ query:state.text, k: 3 });
  
  return { next:"analysis", context: docs };

}

export default agent;