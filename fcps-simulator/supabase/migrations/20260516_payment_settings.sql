-- Payment Settings Table
create table if not exists public.payment_settings (
    id uuid primary key default gen_random_uuid(),
    provider text unique not null, -- 'jazzcash', 'easypaisa', 'bank'
    account_number text not null,
    account_name text not null,
    extra_info text, -- For bank name or other notes
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.payment_settings enable row level security;

-- Policies
create policy "Allow read for all authenticated users"
on public.payment_settings for select
to authenticated
using (true);

create policy "Allow update for admins"
on public.payment_settings for update
to authenticated
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

create policy "Allow insert for admins"
on public.payment_settings for insert
to authenticated
with check (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- Seed Initial Data
insert into public.payment_settings (provider, account_number, account_name, extra_info)
values 
('jazzcash', '0300-XXXXXXX', '[Your Name]', null),
('easypaisa', '0300-XXXXXXX', '[Your Name]', null),
('bank', 'XXXX-XXXX-XXXX-XXXX', '[Your Name]', 'HBL / Meezan Bank')
on conflict (provider) do nothing;
