import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { llm } from "./configs/llm.js";
import { createSystemPrompt, DREAM_PROMPT } from "./configs/prompts.js";

const agent = async (state) => {

  const systemPrompt = await createSystemPrompt({ mode: state.mode, persona: state.persona })

  const context = state.context?.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})\n${h.text}`).join(`\n\n`)

  const userPrompt = await DREAM_PROMPT.format({text:state.text, other:context})

  const response = await llm.invoke([...systemPrompt.messages, userPrompt])

  return { next:"end", messages: [...systemPrompt.messages, userPrompt, response] };

}

export default agent;