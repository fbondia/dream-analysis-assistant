import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "./llm.js";

const agent = async (state) => {
  
  const prompt = `Você é um roteador de decisões em um chatbot de análise de sonhos. 
- Se um usuário relata um sonho você responde: RELATO
- Se um usuário pede para pesquisar ou buscar um sonho você responde: PESQUISA
- Se um usuário fala alguma outra coisa você responde: CONVERSA
  
Responda apenas RELATO, PESQUISA ou CONVERSA. Nenhuma informação adicional.`

  const messages = [
    new SystemMessage(prompt),
    new HumanMessage(state.text)
  ]

  const response = await llm.invoke(messages)

  if (response.content==="RELATO") {
    // salva sonho e encaminha para análise
    return { next:"store" };
  }
  else if (response.content==="PESQUISA") {
    // busca sonho
    return { next:"search" };
  }
  else { // if (response.content==="CONVERSA") {
    // apenas devolve resposta
    console.log(response.content)
    return { next:"end", messages: [...state.messages, response] };
  }

};

export default agent;
