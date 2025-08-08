import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { searchDreams } from "../lib/vectordb.js";
import { ChatOpenAI } from "@langchain/openai";

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });

export async function searchNode(state) {

  const qPrompt = [
    new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`),
    new HumanMessage(state._userText || ''),
  ];

  const q = (await llm.invoke(qPrompt)).content;
  const hits = await searchDreams({ query: q, k: 3 });

  let out = ""

  if (hits?.length===0) {
    out = 'Nenhum similar encontrado.';
  }
  else {
    out = hits.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})\n${h.text}`).join(`\n\n`)
  }

  return { messages: [new AIMessage(`🔎 Similares\n\n${out}`)] };

}
