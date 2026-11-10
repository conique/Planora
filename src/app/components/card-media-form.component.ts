/* Planora — js/pages/cards/08-midia-do-novo-card.js
   Carregar mídia, colar da área de transferência e pré-visualização do novo card.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 721–1000. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        /* =========================================================
           CARREGAR MÍDIA DO CARD
        ========================================================= */

        async function carregarMidiaDoCard(card: CardProjeto, index: number) {

            const container =
                document.getElementById(
                    `midia-card-${index}`
                );

            if (!container) return;

            /*
             * Cards antigos podem ainda possuir:
             * card.midia = "data:image/..."
             *
             * Mantemos compatibilidade com eles.
             */
            if (card.midia) {

                if (
                    card.tipoMidia &&
                    card.tipoMidia.startsWith('video')
                ) {

                    container.innerHTML = `
                        <video
                            controls
                            src="${card.midia}"
                        ></video>
                    `;

                } else {

                    container.innerHTML = `
                        <img
                            src="${card.midia}"
                            alt="Anexo"
                        >
                    `;
                }

                return;
            }

            /*
             * Cards novos usam IndexedDB.
             */
            if (!card.midiaId) return;

            try {

                const registro =
                    await obterMidiaBlob(card.midiaId);

                if (!registro || !registro.blob) return;

                const url =
                    URL.createObjectURL(registro.blob);

                if (
                    registro.tipo &&
                    registro.tipo.startsWith('video')
                ) {

                    container.innerHTML = `
                        <video
                            controls
                            src="${url}"
                        ></video>
                    `;

                } else {

                    container.innerHTML = `
                        <img
                            src="${url}"
                            alt="Anexo"
                        >
                    `;
                }

            } catch (erro) {

                console.error(
                    'Erro ao carregar mídia:',
                    erro
                );
            }
        }


        /* =========================================================
           CAPTURAR COLAGEM
        ========================================================= */

        function capturarCole(event: Event) {

            const clipboard =
                (event as ClipboardEvent).clipboardData ||
                window.clipboardData;

            if (!clipboard || !clipboard.items) return;

            const items =
                clipboard.items;

            for (const item of items) {

                if (
                    item.type.indexOf('image') === 0 ||
                    item.type.indexOf('video') === 0
                ) {

                    event.preventDefault();

                    const blob =
                        item.getAsFile();

                    if (!blob) return;

                    prepararMidiaNovo(blob);

                    return;
                }
            }
        }


        /* =========================================================
           ARQUIVO TRADICIONAL
        ========================================================= */

        function carregarArquivoTradicional(input: HTMLInputElement) {

            if (
                input.files &&
                input.files[0]
            ) {

                prepararMidiaNovo(
                    input.files[0]
                );
            }
        }


        /* =========================================================
           PREPARAR MÍDIA
        ========================================================= */

        function prepararMidiaNovo(blob: Blob) {

            removerUrlPreviewNovo();

            midiaTemporariaNovo = {
                blob: blob,
                tipo: blob.type,
                urlPreview: URL.createObjectURL(blob)
            };

            atualizarPreviewNovo();
        }


        function removerUrlPreviewNovo() {

            if (
                midiaTemporariaNovo &&
                midiaTemporariaNovo.urlPreview
            ) {

                URL.revokeObjectURL(
                    midiaTemporariaNovo.urlPreview
                );
            }
        }


        /* =========================================================
           PREVIEW NOVO CARD
        ========================================================= */

        function atualizarPreviewNovo() {

            const container =
                document.getElementById(
                    'container-preview-novo'
                );

            if (
                !midiaTemporariaNovo ||
                !midiaTemporariaNovo.blob
            ) {

                container.innerHTML = '';

                return;
            }

            const url =
                midiaTemporariaNovo.urlPreview;

            if (
                midiaTemporariaNovo.tipo &&
                midiaTemporariaNovo.tipo.startsWith('video')
            ) {

                container.innerHTML = `
                    <div class="preview-midia-wrapper">

                        <video
                            src="${url}"
                            controls
                        ></video>

                        <button
                            class="btn-remover-preview"
                            onclick="removerMidiaNovo()"
                            title="Remover mídia"
                            type="button"
                        >
                            ×
                        </button>

                    </div>
                `;

            } else {

                container.innerHTML = `
                    <div class="preview-midia-wrapper">

                        <img
                            src="${url}"
                            alt="Preview"
                        >

                        <button
                            class="btn-remover-preview"
                            onclick="removerMidiaNovo()"
                            title="Remover mídia"
                            type="button"
                        >
                            ×
                        </button>

                    </div>
                `;
            }
        }


        /* =========================================================
           REMOVER MÍDIA NOVO CARD
        ========================================================= */

        function removerMidiaNovo() {

            removerUrlPreviewNovo();

            midiaTemporariaNovo = {
                blob: null,
                tipo: null,
                urlPreview: null
            };

            const input =
                document.getElementById(
                    'inputMidiaCard'
                ) as HTMLInputElement;

            if (input) {
                input.value = '';
            }

            atualizarPreviewNovo();
        }
