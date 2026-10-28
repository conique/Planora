-- PLANORA: aposentadoria idempotente da tabela legada.
-- Pode ser executado mesmo quando public."Planora_dados" ja nao existe.

do $planora$
begin
    if to_regclass('public."Planora_dados"') is null then
        raise notice 'A tabela public."Planora_dados" ja nao existe. Nenhuma remocao foi necessaria.';
        return;
    end if;

    execute 'create table if not exists public."Planora_dados_arquivo_20261028" '
         || '(like public."Planora_dados" including all)';

    execute 'insert into public."Planora_dados_arquivo_20261028" '
         || 'select * from public."Planora_dados" on conflict do nothing';

    execute 'drop table public."Planora_dados"';
    raise notice 'Planora_dados foi arquivada e removida.';
end
$planora$;

-- Verificacao final: deve retornar null em tabela_legada.
select
    to_regclass('public."Planora_dados"') as tabela_legada,
    to_regclass('public."Planora_workspaces"') as tabela_workspaces,
    to_regclass('public."Planora_workspace_data"') as tabela_workspace_data;
