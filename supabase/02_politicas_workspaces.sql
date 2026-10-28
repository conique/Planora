-- =====================================================================
-- 02 — POLÍTICAS RLS DOS WORKSPACES (idempotente)
-- Rode DEPOIS de ler o resultado do 01.
--
-- * NÃO toca em public."Planora_dados".
-- * Para cada operação (select/insert/update/delete) só cria a política se NÃO
--   existir nenhuma que já cubra aquela operação (inclusive políticas "ALL").
--   Quando pula, avisa em "Messages". Não apaga nada.
-- * Regra: acesso somente quando "Planora_workspaces".owner_id = auth.uid();
--   em "Planora_workspace_data", somente quando o workspace pertence ao usuário.
-- * UPDATE é necessário para RENOMEAR workspaces e para salvar os dados.
-- * Não há membros/compartilhamento entre contas.
-- =====================================================================
begin;

alter table public."Planora_workspaces"      enable row level security;
alter table public."Planora_workspace_data"  enable row level security;

grant select, insert, update, delete on public."Planora_workspaces"     to authenticated;
grant select, insert, update, delete on public."Planora_workspace_data" to authenticated;

create index if not exists planora_workspaces_owner_id_idx on public."Planora_workspaces" (owner_id);

create or replace function pg_temp.criar_politica(p_tabela text, p_cmd text, p_ddl text)
returns void language plpgsql as $f$
begin
  if exists (select 1 from pg_policies
              where schemaname = 'public' and tablename = p_tabela
                and (cmd = 'ALL' or cmd = upper(p_cmd))) then
    raise notice '% (%): já existe política que cobre esta operação — nada foi criado.', p_tabela, p_cmd;
  else
    execute p_ddl;
    raise notice '% (%): política criada.', p_tabela, p_cmd;
  end if;
end
$f$;

-- ---------- "Planora_workspaces": dono = owner_id ----------
select pg_temp.criar_politica('Planora_workspaces', 'select', $q$
  create policy planora_workspaces_dono_select on public."Planora_workspaces"
    for select to authenticated using (owner_id = (select auth.uid()))
$q$);
select pg_temp.criar_politica('Planora_workspaces', 'insert', $q$
  create policy planora_workspaces_dono_insert on public."Planora_workspaces"
    for insert to authenticated with check (owner_id = (select auth.uid()))
$q$);
select pg_temp.criar_politica('Planora_workspaces', 'update', $q$
  create policy planora_workspaces_dono_update on public."Planora_workspaces"
    for update to authenticated
    using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))
$q$);
select pg_temp.criar_politica('Planora_workspaces', 'delete', $q$
  create policy planora_workspaces_dono_delete on public."Planora_workspaces"
    for delete to authenticated using (owner_id = (select auth.uid()))
$q$);

-- ---------- "Planora_workspace_data": só se o workspace pertence ao usuário ----------
select pg_temp.criar_politica('Planora_workspace_data', 'select', $q$
  create policy planora_workspace_data_dono_select on public."Planora_workspace_data"
    for select to authenticated
    using (exists (select 1 from public."Planora_workspaces" w
                    where w.id = "Planora_workspace_data".workspace_id and w.owner_id = (select auth.uid())))
$q$);
select pg_temp.criar_politica('Planora_workspace_data', 'insert', $q$
  create policy planora_workspace_data_dono_insert on public."Planora_workspace_data"
    for insert to authenticated
    with check (exists (select 1 from public."Planora_workspaces" w
                         where w.id = "Planora_workspace_data".workspace_id and w.owner_id = (select auth.uid())))
$q$);
select pg_temp.criar_politica('Planora_workspace_data', 'update', $q$
  create policy planora_workspace_data_dono_update on public."Planora_workspace_data"
    for update to authenticated
    using (exists (select 1 from public."Planora_workspaces" w
                    where w.id = "Planora_workspace_data".workspace_id and w.owner_id = (select auth.uid())))
    with check (exists (select 1 from public."Planora_workspaces" w
                         where w.id = "Planora_workspace_data".workspace_id and w.owner_id = (select auth.uid())))
$q$);
select pg_temp.criar_politica('Planora_workspace_data', 'delete', $q$
  create policy planora_workspace_data_dono_delete on public."Planora_workspace_data"
    for delete to authenticated
    using (exists (select 1 from public."Planora_workspaces" w
                    where w.id = "Planora_workspace_data".workspace_id and w.owner_id = (select auth.uid())))
$q$);

commit;
-- Depois de rodar, execute o 01 de novo: as 8 políticas (ou equivalentes) devem aparecer.
