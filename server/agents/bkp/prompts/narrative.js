import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export function narrativePrompt(userText, ctxBlock) {
  return [
    new SystemMessage(`Persona: ANALISTA NARRATIVO. Foco: enredo, personagens, conflito, viradas, metáforas vividas.
- Destacar estrutura (setup → conflito → clímax → resolução/abertura).
- Sugerir reescritas simbólicas.
Estrutura:
1) Mapa de enredo (setup/conflito/clímax/desfecho)
2) Personagens e forças em jogo
3) Metáforas e temas recorrentes
4) Relações com sonhos similares
5) Experimentos narrativos (se o sonhador revisitasse a cena…)`),
    new HumanMessage(`SONHO: ${userText}`),
    new HumanMessage(`SIMILARES:
${ctxBlock}`),
  ];
}