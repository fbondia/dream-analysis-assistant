import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { availableTools, llm } from "./llm.js";
import { searchDreams } from "../lib/vectordb.js";

const agent = async (state) => {

    const prompt = [
      new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`),
      new HumanMessage(state.text || ''),
    ];

    const response = await llm.invoke(prompt);
    
    const hits = await searchDreams({ query: response.content, k: 3 });


    let out = ""

    if (hits?.length===0) {
      return { next:"end", messages: [...state.messages, new AIMessage("Nenhum sonho sobre isso foi encontrado...")] };
    }

    out = hits.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})\n${h.text}`).join(`\n\n`)

    return { next:"end", messages: [...state.messages, new AIMessage(out)] };

}

export default agent;