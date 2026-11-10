/* Planora — js/core/08-workspaces-ui.js
   Janelas para pedir o nome de um workspace.
   Trecho do antigo js/db.js, linhas 771–829. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* Janela simples para dar nome a um novo workspace (usada pelo painel lateral). */
function pedirNomeWorkspace(): Promise<string | null> {
    return new Promise(res => {
        const o = document.createElement('div');
        o.className = 'lg-overlay';
        o.innerHTML = `<div class="lg-card" role="dialog" aria-modal="true" aria-labelledby="ws-nome-tit">
            <div class="lg-logo">+</div><h2 id="ws-nome-tit">Novo workspace</h2>
            <p class="lg-sub">Dê um nome para o novo espaço. Ele começa vazio e não mexe nos seus outros workspaces.</p>
            <label>Nome<input id="ws-nome-in" type="text" maxlength="60" placeholder="Ex.: Projetos 2026" autocomplete="off"></label>
            <p class="lg-msg" role="alert"></p>
            <button class="lg-principal" id="ws-nome-ok" type="button">Criar e entrar</button>
            <div class="lg-links"><button id="ws-nome-cancelar" type="button">Cancelar</button></div></div>`;
        document.body.appendChild(o);
        const inp = o.querySelector('#ws-nome-in') as HTMLInputElement, msg = o.querySelector('.lg-msg');
        const fechar = (v: string | null) => { document.removeEventListener('keydown', tecla); o.remove(); res(v); };
        const confirmar = () => {
            const n = nomeWsValido(inp.value);
            if (!n) { msg.textContent = 'Digite um nome para o workspace.'; return; }
            if (listaWorkspaces.some(w => w.nome.toLowerCase() === n.toLowerCase())) { msg.textContent = 'Você já tem um workspace com esse nome.'; return; }
            fechar(n);
        };
        const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(null); };
        document.addEventListener('keydown', tecla);
        (o.querySelector('#ws-nome-ok') as HTMLElement).onclick = confirmar;
        (o.querySelector('#ws-nome-cancelar') as HTMLElement).onclick = () => fechar(null);
        inp.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') confirmar(); });
        inp.focus();
    });
}
function pedirNovoNomeWorkspace(ws: Workspace): Promise<string | null> {
    return new Promise(res => {
        const o = document.createElement('div');
        o.className = 'lg-overlay';
        o.innerHTML = `<div class="lg-card" role="dialog" aria-modal="true" aria-labelledby="ws-renomear-tit">
            <div class="lg-logo">✎</div><h2 id="ws-renomear-tit">Renomear workspace</h2>
            <p class="lg-sub">O nome novo aparecerá no seletor e no painel lateral.</p>
            <label>Nome<input id="ws-renomear-in" type="text" maxlength="60" autocomplete="off"></label>
            <p class="lg-msg" role="alert"></p>
            <button class="lg-principal" id="ws-renomear-ok" type="button">Salvar nome</button>
            <div class="lg-links"><button id="ws-renomear-cancelar" type="button">Cancelar</button></div></div>`;
        document.body.appendChild(o);
        const inp = o.querySelector('#ws-renomear-in') as HTMLInputElement, msg = o.querySelector('.lg-msg');
        inp.value = ws.nome;
        const fechar = (v: string | null) => { document.removeEventListener('keydown', tecla); o.remove(); res(v); };
        const confirmar = () => {
            const nome = nomeWsValido(inp.value);
            if (!nome) { msg.textContent = 'Digite um nome para o workspace.'; return; }
            fechar(nome);
        };
        const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(null); };
        document.addEventListener('keydown', tecla);
        (o.querySelector('#ws-renomear-ok') as HTMLElement).onclick = confirmar;
        (o.querySelector('#ws-renomear-cancelar') as HTMLElement).onclick = () => fechar(null);
        inp.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') confirmar(); });
        inp.focus();
        inp.select();
    });
}
