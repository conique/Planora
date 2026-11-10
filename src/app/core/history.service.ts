/* Planora — js/core/04-historico.js
   Desfazer/refazer (até 20 estados) e window.Planora_Historico.
   Trecho do antigo js/db.js, linhas 276–371. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
const CHAVE_HISTORICO = 'Planora_historico';
const chaveHistorico = () => CHAVE_HISTORICO + sufixoWs();
const LIMITE_HISTORICO = 20;
let estadosHistorico: string[] = [];   // cada estado é o JSON dos itens
let indiceHistorico = -1;
let aplicandoHistorico = false;
let erroPersistenciaHistorico = false;

function notificarHistorico() {
    window.dispatchEvent(new Event('Planora-historico-atualizado'));
}
function persistirHistorico() {
    try {
        sessionStorage.setItem(chaveHistorico(), JSON.stringify({
            estados: estadosHistorico,
            indice: indiceHistorico
        }));
        erroPersistenciaHistorico = false;
    } catch (erro) {
        if (!erroPersistenciaHistorico) {
            console.error('Não foi possível persistir o histórico de alterações nesta sessão:', erro);
            setStatus('Histórico temporário: limite de armazenamento atingido');
        }
        erroPersistenciaHistorico = true;
    }
}
function inicializarHistorico() {
    const estadoAtual = localStorage.getItem(chaveDb()) || '[]';
    try {
        const salvo = JSON.parse(sessionStorage.getItem(chaveHistorico()) || 'null');
        if (salvo && Array.isArray(salvo.estados)
            && salvo.estados.every((estado: unknown) => typeof estado === 'string')
            && Number.isInteger(salvo.indice)
            && salvo.indice >= 0
            && salvo.indice < salvo.estados.length
            && salvo.estados[salvo.indice] === estadoAtual) {
            const inicio = Math.max(0, salvo.estados.length - LIMITE_HISTORICO);
            estadosHistorico = salvo.estados.slice(inicio);
            indiceHistorico = salvo.indice - inicio;
            if (indiceHistorico < 0) indiceHistorico = -1;
        }
    } catch (erro) {
        console.error('Não foi possível carregar o histórico de alterações:', erro);
    }
    if (indiceHistorico < 0) {
        estadosHistorico = [estadoAtual];
        indiceHistorico = 0;
        persistirHistorico();
    }
    notificarHistorico();
}
function registrarEstadoHistorico(estadoAnterior: string, estadoNovo: string) {
    if (estadoAnterior === estadoNovo) return;
    if (estadosHistorico[indiceHistorico] !== estadoAnterior) {
        estadosHistorico = [estadoAnterior];
        indiceHistorico = 0;
    }
    estadosHistorico = estadosHistorico.slice(0, indiceHistorico + 1);
    estadosHistorico.push(estadoNovo);
    if (estadosHistorico.length > LIMITE_HISTORICO) estadosHistorico.shift();
    indiceHistorico = estadosHistorico.length - 1;
    persistirHistorico();
    notificarHistorico();
}
function sincronizarHistoricoComBanco() {
    const estadoAtual = localStorage.getItem(chaveDb()) || '[]';
    if (estadosHistorico[indiceHistorico] === estadoAtual) return;
    estadosHistorico = [estadoAtual];
    indiceHistorico = 0;
    persistirHistorico();
    notificarHistorico();
}
function aplicarEstadoHistorico(indice: number) {
    const dados = JSON.parse(estadosHistorico[indice]);
    aplicandoHistorico = true;
    try {
        salvarBancoDeDados(dados);
    } finally {
        aplicandoHistorico = false;
    }
    indiceHistorico = indice;
    persistirHistorico();
    window.dispatchEvent(new CustomEvent('Planora-dados-restaurados', { detail: { dados } }));
    notificarHistorico();
}
window.Planora_Historico = {
    podeDesfazer: () => indiceHistorico > 0,
    podeRefazer: () => indiceHistorico >= 0 && indiceHistorico < estadosHistorico.length - 1,
    desfazer: () => {
        if (indiceHistorico > 0) aplicarEstadoHistorico(indiceHistorico - 1);
    },
    refazer: () => {
        if (indiceHistorico >= 0 && indiceHistorico < estadosHistorico.length - 1) aplicarEstadoHistorico(indiceHistorico + 1);
    }
};
