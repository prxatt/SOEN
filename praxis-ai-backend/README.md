# Praxis-AI Backend

Production-ready backend for the Praxis-AI productivity app built with Hono.js, tRPC, and Supabase.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js (ultra-fast, edge-optimized)
- **Type Safety**: tRPC (end-to-end TypeScript)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini + Anthropic Claude
- **Deployment**: Cloudflare Workers

## Features

- ✅ Type-safe APIs with tRPC
- ✅ Real-time subscriptions with Supabase
- ✅ Vector embeddings for semantic search
- ✅ AI-powered insights and recommendations
- ✅ Mobile app support (React Native)
- ✅ Cost-effective for 1,000+ users

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Deploy to Cloudflare Workers:**
   ```bash
   npm run deploy
   ```

## Project Structure

```
praxis-ai-backend/
├── src/
│   ├── app.ts              # Main Hono application
│   ├── context.ts          # tRPC context setup
│   ├── trpc.ts             # tRPC configuration
│   ├── routers/            # tRPC routers
│   ├── services/           # Business logic services
│   ├── middleware/         # Custom middleware
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── supabase/
│   ├── migrations/         # Database migrations
│   └── seed.sql           # Seed data
├── package.json
├── wrangler.toml          # Cloudflare Workers config
└── README.md
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## License

Proprietary - Surface Tension LLC
