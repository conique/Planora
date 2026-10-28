-- Execute uma vez no SQL Editor do Supabase antes de publicar esta versao.
alter table public."Planora_workspaces"
    add column if not exists deleted_at timestamptz null;

create index if not exists "Planora_workspaces_owner_deleted_idx"
    on public."Planora_workspaces" (owner_id, deleted_at);

comment on column public."Planora_workspaces".deleted_at is
    'Exclusao logica. O aplicativo permite restaurar por 15 dias e depois remove workspace_data e workspace.';
