-- Verifica apenas a estrutura atual; nao consulta a tabela legada.
select
    to_regclass('public."Planora_dados"') as tabela_legada,
    to_regclass('public."Planora_workspaces"') as tabela_workspaces,
    to_regclass('public."Planora_workspace_data"') as tabela_workspace_data,
    to_regclass('public."bahub_dados"') as tabela_bahub_dados,
    to_regclass('public."planora_backup_workspace_data_20261027"') as tabela_backup_workspace_data;

select
    count(distinct w.id) as workspaces_ativos,
    count(distinct d.workspace_id) as workspaces_ativos_com_dados,
    count(distinct w.id) - count(distinct d.workspace_id) as workspaces_ativos_sem_dados
from public."Planora_workspaces" w
left join public."Planora_workspace_data" d on d.workspace_id = w.id
where w.deleted_at is null;

select w.id, w.nome, w.owner_id, w.created_at
from public."Planora_workspaces" w
left join public."Planora_workspace_data" d on d.workspace_id = w.id
where w.deleted_at is null
  and d.workspace_id is null
order by w.created_at;
