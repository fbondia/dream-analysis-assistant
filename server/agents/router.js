import { HumanMessage, SystemMessage, trimMessages } from "@langchain/core/messages";
import { llm } from "./configs/llm.js";

const agent = async (state) => {
  
  return { next:"store" };

  /*
  const prompt = `A seguir você é um roteador de decisões em um chatbot de análise de sonhos. 
- Se o usuário relata um sonho você responde: RELATO
- Se o usuário pede para listar, pesquisar ou buscar algum sonho anterior você responde: PESQUISA
- Se o usuário está explicando, respondendo ou complementando algum item da mensagem anterior, você responde: RESPOSTA
- Se o usuário fala alguma outra coisa você responde: CONVERSA
  
Responda apenas RELATO, PESQUISA, RESPOSTA ou CONVERSA. Nenhuma informação adicional.`

  const userPrompt = new HumanMessage(state.text)

  const allMessages = [
    ...state.messages,
    userPrompt
  ]

  const trimmer = trimMessages({
    maxTokens: 4,
    strategy: "last",
    tokenCounter: (msgs) => msgs.length,
    includeSystem: false,
    allowPartial: false,
    startOn: "human",
  });

  const messages = await trimmer.invoke(allMessages);

  const withSystemPrompt = [new SystemMessage(prompt), ...messages]

  const category = await llm.invoke(withSystemPrompt)

  console.log(category.content)
  
  if (category.content==="RELATO") {
    // salva sonho e encaminha para análise
    return { next:"store" };
  }
  else if (category.content==="PESQUISA") {
    // busca sonho
    return { next:"search" };
  }
  else { // if (["RESPOSTA", "CONVERSA"].includes(category.content) {
    // apenas devolve resposta
    const newMessages = [...state.messages, userPrompt]
    const response = await llm.invoke(newMessages)
    return { next:"end", messages: [...newMessages, response] };
  }
  */

};

export default agent;
