/* Planora — js/pages/cards/10-menu-e-exclusao-de-card.js
   Menu do card e exclusão.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 1212–1305. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        /* =========================================================
           MENU DO CARD
        ========================================================= */

        function alternarMenuCard(event: Event, index: number) {

            event.stopPropagation();

            document
                .querySelectorAll<HTMLElement>(
                    '.menu-card-flutuante'
                )
                .forEach((menu, idx) => {

                    if (idx !== index) {
                        menu.style.display = 'none';
                    }
                });

            const menu =
                document.getElementById(
                    `menu-card-${index}`
                );

            menu.style.display =
                menu.style.display === 'block'
                    ? 'none'
                    : 'block';
        }


        window.onclick = function() {

            document
                .querySelectorAll<HTMLElement>(
                    '.menu-card-flutuante'
                )
                .forEach(menu => {

                    menu.style.display = 'none';

                });
        };


        /* =========================================================
           DELETAR CARD
        ========================================================= */

        async function deletarCard(index: number) {

            if (
                !confirm(
                    'Tem certeza que deseja apagar este card?'
                )
            ) {
                return;
            }

            const card =
                projetoAtual.cards[index];

            /*
             * Apaga a mídia correspondente
             * do IndexedDB antes de remover o card.
             */
            if (card && card.midiaId) {

                try {
                    await deletarMidiaBlob(
                        card.midiaId
                    );
                } catch (erro) {
                    console.error(
                        'Erro ao apagar mídia:',
                        erro
                    );
                }
            }

            projetoAtual.cards.splice(
                index,
                1
            );

            db[projetoId] =
                projetoAtual;

            salvarBancoDeDados(db);

            await renderizarTimeline();
        }
