/* Planora — js/pages/cards/01-estado.js
   Parâmetros da URL, projeto atual e ícones.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 112–145. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        /* =========================================================
           CONFIGURAÇÃO DO PROJETO
        ========================================================= */

        const parametrosDaURL =
            new URLSearchParams(window.location.search);

        /* A string da URL indexa o array direto (db['3'] === db[3]); o cast mantém o comportamento original,
           inclusive quando o id falta (db[null] é undefined e a página volta para o menu). */
        const projetoId = parametrosDaURL.get('id') as unknown as number;

        let db: Item[] =
            lerBancoDeDados();

        let projetoAtual: Item =
            db[projetoId];

        if (!projetoAtual) {
            window.location.href = 'index.html';
        }

        let midiaTemporariaNovo: MidiaTemporaria = {
            blob: null,
            tipo: null,
            urlPreview: null
        };


        /* =========================================================
           RENDERIZAR TIMELINE
        ========================================================= */

        /* Minimizar/expandir cards: botão "−" (expandido) vira "□" (minimizado). */
        const ICONE_MENOS = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>';
        const ICONE_QUADRADO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>';
