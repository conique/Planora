/* Planora — js/pages/index/06-tags.js
   Tags dos projetos: criar, escolher existente, cor e remover.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 1076–1209. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- Tags dos projetos: criar, escolher existente, cor e remover ---------- */
const CORES_TAG = [
    '#3b82f6', '#22c55e', '#ef4444', '#f97316', '#eab308', '#a855f7',
    '#ec4899', '#14b8a6', '#6366f1', '#92400e', '#6b7280'
];
let popTags: PopTagsIndex | null = null;

function tagsExistentes() {
    const mapa = new Map();
    db.forEach(p => (p.tags || []).forEach(tg => {
        const k = tg.nome.toLowerCase() + '|' + tg.cor;
        if (!mapa.has(k)) mapa.set(k, { nome: tg.nome, cor: tg.cor });
    }));
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function fecharPopTags() {
    if (popTags) { popTags.el.remove(); popTags = null; }
}

function abrirPopTags(event: Event, index: number) {
    event.stopPropagation();
    if (popTags && popTags.index === index) return fecharPopTags();
    fecharPopTags();
    const el = document.createElement('div');
    el.className = 'pop-tags';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Tags do item');
    popTags = { index, el, cor: CORES_TAG[0], livres: [] };
    document.body.appendChild(el);

    el.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest('[data-acao]') as HTMLElement;
        if (!b) return;
        const acao = b.dataset.acao;
        if (acao === 'cor') definirCorPop(b.dataset.cor);
        else if (acao === 'remover') removerTag(Number(b.dataset.i));
        else if (acao === 'usar') adicionarTag(popTags.livres[Number(b.dataset.i)]);
        else if (acao === 'criar') criarTag();
    });
    el.addEventListener('input', e => {
        if ((e.target as HTMLElement).id === 'tag-cor-custom') definirCorPop((e.target as HTMLInputElement).value);
    });
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.target as HTMLElement).id === 'tag-nome') { e.preventDefault(); criarTag(); }
    });

    desenharPopTags();
    posicionarPopTags();
    const campo = el.querySelector('#tag-nome') as HTMLElement;
    if (campo) campo.focus();
}

function desenharPopTags() {
    const atuais = db[popTags.index].tags || [];
    const livres = tagsExistentes().filter(tg => !atuais.some(a => a.nome.toLowerCase() === tg.nome.toLowerCase()));
    popTags.livres = livres;
    const estilo = (c: Tag) => `background:${c.cor};color:${corTextoTag(c.cor)}`;
    popTags.el.innerHTML = `
        ${atuais.length ? `<div class="pop-sec"><div class="pop-tit">Neste item</div><div class="pop-chips">
            ${atuais.map((tg, i) => `<span class="tag-bolha tag-removivel" style="${estilo(tg)}">${escapeHTML(tg.nome)}<button type="button" data-acao="remover" data-i="${i}" aria-label="Remover tag ${escapeHTML(tg.nome)}">×</button></span>`).join('')}
        </div></div>` : ''}
        ${livres.length ? `<div class="pop-sec"><div class="pop-tit">Tags existentes</div><div class="pop-chips">
            ${livres.map((tg, i) => `<button type="button" class="tag-bolha tag-escolher" data-acao="usar" data-i="${i}" style="${estilo(tg)}">${escapeHTML(tg.nome)}</button>`).join('')}
        </div></div>` : ''}
        <div class="pop-sec"><div class="pop-tit">Nova tag</div>
            <input id="tag-nome" class="pop-input" maxlength="24" placeholder="Nome da tag" autocomplete="off">
            <div class="pop-cores">
                ${CORES_TAG.map(c => `<button type="button" class="cor-opcao${c === popTags.cor ? ' sel' : ''}" data-acao="cor" data-cor="${c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join('')}
                <label class="cor-opcao cor-custom${CORES_TAG.includes(popTags.cor) ? '' : ' sel'}" title="Outra cor"><input type="color" id="tag-cor-custom" value="${popTags.cor}"></label>
            </div>
            <button type="button" class="btn-salvar-inline pop-criar" data-acao="criar">Adicionar</button>
        </div>`;
}

function definirCorPop(cor: string) {
    popTags.cor = cor;
    popTags.el.querySelectorAll('.cor-opcao').forEach(b => b.classList.remove('sel'));
    const pre = popTags.el.querySelector(`.cor-opcao[data-cor="${cor}"]`);
    (pre || popTags.el.querySelector('.cor-custom')).classList.add('sel');
}

function posicionarPopTags() {
    const btn = document.querySelector(`${visaoAtual === 'kanban' ? '#kb-card-' : '#linha-projeto-'}${popTags.index} .btn-tag-mais`);
    if (!btn) return fecharPopTags();
    const r = btn.getBoundingClientRect(), el = popTags.el;
    el.style.maxHeight = (window.innerHeight - 16) + 'px';
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - 6 - h);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

function atualizarAposTag() {
    salvarBancoDeDados(db);
    renderizarTabela();
    desenharPopTags();
    posicionarPopTags();
}

function adicionarTag(tag: Tag) {
    if (!tag) return;
    const p = db[popTags.index];
    p.tags = p.tags || [];
    if (p.tags.some(x => x.nome.toLowerCase() === tag.nome.toLowerCase())) return;
    p.tags.push({ nome: tag.nome, cor: tag.cor });
    atualizarAposTag();
}

function criarTag() {
    const campo = popTags.el.querySelector('#tag-nome') as HTMLInputElement;
    const nome = campo.value.trim().slice(0, 24);
    if (!nome) { campo.focus(); return; }
    adicionarTag({ nome, cor: popTags.cor });
    const novo = popTags.el.querySelector('#tag-nome') as HTMLElement;
    if (novo) novo.focus();
}

function removerTag(i: number) {
    const p = db[popTags.index];
    (p.tags || []).splice(i, 1);
    atualizarAposTag();
}

document.addEventListener('pointerdown', e => {
    if (popTags && !popTags.el.contains((e.target as Node)) && !(e.target as HTMLElement).closest('.btn-tag-mais')) fecharPopTags();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharPopTags(); });
window.addEventListener('resize', () => { if (popTags) posicionarPopTags(); });
window.addEventListener('scroll', () => { if (popTags) posicionarPopTags(); }, true);
