This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy to EasyPanel (Docker)

### Files added for deployment

- `Dockerfile`
- `.dockerignore`
- `docker-entrypoint.sh`
- `docker-compose.easypanel.yml`
- `docker.env.example`

### Option A: Deploy as Docker Compose project in EasyPanel

1. Push this repository.
2. In EasyPanel, create a new app from `docker-compose.easypanel.yml`.
3. Replace all default secrets in the compose env (`JWT_SECRET`, `ADMIN_PASSWORD`, and DB password).
4. Deploy.

### Option B: Deploy app container only (external Postgres)

1. In EasyPanel, create a service from `Dockerfile`.
2. Set required environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `SEED_ON_BOOT` (`true` only for first boot if needed)
3. Expose port `3000`.
4. Deploy.

### Notes

- On startup, container will run:
  - `prisma generate`
  - `prisma migrate deploy`
  - optional seed (`SEED_ON_BOOT=true`)
  - `next start`
- App listens on `0.0.0.0:${PORT}`.
