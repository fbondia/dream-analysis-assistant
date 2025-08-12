import { AIMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "./configs/llm.js";
import { ANALYSIS_PROMPT, createSystemPrompt, DREAM_PROMPT } from "./configs/prompts.js";

export default async function agent(state) {

  let messages = (state.messages?.length > 0 ? state.messages : await initializePrompt(state))

  //const response = await llm.invoke(messages)

  const llmStructured = llm.withStructuredOutput(z.object({
    etapa_atual: z.enum([
      "1_presenca",
      "2_inventario",
      "3_qualidades",
      "4_emocoes",
      "5_temas",
      "6_amplificacoes",
      "7_similares",
      "encerramento"
    ]),
    
    // Resposta pronta em Markdown conforme teu guia (título, observações, perguntas)
    markdown: z.string(),

    // Estruturado (útil pra UI)
    observacoes: z.array(z.string()).default([]),
    perguntas: z.array(z.string()).min(1).max(3),

    // Sinaliza se deve incluir a frase “Quer avançar para a próxima etapa?”
    pedir_confirmacao: z.boolean().default(false),

    // Opções de próxima ação (pra tua UI renderizar botões/menus)
    opcoes: z.array(z.object({
      value: z.string(), // id/ação (ex.: "coletar_espacos")
      label: z.string()  // rótulo visível (ex.: "Começar pelos espaços")
    })).default([]),

    // Ecoa o campo de entrada se quiser manter no ciclo
    similares: z.string().default("nenhum"),

    // Campo livre pra telemetria/controle
    meta: z.object({
      proxima_etapa_sugerida: z.enum([
        "1_presenca",
        "2_inventario",
        "3_qualidades",
        "4_emocoes",
        "5_temas",
        "6_amplificacoes",
        "7_similares",
        "encerramento"
      ]).nullable().optional()
    }).nullable().optional()
  }));
  const json = await llmStructured.invoke(messages);

  const response = new AIMessage({content:json.markdown})

  console.log(response)

  return { next:"hitl", messages:[...messages, response], context:{type:"analysis", ...json} };

}

const initializePrompt = async (state) => {

    const systemPrompt = new SystemMessage(await ANALYSIS_PROMPT.format({ prompt_persona }))

    const other = state.docs?.map((h, i) => `#${i + 1} (${h.date || 's/ data'}; id=${h.id || 'n/a'})\n${h.text}`).join(`\n\n`)

    const userPrompt = await DREAM_PROMPT.format({text:state.text, other})

    return [systemPrompt, userPrompt]

}

const prompt_persona = `Persona: ANALISTA DE SONHOS focado em elementos e seu sentido para o sonhador. Tom: perspicaz, gentil, receptivo e curioso.

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
- Título: "## Etapa {etapa_atual}"
- Subtítulo "### Observações" + bullets concisos (se houver).
- Subtítulo "### Perguntas" + perguntas numeradas (1–3).
- Quando fizer sentido, inclua ao final: "Quer avançar para a próxima etapa?"

ETAPAS (guia de condução):
1 — Presença do sonhador (difere da vida acordada?)
2 — Inventário de elementos (coletar aos poucos: espaços, atores, ações, elementos)
3 — Qualidades de cada elemento (1–3 por vez)
4 — Emoções do sonho (rascunho e ajuste)
5 — Temas possíveis (1–3 temas)
6 — Amplificações arquetípicas (1–2, leves)
7 — Sonhos similares (se SIMILARES ≠ "nenhum")

SAÍDA (OBRIGATÓRIA):
- Responda com **apenas um objeto JSON** válido que siga o schema DreamAnalysisResponse.
- Preencha "markdown" com o texto completo em Markdown no formato visual descrito.
- Preencha "opcoes" com próximas ações adequadas à etapa (ex.: "coletar_espacos", "coletar_atores", "aprofundar_elemento", "escolher_temas", "encerrar_sintese").
- Se sugerir avançar de etapa, marque "pedir_confirmacao": true e, opcionalmente, "meta.proxima_etapa_sugerida".
`

const varsEntrada = `
VARIÁVEIS DE ENTRADA:
- Etapa atual: {ETAPA_ATUAL}
- SIMILARES: {SIMILARES}  (ex.: "nenhum" ou breve resumo)
- Contexto já respondido (resumo curto): {HISTORICO}
- Texto do sonhador (última mensagem): {TEXTO}`

