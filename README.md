# The Profit Architecture

A multi-tenant business assessment, profitability analysis, and ongoing advisory platform.

## Overview

The Profit Architecture helps business owners and approved facilitators:
- Understand their organization's complete picture
- Evaluate evidence and financial numbers
- Identify constraints, risks, and opportunities
- Select three priorities aligned with founder capacity
- Manage implementation over time through the Ongoing Advisor

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + pgvector)
- **Auth:** Supabase Auth
- **AI:** OpenAI Responses API
- **Deployment:** Vercel

## Pace Configuration

The build supports three paces:

| Pace | Duration | Characteristics |
|------|----------|-----------------|
| **Aggressive** | 16 weeks | Parallel workstreams, maximum velocity |
| **Standard** | 20 weeks | Balanced approach with quality gates |
| **Conservative** | 25 weeks | Risk-averse with thorough testing |

Configure in `/lib/config/pace.ts`

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and OpenAI credentials

# Run migrations
supabase migration up

# Start development server
npm run dev
```

## Project Structure

```
app/
  (auth)/          # Authentication routes
  (app)/           # Main application shell
  api/             # API routes
components/        # React components
lib/
  supabase/        # Supabase clients
  auth/            # Auth utilities
  config/          # Configuration
  ai/              # AI orchestration
  calculations/    # Financial formulas
supabase/
  migrations/      # Database migrations
```

## Documentation

- [Build State Report](/docs/TPA-BUILD-STATE-REPORT.md)
- [System Audit](/docs/tpa-system-audit.md)
- [Gap Analysis](/docs/tpa-gap-analysis.md)
- [Implementation Map](/docs/tpa-implementation-map.md)

## License

Private - Sacred Kaleidoscope Community LLC
