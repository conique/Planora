/* Planora — js/pages/index/09-pastas.js
   Navegação e CRUD de pastas (caminho, abrir, mover, renomear, excluir).
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 1715–1825. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- Pastas: criar, abrir, mover (arrastando), renomear e excluir ---------- */
function pastaPorId(id: string) { return id ? db.find(x => x.tipo === 'pasta' && x.id === id) : null; }
function contarFilhos(id: string) { return db.filter(x => (x.pai || null) === id).length; }
function htmlDetalhesInline(item: Item) {
    const area = item.area ? `<span class="item-detalhe">· ${escapeHTML(item.area)}</span>` : '';
    if (item.tipo !== 'pasta') return area;
    const quantidade = contarFilhos(item.id);
    return `${area}<span class="item-detalhe">· ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}</span>`;
}
function validarPastaAtual() { if (pastaAtual && !pastaPorId(pastaAtual)) pastaAtual = null; }

function caminhoDaPasta(id: string) {
    const cadeia = [];
    let atual = pastaPorId(id), guarda = 0;
    while (atual && guarda++ < 50) { cadeia.unshift(atual); atual = pastaPorId(atual.pai); }
    return cadeia;
}
/* true se "filhoId" está dentro de "paiId" (em qualquer nível) */
function ehDescendente(paiId: string | null, filhoId: string | null) {
    let x = pastaPorId(filhoId), guarda = 0;
    while (x && guarda++ < 50) { if ((x.pai || null) === paiId) return true; x = pastaPorId(x.pai); }
    return false;
}

function atualizarCaminho() {
    if (!window.Planora_Topo) return;
    const cadeia = caminhoDaPasta(pastaAtual);
    Planora_Topo.definirCaminho(cadeia.map((f, i) => ({
        nome: f.nome, pasta: f.id, href: i < cadeia.length - 1 ? 'index.html?pasta=' + f.id : null
    })));
}

function irParaPasta(id: string, historico = true) {
    pastaAtual = id || null;
    if (historico) {
        try {
            const u = new URL(location.href);
            if (pastaAtual) u.searchParams.set('pasta', pastaAtual); else u.searchParams.delete('pasta');
            history.pushState({}, '', u);
        } catch (e) { /* sem histórico (ex.: arquivo local) */ }
    }
    window.__termoBusca = '';
    const campo = document.getElementById('topo-busca') as HTMLInputElement;
    if (campo) campo.value = '';
    renderizarTabela();
}
window.addEventListener('popstate', () => {
    pastaAtual = new URLSearchParams(location.search).get('pasta') || null;
    renderizarTabela();
});
document.addEventListener('click', e => {                 // links do caminho navegam sem recarregar
    const a = ((e.target as HTMLElement).closest && (e.target as HTMLElement).closest('#topo a[data-pasta]')) as HTMLElement;
    if (!a) return;
    e.preventDefault();
    irParaPasta(a.dataset.pasta || null);
});

function salvarPastas() {
    salvarBancoDeDados(db);
    if (typeof enviarAgora === 'function') enviarAgora();
    renderizarTabela();
}
function criarPasta() {
    db.push({
        tipo: 'pasta',
        id: 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        nome: 'Nova pasta',
        rotulo: opcoesRotulos[0]?.nome || 'Em andamento',
        area: Planora_Areas.padrao(),
        prazo: '---',
        pai: pastaAtual || null
    });
    salvarPastas();
}
function excluirPasta(index: number) {
    const p = db[index], n = contarFilhos(p.id);
    const msg = n
        ? `Excluir a pasta "${p.nome}"?\nOs ${n} item(ns) dentro dela serão movidos para o nível acima. Nada é apagado.`
        : `Excluir a pasta vazia "${p.nome}"?`;
    if (!confirm(msg)) return;
    db.forEach(x => { if (x.pai === p.id) x.pai = p.pai || null; });
    db.splice(index, 1);
    salvarPastas();
}
function moverParaPasta(de: number, pastaId: string | null) {
    const item = db[de];
    if (!item) return;
    if (item.tipo === 'pasta' && (item.id === pastaId || ehDescendente(item.id, pastaId))) return;
    db.splice(de, 1);
    item.pai = pastaId || null;
    db.push(item);
    salvarPastas();
}

function criarLinhaVoltar() {
    const pai = (pastaPorId(pastaAtual) || {}).pai || null;
    const nomePai = pai ? pastaPorId(pai).nome : 'Workspace';
    const tr = document.createElement('tr');
    tr.className = 'linha-voltar';
    tr.dataset.dropPasta = pai || '';
    tr.onclick = () => irParaPasta(pai);
    tr.innerHTML = `<td colspan="5"><div class="col-nome"><span>↰</span><span>Voltar para ${escapeHTML(nomePai)}</span></div></td>`;
    return tr;
}
function criarLinhaVazia() {
    const tr = document.createElement('tr');
    tr.className = 'linha-vazia';
    tr.innerHTML = '<td colspan="5">Pasta vazia. Crie uma página aqui ou arraste itens para dentro dela.</td>';
    return tr;
}
