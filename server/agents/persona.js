import z from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const PersonaChoiceSchema = z.object({ persona: z.enum(['jung', 'narrative', 'cognitive']) });

const MODEL = process.env.MODEL || 'gpt-4.1-mini';
const llm = new ChatOpenAI({ model: MODEL, temperature: 0.2 });

export async function personaRouterNode(state) {

  const mode = state.mode || 'auto';
  if (mode === 'specific' && state.persona) return { persona: state.persona };
  if (mode === 'ensemble') return { persona: 'ensemble' };

  // auto -> deixar o LLM decidir
  const system = new SystemMessage(`Você é um roteador que escolhe a melhor PERSONA para analisar um sonho.
  Regras:
  - 'jung' quando o foco for símbolos, arquétipos, sombra, anima/animus, individuação, mitologia.
  - 'narrative' quando o foco for enredo, personagem, conflito, transformação, ponto de vista.
  - 'cognitive' quando o foco for emoção, ansiedade, memória, aprendizagem, problemas cotidianos, regulação.
  Responda APENAS com JSON: {"persona":"jung|narrative|cognitive"}`);
  const input = new HumanMessage(`SONHO: ${state._userText || ''}`);
  const choice = await llm.withStructuredOutput(PersonaChoiceSchema).invoke([system, input]);
  return { persona: choice.persona };
}