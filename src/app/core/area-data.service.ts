/* Planora — js/core/02-areas-dados.js
   Áreas por workspace: padrão, cores, listar, contar e salvar.
   Trecho do antigo js/db.js, linhas 77–151. Script clássico: as funções e variáveis continuam globais;
   a ORDEM de carregamento (numeração dos arquivos) importa. */
/* ---------- áreas (personalizáveis por workspace; ficam em preferencias.areas) ---------- */
const AREAS_PADRAO: Area[] = [
    { nome: 'Projeto', cor: '#0ea5e9' },
    { nome: 'Melhoria', cor: '#a855f7' },
    { nome: 'Tarefa', cor: '#10b981' }
];
const PALETA_AREAS = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#64748b'];
/* eram áreas padrão da versão anterior; os itens que ainda as usam passam para a primeira área da lista */
const AREAS_ANTIGAS = ['Gerais', 'BI e SSAPM'];
const corAreaValida = (c: string) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
const nomeAreaValido = (t: unknown) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 30);

function areasDasPreferencias(preferencias: Preferencias) {
    const lista = preferencias && Array.isArray(preferencias.areas) ? preferencias.areas : null;
    if (!lista) return null;
    const vistos = new Set<string>(), saida: Area[] = [];
    lista.forEach(a => {
        const nome = nomeAreaValido(a && a.nome);
        if (!nome || vistos.has(nome.toLowerCase())) return;
        vistos.add(nome.toLowerCase());
        saida.push({ nome, cor: corAreaValida(a.cor) ? a.cor : PALETA_AREAS[saida.length % PALETA_AREAS.length] });
    });
    return saida.length ? saida : null;
}
function listarAreas(): Area[] {
    return (areasDasPreferencias(lerPreferenciasBanco()) || AREAS_PADRAO).map(a => ({ nome: a.nome, cor: a.cor }));
}
const nomesAreas = () => listarAreas().map(a => a.nome);
const areaPadrao = () => listarAreas()[0].nome;
function corDaArea(nome: string) {
    const a = listarAreas().find(x => x.nome === nome);
    return a ? a.cor : null;
}
/* valor para o atributo style das pílulas: "--glow:#rrggbb" (vazio se a área não está na lista) */
function estiloArea(nome: string) {
    const cor = corDaArea(nome);
    return cor ? '--glow:' + cor : '';
}
function contarItensPorArea(): Record<string, number> {
    const contagem: Record<string, number> = {};
    lerBancoDeDados().forEach(i => { if (i && i.area) contagem[i.area] = (contagem[i.area] || 0) + 1; });
    return contagem;
}
function reiniciarHistorico() {
    estadosHistorico = [localStorage.getItem(chaveDb()) || '[]'];
    indiceHistorico = 0;
    persistirHistorico();
    notificarHistorico();
}
/* Grava a nova lista de áreas. renomeios: { nomeAntigo: nomeNovo } (inclui as áreas excluídas, que vão para a primeira). */
function salvarAreas(novas: Area[], renomeios: Record<string, string>) {
    const itens = lerBancoDeDados();
    itens.forEach(i => {
        if (i && i.area && Object.prototype.hasOwnProperty.call(renomeios, i.area)) i.area = renomeios[i.area];
    });
    localStorage.setItem(chavePreferencias(), JSON.stringify({ ...lerPreferenciasBanco(), areas: novas }));
    salvarBancoDeDados(itens);
    reiniciarHistorico();   // o desfazer não acompanha as preferências; recomeça a partir daqui para não deixar áreas inconsistentes
    window.dispatchEvent(new CustomEvent('Planora-dados-restaurados', { detail: { dados: itens } }));
    window.dispatchEvent(new Event('Planora-areas-atualizadas'));
}
/* Primeira abertura de um workspace sem áreas definidas: grava a lista padrão e troca as áreas antigas. */
async function garantirAreasPadrao() {
    const preferencias = lerPreferenciasBanco();
    if (areasDasPreferencias(preferencias)) return true;
    const areas = AREAS_PADRAO.map(a => ({ ...a }));
    const itens = lerBancoDeDados();
    itens.forEach(i => { if (i && AREAS_ANTIGAS.includes(i.area)) i.area = areas[0].nome; });
    localStorage.setItem(chaveDb(), JSON.stringify(itens));
    localStorage.setItem(chavePreferencias(), JSON.stringify({ ...preferencias, areas }));
    localStorage.setItem(chavePend(), '1');
    seq++;
    reiniciarHistorico();
    return enviar();
}
