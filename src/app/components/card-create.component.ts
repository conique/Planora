/* Planora — js/pages/cards/09-adicionar-card.js
   Criar card, limpar formulário e atalhos do formulário.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 1001–1211. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        /* =========================================================
           ENVIAR NOVO CARD
        ========================================================= */

        async function adicionarCard() {

            const titulo =
                (document.getElementById(
                    'inputTituloCard'
                ) as HTMLInputElement).value.trim();

            const legenda =
                (document.getElementById(
                    'inputLegendaCard'
                ) as HTMLInputElement).value;

            const tipo =
                (document.getElementById(
                    'inputTipoCard'
                ) as HTMLInputElement).value;

            const botao =
                document.getElementById(
                    'btnEnviarCard'
                ) as HTMLButtonElement;

            if (!titulo) {

                alert(
                    'O card precisa de um título.'
                );

                document.getElementById(
                    'inputTituloCard'
                ).focus();

                return;
            }

            botao.disabled = true;
            botao.textContent = '...';

            try {

                let midiaId = null;

                /*
                 * AQUI ESTÁ A CORREÇÃO:
                 * a imagem/vídeo vai para IndexedDB,
                 * e não para localStorage.
                 */
                if (
                    midiaTemporariaNovo &&
                    midiaTemporariaNovo.blob
                ) {

                    midiaId =
                        await salvarMidiaBlob(
                            midiaTemporariaNovo.blob,
                            midiaTemporariaNovo.tipo
                        );
                }

                const agora =
                    new Date();

                const dataString =
                    `${agora.toLocaleDateString('pt-BR')} às ${
                        agora.toLocaleTimeString(
                            'pt-BR',
                            {
                                hour: '2-digit',
                                minute: '2-digit'
                            }
                        )
                    }`;

                const novoCard = {

                    tipo: tipo,

                    titulo: titulo,

                    legenda:
                        legenda.replace(
                            /\n/g,
                            '<br>'
                        ),

                    data: dataString,

                    /*
                     * Mantido como null para os cards novos.
                     * A mídia fica em IndexedDB.
                     */
                    midia: null as string | null,

                    tipoMidia:
                        midiaTemporariaNovo.tipo ||
                        null,

                    midiaId: midiaId
                };

                projetoAtual.cards.push(
                    novoCard
                );

                db[projetoId] =
                    projetoAtual;

                salvarBancoDeDados(db);

                limparFormularioNovoCard();

                abrirFecharFormulario(false);

                await renderizarTimeline();

            } catch (erro) {

                console.error(
                    'Erro ao criar card:',
                    erro
                );

                alert(
                    'Não foi possível criar o card.\n\n' +
                    'Erro: ' +
                    (erro.message || erro)
                );

            } finally {

                botao.disabled = false;
                botao.textContent = 'Publicar card ↵';
            }
        }


        /* =========================================================
           LIMPAR FORMULÁRIO
        ========================================================= */

        function limparFormularioNovoCard() {

            (document.getElementById(
                'inputTituloCard'
            ) as HTMLInputElement).value = '';

            (document.getElementById(
                'inputLegendaCard'
            ) as HTMLInputElement).value = '';

            removerMidiaNovo();

            document.getElementById(
                'inputTituloCard'
            ).focus();
        }


        /* =========================================================
           ENTER PARA ENVIAR
           SHIFT + ENTER = NOVA LINHA
        ========================================================= */

        document.addEventListener(
            'keydown',
            function(event) {

                const campo =
                    event.target as HTMLElement;

                if (
                    event.key === 'Enter' &&
                    (
                        (campo.id === 'inputTituloCard' && !event.shiftKey) ||
                        (campo.id === 'inputLegendaCard' && (event.ctrlKey || event.metaKey))
                    )
                ) {

                    event.preventDefault();

                    adicionarCard();

                    return;
                }

                if (
                    event.key === 'Enter' &&
                    (
                        (campo.id.startsWith('edit-titulo-') && !event.shiftKey) ||
                        (campo.id.startsWith('edit-legenda-') && (event.ctrlKey || event.metaKey))
                    )
                ) {

                    event.preventDefault();

                    const index =
                        parseInt(
                            campo.id.split('-').pop(),
                            10
                        );

                    salvarEdicaoCard(index);
                }
            }
        );
