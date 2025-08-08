import z from "zod";
import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { llm } from "./llm.js";

import { searchDreams, storeDream } from "../lib/vectordb.js";


const agent = async (state) => {

  const prompt = [
      new SystemMessage(`Extraia JSON do pedido do usuário. Campos: text, date (opcional AAAA-MM-DD), tags (opcional array). Responda APENAS JSON.`),
      new HumanMessage(state.text || ''),
  ];

  const parsed = await llm.withStructuredOutput(z.object({
    text: z.string().describe('Texto do sonho'),
    date: z.string().optional().describe('AAAA-MM-DD'),
    tags: z.array(z.string()).optional(),
  })).invoke(prompt);

  const rec = await storeDream(parsed);
  
  return { next:"retriever", messages: [...state.messages, new AIMessage("Sonho armazenado")] };

}

export default agent;