/* Planora — js/pages/index/07-selecao-multipla.js
   Seleção retangular de itens, mover seleção para pasta e reordenar seleção.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 1210–1336. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- Ordem personalizada: segurar e arrastar as linhas ---------- */
/* ---------- Visão Kanban: colunas por rótulo, arraste entre colunas muda o rótulo ---------- */
const itensSelecionados = new Set<number>();
let selecaoRetangular: SelecaoRetangularEstado | null = null;

function atualizarSelecaoCards() {
    document.querySelectorAll<HTMLElement>('.kb-card[data-idx], #corpo-tabela tr[id^="linha-projeto-"]').forEach(el => {
        const index = Number(el.dataset.idx || el.id.replace('linha-projeto-', ''));
        el.classList.toggle('selecionado', itensSelecionados.has(index));
    });
}

function limparSelecaoCards() {
    itensSelecionados.clear();
    atualizarSelecaoCards();
}

function indicesParaArrastar(index: number) {
    return itensSelecionados.has(index) ? [...itensSelecionados].sort((a, b) => a - b) : [index];
}

function iniciarSelecaoRetangular(e: PointerEvent) {
    if (e.button !== 0 || !(e.target as HTMLElement).closest) return;
    if (!document.body.contains((e.target as Node)) || (e.target as HTMLElement).closest(
        '.topo, .cabecalho-pagina, .footer-Planora, .modal-overlay, .lg-overlay, .pop-tags, .painel-lateral, .fundo-painel-lateral, ' +
        '.kb-card, .kb-col-topo, #corpo-tabela tr, thead, button, input, select, textarea, a'
    )) return;
    if (!e.ctrlKey && !e.metaKey) limparSelecaoCards();
    selecaoRetangular = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        ativo: false,
        manter: new Set(itensSelecionados),
        alternar: e.ctrlKey || e.metaKey,
        caixa: null
    };
}

document.addEventListener('pointerdown', iniciarSelecaoRetangular);
window.addEventListener('pointermove', e => {
    const s = selecaoRetangular;
    if (!s || e.pointerId !== s.id) return;
    if (!s.ativo) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 5) return;
        s.ativo = true;
        if (window.getSelection) window.getSelection().removeAllRanges();
        s.caixa = document.createElement('div');
        s.caixa.className = 'caixa-selecao';
        document.body.appendChild(s.caixa);
        document.body.classList.add('selecionando-cards');
    }
    const esquerda = Math.min(s.x, e.clientX), topo = Math.min(s.y, e.clientY);
    const largura = Math.abs(e.clientX - s.x), altura = Math.abs(e.clientY - s.y);
    Object.assign(s.caixa.style, { left: `${esquerda}px`, top: `${topo}px`, width: `${largura}px`, height: `${altura}px` });
    const atingidos = new Set<number>();
    const seletor = visaoAtual === 'kanban' ? '#kanban .kb-card[data-idx]' : '#corpo-tabela tr[id^="linha-projeto-"]';
    document.querySelectorAll<HTMLElement>(seletor).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > esquerda && r.left < esquerda + largura && r.bottom > topo && r.top < topo + altura) {
            atingidos.add(Number(el.dataset.idx || el.id.replace('linha-projeto-', '')));
        }
    });
    itensSelecionados.clear();
    s.manter.forEach(i => itensSelecionados.add(i));
    atingidos.forEach(i => {
        if (s.alternar && s.manter.has(i)) itensSelecionados.delete(i);
        else itensSelecionados.add(i);
    });
    atualizarSelecaoCards();
});
window.addEventListener('pointerup', e => {
    const s = selecaoRetangular;
    if (!s || e.pointerId !== s.id) return;
    selecaoRetangular = null;
    if (s.caixa) s.caixa.remove();
    document.body.classList.remove('selecionando-cards');
    if (s.ativo) {
        window.__arrastou = true;
        setTimeout(() => { window.__arrastou = false; }, 0);
    }
});
window.addEventListener('pointercancel', e => {
    if (!selecaoRetangular || e.pointerId !== selecaoRetangular.id) return;
    if (selecaoRetangular.caixa) selecaoRetangular.caixa.remove();
    selecaoRetangular = null;
    document.body.classList.remove('selecionando-cards');
});
document.addEventListener('click', e => {
    if (window.__arrastou || (!e.ctrlKey && !e.metaKey)) return;
    const item = ((e.target as HTMLElement).closest && (e.target as HTMLElement).closest('.kb-card[data-idx], #corpo-tabela tr[id^="linha-projeto-"]')) as HTMLElement;
    if (!item || (e.target as HTMLElement).closest('button, a, input, select')) return;
    const index = Number(item.dataset.idx || item.id.replace('linha-projeto-', ''));
    if (itensSelecionados.has(index)) itensSelecionados.delete(index);
    else itensSelecionados.add(index);
    atualizarSelecaoCards();
    e.preventDefault();
    e.stopPropagation();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') limparSelecaoCards(); });

function moverSelecaoParaPasta(indices: number[], pastaId: string | null) {
    const itens = indices.map(i => db[i]).filter(Boolean);
    if (!itens.length || itens.some(item => item.tipo === 'pasta' && (item.id === pastaId || ehDescendente(item.id, pastaId)))) return false;
    const conjunto = new Set(itens);
    itens.forEach(item => { item.pai = pastaId || null; });
    db.splice(0, db.length, ...db.filter(item => !conjunto.has(item)), ...itens);
    limparSelecaoCards();
    salvarPastas();
    return true;
}

function reordenarSelecao(indices: number[], alvoIndex: number, depois: boolean) {
    const itens = indices.map(i => db[i]).filter(Boolean);
    const alvo = db[alvoIndex];
    if (!itens.length || !alvo || itens.includes(alvo)) return false;
    const conjunto = new Set(itens);
    const restante = db.filter(item => !conjunto.has(item));
    const posicaoAlvo = restante.indexOf(alvo);
    if (posicaoAlvo < 0) return false;
    restante.splice(posicaoAlvo + (depois ? 1 : 0), 0, ...itens);
    db.splice(0, db.length, ...restante);
    limparSelecaoCards();
    salvarPastas();
    return true;
}
