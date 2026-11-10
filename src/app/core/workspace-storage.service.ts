/* Planora — js/core/01-estado-e-armazenamento.js
   Constantes, estado global (sb, usuario, versão) e leitura/gravação local de dados e preferências.
   Trecho do antigo js/db.js, linhas 1–76. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* Planora — dados no Supabase por workspace, com cache local (localStorage + IndexedDB)
   Cada conta pode ter vários workspaces (Planora_workspaces); os dados de cada um ficam em
   Planora_workspace_data, e o cache local usa chaves com o id do workspace.
   A tabela legada Planora_dados foi aposentada e não é mais consultada pelo aplicativo. */
const CHAVE_DB = 'Planora_db';
const CHAVE_PREFERENCIAS = 'Planora_preferencias';
const BUCKET = 'midias';
const PEND_FLAG = 'Planora_pendente';
const TABELA_WS = 'Planora_workspaces';
const TABELA_DADOS = 'Planora_workspace_data';
const SESSAO_WS = 'Planora_ws_ativo';           // sessionStorage: workspace aberto nesta aba
const ULTIMO_WS = 'Planora_ultimo_ws';          // localStorage: último workspace usado (por usuário)
let seq = 0;
let sb: SupabaseCliente | null = null, usuario: SupabaseUsuario | null = null, versao: string | null = null;
let timer: number | null = null, fila: Promise<unknown> = Promise.resolve(), ultimoStatus = '';
let workspaceAtual: Workspace | null = null, listaWorkspaces: Workspace[] = [];

/* Sem workspace ativo (modo local), as chaves continuam as de sempre. */
const sufixoWs = () => workspaceAtual ? ':' + workspaceAtual.id : '';
const chaveDb = () => CHAVE_DB + sufixoWs();
const chavePreferencias = () => CHAVE_PREFERENCIAS + sufixoWs();
const chavePend = () => PEND_FLAG + sufixoWs();
const nuvemAtiva = () => !!(sb && usuario && workspaceAtual);

function lerBancoDeDados(): Item[] { return JSON.parse(localStorage.getItem(chaveDb())) || []; }
function lerPreferenciasBanco(): Preferencias {
    try {
        const preferencias = JSON.parse(localStorage.getItem(chavePreferencias()));
        if (preferencias && typeof preferencias === 'object' && !Array.isArray(preferencias)) return preferencias;
    } catch (e) { /* migra preferências antigas */ }

    const preferencias: Preferencias = {};
    const visao = localStorage.getItem('Planora_visao');
    if (visao === 'tabela' || visao === 'kanban') preferencias.visao = visao;
    try {
        const ordenacao = JSON.parse(localStorage.getItem('Planora_ordenacao'));
        if (ordenacao && ['nome', 'rotulo', 'area', 'prazo'].includes(ordenacao.tipo)) {
            preferencias.ordenacao = { tipo: ordenacao.tipo, dir: ordenacao.dir === -1 ? -1 : 1 };
        }
    } catch (e) { /* sem ordenação antiga salva */ }
    try {
        const colunas = JSON.parse(localStorage.getItem('Planora_kanban_colunas'));
        if (Array.isArray(colunas)) preferencias.kanbanColunas = colunas;
    } catch (e) { /* sem ordem antiga de colunas salva */ }
    localStorage.setItem(chavePreferencias(), JSON.stringify(preferencias));
    return preferencias;
}
function salvarPreferenciasBanco(preferencias: Preferencias) {
    if (!preferencias || typeof preferencias !== 'object' || Array.isArray(preferencias)) {
        throw new TypeError('As preferências precisam ser um objeto.');
    }
    localStorage.setItem(chavePreferencias(), JSON.stringify(preferencias));
    salvarBancoDeDados(lerBancoDeDados());
}
function carregarDadosPersistidos(dados: DadosPersistidos | Item[]) {
    const preferenciasLocais = lerPreferenciasBanco();
    if (Array.isArray(dados)) {
        localStorage.setItem(chaveDb(), JSON.stringify(dados));
        localStorage.setItem(chavePreferencias(), JSON.stringify(preferenciasLocais));
        sincronizarHistoricoComBanco();
        return true;
    }
    if (!dados || typeof dados !== 'object' || !Array.isArray(dados.itens)) {
        throw new Error('Os dados recebidos da nuvem têm um formato inválido.');
    }
    localStorage.setItem(chaveDb(), JSON.stringify(dados.itens));
    localStorage.setItem(chavePreferencias(), JSON.stringify(
        dados.preferencias && typeof dados.preferencias === 'object' && !Array.isArray(dados.preferencias)
            ? dados.preferencias
            : {}
    ));
    sincronizarHistoricoComBanco();
    return false;
}
function montarDadosPersistidos() {
    return { itens: lerBancoDeDados(), preferencias: lerPreferenciasBanco() };
}
