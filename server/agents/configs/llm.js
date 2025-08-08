import { ChatOpenAI } from "@langchain/openai";

import { buscar_sonhos } from "../tools/search.js";
import { salvar_sonho } from "../tools/store.js";

const MODEL = process.env.MODEL || 'gpt-5-nano';

export const llm = new ChatOpenAI({ model:MODEL, temperature:1, maxTokens:300 });
export const availableTools = [buscar_sonhos, salvar_sonho]

export function lastMessage(state, type) {
  const last = [...(state.messages || [])].reverse().find((m) => m._getType?.() === type);
  return last?.content || '';
}

export function lastUserMessage(state) {
  return lastMessage(state, 'human');
}

export function lastAIMessage(state) {
  return lastMessage(state, 'ai');  
}