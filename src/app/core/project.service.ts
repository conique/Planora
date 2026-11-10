/* Planora — js/pages/index/05-projetos-crud.js
   Janela de novo projeto, salvar, edição completa na linha e exclusão.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 782–1075. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function abrirModal() {

    renderizarOpcoesAreaNovaPagina();

    document.getElementById(
        'modalNovaPagina'
    ).style.display = 'flex';


    setTimeout(
        () =>
            document
                .getElementById(
                    'nomePagina'
                )
                .focus(),
        50
    );

}


function fecharModal() {

    document.getElementById(
        'modalNovaPagina'
    ).style.display = 'none';

}


async function salvarNovoProjeto() {

    const nome =
        (document
            .getElementById(
                'nomePagina'
            ) as HTMLInputElement)
            .value
            .trim();


    if (!nome)
        return;


    const area =
        (document.querySelector(
            'input[name="tipoPagina"]:checked'
        ) as HTMLInputElement).value;


    db.push({

        nome,

        rotulo:
            opcoesRotulos[0]?.nome ||
            'Em andamento',

        area,

        prazo:'---',

        pai: pastaAtual || null,
        cards:[]

    });


    salvarBancoDeDados(db);
    await descarregarNuvem();
    location.href =
        `cards.html?id=${db.length - 1}`;

}


document
    .getElementById('nomePagina')
    .addEventListener(
        'keydown',
        e => {

            if (e.key === 'Enter')
                salvarNovoProjeto();


            if (e.key === 'Escape')
                fecharModal();

        }
    );


function ativarEdicaoCompleta(index: number) {

    const linhaEmEdicao =
        document.querySelector(
            '#corpo-tabela tr.em-edicao'
        );

    if (linhaEmEdicao) {
        if (linhaEmEdicao.id === `linha-projeto-${index}`) return;
        renderizarTabela();
    }

    const p =
        db[index];


    const tr =
        document.getElementById(
            `linha-projeto-${index}`
        );


    tr.classList.add(
        'em-edicao'
    );


    document
        .getElementById(
            `nome-container-${index}`
        )
        ?.remove();


    tr.innerHTML = `

        <td>

            <input
                id="edit-nome-${index}"
                class="input-inline-tabela"
                value="${escapeHTML(p.nome)}"
            >

        </td>


        <td>

            <select
                id="edit-rotulo-${index}"
                class="select-inline-tabela"
            >

                ${opcoesRotulos
                    .map(
                        r =>
                            `<option
                                ${r.nome === p.rotulo ? 'selected' : ''}
                            >
                                ${escapeHTML(r.nome)}
                            </option>`
                    )
                    .join('')
                }

            </select>

        </td>


        <td>

            <select
                id="edit-area-${index}"
                class="select-inline-tabela"
            >

                ${opcoesAreaHtml(p.area)}

            </select>

        </td>


        <td>

            <input
                type="date"
                id="edit-prazo-${index}"
                class="input-inline-tabela"
                value="${
                    p.prazo &&
                    p.prazo !== '---'
                        ? p.prazo
                        : ''
                }"
            >

        </td>


        <td class="col-acoes">

            <button
                class="btn-salvar-inline"
                onclick="salvarEdicaoCompleta(${index})"
            >
                Salvar
            </button>

        </td>

    `;

}


function salvarEdicaoCompleta(index: number) {

    const nome =
        (document
            .getElementById(
                `edit-nome-${index}`
            ) as HTMLInputElement)
            .value
            .trim();


    if (!nome) {

        alert(
            'O título do projeto não pode ser vazio.'
        );

        return;

    }


    db[index].nome =
        nome;


    db[index].rotulo =
        (document
            .getElementById(
                `edit-rotulo-${index}`
            ) as HTMLInputElement)
            .value;


    db[index].area =
        (document
            .getElementById(
                `edit-area-${index}`
            ) as HTMLInputElement)
            .value;


    db[index].prazo =
        (document
            .getElementById(
                `edit-prazo-${index}`
            ) as HTMLInputElement)
            .value ||
        '---';


    salvarBancoDeDados(db);

    renderizarTabela();

}


function deletarProjeto(index: number) {

    if (
        confirm(
            `Tem certeza que deseja deletar o projeto "${db[index].nome}"?`
        )
    ) {

        db.splice(
            index,
            1
        );


        salvarBancoDeDados(db);

        renderizarTabela();

    }

}
