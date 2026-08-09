create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor_email text,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_user_id_idx on public.audit_log (user_id);

alter table public.audit_log enable row level security;
