/* Planora — js/pages/index/11-busca-e-inicializacao.js
   Busca, ganchos do cabeçalho (aoBuscar, aoNovoRegistro, aoNovaPasta) e primeira renderização.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 1961–1980. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
function aplicarBusca() {
    const termo = window.__termoBusca || '';
    document.querySelectorAll<HTMLElement>('#corpo-tabela tr').forEach(tr => {
        tr.style.display = !termo || tr.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
}
window.aoBuscar = t => { window.__termoBusca = t; aplicarBusca(); if (visaoAtual === 'kanban') renderizarKanban(); };
window.aoNovoRegistro = abrirModal;
window.aoNovaPasta = criarPasta;
const _renderizarTabelaBase = renderizarTabela;
window.renderizarTabela = function () { _renderizarTabelaBase(); atualizarBarraOrdem(); atualizarCaminho(); aplicarBusca(); aplicarVisao(); };

window.addEventListener('Planora-dados-restaurados', e => {
    db = (e as CustomEvent).detail.dados;
    renderizarTabela();
});

renderizarTabela();
