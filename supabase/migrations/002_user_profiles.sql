-- User profiles for personalization (Creator app)
-- Deploy when auth is implemented. Until then, all settings are localStorage-only.

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  studio_name text not null default '',
  accent_color text not null default '#007AFF',
  theme_preference text not null default 'light'
    check (theme_preference in ('light', 'dark', 'system')),
  custom_greeting text not null default '',
  studio_logo_url text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: users can only read/write their own profile
alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Auto-create profile on first sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute procedure update_updated_at();
