export const isStaticHosting=(metadata=globalThis.document?.querySelector('meta[name="daily-hosting"]'))=>metadata?.content==='static';
export const mediaStatus=(record,staticHosting=false)=>record.status==='uploaded'?'已存 服务器':staticHosting?'仅存本机 · 回家后可备份 服务器':'本机已保存 · 服务器 待同步';
