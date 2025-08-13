import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "./configs/llm.js";
import { PromptTemplate } from "@langchain/core/prompts";

export default async function agent(state) {

  let messages = (state.messages?.length > 0 ? state.messages : await initializePrompt(state))

  const steps = [
      "1_presenca",
      "2_inventario",
      "3_qualidades",
      "4_emocoes",
      "5_temas",
      "6_amplificacoes",
      "7_similares",
      "encerramento"
  ]

  const llmStructured = llm.withStructuredOutput(z.object({
    
    current_step: z.enum(steps),
    next_step: z.enum(steps).nullable().optional(),
    markdown: z.string(),
    insights: z.array(z.string()).default([]),
    questions: z.array(z.string()).min(1).max(3),
    should_confirm: z.boolean().default(false),
    options: z.array(z.object({
      value: z.string(),
      label: z.string()
    })).default([]),
  }));

  const json = await llmStructured.invoke(messages);

  const response = new AIMessage({content:json.markdown})

  return { next:"hitl", messages:[...messages, response], context:{type:"analysis", ...json} };

}

const initializePrompt = async (state) => {

    const systemPrompt = new SystemMessage(system_prompt)

    const other = state.docs?.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})\n${h.text}`).join(`\n\n`)


    const userPrompt = await dream_prompt.format({text:state.text, other})

    return [systemPrompt, userPrompt]

}

const system_prompt = `Você analisa sonhos de acordo com a metodologia indicada a seguir.

Persona: ANALISTA DE SONHOS focado em elementos e seu sentido para o sonhador. Tom: perspicaz, gentil, receptivo e curioso.

REGRAS:
- Fale em português do Brasil e formate em Markdown.
- Não faça diagnósticos médicos.
- Respostas curtas (2–6 linhas) e conversacionais.
- No máx. 3 perguntas por turno (ideal: 1–2).
- Não explique o plano da análise; aja apenas na etapa atual.
- Não avance de etapa sem confirmação do sonhador.
- Não repita perguntas já respondidas; referencie o que o sonhador trouxe.
- Se faltar contexto, faça uma pergunta única e clara.

FORMATO VISUAL (dentro do campo "markdown"):
- Título: "## Etapa {current_step}"
- Subtítulo "### Observações" + bullets concisos (se houver).
- Subtítulo "### Associações" + associações coletadas do usuário até o momento.

ETAPAS (guia de condução):
1 — Presença do sonhador (como o sonhador difere de quem é em sua vida acordada?)
2 — Inventário de elementos (coletar aos poucos: espaços, ambientes, atores, personages, ações, gestos, elementos, objetos símbolos)
3 — Qualidades de cada elemento (1–3 por vez)
4 — Emoções do sonho (rascunho e ajuste)
5 — Temas possíveis (1–3 temas)
6 — Possíveis amplificações arquetípicas (1–3, leves)
7 — Sonhos similares (se SIMILARES ≠ "nenhum")

SAÍDA (OBRIGATÓRIA):
- Responda com **apenas um objeto JSON** válido que siga o schema fornecido.
- Preencha "markdown" com o texto completo em Markdown no formato visual descrito.
- Preencha "options" com próximas ações adequadas à etapa (ex.: "Analisar espaços no sonho", "Analisar atores e personagens", "Aprofundar análise dos elementos simbólicos", "Analisar temas", "Finalizar análise").
- Se sugerir avançar de etapa, marque "should_confirm": true e, opcionalmente, "next_step".
`

const dream_prompt = new PromptTemplate({
  inputVariables: ["text", "other"],
  template: `SONHO: {text}

SIMILARES:
{other}`
})