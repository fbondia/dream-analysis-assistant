import dayjs from "dayjs";
import { z } from "zod";

import { searchDreams } from "../../lib/vectordb.js";
import { db, deepCloneAndReplaceTimestamps, snapToObject } from "../../lib/firestore.js";

import { createManagedTool } from "./managed-tools.js";

const schema_name = "DREAM";

export const [buscar_sonhos, buscar_sonhos_eval] = createManagedTool({
  name: "buscar_sonhos",
  description: "Busca sonhos do usuário na base de dados vetorial",
  friendly_name: "Pesquisar sonhos",
  should_confirm: false,
  schema_name,
  schema_fields: z.object({
    data: z.string().optional().describe("Data no formato AAAA-MM-DD"),
    assunto: z.string().describe("Assunto, elemento, acontecimento"),
  }),
  fn: async (data, context) => {

    const results = await searchDreams(data.texto, 5)

    return results;
    
  },
})
