import { searchDreams } from "../lib/database.js";
import { lastUser } from "./llm.js"

// ===== Pré-busca de contexto (para análise) =====
export async function retrieverNode(state) {
  const q = lastUser(state);
  const docs = await searchDreams({ query: q, k: 3 });
  return { contextDocs: docs };
}
