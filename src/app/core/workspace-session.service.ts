/* Planora — js/core/07-sessao-e-workspaces.js
   Sair da conta, carregar/criar/ativar/trocar/renomear workspaces e window.Planora_Workspaces.
   Trecho do antigo js/db.js, linhas 554–770. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- limpeza local (sair da conta) ---------- */
function limparCacheLocal() {
    const bases = [CHAVE_DB, CHAVE_PREFERENCIAS, PEND_FLAG];
    for (const k of Object.keys(localStorage)) {
        if (bases.some(b => k === b || k.startsWith(b + ':'))) localStorage.removeItem(k);
    }
    for (const k of Object.keys(sessionStorage)) {
        if (k === CHAVE_HISTORICO || k.startsWith(CHAVE_HISTORICO + ':') || k === SESSAO_WS) sessionStorage.removeItem(k);
    }
    localStorage.removeItem('Planora_visao');
    localStorage.removeItem('Planora_ordenacao');
    localStorage.removeItem('Planora_kanban_colunas');
}
/* Garante que nada pendente fique para trás antes de sair/trocar. Devolve true se está tudo na nuvem. */
async function garantirEnvioPendente() {
    clearTimeout(timer);
    await fila;
    if (!nuvemAtiva() || localStorage.getItem(chavePend()) !== '1') return true;
    return (await descarregarNuvem()) === true;
}
async function sairDaConta() {
    if (!sb || !usuario) {
        alert('A nuvem não está ativa, então não há conta para sair. Seus dados continuam salvos neste navegador.');
        return;
    }
    /* Só sai (e limpa o cache local) depois de confirmar que tudo foi para a nuvem. */
    if (!await garantirEnvioPendente()) {
        alert('Não foi possível confirmar o envio dos dados para a nuvem. Você NÃO foi desconectado, para não perder nada.');
        return;
    }
    await sb.auth.signOut();
    limparCacheLocal();
    location.reload();
}

/* ---------- workspaces ---------- */
const nomeWsValido = (t: unknown) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 60);
const dataCurta = (iso: string | undefined) => { const d = new Date(iso as string); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR'); };

async function carregarWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await sb.from(TABELA_WS).select('id,nome,created_at,legacy_user_id')
        .eq('owner_id', usuario.id).order('created_at', { ascending: true });
    if (error) throw error;
    const lista: Workspace[] = data || [];
    if (lista.length) {   // só para mostrar "atualizado em" na tela inicial; não traz o conteúdo (dados)
        const r = await sb.from(TABELA_DADOS).select('workspace_id,atualizado_em').in('workspace_id', lista.map(w => w.id));
        if (!r.error) (r.data || []).forEach((x: { workspace_id: string; atualizado_em: string }) => { const w = lista.find(y => y.id === x.workspace_id); if (w) w.atualizado_em = x.atualizado_em; });
    }
    return lista;
}
async function criarWorkspace(nome: string, dadosIniciais?: DadosPersistidos | undefined) {
    nome = nomeWsValido(nome);
    if (!nome) throw new Error('Digite um nome para o workspace.');
    if (listaWorkspaces.some(w => w.nome.toLowerCase() === nome.toLowerCase())) throw new Error('Você já tem um workspace com esse nome.');
    const ws = { id: crypto.randomUUID(), owner_id: usuario.id, nome, created_at: new Date().toISOString() };
    const r = await sb.from(TABELA_WS).insert(ws).select('id,nome,created_at,legacy_user_id').single();
    if (r.error) throw r.error;
    const novo = r.data;
    const dados = dadosIniciais || { itens: [], preferencias: { areas: AREAS_PADRAO.map(a => ({ ...a })) } };
    const atualizado_em = new Date().toISOString();
    const d = await sb.from(TABELA_DADOS).insert({ workspace_id: novo.id, dados, atualizado_em });
    /* se esta segunda gravação falhar, o workspace existe sem dados; ao abrir, o primeiro envio cria a linha. */
    if (d.error) console.error('Workspace criado, mas os dados iniciais não foram gravados:', d.error);
    else novo.atualizado_em = atualizado_em;
    listaWorkspaces.push(novo);
    return novo;
}
/* A tabela legada Planora_dados foi aposentada. Novos dados existem apenas por workspace. */
function workspaceDaSessao(lista: Workspace[]): (Workspace & { __importouLocal?: boolean }) | null {
    try {
        const s = JSON.parse(sessionStorage.getItem(SESSAO_WS) || 'null');
        if (s && s.u === usuario.id) return lista.find(w => w.id === s.w) || null;
    } catch (e) { /* sem escolha anterior */ }
    return null;
}
function ehTelaWorkspaces() {
    return location.pathname.split('/').pop() === 'workspaces.html';
}
function retornoSeguroWorkspaces(valor: unknown) {
    try {
        const destino = new URL((valor as string) || 'index.html', location.href);
        const pagina = destino.pathname.split('/').pop();
        if (destino.origin !== location.origin || !['index.html', 'cards.html'].includes(pagina)) return 'index.html';
        return destino.pathname + destino.search + destino.hash;
    } catch (e) {
        return 'index.html';
    }
}
function urlTelaWorkspaces(retorno: string | undefined) {
    return 'workspaces.html?return=' + encodeURIComponent(retornoSeguroWorkspaces(retorno));
}
function urlRetornoWorkspaces() {
    return retornoSeguroWorkspaces(new URLSearchParams(location.search).get('return'));
}
/* Caminho do primeiro acesso: dados que só existiam neste navegador (modo local, antes da nuvem). */
function dadosLocaisAntigos() {
    try {
        const itens = JSON.parse(localStorage.getItem(CHAVE_DB));
        if (!Array.isArray(itens) || !itens.length) return null;
        let preferencias = {};
        try { const p = JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS)); if (p && typeof p === 'object' && !Array.isArray(p)) preferencias = p; } catch (e) { /* padrão */ }
        return { itens, preferencias };
    } catch (e) { return null; }
}
/* Alterações que ficaram pendentes no cache da versão anterior (chaves sem id) vão para o workspace inicial. */
function adotarCachePendenteAntigo() {
    if (workspaceAtual.legacy_user_id !== usuario.id) return;
    if (localStorage.getItem(PEND_FLAG) !== '1' || localStorage.getItem(chaveDb()) !== null) return;
    const antigo = localStorage.getItem(CHAVE_DB);
    if (antigo === null) return;
    localStorage.setItem(chaveDb(), antigo);
    const pref = localStorage.getItem(CHAVE_PREFERENCIAS);
    if (pref !== null) localStorage.setItem(chavePreferencias(), pref);
    localStorage.setItem(chavePend(), '1');
    localStorage.removeItem(PEND_FLAG);
}
async function ativarWorkspace(ws: Workspace, importouLocal: boolean) {
    workspaceAtual = ws;
    versao = null;
    try {
        sessionStorage.setItem(SESSAO_WS, JSON.stringify({ u: usuario.id, w: ws.id }));
        localStorage.setItem(ULTIMO_WS + ':' + usuario.id, ws.id);
    } catch (e) { /* sem armazenamento */ }
    adotarCachePendenteAntigo();
    inicializarHistorico();
    const { data, error } = await sb.from(TABELA_DADOS).select('dados,atualizado_em').eq('workspace_id', ws.id).maybeSingle();
    if (error) {
        console.error(error);
        sb = null; usuario = null; // não envia nada, para não sobrescrever a nuvem
        setStatus('Erro ao carregar da nuvem (somente leitura local)');
        return false;
    }
    if (data) {
        versao = data.atualizado_em;
        if (localStorage.getItem(chavePend()) === '1') {
            await enviar();   // havia alteração local ainda não enviada (ex.: trocou de página rápido)
        } else {
            const migrarFormato = carregarDadosPersistidos(data.dados);
            if (migrarFormato) {
                localStorage.setItem(chavePend(), '1');
                seq++;
                if (!await enviar()) return false;
            }
        }
    } else if (!await enviar()) {   // workspace sem linha de dados: cria a linha (vazia ou com o cache pendente)
        return false;
    }
    if (!await garantirAreasPadrao()) return false;
    if (importouLocal) await sincronizarMidiasLocais();
    setStatus('Salvo na nuvem');
    reenviarPendentes();
    window.dispatchEvent(new Event('Planora-areas-atualizadas'));
    window.dispatchEvent(new Event('Planora-workspace-atualizado'));
    return true;
}
/* Troca de workspace: envia o que estiver pendente e recarrega na raiz do novo workspace.
   id = null volta para a tela de boas-vindas. */
async function trocarWorkspace(id: string) {
    if (!await garantirEnvioPendente()) {
        alert('Não foi possível confirmar o envio dos dados para a nuvem. Você continua neste workspace para não perder nada.');
        return false;
    }
    try {
        if (id) sessionStorage.setItem(SESSAO_WS, JSON.stringify({ u: usuario.id, w: id }));
        else sessionStorage.removeItem(SESSAO_WS);
    } catch (e) { /* sem armazenamento */ }
    location.href = id ? 'index.html' : urlTelaWorkspaces(location.pathname + location.search + location.hash);
    return true;
}
async function novoWorkspaceInterativo() {
    const nome = await pedirNomeWorkspace();
    if (!nome) return;
    try {
        const ws = await criarWorkspace(nome);
        await trocarWorkspace(ws.id);
    } catch (e) {
        console.error(e);
        alert('Não foi possível criar o workspace: ' + (e.message || e));
    }
}
/* Grava o novo nome de um workspace (só o dono consegue; exige a política de UPDATE em Planora_workspaces). */
async function salvarNomeWorkspace(id: string, nomeBruto: string) {
    const nome = nomeWsValido(nomeBruto);
    if (!nome) throw new Error('Digite um nome para o workspace.');
    const ws = listaWorkspaces.find(w => w.id === id);
    if (!ws) throw new Error('Workspace não encontrado.');
    if (nome === ws.nome) return false;
    if (listaWorkspaces.some(w => w.id !== id && w.nome.toLowerCase() === nome.toLowerCase())) throw new Error('Você já tem um workspace com esse nome.');
    const { data, error } = await sb.from(TABELA_WS).update({ nome })
        .eq('id', id).eq('owner_id', usuario.id).select('id,nome').maybeSingle();
    if (error) throw error;
    if (!data) {
        const e = new Error('O Supabase não permitiu renomear. Confira a política de UPDATE em Planora_workspaces (supabase/02_politicas_workspaces.sql).');
        e.code = '42501';
        throw e;
    }
    ws.nome = data.nome;
    if (workspaceAtual && workspaceAtual.id === id) workspaceAtual.nome = data.nome;
    window.dispatchEvent(new Event('Planora-workspace-atualizado'));
    return true;
}
async function renomearWorkspaceInterativo(id: string) {
    const ws = listaWorkspaces.find(w => w.id === id);
    if (!ws) throw new Error('Workspace não encontrado.');
    const nome = await pedirNovoNomeWorkspace(ws);
    if (!nome || nome === ws.nome) return false;
    return salvarNomeWorkspace(id, nome);
}
window.Planora_Workspaces = {
    get lista() { return listaWorkspaces.slice(); },
    get atual() { return workspaceAtual; },
    selecionar: trocarWorkspace,
    telaInicial: () => trocarWorkspace(null),
    criarNovo: novoWorkspaceInterativo,
    renomear: renomearWorkspaceInterativo,
    salvarNome: salvarNomeWorkspace
};
