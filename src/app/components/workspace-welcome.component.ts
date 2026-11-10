/* Planora — js/core/09-boas-vindas-ui.js
   Tela de boas-vindas (escolher ou criar workspace).
   Trecho do antigo js/db.js, linhas 830–1017. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- tela de boas-vindas: escolher um workspace existente ou criar outro ---------- */
function telaBoasVindas(lista: Workspace[]): Promise<Workspace & { __importouLocal?: boolean }> {
    return new Promise(res => {
        const o = document.createElement('div');
        o.className = 'lg-overlay ws-overlay';
        document.body.appendChild(o);
        const ultimoId = (() => { try { return localStorage.getItem(ULTIMO_WS + ':' + usuario.id); } catch (e) { return null; } })();
        const primeiroNome = escaparTag((usuario.email || '').split('@')[0] || 'por aqui');
        const matiz = (id: string) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
        const vazio = !lista.length;
        const ICONE_EDITAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>';
        let editandoId: string | null = null;
        const inicialDe = (w: Workspace) => escaparTag((w.nome.trim()[0] || '?').toUpperCase());
        const cartao = (w: Workspace) => {
            const h = matiz(w.id), ultimo = w.id === ultimoId, id = escaparTag(w.id);
            const meta = [w.created_at ? 'Criado em ' + dataCurta(w.created_at) : '', w.atualizado_em ? 'Atualizado em ' + dataCurta(w.atualizado_em) : ''].filter(Boolean).join(' · ');
            if (w.id === editandoId) {
                return `<div class="ws-item editando" role="listitem" data-id="${id}">
                    <form class="ws-editar-form" data-form="${id}" novalidate>
                        <span class="ws-avatar" style="--h:${h}" aria-hidden="true">${inicialDe(w)}</span>
                        <input class="ws-editar-campo" type="text" maxlength="60" autocomplete="off" value="${escaparTag(w.nome)}" aria-label="Novo nome do workspace">
                        <div class="ws-editar-acoes"><button class="btn-cancelar-edicao" type="button" data-cancelar>Cancelar</button><button class="btn-salvar-inline" type="submit">Salvar</button></div>
                        <p class="ws-editar-msg" role="alert" aria-live="polite"></p>
                    </form></div>`;
            }
            return `<div class="ws-item${ultimo ? ' ws-card-ultimo' : ''}" role="listitem" data-id="${id}">
                <button class="ws-card" type="button" data-id="${id}">
                    <span class="ws-avatar" style="--h:${h}" aria-hidden="true">${inicialDe(w)}</span>
                    <span class="ws-card-texto"><span class="ws-card-titulo"><span class="ws-card-nome">${escaparTag(w.nome)}</span>${ultimo ? '<span class="ws-etiqueta ws-etiqueta-ultimo">Último acesso</span>' : ''}</span><span class="ws-card-meta">${escaparTag(meta)}</span></span>
                </button>
                <button class="ws-editar" type="button" data-editar="${id}" title="Editar nome" aria-label="Editar nome de ${escaparTag(w.nome)}">${ICONE_EDITAR}</button>
            </div>`;
        };
        o.innerHTML = `<button class="btn-tema ws-theme-toggle" id="ws-tema" type="button" aria-label="Ativar modo claro" title="Ativar modo claro"></button>
            <main class="ws-conteudo">
                <header class="ws-hero">
                    <div class="ws-marca"> <img src="assets/planora-logo.png" alt="Planora"> </div>
                    <p class="ws-ola">${vazio ? 'Que bom ter você aqui' : 'Olá'}, <strong>${primeiroNome}</strong></p>
                    <h1>Bem-vindo ao <span>Planora</span></h1>
                    <p class="ws-sub">${vazio
                        ? 'Vamos começar criando seu primeiro workspace, um espaço só seu para organizar projetos, páginas e cards.'
                        : 'Entre em um dos seus workspaces para continuar de onde parou, ou crie um novo espaço separado para outro contexto.'}</p>
                </header>
                <section class="ws-secao ws-novo" aria-labelledby="ws-tit-novo"${vazio ? '' : ' hidden'}>
                    <div class="ws-secao-topo"><h2 id="ws-tit-novo">${vazio ? 'Criar meu primeiro workspace' : 'Novo workspace'}</h2></div>
                    <div class="ws-novo-linha">
                        <label class="ws-campo"><span class="ws-campo-rot">Nome do workspace</span>
                            <input id="ws-novo-nome" type="text" maxlength="60" autocomplete="off" placeholder="Ex.: Projetos 2026" value="${vazio ? 'Meu workspace' : ''}"></label>
                        <div class="ws-acoes-novo"><button class="ws-btn-criar" id="ws-novo-ok" type="button">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14"></path></svg>
                            <span>Criar e entrar</span></button>${vazio ? '' : '<button class="ws-btn-cancelar" id="ws-novo-cancelar" type="button">Cancelar</button>'}</div>
                    </div>
                    <p class="ws-msg" role="alert" aria-live="polite"></p>
                </section>
                ${vazio ? '' : `<section class="ws-secao ws-secao-lista" aria-labelledby="ws-tit-lista">
                    <div class="ws-secao-topo"><div class="ws-secao-titulo"><h2 id="ws-tit-lista">Entrar em um workspace</h2><span class="ws-contagem">${lista.length}</span></div>
                        <button class="ws-btn-novo-workspace" id="ws-adicionar" type="button" aria-expanded="false">+ Novo workspace</button></div>
                    <div class="ws-lista" role="list"></div>
                </section>`}
            </main>
            <footer class="footer-Planora ws-footer-padrao">
                <span class="ponto"></span><strong>Planora</strong><span>© 2026</span>
                <span id="status-nuvem" class="status-nuvem" role="img" aria-label="Status da nuvem"></span>
                <span id="email-usuario" class="email-usuario">${escaparTag(usuario.email || '')}</span>
                <button type="button" class="btn-rodape" id="ws-sair">Sair</button>
            </footer>`;
        const q = (s: string) => o.querySelector(s), msg = (t: string) => { q('.ws-msg').textContent = t; };
        /* O footer é criado dinamicamente nesta tela. Reaplica o último status para desenhar o ícone da nuvem. */
        setStatus(ultimoStatus || 'Salvo na nuvem');
        const btnTema = q('#ws-tema') as HTMLElement;
        const ICONE_SOL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
        const ICONE_LUA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';
        function atualizarBotaoTema() {
            if (!btnTema) return;
            const claro = document.documentElement.dataset.tema === 'claro';
            btnTema.innerHTML = claro ? ICONE_LUA : ICONE_SOL;
            btnTema.title = claro ? 'Ativar modo escuro' : 'Ativar modo claro';
            btnTema.setAttribute('aria-label', btnTema.title);
        }
        if (btnTema) {
            btnTema.addEventListener('click', () => {
                const novo = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro';
                document.documentElement.dataset.tema = novo;
                try { localStorage.setItem('Planora_tema', novo); } catch (e) { /* sem armazenamento */ }
                const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
                if (meta) meta.content = novo === 'claro' ? '#f3f5f9' : '#111316';
                atualizarBotaoTema();
            });
            atualizarBotaoTema();
        }
        const concluir = (ws: Workspace) => { o.remove(); res(ws); };
        /* lista de workspaces: entrar, editar o nome (inline) e cancelar */
        const elLista = q('.ws-lista');
        const desenharLista = () => { if (elLista) elLista.innerHTML = lista.map(cartao).join(''); };
        const abrirEdicao = (id: string) => {
            editandoId = id;
            desenharLista();
            const campo = (elLista.querySelector('.ws-editar-campo') as HTMLElement) as HTMLInputElement;
            if (campo) { campo.focus(); campo.select(); }
        };
        if (elLista) {
            desenharLista();
            elLista.addEventListener('click', e => {
                const editar = (e.target as HTMLElement).closest('[data-editar]') as HTMLElement;
                if (editar) return abrirEdicao(editar.dataset.editar);
                if ((e.target as HTMLElement).closest('[data-cancelar]')) { editandoId = null; return desenharLista(); }
                const entrar = (e.target as HTMLElement).closest('.ws-card[data-id]') as HTMLElement;
                if (entrar) concluir(lista.find(w => w.id === entrar.dataset.id));
            });
            elLista.addEventListener('keydown', e => {
                if ((e as KeyboardEvent).key === 'Escape' && editandoId) { e.stopPropagation(); editandoId = null; desenharLista(); }
            });
            elLista.addEventListener('submit', async e => {
                e.preventDefault();
                const form = (e.target as HTMLElement).closest('form[data-form]') as HTMLElement;
                if (!form) return;
                const campo = form.querySelector('.ws-editar-campo') as HTMLInputElement, aviso = form.querySelector('.ws-editar-msg');
                const salvar = form.querySelector('[type="submit"]') as HTMLButtonElement;
                salvar.disabled = true; aviso.textContent = '';
                try {
                    await salvarNomeWorkspace(form.dataset.form, campo.value);
                    editandoId = null;
                    desenharLista();
                } catch (erro) {
                    console.error(erro);
                    salvar.disabled = false;
                    aviso.textContent = erro.code === '42501'
                        ? 'Sem permissão para renomear. Confira a política de UPDATE no Supabase (supabase/02_politicas_workspaces.sql).'
                        : (erro.message || 'Não foi possível renomear o workspace.');
                    campo.focus();
                }
            });
        }
        const adicionar = q('#ws-adicionar') as HTMLElement;
        let formularioWsAberto = vazio;
        const abrirFecharWorkspace = (abrir: boolean, focar: boolean) => {
            const form = q('.ws-novo') as HTMLElement;
            formularioWsAberto = abrir;
            if (!adicionar || vazio) return;
            if (abrir) {
                form.hidden = false;
                form.classList.remove('fechando', 'entrando');
                void form.offsetWidth;
                form.classList.add('entrando');
                if (focar) setTimeout(() => (q('#ws-novo-nome') as HTMLElement).focus(), 120);
            } else {
                form.classList.remove('entrando');
                form.classList.add('fechando');
                setTimeout(() => {
                    if (!formularioWsAberto) {
                        form.hidden = true;
                        form.classList.remove('fechando');
                    }
                }, 220);
            }
            adicionar.setAttribute('aria-expanded', String(abrir));
        };
        if (adicionar) adicionar.onclick = () => abrirFecharWorkspace(!formularioWsAberto, true);
        const cancelarNovo = q('#ws-novo-cancelar') as HTMLElement;
        if (cancelarNovo) cancelarNovo.onclick = () => {
            (q('#ws-novo-nome') as HTMLInputElement).value = '';
            msg('');
            abrirFecharWorkspace(false, false);
        };
        (q('#ws-sair') as HTMLElement).onclick = () => sairDaConta();
        const criar = async () => {
            const btn = q('#ws-novo-ok') as HTMLButtonElement, inp = q('#ws-novo-nome') as HTMLInputElement;
            const nome = nomeWsValido(inp.value);
            if (!nome) return msg('Digite um nome para o workspace.');
            btn.disabled = true; msg('');
            try {
                /* primeiro workspace de quem ainda tinha dados só neste navegador: leva esses dados junto */
                const locais = vazio ? dadosLocaisAntigos() : null;
                const ws = await criarWorkspace(nome, locais);
                ws.__importouLocal = !!locais;
                concluir(ws);
            } catch (e) {
                console.error(e);
                btn.disabled = false;
                msg(e && e.code === '42501' ? 'Sem permissão para criar workspaces. Verifique as políticas RLS no Supabase.' : (e.message || 'Não foi possível criar o workspace.'));
            }
        };
        (q('#ws-novo-ok') as HTMLElement).onclick = criar;
        q('#ws-novo-nome').addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') criar(); });
        if (vazio) (q('#ws-novo-nome') as HTMLElement).focus();
    });
}
