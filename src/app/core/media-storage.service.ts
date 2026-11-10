/* Planora — js/core/10-midia.js
   Mídias: cache em IndexedDB e arquivos no Supabase Storage.
   Trecho do antigo js/db.js, linhas 1071–1146. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- mídias: cache em IndexedDB + arquivo no Supabase Storage ---------- */
let _idb: Promise<IDBDatabase> | null = null;
function abrirBancoMidia() {
    return _idb || (_idb = new Promise((ok, err) => {
        const r = indexedDB.open('Planora_midia_db', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('arquivos');
        r.onsuccess = () => ok(r.result);
        r.onerror = () => err(r.error);
    }));
}
async function idbOp<T = any>(modo: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | undefined): Promise<T> {
    const b = await abrirBancoMidia();
    return new Promise<T>((ok, err) => {
        const t = b.transaction(['arquivos'], modo);
        const rq = fn(t.objectStore('arquivos'));
        t.oncomplete = () => ok(rq && rq.result);
        t.onerror = () => err(t.error);
    });
}
async function enviarMidia(id: string, blob: Blob, tipo: string) {
    if (!sb || !usuario) return;
    const { error } = await sb.storage.from(BUCKET).upload(usuario.id + '/' + id, blob, { contentType: tipo, upsert: true });
    if (error) throw error;
}
const PENDENTES = 'Planora_midias_pendentes';
const lerPendentes = () => JSON.parse(localStorage.getItem(PENDENTES) || '[]');
async function salvarMidiaBlob(blob: Blob, tipo: string) {
    if (!blob) return null;
    const id = 'midia_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
    tipo = tipo || blob.type || 'application/octet-stream';
    await idbOp('readwrite', s => s.put({ blob, tipo }, id));
    try {
        await enviarMidia(id, blob, tipo);
    } catch (e) {
        console.error('Falha ao enviar mídia:', e);
        localStorage.setItem(PENDENTES, JSON.stringify([...lerPendentes(), id]));
        alert('A mídia foi salva neste navegador, mas NÃO foi enviada para a nuvem:\n' + (e.message || e) +
            '\n\nEla será reenviada automaticamente na próxima vez que abrir o sistema. ' +
            'Se persistir, rode o trecho de Storage do setup.sql no Supabase.');
    }
    return id;
}
async function reenviarPendentes() {
    const restantes: string[] = [];
    for (const id of lerPendentes()) {
        const r = await idbOp<RegistroMidia | undefined>('readonly', s => s.get(id));
        if (!r) continue;
        try { await enviarMidia(id, r.blob, r.tipo); } catch (e) { restantes.push(id); }
    }
    localStorage.setItem(PENDENTES, JSON.stringify(restantes));
}
async function obterMidiaBlob(id: string): Promise<RegistroMidia | null> {
    if (!id) return null;
    let r = await idbOp<RegistroMidia | undefined>('readonly', s => s.get(id));
    if (r) return r;
    if (!sb || !usuario) return null;
    const { data, error } = await sb.storage.from(BUCKET).download(usuario.id + '/' + id);
    if (error || !data) return null;
    r = { blob: data, tipo: data.type };
    await idbOp('readwrite', s => s.put(r, id));
    return r;
}
async function deletarMidiaBlob(id: string) {
    if (!id) return;
    await idbOp('readwrite', s => s.delete(id));
    if (sb && usuario) await sb.storage.from(BUCKET).remove([usuario.id + '/' + id]);
}
async function sincronizarMidiasLocais() {
    for (const p of lerBancoDeDados())
        for (const c of (p.cards || []))
            if (c.midiaId) {
                const r = await idbOp<RegistroMidia | undefined>('readonly', s => s.get(c.midiaId));
                if (r) try { await enviarMidia(c.midiaId, r.blob, r.tipo); } catch (e) { console.error(e); }
            }
}
