/* Planora — js/pages/cards/03-formatacao.js
   escaparHTML, legenda, prazo do cabeçalho e ordem de rótulos.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 277–305. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        function escaparHTML(texto: unknown) {
            return String(texto).replace(/[&<>"']/g, c => (
                { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
            ));
        }

        /* Legenda: preserva quebras de linha e transforma links em clicáveis (com escape de HTML). */
        function formatarLegenda(legenda: string) {
            const puro = String(legenda || '').replace(/<br\s*\/?>/gi, '\n');
            return escaparHTML(puro)
                .replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, m => {
                    let url = m, fim = '';
                    const sobra = url.match(/[.,;:!?)\]]+$/);
                    if (sobra) { fim = sobra[0]; url = url.slice(0, -fim.length); }
                    const href = /^www\./i.test(url) ? 'https://' + url : url;
                    return `<a href="${href}" target="_blank" rel="noopener noreferrer" ondblclick="event.stopPropagation()">${url}</a>${fim}`;
                })
                .replace(/\n/g, '<br>');
        }

        function formatarPrazoHeader(prazo: string) {
            if (!prazo || prazo === '---') return '';
            const m = String(prazo).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            return m ? `${m[3]}/${m[2]}/${m[1]}` : prazo;
        }

        /* ---------- Editar os dados do projeto (título, rótulo, área, prazo e tags) na própria página ---------- */
        const ROTULOS_ORDEM = ['A ser feito', 'Atrasado', 'Esperando', 'Em andamento', 'Pronto'];
