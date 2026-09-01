# DriveGO

A peer-to-peer car rental marketplace. Renters browse and book cars from local owners; owners list cars and manage bookings; everyone gets in-app notifications, live chat, and email updates.

## Stack

- React (Create React App) + React Router
- [Supabase](https://supabase.com) — Postgres, Auth, Storage, Realtime
- [Paystack](https://paystack.com) — card payments
- [EmailJS](https://www.emailjs.com) — transactional email, no backend required

## Setup

1. **Install dependencies**

   ```
   npm install
   ```

2. **Create a Supabase project**, then in the SQL editor run `supabase/schema.sql`. This creates all tables (`profiles`, `cars`, `bookings`, `notifications`, `reviews`, `messages`), row-level security policies, a trigger that auto-creates a `profiles` row on signup, and the `car-images` storage bucket.

   Optionally seed some demo cars with `supabase/seed.sql` after you've signed up at least one `owner` account (see the comment at the top of that file).

3. **Set up Paystack** and grab your public key (test mode is fine for development).

4. **Set up EmailJS**: one service, two templates — one for booking-related emails (used by `src/lib/email.js`: new booking, booking confirmed/declined, new chat message) and one for the general contact form (`src/pages/ContactPage.jsx`).

5. **Copy `.env.example` to `.env`** and fill in the values from steps 2–4.

6. **Run it**

   ```
   npm start
   ```

## Roles

Every account is a `renter`, `owner`, or `admin` (stored in `profiles.role`). New signups choose renter or owner; there's no self-serve way to become an admin — promote a user manually in the Supabase table editor (`update profiles set role = 'admin' where id = '...'`).

## Scripts

- `npm start` — dev server
- `npm run build` — production build
- `npm test` — CRA test runner (no test suite is checked in yet)
