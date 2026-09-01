# SplitNice

A free, self-hosted expense-sharing app for small groups of friends. Track shared expenses, simplify debts, and settle up — no subscription required.

## Features

- **Google OAuth** login with secure server-side sessions
- **Groups** — create trip, apartment, couple, or event groups with multiple members
- **Flexible splitting** — equal, exact amounts, percentage, or shares/ratio
- **Multi-payer** support — expenses can be paid by more than one person
- **Debt simplification** — minimizes the number of payments needed to settle up
- **Settlements** — record payments and track settlement history
- **Activity feed** — see all expense and group activity at a glance
- **Search & filter** — find expenses by keyword, group, date, or category
- **Notifications** — in-app notifications for group additions, new expenses, settlements
- **Mobile-friendly** — responsive design with bottom navigation on mobile
- **Decimal-safe math** — all financial calculations use arbitrary-precision decimals (never IEEE floats)

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router) + TypeScript
- [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) 7 ORM
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Auth.js / NextAuth](https://authjs.dev/) v5 (Google OAuth)
- [Decimal.js](https://mikemcl.github.io/decimal.js/) for money-safe arithmetic
- [Zod](https://zod.dev/) for runtime validation
- [Vitest](https://vitest.dev/) for testing

## Prerequisites

- Node.js 18+ (tested with 22)
- A PostgreSQL database (local or hosted)
- A Google OAuth client ID and secret

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/mator9/SplitNice.git
cd SplitNice
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/splitnice` |
| `NEXTAUTH_URL` | Your app URL, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret. Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console (see below) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (see below) |

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth Client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret into your `.env`

### 4. Set up the database

```bash
# Push the schema to your database (creates tables)
npm run db:push

# (Optional) Run migrations for production-ready setup
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint the codebase |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:migrate:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # NextAuth route handlers
│   │   ├── groups/         # Group CRUD + members + balances
│   │   ├── expenses/       # Expense CRUD
│   │   ├── settlements/    # Settlement recording
│   │   ├── friends/        # Friend requests & relations
│   │   ├── notifications/  # In-app notifications
│   │   ├── search/         # Expense search & filter
│   │   ├── activity/       # Activity feed
│   │   └── balances/       # Overall balance summary
│   ├── dashboard/          # Dashboard page
│   ├── groups/             # Groups list + detail
│   ├── expenses/           # Expenses list with search
│   ├── friends/            # Friends management
│   ├── activity/           # Activity feed
│   ├── settings/           # Profile & notifications
│   └── login/              # Login page
├── components/
│   ├── ui/                 # Reusable UI components (Button, Card, Modal, etc.)
│   ├── layout/             # App layout, sidebar, mobile nav
│   └── AddExpenseModal.tsx # Expense creation form
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── authz.ts            # Authorization helpers
│   ├── hooks.ts            # React hooks (useFetch, useDebounce)
│   ├── money.ts            # Decimal-safe split calculations & debt simplification
│   ├── prisma.ts           # Prisma client singleton
│   └── validations.ts      # Zod schemas
└── __tests__/
    └── money.test.ts       # 31 tests for financial calculations
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Demo data seeder
```

## Deployment (Free Tier)

SplitNice is designed to run on free-tier infrastructure:

### Option A: Vercel + Neon (Recommended)

1. **Database**: Create a free PostgreSQL database at [Neon](https://neon.tech)
   - Copy the connection string
2. **Deploy**: Push to GitHub and import in [Vercel](https://vercel.com)
   - Add environment variables in Vercel project settings
   - `DATABASE_URL` = your Neon connection string
   - `NEXTAUTH_URL` = your Vercel domain (e.g. `https://splitnice.vercel.app`)
   - `NEXTAUTH_SECRET` = generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` = your OAuth credentials
   - Add your Vercel domain to Google OAuth redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`
3. **Migrate**: Run migrations on deploy
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Vercel + Supabase

1. **Database**: Create a free PostgreSQL database at [Supabase](https://supabase.com)
   - Use the direct connection string (not the pooled one) for migrations
2. Follow the same Vercel deployment steps as above

### Option C: Railway

1. Create a project at [Railway](https://railway.app)
2. Add a PostgreSQL service
3. Deploy from GitHub
4. Configure environment variables in Railway dashboard

### Post-Deploy

- Update Google OAuth redirect URIs to include your production domain
- Run `npx prisma migrate deploy` to set up the production database
- Optionally run `npm run db:seed` for demo data

## Database Backup

```bash
# Export
pg_dump $DATABASE_URL > backup.sql

# Import
psql $DATABASE_URL < backup.sql
```

## Security

- All API routes verify authentication via NextAuth sessions
- Authorization checks on every data access (group membership, expense access)
- Server-side validation with Zod on all inputs
- Secrets stored only in environment variables
- Prisma parameterized queries (no SQL injection)
- Session-based auth with secure cookies

## License

MIT
