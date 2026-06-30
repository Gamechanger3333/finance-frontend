# FinFlow Frontend

Next.js 14 frontend for FinFlow — AI-Powered Finance Management.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **TanStack Query** (data fetching)
- **Lucide React** (icons)

## Pages

| Route | Description |
|-------|-------------|
| `/landing` | Public landing page |
| `/login` | Login page |
| `/register` | Register page |
| `/dashboard` | Financial overview (protected) |
| `/transactions` | Transactions CRUD (protected) |
| `/budgets` | Budget management (protected) |
| `/goals` | Financial goals (protected) |
| `/ai-assistant` | AI chat + insights (protected) |
| `/analytics` | Charts & analytics (protected) |
| `/settings` | Profile & settings (protected) |

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The Next.js rewrite in `next.config.js` proxies all `/api/*` calls to your backend.

## Development

```bash
npm run dev
# Frontend runs on http://localhost:3000
# Backend should run on http://localhost:3001
```

## API Communication

- All API calls go through `/api/*` which Next.js rewrites to the backend
- JWT token is stored in `localStorage` under key `finflow_token`
- Token is attached as `Authorization: Bearer <token>` header on every request
- Auth state lives in `AuthProvider` (`src/hooks/use-auth.tsx`)

## Build

```bash
npm run build
npm start
```
