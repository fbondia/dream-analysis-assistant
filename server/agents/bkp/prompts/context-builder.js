export function buildContextBlock(ctx = []) {
    if (!ctx.length) return '(sem similares)';
    return ctx
        .map((c, i) => `— Similar #${i + 1} (${c?.date || 's/ data'}; id=${c?.id || 'n/a'}):
${c?.text}`)
        .join(`

`);

}
