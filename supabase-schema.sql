-- Run this once in your Supabase project's SQL Editor.
-- Stores arbitrary key/value save data per player code
-- (progress, custom NPCs, AI sentence cache, etc.)

create table if not exists player_data (
  code text not null,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (code, key)
);

-- Row Level Security is enabled with no public policies. The Netlify
-- Functions connect using the service-role key, which bypasses RLS, so the
-- table stays inaccessible to anyone calling Supabase directly from a
-- browser with the anon key.
alter table player_data enable row level security;
