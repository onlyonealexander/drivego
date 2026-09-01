-- DriveGO database schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`) for a fresh project.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

-- ── EXTENSIONS ──────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── PROFILES ──────────────────────────────────────
-- One row per auth user. Created automatically by the trigger below on signup.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  city       text,
  bio        text,
  role       text not null default 'renter' check (role in ('renter', 'owner', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- In case an older profiles table already existed with fewer columns.
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists city       text;
alter table public.profiles add column if not exists bio        text;

-- Auto-create a profile row whenever a new auth user signs up,
-- using the metadata passed to supabase.auth.signUp() (see src/context/AuthContext.jsx).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'renter'),
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── CARS ──────────────────────────────────────────
create table if not exists public.cars (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  brand       text not null,
  type        text not null default 'Sedan',
  year        int,
  price       numeric not null,
  city        text not null,
  description text,
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists cars_owner_id_idx on public.cars (owner_id);
create index if not exists cars_available_idx on public.cars (available);

-- ── BOOKINGS ──────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  renter_id    uuid not null,
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  total_price  numeric not null,
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'completed')),
  payment_ref  text,
  reviewed     boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint bookings_renter_id_fkey foreign key (renter_id) references public.profiles (id) on delete cascade
);

create index if not exists bookings_renter_id_idx on public.bookings (renter_id);
create index if not exists bookings_owner_id_idx on public.bookings (owner_id);
create index if not exists bookings_car_id_idx on public.bookings (car_id);

-- ── NOTIFICATIONS ──────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null default 'info',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);

-- ── REVIEWS ──────────────────────────────────────
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  car_id     uuid not null references public.cars (id) on delete cascade,
  renter_id  uuid not null references public.profiles (id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_car_id_idx on public.reviews (car_id);

-- ── MESSAGES ──────────────────────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null,
  receiver_id uuid not null,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles (id) on delete cascade,
  constraint messages_receiver_id_fkey foreign key (receiver_id) references public.profiles (id) on delete cascade
);

create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);

-- ── ROW LEVEL SECURITY ──────────────────────────────
alter table public.profiles      enable row level security;
alter table public.cars          enable row level security;
alter table public.bookings      enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews       enable row level security;
alter table public.messages      enable row level security;

-- profiles: anyone signed in can read any profile (needed for car owner/renter names in joins);
-- a user can only edit their own row.
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- cars: available cars are publicly readable; owners manage their own; admins manage all.
drop policy if exists "available cars are publicly readable" on public.cars;
create policy "available cars are publicly readable"
  on public.cars for select
  using (available = true or owner_id = auth.uid());

drop policy if exists "owners can insert their own cars" on public.cars;
create policy "owners can insert their own cars"
  on public.cars for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owners can update their own cars" on public.cars;
create policy "owners can update their own cars"
  on public.cars for update
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "owners can delete their own cars" on public.cars;
create policy "owners can delete their own cars"
  on public.cars for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "admins manage all cars" on public.cars;
create policy "admins manage all cars"
  on public.cars for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- bookings: visible to the renter and the owner involved; either can update status.
drop policy if exists "bookings visible to renter or owner" on public.bookings;
create policy "bookings visible to renter or owner"
  on public.bookings for select
  to authenticated
  using (renter_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "renters can create bookings" on public.bookings;
create policy "renters can create bookings"
  on public.bookings for insert
  to authenticated
  with check (renter_id = auth.uid());

drop policy if exists "renter or owner can update a booking" on public.bookings;
create policy "renter or owner can update a booking"
  on public.bookings for update
  to authenticated
  using (renter_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "admins manage all bookings" on public.bookings;
create policy "admins manage all bookings"
  on public.bookings for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- notifications: a user only sees and manages their own.
drop policy if exists "users see their own notifications" on public.notifications;
create policy "users see their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update their own notifications" on public.notifications;
create policy "users update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "system can insert notifications" on public.notifications;
create policy "system can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- reviews: publicly readable; only the renter on a completed booking writes their own review.
drop policy if exists "reviews are publicly readable" on public.reviews;
create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

drop policy if exists "renters can insert their own reviews" on public.reviews;
create policy "renters can insert their own reviews"
  on public.reviews for insert
  to authenticated
  with check (renter_id = auth.uid());

-- messages: only sender and receiver can see or send.
drop policy if exists "messages visible to sender or receiver" on public.messages;
create policy "messages visible to sender or receiver"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "users can send messages" on public.messages;
create policy "users can send messages"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "receiver can mark messages read" on public.messages;
create policy "receiver can mark messages read"
  on public.messages for update
  to authenticated
  using (receiver_id = auth.uid());

-- ── REALTIME ──────────────────────────────────────
-- Needed for the live chat (src/pages/ChatPage.jsx) and notification bell
-- (src/components/NotificationBell.jsx) postgres_changes subscriptions.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ── STORAGE ──────────────────────────────────────
-- Public bucket for car listing photos (src/lib/storage.js).
insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

drop policy if exists "car images are publicly readable" on storage.objects;
create policy "car images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'car-images');

drop policy if exists "authenticated users can upload car images" on storage.objects;
create policy "authenticated users can upload car images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-images');

drop policy if exists "owners can delete their own car images" on storage.objects;
create policy "owners can delete their own car images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-images' and owner = auth.uid());

-- ── BOOKING LIFECYCLE ──────────────────────────────
-- Full flow: renter requests + pays -> owner accepts/declines -> owner marks
-- dispatched -> delivered -> completed. See src/lib/db.js for the transitions.

-- Per-car, owner-written requirements the renter must agree to before booking
-- (e.g. "Must be 25+, valid driver's license, ₦20k refundable deposit").
alter table public.cars add column if not exists requirements text;

-- Owner payout details, shown on their own dashboard only.
alter table public.profiles add column if not exists bank_name      text;
alter table public.profiles add column if not exists account_number text;
alter table public.profiles add column if not exists account_name   text;

-- Track that the renter explicitly agreed to the car's requirements at booking time.
alter table public.bookings add column if not exists requirements_agreed boolean not null default false;

-- Extend booking status beyond pending/confirmed/declined/completed to add the
-- dispatch/delivery tracking stages.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'declined', 'dispatched', 'delivered', 'completed'));
