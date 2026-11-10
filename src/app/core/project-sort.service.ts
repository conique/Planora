/* Planora — js/pages/index/02-ordenacao.js
   Regras de ordenação (ordenarPor, calcularOrdemVisual).
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 273–421. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function ordenarPor(tipo: ColunaOrdenacao) {

    if (ordenacaoAtual === tipo) {

        direcaoOrdenacao *= -1;

    } else {

        ordenacaoAtual = tipo;
        direcaoOrdenacao = 1;

    }

    salvarPreferenciasBanco({
        ...lerPreferenciasBanco(),
        ordenacao: { tipo: ordenacaoAtual, dir: direcaoOrdenacao }
    });
    renderizarTabela();

}


/* Ordem de exibição: a personalizada (a do banco) ou a ordenação temporária por coluna. */
function calcularOrdemVisual() {

    const tipo = ordenacaoAtual;

    const nivel = db.map((_, i) => i).filter(i => (db[i].pai || null) === (pastaAtual || null));

    if (!tipo) {
        return nivel;
    }

    return nivel.sort((ia, ib) => {

        const a = db[ia];
        const b = db[ib];


        if (tipo === 'nome') {

            return String(a.nome || '')
                .localeCompare(
                    String(b.nome || ''),
                    'pt-BR',
                    {
                        sensitivity:'base'
                    }
                ) * direcaoOrdenacao;

        }


        if (tipo === 'rotulo') {

            const posA =
                ordemRotulos.indexOf(
                    a.rotulo || 'Em andamento'
                );

            const posB =
                ordemRotulos.indexOf(
                    b.rotulo || 'Em andamento'
                );


            const ordemA =
                posA === -1
                    ? ordemRotulos.length
                    : posA;


            const ordemB =
                posB === -1
                    ? ordemRotulos.length
                    : posB;


            return (
                ordemA - ordemB
            ) * direcaoOrdenacao;

        }


        if (tipo === 'area') {

            return String(a.area || '')
                .localeCompare(
                    String(b.area || ''),
                    'pt-BR',
                    {
                        sensitivity:'base'
                    }
                ) * direcaoOrdenacao;

        }


        if (tipo === 'prazo') {

            const prazoA =
                a.prazo;

            const prazoB =
                b.prazo;


            const semA =
                !prazoA ||
                prazoA === '---';


            const semB =
                !prazoB ||
                prazoB === '---';


            if (semA && semB)
                return 0;


            if (semA)
                return 1;


            if (semB)
                return -1;


            return (
                new Date(prazoA + 'T00:00:00').getTime() -
                new Date(prazoB + 'T00:00:00').getTime()
            ) * direcaoOrdenacao;

        }


        return 0;

    });

}
