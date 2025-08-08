import { lastUser } from "./commons.js"

// ===== Roteador de intenção (store/search/analyze) =====
export async function routerNode(state) {
  const txt = lastUser(state).toLowerCase();
  let action = 'analyze';
  if (/(salvar|guardar|registrar|armazenar|gravar|adicionar)/.test(txt)) action = 'store';
  if (/(busca|buscar|procurar|achar|similar|encontrar|listar)/.test(txt)) action = 'search';
  return { action };
}