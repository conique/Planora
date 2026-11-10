/* Planora — js/pages/index/04-menus-e-edicao-rapida.js
   Menus ⋮ da tabela e do Kanban, edição rápida no Kanban e fechar menus flutuantes.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 649–781. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function alternarMenuTabela(
    event: Event,
    index: number
) {

    event.stopPropagation();


    document
        .querySelectorAll<HTMLElement>(
            '.menu-tabela-flutuante'
        )
        .forEach((m, i) => {

            if (i !== index) {
                m.style.display = 'none';
            }

        });


    const menu =
        document.getElementById(
            `menu-tabela-${index}`
        );


    const abrir = menu.style.display !== 'block';
    menu.style.display = abrir ? 'block' : 'none';
    if (!abrir) return;

    /* Menu "fixed": não é cortado pela rolagem/bordas da tabela. */
    const caixa = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const altura = menu.offsetHeight;
    const cabeAbaixo = caixa.bottom + 6 + altura <= window.innerHeight;
    menu.style.position = 'fixed';
    menu.style.left = 'auto';
    menu.style.right = (window.innerWidth - caixa.right) + 'px';
    menu.style.top = (cabeAbaixo ? caixa.bottom + 6 : Math.max(8, caixa.top - 6 - altura)) + 'px';

}

function alternarMenuKanban(event: Event, index: number) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-kanban-${index}`);
    const abrir = menu.style.display !== 'block';
    fecharMenusFlutuantes();
    if (abrir) {
        const botao = event.currentTarget as HTMLElement;
        document.body.appendChild(menu);
        menu.style.display = 'block';
        menu.style.position = 'fixed';

        const caixa = botao.getBoundingClientRect();
        const margem = 8;
        const largura = menu.offsetWidth;
        const altura = menu.offsetHeight;
        const esquerda = Math.max(margem, Math.min(
            caixa.right - largura,
            window.innerWidth - largura - margem
        ));
        const abaixo = window.innerHeight - caixa.bottom - margem;
        const topo = altura <= abaixo || caixa.top < altura + margem
            ? Math.min(caixa.bottom + 6, window.innerHeight - altura - margem)
            : caixa.top - altura - 6;

        menu.style.left = `${esquerda}px`;
        menu.style.right = 'auto';
        menu.style.top = `${Math.max(margem, topo)}px`;
    }
}

function editarNoKanban(index: number) {
    const p = db[index];
    if (!p) return;
    indiceEdicaoKanban = index;
    (document.getElementById('kanban-edit-nome') as HTMLInputElement).value = p.nome || '';
    document.getElementById('kanban-edit-rotulo').innerHTML = opcoesRotulos
        .map(r => `<option value="${escapeHTML(r.nome)}" ${r.nome === p.rotulo ? 'selected' : ''}>${escapeHTML(r.nome)}</option>`)
        .join('');
    document.getElementById('kanban-edit-area').innerHTML = opcoesAreaHtml(p.area);
    (document.getElementById('kanban-edit-prazo') as HTMLInputElement).value =
        p.prazo && p.prazo !== '---' ? p.prazo : '';
    document.getElementById('modalEditarKanban').style.display = 'flex';
    document.getElementById('kanban-edit-nome').focus();
}

function fecharEdicaoKanban() {
    document.getElementById('modalEditarKanban').style.display = 'none';
    indiceEdicaoKanban = null;
}

function salvarEdicaoKanban(event: Event) {
    event.preventDefault();
    const index = indiceEdicaoKanban;
    const nome = (document.getElementById('kanban-edit-nome') as HTMLInputElement).value.trim();
    if (index === null || !db[index]) return;
    if (!nome) {
        document.getElementById('kanban-edit-nome').focus();
        return;
    }
    db[index].nome = nome;
    db[index].rotulo = (document.getElementById('kanban-edit-rotulo') as HTMLInputElement).value;
    db[index].area = (document.getElementById('kanban-edit-area') as HTMLInputElement).value;
    db[index].prazo = (document.getElementById('kanban-edit-prazo') as HTMLInputElement).value || '---';
    salvarBancoDeDados(db);
    fecharEdicaoKanban();
    renderizarTabela();
}

function fecharMenusFlutuantes() {
    document.querySelectorAll<HTMLElement>('.menu-tabela-flutuante, .menu-card-flutuante')
        .forEach(menu => {
            menu.style.display = 'none';
            if (!menu.id.startsWith('menu-kanban-') || menu.parentElement !== document.body) return;

            const indice = menu.id.slice('menu-kanban-'.length);
            const card = document.getElementById(`kb-card-${indice}`);
            const topo = card && card.querySelector('.kb-card-topo');
            if (topo) topo.insertAdjacentElement('afterend', menu);

            menu.style.position = '';
            menu.style.left = '';
            menu.style.right = '';
            menu.style.top = '';
        });
}

window.addEventListener('scroll', fecharMenusFlutuantes, true);
window.onclick = fecharMenusFlutuantes;
