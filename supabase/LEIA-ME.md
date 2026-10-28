# Planora — banco de dados (Supabase)

Tabelas em uso (nomes com maiúscula, sempre entre aspas no SQL): `"Planora_workspaces"`,
`"Planora_workspace_data"` e a tabela antiga `"Planora_dados"`, que o app só **lê**
(constante `MIGRAR_LEGADO_SOB_DEMANDA` em `js/db.js`).

## Ordem de execução (SQL Editor)

1. `01_verificar_politicas.sql` — somente leitura: RLS, políticas, contagens, cópia e permissões.
2. `02_politicas_workspaces.sql` — idempotente: só cria a política de uma operação se nenhuma existente já a cobrir.
   **Precisa existir UPDATE** em `Planora_workspaces` (renomear workspace) e em `Planora_workspace_data` (salvar).
3. `03_rollback_e_ressincronizacao.sql` — tudo comentado: backup, ressincronização e rollback.

## O que o app guarda onde

- `Planora_workspace_data.dados` → `{ itens, preferencias }`.
- Áreas de cada workspace: `dados.preferencias.areas = [{ nome, cor }]` (padrão: Projeto, Melhoria, Tarefa).
  Cada item guarda o **nome** da área em `item.area`. Renomear uma área atualiza os itens; excluir move os itens para a primeira.
- Na primeira abertura de um workspace sem áreas definidas, os itens com as áreas antigas **Gerais** e **BI e SSAPM** passam para **Projeto**.
- Cache local: `Planora_db:<id>`, `Planora_preferencias:<id>`, `Planora_pendente:<id>`.

## Checklist de validação

- [ ] 01 sem "NENHUMA POLÍTICA"; contagens e cópia conferem
- [ ] Renomear um workspace na tela inicial (lápis no cartão) e recarregar
- [ ] Criar, renomear, colorir e excluir áreas; conferir os itens
- [ ] Trocar de workspace: as áreas de cada um são independentes
- [ ] Tema claro e escuro em todas as telas
