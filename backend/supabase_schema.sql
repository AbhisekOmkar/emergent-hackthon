-- Run this in your Supabase SQL Editor to create the agents table

create table if not exists agents (
  id uuid primary key,
  name text not null,
  description text,
  type text not null,
  status text not null default 'draft',
  system_prompt text,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS (Optional, depending on your security model)
alter table agents enable row level security;

-- Allow public read access (Modify as needed)
create policy "Public agents are viewable by everyone" 
on agents for select using (true);

-- Allow authenticated insert/update (Modify as needed)
create policy "Authenticated users can insert agents" 
on agents for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update agents" 
on agents for update using (auth.role() = 'authenticated');
