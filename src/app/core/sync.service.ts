/* Planora — js/core/05-sincronizacao.js
   Salvar local, status de sincronização e envio à nuvem com controle de conflito.
   Trecho do antigo js/db.js, linhas 372–463. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function salvarBancoDeDados(dados: Item[]) {
    const estadoAnterior = localStorage.getItem(chaveDb()) || '[]';
    const estadoNovo = JSON.stringify(dados);
    localStorage.setItem(chaveDb(), estadoNovo);
    if (!aplicandoHistorico) registrarEstadoHistorico(estadoAnterior, estadoNovo);
    if (nuvemAtiva()) { localStorage.setItem(chavePend(), '1'); seq++; }
    agendarEnvio();
}
function setStatus(t: string) {
    ultimoStatus = t;
    const e = document.getElementById('status-nuvem');
    if (!e) return;
    const estado = t.includes('Salvando') ? 'salvando'
        : t.includes('Erro') || t.includes('Conflito') || t.includes('limite') ? 'erro'
            : t.includes('Salvo na nuvem') ? 'salvo'
                : 'local';
    const descricoes = {
        salvando: 'Salvando alterações',
        salvo: 'Tudo salvo na nuvem',
        erro: t,
        local: t
    };
    const icone = estado === 'salvando'
        ? '<svg class="status-nuvem-spinner" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="32 12"></circle></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 16.2A4.5 4.5 0 0 0 18.5 7.4 6.5 6.5 0 0 0 6 9a4 4 0 0 0 .5 8H19"></path></svg>';
    e.dataset.estado = estado;
    e.title = descricoes[estado];
    e.setAttribute('aria-label', descricoes[estado]);
    e.innerHTML = icone;
}

/* ---------- envio com controle de conflito ---------- */
/* Envia já (use antes de trocar de página, para não perder o que acabou de salvar). */
function descarregarNuvem() {
    clearTimeout(timer);
    fila = fila.then(enviar);
    return fila;
}
function agendarEnvio() {
    if (!nuvemAtiva()) return;
    setStatus('Salvando...');
    clearTimeout(timer);
    timer = setTimeout(() => { fila = fila.then(enviar); }, 200);
}
/* Envio imediato (usado depois de arrastar linhas, para não depender do tempo de espera). */
function enviarAgora() {
    if (!nuvemAtiva()) return;
    clearTimeout(timer);
    setStatus('Salvando...');
    fila = fila.then(enviar);
}

/* Avisa antes de fechar/recarregar se ainda há alteração não enviada à nuvem. */
window.addEventListener('beforeunload', e => {
    if (nuvemAtiva() && localStorage.getItem(chavePend()) === '1') { e.preventDefault(); e.returnValue = ''; }
});

async function enviar() {
    if (!nuvemAtiva()) return false;
    const dados = montarDadosPersistidos();
    const minhaSeq = seq;
    const wid = workspaceAtual.id;
    try {
        let r;
        /* atualizado_em é o "número da versão" do controle de conflito: gravamos um valor novo a cada envio,
           sem depender de gatilho no banco. */
        const agora = new Date().toISOString();
        if (versao === null) {
            r = await sb.from(TABELA_DADOS).upsert({ workspace_id: wid, dados, atualizado_em: agora }, { onConflict: 'workspace_id' })
                .select('atualizado_em').single();
            if (r.error) throw r.error;
            versao = r.data.atualizado_em;
        } else {
            r = await sb.from(TABELA_DADOS).update({ dados, atualizado_em: agora })
                .eq('workspace_id', wid).eq('atualizado_em', versao).select('atualizado_em');
            if (r.error) throw r.error;
            if (!r.data.length) {
                setStatus('Conflito: recarregue a página');
                alert('Outro computador alterou os dados. Recarregue a página para ver a versão mais recente.\n\nSuas últimas alterações NÃO foram enviadas.');
                return false;
            }
            versao = r.data[0].atualizado_em;
        }
        if (minhaSeq === seq) localStorage.removeItem(chavePend());
        setStatus('Salvo na nuvem');
        return true;
    } catch (e) {
        console.error(e);
        setStatus('Erro ao salvar na nuvem');
        return false;
    }
}
