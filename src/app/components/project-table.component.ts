/* Planora — js/pages/index/03-tabela.js
   Desenho da tabela de projetos (renderizarTabela) e escapeHTML.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 422–648. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function renderizarTabela() {
    limparSelecaoCards();

    const tbody =
        document.getElementById(
            'corpo-tabela'
        );


    tbody.innerHTML = '';


    if (!db.length) {

        document.getElementById(
            'estado-vazio'
        ).style.display = 'block';


        document.getElementById(
            'conteudo-tabela'
        ).style.display = 'none';


        return;

    }


    document.getElementById(
        'estado-vazio'
    ).style.display = 'none';


    document.getElementById(
        'conteudo-tabela'
    ).style.display = 'block';


    validarPastaAtual();
    if (pastaAtual) tbody.appendChild(criarLinhaVoltar());
    const nivelAtual = calcularOrdemVisual();
    if (pastaAtual && !nivelAtual.length) tbody.appendChild(criarLinhaVazia());
    nivelAtual.forEach(index => {

        const projeto = db[index];

        const tr =
            document.createElement('tr');


        tr.id =
            `linha-projeto-${index}`;
        if (projeto.tipo === 'pasta') tr.className = 'linha-pasta';


        tr.onclick = e => {

            if (
                tr.classList.contains(
                    'em-edicao'
                )
            ) {
                return;
            }


            if (
                !(e.target as HTMLElement).closest(
                    '.col-acoes'
                ) &&
                !(e.target as HTMLElement).closest(
                    'select'
                ) &&
                !(e.target as HTMLElement).closest(
                    'input'
                ) &&
                !(e.target as HTMLElement).closest(
                    'button'
                )
            ) {

                if (projeto.tipo === 'pasta') irParaPasta(projeto.id);
                else location.href = `cards.html?id=${index}`;

            }

        };


        const rotulo =
            projeto.rotulo ||
            'Em andamento';


        const area = projeto.area || Planora_Areas.padrao();


        let prazo =
            projeto.prazo ||
            '---';


        if (
            prazo !== '---' &&
            prazo.includes('-')
        ) {

            const p =
                prazo.split('-');


            if (p.length === 3) {

                prazo =
                    `${p[2]}/${p[1]}/${p[0]}`;

            }

        }


        tr.innerHTML = `

            <td>

                <div class="col-nome">

                    <span class="alca-arrastar" title="Arraste para mover">⠿</span>

                    <span>${projeto.tipo === 'pasta' ? '📁' : '📄'}</span>

                    <span class="titulo-linha">${escapeHTML(projeto.nome)}${htmlDetalhesInline(projeto)}</span>
                    <span class="tags-linha">${(projeto.tags || []).map(htmlTagBolha).join('')}</span>
                    <button type="button" class="btn-tag-mais" onclick="abrirPopTags(event, ${index})" title="Adicionar tag" aria-label="Adicionar tag">+</button>

                </div>

            </td>


            <td>

                <span
                    class="selo selo-rotulo"
                    style="--glow:${obterCorRotulo(rotulo)}"
                >
                    ${escapeHTML(rotulo)}
                </span>

            </td>


            <td>

                <span class="pilula-area" style="${Planora_Areas.estilo(area)}">
                    ${escapeHTML(area)}
                </span>

            </td>


            <td>
                ${prazo}
            </td>


            <td class="col-acoes">

                <button
                    class="btn-tabela-opcoes"
                    onclick="alternarMenuTabela(event,${index})"
                >
                    ⋮
                </button>


                <div
                    class="menu-tabela-flutuante"
                    id="menu-tabela-${index}"
                >

                    <button
                        onclick="ativarEdicaoCompleta(${index})"
                    >
                        Editar
                    </button>


                    <button
                        onclick="${projeto.tipo === 'pasta' ? 'excluirPasta' : 'deletarProjeto'}(${index})"
                        style="color:#ff4d4d"
                    >
                        Deletar
                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


function escapeHTML(v: unknown) {

    return String(v ?? '')
        .replace(
            /[&<>"']/g,
            c => ({
                '&':'&amp;',
                '<':'&lt;',
                '>':'&gt;',
                '"':'&quot;',
                "'":'&#039;'
            }[c])
        );

}
