-- Enable Realtime on necessary tables
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.metas;

-- Ensure updated_at column and trigger exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_updated_at_leads on public.leads;
create trigger trg_updated_at_leads
before update on public.leads
for each row execute function public.handle_updated_at();

drop trigger if exists trg_updated_at_metas on public.metas;
create trigger trg_updated_at_metas
before update on public.metas
for each row execute function public.handle_updated_at();

-- Optimistic concurrency control
alter table public.leads add column if not exists row_version int not null default 0;

create or replace function public.bump_row_version()
returns trigger as $$
begin
  new.row_version := old.row_version + 1;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_row_version_leads on public.leads;
create trigger trg_row_version_leads
before update on public.leads
for each row execute function public.bump_row_version();
