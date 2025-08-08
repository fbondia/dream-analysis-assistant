import { SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts"

import { marked } from "marked";

import { availableTools } from "./llm.js";



export const CONFIRM_AGENT_PROMPT = new PromptTemplate({
inputVariables: ["confirmations"],
template:`Antes de prosseguir, veja se está tudo certo:\n
{confirmations}\n
Coloque ${marked('**SIM**')} para confirmar.
Ou então informe o que precisa ser corrigido.`
})

export const CANCEL_ACTION_PROMPT = new PromptTemplate({
inputVariables: ["operation"],
template:`O usuário cancelou a operação {operation}.`
})


export const ANALYSIS_PROMPT = new PromptTemplate({
  inputVariables: [ "prompt_persona" ],
  template: `Você analisa sonhos de acordo com uma metodologia indicada pela seguinte persona:

{prompt_persona}`
})

export const NARRATIVE_PROMPT = new PromptTemplate({
  inputVariables: [],
  template: `Persona: ANALISTA NARRATIVO. Foco: enredo, personagens, conflito, viradas, metáforas vividas.
- Destacar estrutura (setup → conflito → clímax → resolução/abertura).
- Sugerir reescritas simbólicas.
Estrutura:
1) Mapa de enredo (setup/conflito/clímax/desfecho)
2) Personagens e forças em jogo
3) Metáforas e temas recorrentes
4) Relações com sonhos similares
5) Experimentos narrativos (se o sonhador revisitasse a cena…)`
});

export const JUNG_PROMPT = new PromptTemplate({
  inputVariables: [],
  template: `Persona: ANALISTA JUNGIANO. Estilo: simbólico, arquétipos, mitopoiese, sombra, anima/animus.
- Forneça múltiplas hipóteses, sem determinismo.
- Não faça diagnósticos médicos.
Estrutura:
1) Símbolos centrais e arquétipos possíveis
2) Relação com processo de individuação e tensões psíquicas
3) Ecos mitológicos e culturais (se houver)
4) Relações com sonhos similares
5) Perguntas para aprofundar`
});

export const COGNITIVE_PROMPT = new PromptTemplate({
  inputVariables: [],
  template: `Persona: ANALISTA COGNITIVO-AFETIVO. Foco: emoção, ansiedade, memória, aprendizagem, regulação.
- Linguagem prática, hipóteses parcimoniosas, vieses cognitivos, pistas de estresse.
- Oferecer exercícios leves de autorreflexão (não clínicos).
Estrutura:
1) Emoções predominantes e gatilhos prováveis
2) Hipóteses de função do sonho (consolidação/ensaio/gestão de ameaça)
3) Relações com rotina/estressores atuais
4) Relações com sonhos similares
5) Pequenos experimentos/diário de bordo para próximos dias`
});

export const DREAM_PROMPT = new PromptTemplate({
  inputVariables: ["text", "other"],
  template: `SONHO: {text}

SIMILARES:
{other}`
})

export const buildConfirmationTable = (fn) => {

  const call = fn.call;
  const tool = availableTools.find(t => t.name === call.name);
  const metadata = tool.metadata;

  const params = tool.schema.parse(call.args);
  const schemaFields = FIELDS[metadata.schema_name] || {};

  const lines = [];
  lines.push("---");
  lines.push(`## ${metadata.friendly_name}`);
  lines.push("---");

  for (const key of Object.keys(params)) {
    const fieldConfig = schemaFields[key];

    // Nome do campo
    const label = typeof fieldConfig === "string"
      ? fieldConfig
      : fieldConfig?.field || key;

    // Valor formatado
    const rawValue = params[key];
    const formattedValue = typeof fieldConfig?.format === "function" ? fieldConfig.format(rawValue) : rawValue;

    lines.push(`- **${label}** = ${formattedValue}`);
  }

  lines.push("---");

  return marked(lines.join("\n"));

}

export function buildContextBlock(ctx = []) {
    if (!ctx.length) return '(sem similares)';
    return ctx
        .map((c, i) => `— Similar #${i + 1} (${c?.date || 's/ data'}; id=${c?.id || 'n/a'}):
${c?.text}`)
        .join(`

`);

}

export async function createSystemPrompt({ mode = 'auto', persona = 'jung' }) {
  
  const chosen = persona === 'ensemble' ? 'jung' : (persona || 'jung');

  const template = {
    jung: JUNG_PROMPT,
    narrative: NARRATIVE_PROMPT,
    cognitive: COGNITIVE_PROMPT,
  }[chosen];

  const prompt_persona = await template.format({ });
  const system_prompt = await ANALYSIS_PROMPT.format({ prompt_persona })

  const messages = [new SystemMessage(system_prompt)];

  return { messages, chosen, modeOut: persona === 'ensemble' ? 'ensemble' : mode || 'auto' };
  
}