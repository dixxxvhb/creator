-- Creator App — Seasons & Competitions
-- Run against Supabase project: creator (adfqiknbtpzbyxwhrrmc)

-- ─── Seasons ───
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  year int not null,
  start_date date,
  end_date date,
  notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Piece-Season join table ───
create table public.piece_seasons (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  unique(piece_id, season_id)
);

-- ─── Competitions ───
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  location text not null default '',
  date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Competition Entries ───
create table public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  piece_id uuid not null references public.pieces(id) on delete cascade,
  category text not null default '',
  placement text,
  score numeric(6,2),
  special_awards text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_seasons_user on public.seasons(user_id);
create index idx_piece_seasons_piece on public.piece_seasons(piece_id);
create index idx_piece_seasons_season on public.piece_seasons(season_id);
create index idx_competitions_season on public.competitions(season_id);
create index idx_entries_competition on public.competition_entries(competition_id);
create index idx_entries_piece on public.competition_entries(piece_id);

-- RLS (permissive for now — no auth yet)
alter table public.seasons enable row level security;
alter table public.piece_seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;

create policy "Allow all seasons" on public.seasons for all using (true) with check (true);
create policy "Allow all piece_seasons" on public.piece_seasons for all using (true) with check (true);
create policy "Allow all competitions" on public.competitions for all using (true) with check (true);
create policy "Allow all entries" on public.competition_entries for all using (true) with check (true);

-- Updated_at triggers
create trigger set_updated_at before update on public.seasons
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.competitions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.competition_entries
  for each row execute function public.handle_updated_at();
