/* Planora — js/pages/index/10-ordem-personalizada.js
   Barra de ordem e arraste de linhas da tabela (ordem personalizada).
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 1826–1960. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
const NOMES_COLUNAS = { nome: 'Título', rotulo: 'Rótulo', area: 'Área', prazo: 'Prazo' };

/* Transforma a ordenação que está na tela na ordem personalizada salva (vai para a nuvem). */
function adotarOrdemAtual() {
    const posicoes = db.map((_, i) => i).filter(i => (db[i].pai || null) === (pastaAtual || null));
    const ordenados = calcularOrdemVisual().map(i => db[i]);
    posicoes.forEach((pos, k) => { db[pos] = ordenados[k]; });
    ordenacaoAtual = null;
    direcaoOrdenacao = 1;
    salvarPreferenciasBanco({
        ...lerPreferenciasBanco(),
        ordenacao: null
    });
    salvarBancoDeDados(db);
    if (typeof enviarAgora === 'function') enviarAgora();
    renderizarTabela();
}

function usarOrdemPersonalizada() {
    ordenacaoAtual = null;
    direcaoOrdenacao = 1;
    salvarPreferenciasBanco({
        ...lerPreferenciasBanco(),
        ordenacao: null
    });
    renderizarTabela();
}

function atualizarBarraOrdem() {
    document.querySelectorAll<HTMLElement>('.cabecalho-clicavel').forEach(th => {
        const m = (th.getAttribute('onclick') || '').match(/'(\w+)'/);
        th.dataset.ordem = m && m[1] === ordenacaoAtual ? (direcaoOrdenacao === 1 ? 'asc' : 'desc') : '';
    });
    const barra = document.getElementById('barra-ordem');
    if (!barra) return;
    barra.innerHTML = ordenacaoAtual
        ? `<span>Visualização ordenada por <strong>${NOMES_COLUNAS[ordenacaoAtual]}</strong> ${direcaoOrdenacao === 1 ? '↑' : '↓'} · Arraste desativado</span>
           <span class="barra-acoes"><button type="button" class="btn-ordem" onclick="adotarOrdemAtual()">Salvar como minha ordem</button><button type="button" class="btn-ordem" onclick="usarOrdemPersonalizada()">Voltar à ordem personalizada</button></span>`
        : '<span>⠿ Ordem personalizada · arraste em uma área vazia para selecionar vários; Ctrl+clique alterna a seleção</span>';
}

let arrasto: ArrastoLinha | null = null;

document.addEventListener('pointerdown', e => {
    if (e.button > 0 || !(e.target as HTMLElement).closest) return;
    const tr = (e.target as HTMLElement).closest('#corpo-tabela tr') as HTMLTableRowElement;
    if (!tr || tr.classList.contains('em-edicao') || !tr.id.startsWith('linha-projeto-')) return;
    if ((e.target as HTMLElement).closest('button, input, select, a, .col-acoes')) return;
    if (e.pointerType === 'touch' && !(e.target as HTMLElement).closest('.alca-arrastar')) return;   // no toque, só pela alça
    const index = Number(tr.id.replace('linha-projeto-', ''));
    const indices = indicesParaArrastar(index);
    if (!itensSelecionados.has(index)) limparSelecaoCards();
    arrasto = { tr, indices, id: e.pointerId, x0: e.clientX, y0: e.clientY, ativo: false, ghost: null, alvo: null, depois: false, dentro: undefined };
});

window.addEventListener('pointermove', e => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    if (!arrasto.ativo) {
        if (Math.hypot(e.clientX - arrasto.x0, e.clientY - arrasto.y0) < 6) return;
        arrasto.ativo = true;
        arrasto.indices.forEach(i => document.getElementById(`linha-projeto-${i}`)?.classList.add('arrastando-origem', 'selecionado'));
        arrasto.indices.forEach(i => itensSelecionados.add(i));
        document.body.classList.add('arrastando');
        if (window.getSelection) window.getSelection().removeAllRanges();
        const nome = arrasto.tr.querySelector('.titulo-linha');
        const g = document.createElement('div');
        g.className = 'ghost-arrasto';
        g.textContent = arrasto.indices.length > 1
            ? `${arrasto.indices.length} itens selecionados`
            : (nome ? nome.textContent.trim() : 'Projeto');
        document.body.appendChild(g);
        arrasto.ghost = g;
    }
    arrasto.ghost.style.left = (e.clientX + 14) + 'px';
    arrasto.ghost.style.top = (e.clientY + 10) + 'px';

    if (e.clientY < 70) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);

    document.querySelectorAll('.drop-acima, .drop-abaixo, .drop-dentro')
        .forEach(r => r.classList.remove('drop-acima', 'drop-abaixo', 'drop-dentro'));
    arrasto.alvo = null;
    arrasto.dentro = undefined;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !el.closest) return;
    const podeIrPara = (pastaId: string | null) => arrasto.indices.every(i => {
        const origem = db[i];
        return origem && !(origem.tipo === 'pasta' && (origem.id === pastaId || ehDescendente(origem.id, pastaId)));
    });

    const zona = el.closest('[data-drop-pasta]') as HTMLElement;          // linha "voltar", Workspace e pastas do caminho
    if (zona) {
        const id = zona.dataset.dropPasta || null;
        if (podeIrPara(id)) { arrasto.dentro = id; zona.classList.add('drop-dentro'); }
        return;
    }
    const alvo = el.closest('#corpo-tabela tr') as HTMLElement;
    if (!alvo || !alvo.id.startsWith('linha-projeto-') || arrasto.indices.includes(Number(alvo.id.replace('linha-projeto-', '')))) return;
    const r = alvo.getBoundingClientRect();
    const rel = (e.clientY - r.top) / r.height;
    if (alvo.classList.contains('linha-pasta') && rel > .25 && rel < .75) {   // meio da pasta = colocar dentro
        const idPasta = db[Number(alvo.id.replace('linha-projeto-', ''))].id;
        if (podeIrPara(idPasta)) { arrasto.dentro = idPasta; alvo.classList.add('drop-dentro'); }
        return;
    }
    arrasto.alvo = alvo;
    arrasto.depois = rel > .5;
    alvo.classList.add(arrasto.depois ? 'drop-abaixo' : 'drop-acima');
});

function finalizarArrasto(e: PointerEvent, cancelar: boolean) {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    const a = arrasto;
    arrasto = null;
    if (!a.ativo) return;
    if (a.ghost) a.ghost.remove();
    document.body.classList.remove('arrastando');
    a.indices.forEach(i => document.getElementById(`linha-projeto-${i}`)?.classList.remove('arrastando-origem'));
    document.querySelectorAll('.drop-acima, .drop-abaixo, .drop-dentro').forEach(r => r.classList.remove('drop-acima', 'drop-abaixo', 'drop-dentro'));
    window.__arrastou = true;                       // evita abrir o projeto ao soltar
    setTimeout(() => { window.__arrastou = false; }, 0);
    if (cancelar) return;
    if (a.dentro !== undefined) { moverSelecaoParaPasta(a.indices, a.dentro); return; }
    if (ordenacaoAtual) return;
    if (!a.alvo) return;
    const para = Number(a.alvo.id.replace('linha-projeto-', ''));
    reordenarSelecao(a.indices, para, a.depois);
}
window.addEventListener('pointerup', e => finalizarArrasto(e, false));
window.addEventListener('pointercancel', e => finalizarArrasto(e, true));
document.addEventListener('click', e => {
    if (window.__arrastou) { e.stopPropagation(); e.preventDefault(); }
}, true);
document.addEventListener('dragstart', e => { if (arrasto && arrasto.ativo) e.preventDefault(); });
