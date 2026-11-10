/* Planora — js/pages/cards/04-edicao-dos-dados-do-projeto.js
   Painel para editar título, rótulo, área e prazo do projeto.
   Trecho do antigo bloco <script id="app-script"> de cards.html, linhas 306–362. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
        function listaRotulosEdicao() {
            let nomes: string[] = [];
            try { nomes = ((lerPreferenciasBanco().rotulos || []) || []).map(r => r.nome); } catch (e) { /* padrão */ }
            ROTULOS_ORDEM.forEach(n => { if (!nomes.includes(n)) nomes.push(n); });
            return nomes.sort((a, b) => {
                const i = ROTULOS_ORDEM.indexOf(a), j = ROTULOS_ORDEM.indexOf(b);
                return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
            });
        }
        function listaAreasEdicao() {
            return Planora_Areas.nomes();
        }
        function preencherSelect(id: string, lista: string[], atual: string) {
            const itens = atual && !lista.includes(atual) ? [...lista, atual] : lista;
            document.getElementById(id).innerHTML = itens
                .map(v => `<option${v === atual ? ' selected' : ''}>${escaparHTML(v)}</option>`).join('');
        }
        function abrirEdicaoDados() {
            (document.getElementById('ed-nome') as HTMLInputElement).value = projetoAtual.nome || '';
            preencherSelect('ed-rotulo', listaRotulosEdicao(), projetoAtual.rotulo || projetoAtual.status || 'Em andamento');
            preencherSelect('ed-area', listaAreasEdicao(), projetoAtual.area || Planora_Areas.padrao());
            const prazo = projetoAtual.prazo || '';
            (document.getElementById('ed-prazo') as HTMLInputElement).value = /^\d{4}-\d{2}-\d{2}$/.test(prazo) ? prazo : '';
            document.getElementById('painel-edicao').hidden = false;
            document.getElementById('ed-nome').focus();
        }
        function fecharEdicaoDados() {
            document.getElementById('painel-edicao').hidden = true;
        }
        function salvarEdicaoDados() {
            const nome = (document.getElementById('ed-nome') as HTMLInputElement).value.trim();
            if (!nome) { alert('O título não pode ficar vazio.'); return; }
            const rotulo = (document.getElementById('ed-rotulo') as HTMLInputElement).value;
            projetoAtual.nome = nome;
            projetoAtual.rotulo = rotulo;
            if ('status' in projetoAtual) projetoAtual.status = rotulo;
            projetoAtual.area = (document.getElementById('ed-area') as HTMLInputElement).value;
            projetoAtual.prazo = (document.getElementById('ed-prazo') as HTMLInputElement).value || '---';
            db[projetoId] = projetoAtual;
            salvarBancoDeDados(db);
            if (typeof enviarAgora === 'function') enviarAgora();
            fecharEdicaoDados();
            renderizarTimeline();
        }

        document.getElementById('btn-editar-dados').addEventListener('click', () => {
            if (document.getElementById('painel-edicao').hidden) abrirEdicaoDados(); else fecharEdicaoDados();
        });
        document.getElementById('ed-salvar').addEventListener('click', salvarEdicaoDados);
        document.getElementById('ed-cancelar').addEventListener('click', fecharEdicaoDados);
        document.getElementById('painel-edicao').addEventListener('keydown', e => {
            if (e.key === 'Escape') { fecharEdicaoDados(); return; }
            if (e.key !== 'Enter') return;
            e.preventDefault();
            salvarEdicaoDados();
        });
