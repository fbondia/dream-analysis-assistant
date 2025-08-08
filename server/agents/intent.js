import { availableTools, llm } from "./llm.js"

const agent = async (state) => {
  
  // vamos avaliar a intenção do usuário

  const llmWithTools = llm.bindTools(availableTools);

  const response = await llmWithTools.invoke(state.messages);


  // não há tool_call, o usuário só quer conversar

  if (response.tool_calls?.length===0) {
    return { next:"end", messages: [...state.messages, response] };
  }



  // faz a avaliação das funções e parâmetros que deverão ser confirmados

  let somethingToConfirm = false;

  const confirmations = [];

  for (const call of response.tool_calls ?? []) {

    const tool = availableTools.find(t => t.name === call.name);

    if (!tool) continue;

    if (tool.metadata.should_confirm) {
      somethingToConfirm = true
    }

    confirmations.push({ call });

  }

  // verifica se é necessário confirmar ou não

  if (somethingToConfirm) {
    return { next:"confirmation", approved:false, confirmations, messages: [...state.messages, response] };
  }
  else {
    return { next:"confirmation", approved:true, confirmations, messages: [...state.messages, response] };
  }

};

export default agent;
