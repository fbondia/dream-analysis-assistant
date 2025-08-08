import { searchDreams } from "../database.js";
import { lastUser } from "./commons.js"

// ===== Pré-busca de contexto (para análise) =====
export async function retrieverNode(state) {
  const q = lastUser(state);
  const docs = await searchDreams({ query: q, k: 3 });
  return { contextDocs: docs };
}
