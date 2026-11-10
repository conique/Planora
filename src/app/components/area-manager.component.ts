/* Planora — js/core/03-areas-ui.js
   Janela "Gerenciar áreas" e a API window.Planora_Areas.
   Trecho do antigo js/db.js, linhas 152–275. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function abrirGerenciadorAreas() {
    if (document.querySelector('.ar-overlay')) return;
    const usos = contarItensPorArea();
    let rascunho: AreaRascunho[] = listarAreas().map(a => ({ orig: a.nome, nome: a.nome, cor: a.cor, removida: false }));
    let paletaAberta: number | 'nova' | null = null;                       // índice do rascunho com a paleta aberta (ou 'nova')
    let corNova = PALETA_AREAS[rascunho.length % PALETA_AREAS.length];
    const o = document.createElement('div');
    o.className = 'lg-overlay ar-overlay';
    o.innerHTML = `<div class="lg-card ar-modal" role="dialog" aria-modal="true" aria-labelledby="ar-tit">
        <div class="modal-header"><h2 id="ar-tit">Áreas</h2><button class="btn-fechar" type="button" id="ar-fechar" aria-label="Fechar">×</button></div>
        <p class="ar-intro">Crie, renomeie, reordene e escolha a cor das áreas deste workspace. Renomear atualiza os itens; ao excluir uma área em uso, os itens passam para a primeira área da lista.</p>
        <ul class="ar-lista" id="ar-lista"></ul>
        <div class="ar-nova">
            <button type="button" class="ar-cor" id="ar-nova-cor" aria-label="Cor da nova área"></button>
            <input class="ar-campo" id="ar-nova-nome" maxlength="30" placeholder="Nova área (ex.: Suporte)" autocomplete="off" aria-label="Nome da nova área">
            <button type="button" class="ar-btn-pri" id="ar-add">Adicionar</button>
            <div class="ar-paleta" id="ar-nova-paleta" hidden></div>
        </div>
        <p class="ar-msg" role="alert" aria-live="polite"></p>
        <div class="ar-rodape"><button type="button" class="ar-btn-sec" id="ar-cancelar">Cancelar</button><button type="button" class="ar-btn-pri" id="ar-salvar">Salvar alterações</button></div>
    </div>`;
    document.body.appendChild(o);
    const q = (s: string) => o.querySelector(s);
    const msg = (t: string) => { q('.ar-msg').textContent = t; };
    const paletaHtml = (atual: string) => PALETA_AREAS.map(c => `<button type="button" class="cor-opcao${c.toLowerCase() === String(atual).toLowerCase() ? ' sel' : ''}" data-cor="${c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join('');
    function desenhar() {
        const vivas = rascunho.filter(a => !a.removida);
        q('#ar-lista').innerHTML = rascunho.map((a, i) => {
            if (a.removida) return '';
            const pos = vivas.indexOf(a), uso = a.orig ? (usos[a.orig] || 0) : 0;
            return `<li class="ar-linha" data-i="${i}" style="--cor-area:${a.cor}">
                <button class="ar-cor" type="button" data-acao="cor" aria-label="Escolher cor de ${escaparTag(a.nome)}"></button>
                <input class="ar-campo" data-acao="nome" maxlength="30" value="${escaparTag(a.nome)}" aria-label="Nome da área" autocomplete="off">
                <span class="ar-uso">${uso} ${uso === 1 ? 'item' : 'itens'}</span>
                <span class="ar-acoes">
                    <button class="ar-icone" type="button" data-acao="subir" title="Subir" aria-label="Subir"${pos === 0 ? ' disabled' : ''}>↑</button>
                    <button class="ar-icone" type="button" data-acao="descer" title="Descer" aria-label="Descer"${pos === vivas.length - 1 ? ' disabled' : ''}>↓</button>
                    <button class="ar-icone perigo" type="button" data-acao="excluir" title="Excluir" aria-label="Excluir"${vivas.length <= 1 ? ' disabled' : ''}>✕</button>
                </span>
                <div class="ar-paleta"${paletaAberta === i ? '' : ' hidden'}>${paletaHtml(a.cor)}</div>
            </li>`;
        }).join('');
        const nova = q('#ar-nova-cor') as HTMLElement, paletaNova = q('#ar-nova-paleta') as HTMLElement;
        nova.style.setProperty('--cor-area', corNova);
        paletaNova.hidden = paletaAberta !== 'nova';
        paletaNova.innerHTML = paletaHtml(corNova);
    }
    const fechar = () => { document.removeEventListener('keydown', tecla); o.remove(); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    o.addEventListener('mousedown', e => { if (e.target === o) fechar(); });
    (q('#ar-fechar') as HTMLElement).onclick = fechar;
    (q('#ar-cancelar') as HTMLElement).onclick = fechar;
    const lista = q('#ar-lista');
    lista.addEventListener('input', e => {
        const li = (e.target as HTMLElement).closest('.ar-linha') as HTMLElement;
        if (li && (e.target as HTMLElement).dataset.acao === 'nome') { rascunho[Number(li.dataset.i)].nome = (e.target as HTMLInputElement).value; msg(''); }
    });
    lista.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest('button');
        const li = (e.target as HTMLElement).closest('.ar-linha') as HTMLElement;
        if (!b || !li) return;
        const i = Number(li.dataset.i), a = rascunho[i];
        if (b.dataset.cor) { a.cor = b.dataset.cor; paletaAberta = null; return desenhar(); }
        const vivas = rascunho.filter(x => !x.removida);
        if (b.dataset.acao === 'cor') { paletaAberta = paletaAberta === i ? null : i; desenhar(); }
        else if (b.dataset.acao === 'subir' || b.dataset.acao === 'descer') {
            const pos = vivas.indexOf(a), vizinho = vivas[pos + (b.dataset.acao === 'subir' ? -1 : 1)];
            if (!vizinho) return;
            const j = rascunho.indexOf(vizinho);
            [rascunho[i], rascunho[j]] = [rascunho[j], rascunho[i]];
            paletaAberta = null;
            desenhar();
        } else if (b.dataset.acao === 'excluir' && vivas.length > 1) { a.removida = true; paletaAberta = null; msg(''); desenhar(); }
    });
    (q('#ar-nova-cor') as HTMLElement).onclick = () => { paletaAberta = paletaAberta === 'nova' ? null : 'nova'; desenhar(); };
    q('#ar-nova-paleta').addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest('button[data-cor]') as HTMLElement;
        if (b) { corNova = b.dataset.cor; paletaAberta = null; desenhar(); }
    });
    const nomeDuplicado = (nome: string, ignorar?: AreaRascunho) => rascunho.some(x => x !== ignorar && !x.removida && x.nome.trim().toLowerCase() === nome.toLowerCase());
    const adicionar = () => {
        const campo = q('#ar-nova-nome') as HTMLInputElement, nome = nomeAreaValido(campo.value);
        if (!nome) return msg('Digite um nome para a nova área.');
        if (nomeDuplicado(nome, null)) return msg('Já existe uma área com esse nome.');
        rascunho.push({ orig: null, nome, cor: corNova, removida: false });
        campo.value = '';
        corNova = PALETA_AREAS[(rascunho.filter(x => !x.removida).length) % PALETA_AREAS.length];
        msg('');
        desenhar();
        campo.focus();
    };
    (q('#ar-add') as HTMLElement).onclick = adicionar;
    q('#ar-nova-nome').addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); adicionar(); } });
    (q('#ar-salvar') as HTMLElement).onclick = () => {
        const vivas = rascunho.filter(a => !a.removida);
        if (!vivas.length) return msg('Mantenha pelo menos uma área.');
        const vistos = new Set();
        for (const a of vivas) {
            const nome = nomeAreaValido(a.nome);
            if (!nome) return msg('Toda área precisa de um nome.');
            if (vistos.has(nome.toLowerCase())) return msg('Há duas áreas com o nome "' + nome + '".');
            vistos.add(nome.toLowerCase());
            a.nome = nome;
        }
        const destino = vivas[0].nome;
        const emUso = rascunho.filter(a => a.removida && a.orig && (usos[a.orig] || 0) > 0);
        if (emUso.length) {
            const total = emUso.reduce((s, a) => s + usos[a.orig], 0);
            if (!confirm(`${total} ${total === 1 ? 'item usa' : 'itens usam'} a${emUso.length > 1 ? 's áreas excluídas' : ' área excluída'} (${emUso.map(a => a.orig).join(', ')}). ${total === 1 ? 'Ele passará' : 'Eles passarão'} para "${destino}". Continuar?`)) return;
        }
        const renomeios: Record<string, string> = {};
        rascunho.forEach(a => { if (a.orig) renomeios[a.orig] = a.removida ? destino : a.nome; });
        salvarAreas(vivas.map(a => ({ nome: a.nome, cor: a.cor })), renomeios);
        fechar();
    };
    desenhar();
    (q('#ar-nova-nome') as HTMLElement).focus();
}
window.Planora_Areas = {
    listar: listarAreas, nomes: nomesAreas, padrao: areaPadrao, cor: corDaArea, estilo: estiloArea,
    contar: contarItensPorArea, gerenciar: abrirGerenciadorAreas, paleta: PALETA_AREAS.slice()
};
