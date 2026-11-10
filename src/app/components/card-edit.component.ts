/* Planora — js/pages/cards/11-edicao-de-card.js
   Edição de card existente (texto, mídia, pré-visualização).
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 1306–1775. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        /* =========================================================
           EDIÇÃO DO CARD
        ========================================================= */

        async function ativarEdicaoCard(index: number) {

            const btnOpcoes =
                document.getElementById(
                    `btn-opcoes-${index}`
                );

            if (btnOpcoes) {
                btnOpcoes.style.display = 'none';
            }

            const menu =
                document.getElementById(
                    `menu-card-${index}`
                );

            if (menu) {
                menu.style.display = 'none';
            }

            const card =
                projetoAtual.cards[index];

            const containerConteudo =
                document.getElementById(
                    `card-conteudo-${index}`
                );

            if (!containerConteudo) return;

            const legendaPura =
                card.legenda
                    ? card.legenda.replace(
                        /<br\s*[\/]?>/gi,
                        '\n'
                    )
                    : '';

            window[
                `midiaTemporariaEdicao_${index}`
            ] = {
                blob: null,
                tipo: card.tipoMidia || null,
                midiaId: card.midiaId || null,
                urlPreview: null,
                removida: false
            };

            let previewInicialHTML = '';

            /*
             * Card antigo com Base64.
             */
            if (card.midia) {

                const tag =
                    card.tipoMidia &&
                    card.tipoMidia.startsWith('video')
                        ? 'video'
                        : 'img';

                previewInicialHTML = `
                    <div class="preview-midia-wrapper">

                        <${tag}
                            src="${card.midia}"
                            ${tag === 'video' ? 'controls' : ''}
                        ></${tag}>

                        <button
                            class="btn-remover-preview"
                            onclick="removerMidiaEdicao(${index})"
                            title="Remover mídia"
                            type="button"
                        >
                            ×
                        </button>

                    </div>
                `;
            }

            /*
             * Card novo com IndexedDB.
             */
            else if (card.midiaId) {

                const registro =
                    await obterMidiaBlob(
                        card.midiaId
                    );

                if (
                    registro &&
                    registro.blob
                ) {

                    const url =
                        URL.createObjectURL(
                            registro.blob
                        );

                    window[
                        `midiaTemporariaEdicao_${index}`
                    ].blob =
                        registro.blob;

                    window[
                        `midiaTemporariaEdicao_${index}`
                    ].urlPreview =
                        url;

                    const tag =
                        registro.tipo &&
                        registro.tipo.startsWith('video')
                            ? 'video'
                            : 'img';

                    previewInicialHTML = `
                        <div class="preview-midia-wrapper">

                            <${tag}
                                src="${url}"
                                ${tag === 'video' ? 'controls' : ''}
                            ></${tag}>

                            <button
                                class="btn-remover-preview"
                                onclick="removerMidiaEdicao(${index})"
                                title="Remover mídia"
                                type="button"
                            >
                                ×
                            </button>

                        </div>
                    `;
                }
            }

            containerConteudo.style.cursor = 'default';
            containerConteudo.removeAttribute('ondblclick');
            containerConteudo.removeAttribute('title');

            containerConteudo.innerHTML = `

                <select
                    id="edit-tipo-${index}"
                    class="seletor-tipo"
                    style="margin-bottom: 10px;"
                >
                    <option value="Atualização" ${card.tipo === 'Atualização' ? 'selected' : ''}>Atualização</option>
                    <option value="Tarefa" ${card.tipo === 'Tarefa' ? 'selected' : ''}>Tarefa</option>
                    <option value="Reunião" ${card.tipo === 'Reunião' ? 'selected' : ''}>Reunião</option>
                    <option value="Decisão" ${card.tipo === 'Decisão' ? 'selected' : ''}>Decisão</option>
                </select>

                <input
                    type="text"
                    id="edit-titulo-${index}"
                    class="input-titulo-card"
                    value="${card.titulo || ''}"
                    placeholder="Título do card"
                >

                <textarea
                    id="edit-legenda-${index}"
                    class="input-legenda-card"
                    rows="3"
                    placeholder="Escreva a legenda ou cole uma imagem/vídeo aqui (Ctrl+V)..."
                    onpaste="capturarColeEdicao(event, ${index})"
                >${escaparHTML(legendaPura)}</textarea>

                <div id="container-preview-edicao-${index}">
                    ${previewInicialHTML}
                </div>

                <div style="margin-top: 10px;">

                    <label
                        class="label-file"
                        for="edit-novo-arquivo-${index}"
                    >
                        📁 Inserir Imagem/Vídeo
                    </label>

                    <input
                        type="file"
                        id="edit-novo-arquivo-${index}"
                        class="input-file-culto"
                        accept="image/*,video/*"
                        onchange="carregarArquivoEdicao(this, ${index})"
                    >

                    <button
                        class="btn-cancelar-edicao"
                        onclick="cancelarEdicaoCard(${index})"
                        type="button"
                    >
                        Cancelar edição
                    </button>

                </div>

                <button
                    class="btn-enviar-card"
                    onclick="salvarEdicaoCard(${index})"
                    type="button"
                    title="Salvar alterações"
                >
                    Salvar ↵
                </button>
            `;

            const campoTitulo =
                document.getElementById(
                    `edit-titulo-${index}`
                ) as HTMLInputElement;

            if (campoTitulo) {
                campoTitulo.focus();
                campoTitulo.select();
            }
        }


        /* =========================================================
           CANCELAR EDIÇÃO
        ========================================================= */

        function cancelarEdicaoCard(index: number) {

            const dados =
                window[
                    `midiaTemporariaEdicao_${index}`
                ];

            if (
                dados &&
                dados.urlPreview
            ) {
                URL.revokeObjectURL(
                    dados.urlPreview
                );
            }

            delete window[
                `midiaTemporariaEdicao_${index}`
            ];

            renderizarTimeline();
        }


        /* =========================================================
           COLAR MÍDIA NA EDIÇÃO
        ========================================================= */

        function capturarColeEdicao(event: Event, index: number) {

            const clipboard =
                (event as ClipboardEvent).clipboardData ||
                window.clipboardData;

            if (!clipboard || !clipboard.items) return;

            for (const item of clipboard.items) {

                if (
                    item.type.indexOf('image') === 0 ||
                    item.type.indexOf('video') === 0
                ) {

                    event.preventDefault();

                    const blob =
                        item.getAsFile();

                    if (!blob) return;

                    prepararMidiaEdicao(
                        index,
                        blob
                    );

                    return;
                }
            }
        }


        /* =========================================================
           ARQUIVO NA EDIÇÃO
        ========================================================= */

        function carregarArquivoEdicao(
            input: HTMLInputElement,
            index: number
        ) {

            if (
                input.files &&
                input.files[0]
            ) {

                prepararMidiaEdicao(
                    index,
                    input.files[0]
                );
            }
        }


        async function prepararMidiaEdicao(
            index: number,
            blob: Blob
        ) {

            const anterior =
                window[
                    `midiaTemporariaEdicao_${index}`
                ];

            if (
                anterior &&
                anterior.urlPreview
            ) {

                URL.revokeObjectURL(
                    anterior.urlPreview
                );
            }

            window[
                `midiaTemporariaEdicao_${index}`
            ] = {

                blob: blob,

                tipo: blob.type,

                midiaId:
                    anterior
                        ? anterior.midiaId
                        : null,

                urlPreview:
                    URL.createObjectURL(blob),

                removida: false
            };

            atualizarPreviewEdicao(index);
        }


        /* =========================================================
           PREVIEW DA EDIÇÃO
        ========================================================= */

        function atualizarPreviewEdicao(index: number) {

            const container =
                document.getElementById(
                    `container-preview-edicao-${index}`
                );

            const dados =
                window[
                    `midiaTemporariaEdicao_${index}`
                ];

            if (
                !container ||
                !dados ||
                !dados.blob
            ) {

                if (container) {
                    container.innerHTML = '';
                }

                return;
            }

            const tag =
                dados.tipo &&
                dados.tipo.startsWith('video')
                    ? 'video'
                    : 'img';

            container.innerHTML = `

                <div class="preview-midia-wrapper">

                    <${tag}
                        src="${dados.urlPreview}"
                        ${tag === 'video' ? 'controls' : ''}
                    ></${tag}>

                    <button
                        class="btn-remover-preview"
                        onclick="removerMidiaEdicao(${index})"
                        title="Remover mídia"
                        type="button"
                    >
                        ×
                    </button>

                </div>
            `;
        }


        /* =========================================================
           REMOVER MÍDIA DA EDIÇÃO
        ========================================================= */

        function removerMidiaEdicao(index: number) {

            const dados =
                window[
                    `midiaTemporariaEdicao_${index}`
                ];

            if (
                dados &&
                dados.urlPreview
            ) {

                URL.revokeObjectURL(
                    dados.urlPreview
                );
            }

            window[
                `midiaTemporariaEdicao_${index}`
            ] = {

                blob: null,

                tipo: null,

                midiaId:
                    dados
                        ? dados.midiaId
                        : null,

                urlPreview: null,

                removida: true
            };

            const input =
                document.getElementById(
                    `edit-novo-arquivo-${index}`
                ) as HTMLInputElement;

            if (input) {
                input.value = '';
            }

            atualizarPreviewEdicao(index);
        }
