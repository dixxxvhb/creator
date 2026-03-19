-- Creator App — Phase 1 Tables
-- Run against Supabase project: creator (adfqiknbtpzbyxwhrrmc)

-- ─── Global Roster ───
create table public.dancers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  short_name text not null default '',
  color text not null default '#3B82F6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Pieces ───
create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  song_title text,
  song_artist text,
  style text,
  group_size text,
  dancer_count int not null default 0,
  bpm int,
  duration_seconds int,
  audio_url text,
  stage_width int not null default 40,
  stage_depth int not null default 30,
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Formations ───
create table public.formations (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  index int not null default 0,
  label text not null default '',
  timestamp_seconds int,
  choreo_notes text not null default '',
  counts_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Dancer Positions ───
create table public.dancer_positions (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  dancer_id uuid references public.dancers(id) on delete set null,
  dancer_label text not null default '',
  x real not null default 0,
  y real not null default 0,
  color text not null default '#3B82F6',
  created_at timestamptz not null default now()
);

-- ─── Row Level Security ───
alter table public.dancers enable row level security;
alter table public.pieces enable row level security;
alter table public.formations enable row level security;
alter table public.dancer_positions enable row level security;

create policy "Users manage own dancers"
  on public.dancers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own pieces"
  on public.pieces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage formations of own pieces"
  on public.formations for all
  using (piece_id in (select id from public.pieces where user_id = auth.uid()))
  with check (piece_id in (select id from public.pieces where user_id = auth.uid()));

create policy "Users manage positions of own formations"
  on public.dancer_positions for all
  using (formation_id in (
    select f.id from public.formations f
    join public.pieces p on f.piece_id = p.id
    where p.user_id = auth.uid()
  ))
  with check (formation_id in (
    select f.id from public.formations f
    join public.pieces p on f.piece_id = p.id
    where p.user_id = auth.uid()
  ));

-- ─── Indexes ───
create index idx_dancers_user on public.dancers(user_id);
create index idx_pieces_user on public.pieces(user_id);
create index idx_formations_piece on public.formations(piece_id);
create index idx_positions_formation on public.dancer_positions(formation_id);

-- ─── Updated_at triggers ───
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.dancers
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.pieces
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.formations
  for each row execute function public.handle_updated_at();
