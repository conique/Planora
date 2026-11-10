/* Planora — js/pages/index/01-estado-e-rotulos.js
   Estado da página (db, pasta, visão, ordenação), rótulos, cores e opções de área.
   Trecho do antigo bloco <script id="app-script"> de index.html, linhas 173–272. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
let db: Item[] = lerBancoDeDados();


let ordenacaoAtual: ColunaOrdenacao | null = null;
let direcaoOrdenacao: 1 | -1 = 1;

let pastaAtual: string | null = new URLSearchParams(location.search).get('pasta') || null;
const preferenciasUsuario = lerPreferenciasBanco();
let visaoAtual: 'tabela' | 'kanban' = preferenciasUsuario.visao === 'kanban' ? 'kanban' : 'tabela';
let indiceEdicaoKanban: number | null = null;

const ordenacaoSalva = preferenciasUsuario.ordenacao;
if (ordenacaoSalva && ['nome', 'rotulo', 'area', 'prazo'].includes(ordenacaoSalva.tipo)) {
    ordenacaoAtual = ordenacaoSalva.tipo;
    direcaoOrdenacao = ordenacaoSalva.dir === -1 ? -1 : 1;
}


const ordemRotulos = [
    'A ser feito',
    'Atrasado',
    'Esperando',
    'Em andamento',
    'Pronto'
];


let opcoesRotulos: Rotulo[] =
    (Array.isArray(preferenciasUsuario.rotulos) && preferenciasUsuario.rotulos.length
        ? preferenciasUsuario.rotulos.map(r => ({ nome: r.nome, cor: r.cor }))
        : [
            { nome:'A ser feito', cor:'gray' },
            { nome:'Atrasado', cor:'red' },
            { nome:'Esperando', cor:'#a855f7' },
            { nome:'Em andamento', cor:'blue' },
            { nome:'Pronto', cor:'green' }
        ]);
/* Garante todos os rótulos e a ordem padrão (também em dados já salvos no navegador). */
const CORES_PADRAO_ROTULO: Record<string, string> = {
    'Em andamento':'blue','Esperando':'#a855f7','Atrasado':'red','A ser feito':'gray','Pronto':'green'
};
ordemRotulos.forEach(nome => {
    if (!opcoesRotulos.some(r => r.nome === nome)) {
        opcoesRotulos.push({ nome, cor: CORES_PADRAO_ROTULO[nome] });
    }
});
opcoesRotulos.sort((a, b) => {
    const pa = ordemRotulos.indexOf(a.nome), pb = ordemRotulos.indexOf(b.nome);
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
});
const rotuloEsperando = opcoesRotulos.find(r => r.nome === 'Esperando');
if (rotuloEsperando && rotuloEsperando.cor !== '#a855f7') {
    rotuloEsperando.cor = '#a855f7';
}

/* Áreas: vêm do workspace aberto (Planora_Areas, em db.js) e podem ser criadas, renomeadas e coloridas em "Gerenciar áreas". */
function opcoesAreaHtml(atual: string) {
    const nomes = Planora_Areas.nomes();
    if (atual && !nomes.includes(atual)) nomes.push(atual);
    return nomes
        .map(a => `<option value="${escapeHTML(a)}"${a === atual ? ' selected' : ''}>${escapeHTML(a)}</option>`)
        .join('');
}
function renderizarOpcoesAreaNovaPagina() {
    const caixa = document.getElementById('tipo-selecao-areas');
    if (!caixa) return;
    const marcado = document.querySelector('input[name="tipoPagina"]:checked') as HTMLInputElement;
    const nomes = Planora_Areas.nomes();
    const escolhida = marcado && nomes.includes(marcado.value) ? marcado.value : nomes[0];
    caixa.innerHTML = Planora_Areas.listar().map(a =>
        `<label style="${Planora_Areas.estilo(a.nome)}"><input type="radio" name="tipoPagina" value="${escapeHTML(a.nome)}"${a.nome === escolhida ? ' checked' : ''}><span>${escapeHTML(a.nome)}</span></label>`
    ).join('');
}


function salvarOpcoesGlobais() {
    preferenciasUsuario.rotulos = opcoesRotulos.map(r => ({ nome: r.nome, cor: r.cor }));
    salvarPreferenciasBanco({ ...lerPreferenciasBanco(), rotulos: preferenciasUsuario.rotulos });

}


if (!Array.isArray(preferenciasUsuario.rotulos) || !preferenciasUsuario.rotulos.length) {
    preferenciasUsuario.rotulos = opcoesRotulos.map(r => ({ nome: r.nome, cor: r.cor }));
    salvarPreferenciasBanco({ ...lerPreferenciasBanco(), rotulos: preferenciasUsuario.rotulos, kanbanColunas: opcoesRotulos.map(r => r.nome) });
}

const MAPA_CORES: Record<string, string> = {blue:'#0ea5e9',green:'#10b981',red:'#dc2626',gray:'#4b5563',purple:'#a855f7'};
function obterCorRotulo(nome: string) {

    const r =
        opcoesRotulos.find(
            x => x.nome === nome
        );

    const c = r ? r.cor : 'blue';
    return MAPA_CORES[c] || c;

}
