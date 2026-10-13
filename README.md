# Resource Reservation System

A web app for managing shared rooms, equipment and vehicles, and booking them without double-booking.
Built with Next.js (App Router), TypeScript, PostgreSQL, Prisma and Tailwind CSS.

## Features
- **Accounts and roles.** Sign in / register. Admins manage resources and see everything; members book and manage their own reservations.
- **Schedule board.** A calendar page shows every resource on one day-timeline (06:00 to 22:00) with a "now" marker; click your own upcoming block to edit it.
- **Booking.** Create, edit (reschedule) and cancel reservations. Admins can book on behalf of someone.
- **Recurring reservations.** Repeat daily or weekly, 2 to 12 occurrences, created all-or-nothing in one transaction; a whole series can be cancelled at once.
- **Smart conflicts.** If a slot is taken, the message names who has it and suggests the next free slots of the same length.
- **Live availability.** Each resource shows "Free now" or "In use until HH:MM", plus a 7-day timeline. Resources can be searched and filtered by type, capacity and "free right now".
- **Overview dashboard.** KPIs, utilisation per resource for the next 7 days, busiest weekdays, and your next reservations.
- **Admin tools.** Activity log (who did what), CSV export of reservations, resource amenities.

## Key engineering decisions
- **Overlaps are prevented in the database.** A PostgreSQL exclusion constraint (`tstzrange` + `btree_gist`) rejects two confirmed reservations for the same resource at overlapping times, even if two people submit at the same instant. The app checks first to give a friendly message; the constraint is the final guard.
- **Half-open time ranges.** A booking ending at 10:00 does not conflict with one starting at 10:00.
- **Soft cancel.** Cancelled bookings stay in the table (status `CANCELLED`) so history and usage stay accurate, and they no longer block the slot.
- **Time zones.** Stored as UTC (`timestamptz`); entered and displayed in Sri Lanka time (`Asia/Colombo`).
- **Validation in layers.** Zod on the server for input; the database enforces `end > start` and no-overlap.
- **Authorization on the server.** Every server action re-checks who is calling and their role; hiding a button is never the only protection.
- **Authentication without extra dependencies.** Passwords are hashed with scrypt (built into Node). Sessions are signed, httpOnly cookies (HMAC), so the browser cannot forge or edit them.
- **Server Actions** for mutations; server components read data directly through Prisma.
- **Deactivation rules.** A resource cannot be deactivated while it has upcoming reservations.

## Setup
Requirements: Node.js 20+ and PostgreSQL 16+ (running locally).

1. `npm install`
2. Copy `.env.example` to `.env` and put your PostgreSQL password in `DATABASE_URL`.
3. `npm run dev`

`npm run dev` first runs a setup step that creates the `reservations` database if it does not exist,
generates the Prisma client, applies the migrations (including the overlap constraint) and seeds demo data.
Then open http://localhost:3000.

Demo accounts (created by the seed):
- Admin: `admin@example.com` / `admin123`
- Member: `member@example.com` / `member123`

## Data model
Tables: `users`, `resource_types`, `resources`, `reservations`, `activity_logs`. See `docs/schema.dbml` and the ER diagram link in the submission.

## Known limitations / next steps
- No email notifications or password reset.
- Opening hours are not enforced per resource (suggested slots stay between 06:00 and 22:00).
- Tests are manual; automated tests for the booking logic would be the next addition.
