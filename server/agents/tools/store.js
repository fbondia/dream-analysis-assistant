import dayjs from "dayjs";
import { z } from "zod";

import { storeDream } from "../../lib/vectordb.js";
import { db, deepCloneAndReplaceTimestamps, snapToObject } from "../../lib/firestore.js";

import { createManagedTool } from "./managed-tools.js";

const schema_name = "DREAM";

export const [salvar_sonho, salvar_sonhoeval] = createManagedTool({
  name: "armazenar_sonho",
  description: "Salvar sonho do usuário na base de dados vetorial",
  friendly_name: "Salvar sonho",
  should_confirm: false,
  schema_name,
  schema_fields: z.object({
    data: z.string().default(dayjs().format("YYYY-MM-DD")).describe("Data no formato AAAA-MM-DD"),
    texto: z.string().describe("Conteúdo do sonho"),
  }),
  fn: async (data, context) => {

    const rec = await storeDream({text:data.texto, date:data.data});
    
    return "Sonho armazenado."
    
  },
})
