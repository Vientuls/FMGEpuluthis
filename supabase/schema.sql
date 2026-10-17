-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run
create table if not exists public.user_data (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  profile    text        not null,            -- the user name chosen inside the app (e.g. "Priya")
  key        text        not null,            -- bank | hist | prof | last
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile, key)
);
alter table public.user_data enable row level security;
-- Each signed-in person can only ever see and change their own rows
create policy "own rows select" on public.user_data for select using (auth.uid() = user_id);
create policy "own rows insert" on public.user_data for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows delete" on public.user_data for delete using (auth.uid() = user_id);
