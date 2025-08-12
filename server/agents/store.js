import z from "zod";
import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { llm } from "./configs/llm.js";

import { searchDreams, storeDream } from "../lib/vectordb.js";
import dayjs from "dayjs";


const agent = async (state) => {

  return { next:"retriever" };

  /*
  const prompt = [
      new SystemMessage(`Extraia JSON do pedido do usuário. Campos: title, text, date (opcional AAAA-MM-DD), tags (opcional array). 
Se o titulo ou as tags não estiverem explícitos no texto, gere a partir do conteúdo enviado. 
Responda APENAS JSON.`),
      new HumanMessage(state.text || ''),
  ];

  const parsed = await llm.withStructuredOutput(z.object({
    title: z.string().describe('Titulo para o sonho'),
    text: z.string().describe('Texto do sonho'),
    date: z.string().default(dayjs().format("YYYY-MM-DD")).describe('Data do sonho no formato AAAA-MM-DD'),
    tags: z.array(z.string()).default([]).describe("Palavras chave"),
  })).invoke(prompt);

  // apenas parsear - o usuario decidirá se quer armazenar ou não
  const added = await storeDream({...parsed, uid:state.session.userId});
  
  return { next:"retriever", added, messages: [...state.messages] };
  */

}

export default agent;