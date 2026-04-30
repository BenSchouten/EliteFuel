# EliteFuel

**AI-powered nutrition support for youth sports clubs.**

EliteFuel is a local MVP for club-scoped youth sports nutrition operations. It helps clubs connect team schedules, athlete context, meal logging, parent support, staff follow-ups, hydration trends, and a practical club meal library.

## Problem

Youth sports clubs rarely have affordable, day-to-day nutrition support. Athletes, parents, and coaches often need simple guidance around what to eat, when to hydrate, how to pack for travel, and how training context changes fueling needs.

## Solution

EliteFuel turns meal photos, user corrections, hydration check-ins, and schedule context into coachable fueling feedback across four role-aware experiences: Club Admin, Staff, Athlete, and Parent.

The flagship feature is AI meal photo feedback grounded in visible meal components and user corrections. Meal images are handled transiently: the app interprets the image server-side, saves only broad extracted food details, and does not permanently store the photo.

## Core Roles

- **Club Admin:** manage teams, rosters, staff assignment, team schedules, and the club meal library.
- **Staff:** use roster check-ins, quick athlete reviews, assigned-team schedule setup, and roster support.
- **Athlete:** log meals, receive AI feedback, correct meal details, track hydration, view schedules, and browse the club meal library.
- **Parent:** view linked-child summaries, schedule, meals, hydration trends, and update parent-appropriate profile and food safety details.

## Feature Summary

- AI meal photo interpretation and grounded meal feedback
- Meal correction flow that combines user details with original image interpretation
- Ask EliteFuel text helper for general fueling, parent support, staff workflow, and admin setup questions
- Team schedule builder with one-off dates, weekly repeats, start/end times, and read-only athlete/parent views
- Staff roster check-in board with assigned-team selector and multi-select filters
- Staff quick athlete review pages
- Club meal library with contextual, softened recommendation language
- Hydration and urine-color trend visualization
- Parent linked-child selector and read-only hydration support
- Optional onboarding model for athlete logins, parent-managed athletes, and roster-only athletes
- Club admin control center for setup and operational readiness

## Demo Accounts

Password for all demo accounts:

```text
Demo123!
```

| Role | Email |
| --- | --- |
| Club Admin | `admin@elitefuel.demo` |
| Staff | `jordan.staff@elitefuel.demo` |
| Athlete | `maya.torres@elitefuel.demo` |
| Parent | `morgan.parent@elitefuel.demo` |

## Suggested Demo Flow

1. Sign in as **Club Admin** and review Club admin, Team roster, Team schedule, and Club meal library.
2. Sign in as **Staff** and review Staff Operations, team selection, filters, quick athlete review, roster, and assigned-team schedule.
3. Sign in as **Athlete** and review Athlete overview, Meals, AI feedback, correction details, hydration trend, schedule, and library.
4. Sign in as **Parent** and review linked-child selection, schedule, meal summary, hydration trend, and profile/safety support.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth credentials auth
- OpenAI text and vision AI

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your local PostgreSQL connection string and secrets.

4. Create/apply migrations and seed demo data:

```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

Or run the combined setup script:

```bash
npm run db:setup
```

5. Start local development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If the app starts on another port, use the URL printed by Next.js.

## Important Commands

```bash
npm run dev
npm run dev:clean
npm run typecheck
npm run build
npm run build:local
npm run db:deploy
npx prisma migrate dev
npx tsx prisma/seed.ts
```

Use `npm run dev:clean` if local styles or Next.js cache artifacts get stale. It clears local build caches, regenerates Prisma Client, and starts the dev server.

`npm run build` uses the standard Next.js `.next` output and is the command Vercel should run. `npm run build:local` is available if you want a separate local `.next-build` output while testing.

## Environment Variables

See [.env.example](./.env.example).

Required for local app/database:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Optional for AI features:

- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_VISION_MODEL`

If `OPENAI_API_KEY` is missing, Ask EliteFuel and meal vision analysis use safe fallback behavior instead of failing the app.

## Vercel Deployment Notes

EliteFuel can be deployed to Vercel with a hosted PostgreSQL database. Do not commit `.env` or any real secrets.

Recommended Vercel settings:

- **Framework preset:** Next.js
- **Install command:** `npm install`
- **Build command:** `npm run build`
- **Output directory:** default Next.js output

Required Vercel environment variables:

- `DATABASE_URL`: hosted PostgreSQL connection string for Prisma
- `NEXTAUTH_SECRET`: strong random secret
- `NEXTAUTH_URL`: deployed URL, for example `https://your-project.vercel.app`

Optional AI environment variables:

- `OPENAI_API_KEY`: enables Ask EliteFuel and meal photo interpretation
- `OPENAI_TEXT_MODEL`: optional override, defaults to `gpt-4.1-mini`
- `OPENAI_VISION_MODEL`: optional override, defaults to `gpt-4.1-mini`

Hosted database setup:

1. Create a hosted PostgreSQL database.
2. Set `DATABASE_URL` in Vercel and in your local shell when running Prisma commands against that hosted database.
3. Apply migrations:

```bash
npm run db:deploy
```

4. Optional for a public demo database only: seed demo data.

```bash
npx tsx prisma/seed.ts
```

The seed script deletes and recreates demo data. Run it only against a database intended for demo/reset behavior, not against real club data.

Before deploying, run locally:

```bash
npm run typecheck
npm run build
```

## Safety And Privacy Notes

- EliteFuel is general sports nutrition education, not medical care.
- It does not provide calorie restriction, weight-loss, body-shaming, diagnosis, or treatment guidance.
- Allergy, supplement, eating concern, injury, dehydration symptom, and medical questions are directed to parents/guardians and qualified professionals.
- Athlete, parent, staff, and admin permissions are separated by role and club scope.
- Parents can view linked athletes only.
- Staff are scoped to assigned teams.
- Meal photos are interpreted transiently; only extracted broad food descriptions/components are saved.
- The club meal library is club-scoped and is not a public social feed.

## Known Limitations

- MVP submission/demo app; production deployment needs hardened ops and secrets management.
- Credentials auth is demo-oriented and not production-auth hardened.
- AI answers and meal interpretation require `OPENAI_API_KEY` for full behavior.
- Not a replacement for a registered dietitian, physician, athletic trainer, or emergency care.
- Seed data is intentionally small and demo-focused.
- No real club deployment, billing, notifications, or production observability yet.

## Future Improvements

- Production deployment and managed database hosting
- Stronger production authentication and account invitation flows
- Richer staff analytics and trend summaries
- Mobile-first polish for athlete and parent use
- Parent notifications and reminders
- More robust club onboarding and import tools
- Expanded audit logging and privacy controls
