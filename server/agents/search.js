import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { searchDreams } from "../database.js";

export async function searchNode(state) {

  const qPrompt = [
    new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`),
    new HumanMessage(state._userText || ''),
  ];
  const q = (await llm.invoke(qPrompt)).content;
  const hits = await searchDreams({ query: q, k: 3 });
  const out = hits.length
    ? hits.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})
${h.text.slice(0, 400)}${h.text.length > 400 ? '…' : ''}`).join(`

`)
    : 'Nenhum similar encontrado.';
  return { messages: [new AIMessage(`🔎 Similares

${out}`)] };
}
