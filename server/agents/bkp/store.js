import z from "zod";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { storeDream } from "../lib/vectordb.js";

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });

// ===== Nós store/search (modo não-stream) — reutilizam grafo JSON =====
const storeDreamSchema = z.object({
  text: z.string().describe('Texto do sonho'),
  date: z.string().optional().describe('AAAA-MM-DD'),
  tags: z.array(z.string()).optional(),
});

export async function storeNode(state) {

  const prompt = [
    new SystemMessage(`Extraia JSON do pedido do usuário. Campos: text, date (opcional AAAA-MM-DD), tags (opcional array). Responda APENAS JSON.`),
    new HumanMessage(state._userText || ''),
  ];

  const parsed = await llm.withStructuredOutput(storeDreamSchema).invoke(prompt);
  const rec = await storeDream(parsed);
  
  return { messages: [new AIMessage(`✅ Sonho salvo (id ${rec.id}, ${rec.date}). Tags: ${(rec.tags || []).join(', ') || '—'}`)] };

}
