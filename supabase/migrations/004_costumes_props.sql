-- Creator App — Costumes & Props
-- Run against Supabase project: creator (adfqiknbtpzbyxwhrrmc)

-- ─── Costumes ───
create table public.costumes (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '',
  image_url text,
  cost numeric(8,2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Costume Assignments (per dancer) ───
create table public.costume_assignments (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid not null references public.costumes(id) on delete cascade,
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  size text not null default '',
  alteration_notes text not null default '',
  status text not null default 'needed'
    check (status in ('needed', 'ordered', 'received', 'altered', 'ready')),
  unique(costume_id, dancer_id)
);

-- ─── Props ───
create table public.props (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  name text not null,
  quantity int not null default 1,
  cost numeric(8,2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_costumes_piece on public.costumes(piece_id);
create index idx_costume_assignments_costume on public.costume_assignments(costume_id);
create index idx_costume_assignments_dancer on public.costume_assignments(dancer_id);
create index idx_props_piece on public.props(piece_id);

-- RLS (permissive for now)
alter table public.costumes enable row level security;
alter table public.costume_assignments enable row level security;
alter table public.props enable row level security;

create policy "Allow all costumes" on public.costumes for all using (true) with check (true);
create policy "Allow all costume_assignments" on public.costume_assignments for all using (true) with check (true);
create policy "Allow all props" on public.props for all using (true) with check (true);

create trigger set_updated_at before update on public.costumes
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.props
  for each row execute function public.handle_updated_at();
