-- =====================================================================
-- 01 — DIAGNÓSTICO (SOMENTE LEITURA — não altera nada)
-- Rode ANTES do 02. Mostra, numa única tabela:
--   1. se o RLS está ligado nas tabelas
--   2. quais políticas já existem (e se alguma tabela está sem política)
--   3. contagem de registros
--   4. se a cópia da tabela antiga para os workspaces está completa e idêntica
--   5. quem tem permissão de tabela (anon não deveria ter nas tabelas de workspace)
-- Os nomes das tabelas têm letra maiúscula ("Planora_..."), por isso vão entre aspas.
-- =====================================================================
select * from (

  select '1. RLS' as secao, c.relname::text as item,
         case when c.relrowsecurity then 'RLS ligado' else 'RLS DESLIGADO' end as resultado,
         'forçado para o dono da tabela: ' || c.relforcerowsecurity::text as detalhe
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('Planora_dados', 'Planora_workspaces', 'Planora_workspace_data')

  union all
  select '2. Políticas', tablename || ' / ' || policyname,
         cmd || ' para ' || roles::text,
         'USING: ' || coalesce(qual, '-') || '  |  WITH CHECK: ' || coalesce(with_check, '-')
    from pg_policies
   where schemaname = 'public'
     and tablename in ('Planora_dados', 'Planora_workspaces', 'Planora_workspace_data')

  union all
  select '2. Políticas', v.t, 'NENHUMA POLÍTICA',
         'com RLS ligado e sem política, ninguém consegue ler nem gravar (o app mostraria a lista vazia)'
    from (values ('Planora_workspaces'), ('Planora_workspace_data')) as v(t)
   where not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = v.t)

  union all
  select '2. Políticas', v.t || ' / ' || v.cmd, 'SEM POLÍTICA PARA ' || v.cmd,
         case v.cmd when 'UPDATE' then 'sem UPDATE não é possível renomear workspace nem salvar dados' else 'operação bloqueada pelo RLS' end
    from (values ('Planora_workspaces', 'SELECT'), ('Planora_workspaces', 'INSERT'), ('Planora_workspaces', 'UPDATE'),
                 ('Planora_workspace_data', 'SELECT'), ('Planora_workspace_data', 'INSERT'), ('Planora_workspace_data', 'UPDATE')) as v(t, cmd)
   where exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = v.t)
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = v.t and (p.cmd = 'ALL' or p.cmd = v.cmd))

  union all select '3. Contagens', 'Planora_dados (legado)',  count(*)::text, '' from public."Planora_dados"
  union all select '3. Contagens', 'Planora_workspaces',      count(*)::text, '' from public."Planora_workspaces"
  union all select '3. Contagens', 'Planora_workspace_data',  count(*)::text, '' from public."Planora_workspace_data"

  union all
  select '4. Cópia', 'registros legados SEM workspace', count(*)::text, 'esperado: 0'
    from public."Planora_dados" d
   where not exists (select 1 from public."Planora_workspaces" w where w.legacy_user_id = d.user_id)

  union all
  select '4. Cópia', 'workspaces SEM linha de dados', count(*)::text, 'esperado: 0'
    from public."Planora_workspaces" w
   where not exists (select 1 from public."Planora_workspace_data" wd where wd.workspace_id = w.id)

  union all
  select '5. Permissões', grantee || ' em ' || table_name, string_agg(privilege_type, ', ' order by privilege_type),
         case when grantee = 'anon' then 'atenção: anon não deveria ter acesso às tabelas de workspace' else '' end
    from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('Planora_workspaces', 'Planora_workspace_data')
     and grantee in ('anon', 'authenticated')
   group by grantee, table_name

) diagnostico
order by secao, item;
