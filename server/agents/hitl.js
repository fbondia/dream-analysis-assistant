import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { lastAIMessage, llm } from "./configs/llm.js";
import { interrupt } from "@langchain/langgraph";

const agent = async (state) => {

  const feedback = interrupt({ content:lastAIMessage(state) });

  return { next:"analysis", messages: [...state.messages, new HumanMessage(feedback)] };

}

export default agent;