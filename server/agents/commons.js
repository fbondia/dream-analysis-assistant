export function lastUser(state) {
  const last = [...(state.messages || [])].reverse().find((m) => m._getType?.() === 'human');
  return last?.content || '';
}
