import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { availableTools, llm } from "./configs/llm.js";
import { searchDreams } from "../lib/vectordb.js";

const agent = async (state) => {

    const prompt = [
      new SystemMessage(`Gere uma query curta para buscar sonhos similares. Responda apenas a query.`),
      new HumanMessage(state.text || ''),
    ];

    const response = await llm.invoke(prompt);
    
    const filter = (doc) => {
      return doc.metadata.uid===state.session.userId;
    }

    const hits = await searchDreams({ query: response.content, filter, k: 3 });

    if (hits?.length===0) {
      return { next:"end", messages: [...state.messages, new AIMessage("Nenhum sonho sobre isso foi encontrado...")] };
    }

    const out = hits.map((h, i) => `#${i+1} [${h.date}] = ${h.title}

${h.text}`).join(`

`)

    return { next:"end", messages: [...state.messages, new AIMessage(out)] };

}

export default agent;