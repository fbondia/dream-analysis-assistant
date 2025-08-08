import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { interrupt } from "@langchain/langgraph";

import { availableTools, llm } from "./llm.js";
import { CANCEL_ACTION_PROMPT, CONFIRM_AGENT_PROMPT, buildConfirmationTable } from "./prompts.js";

const agent = async (state) => {

  const executionMessages = []

  let feedback = (state.approved ? "SIM" : "NÃO")

  if (!state.approved) {

    const question = await CONFIRM_AGENT_PROMPT.format({
      confirmations: state.confirmations
        .filter(x=>availableTools.find(t => t.name === x.call.name)?.metadata?.should_confirm)
        .map(x=>buildConfirmationTable(x))
        .join("\n\n")
    })

    //executionMessages.push(new AIMessage(question))
    feedback = interrupt({ question, options: ["SIM", "NÃO"] });
    //executionMessages.push(new HumanMessage(feedback))
  
  }

  const isApproved = (feedback.toUpperCase() === "SIM")


  for (const fn of state.confirmations) {
    
    const call = fn.call
    const tool = availableTools.find(t => t.name === call.name);

    if (!tool) continue;

    if (isApproved) {
        const results = await tool.func(call.args, null, {metadata: state.session});
        executionMessages.push(new ToolMessage(results, call.id))
    }
    else {
      const prompt = await CANCEL_ACTION_PROMPT.format({operation: tool.metadata.friendly_name})
      executionMessages.push(new ToolMessage(prompt, call.id))
    }

  }

  if (isApproved) {
    const response = await llm.invoke([...state.messages, ...executionMessages]);
    return { next:"end", messages: [...state.messages, ...executionMessages, response] };
  }
  else {
    executionMessages.push(new HumanMessage(feedback))
    return { next:"router", approved:false, confirmations:[], messages: [...state.messages, ...executionMessages] };
  }

}

export default agent;