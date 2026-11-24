# Empower Bonds

A banking website UI built with Next.js and exported as a **static site**. The full marketing site and a complete sample dashboard (accounts, transactions, cards, statements, security, settings, support) are prerendered to plain HTML/CSS/JS in `out/` and can be served by any static host — Firebase Hosting on the free Spark plan is the intended target.

There is no server runtime, no API routes, no database and no real authentication in this build. Everything the dashboard shows comes from local demo data.

## What works

- **Marketing pages** — home, about, careers, security, privacy policy, terms of service.
- **Sample dashboard** — overview, accounts, transactions (client-side search/filter), cards, statements, security, settings, support, all backed by local demo data for the account holder *Gloria Morgan* (total balance `$2,684,305.72`, 12-month cash-flow chart).
- **Demo sign-in** — the form accepts the sample credentials below and opens `/dashboard`. Anything else shows an authentication error.
- **Sign up** — goes to the "Getting your account ready" holding page.
- **Loading states** — the dashboard shows a skeleton for ~900 ms per route, sign-in for ~1.2 s, sign-up for ~1.4 s, so the demo feels like a real application.
- **Local interactions** — card freeze, notification read state, settings and account controls update in the browser only; transfers always reject the secret code with "Wrong password".
- **Exchange rates** — the currency converter and the dashboard's converted totals ask the keyless `open.er-api.com` feed for today's rates on page load and fall back to the bundled table in `src/lib/rates.ts` when the request fails.

Intentionally unavailable: real authentication, database-backed accounts, emails, payments.

## Tech stack

Next.js 15.5 (App Router, static export) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui components · react-hook-form + Zod · Framer Motion · sonner toasts.

## Demo sign-in

| Field    | Value                     |
| -------- | ------------------------- |
| Email    | `gloria.morgan@gmail.com`  |
| Password | `hrny1986#!`              |

The values live in `src/lib/demo-credentials.ts` and are public demo values — change or remove them before using this project for real accounts. Because the site is a static export, a credential change requires a rebuild and redeploy before visitors see it. The form starts empty; it is not pre-filled.

## Getting started

### Prerequisites

- Node.js `22.13.1` (see `engines` in `package.json`)
- npm (bundled with Node) — pnpm is optional

No database, Redis instance or email provider is required for the demo build.

### Install

```sh
# respects pnpm-lock.yaml without a global pnpm install
npx pnpm@10.18.1 install

# or, using the npm that ships with Node
npm install
```

### Develop

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To use another port, pass it through: `npm run dev -- -p 65040`.

### Build the static site

```sh
npm run build
```

`next.config.ts` sets `output: "export"`, so the build writes static files to `out/`. No server needs to be running, and every route in the build output is marked `○ (Static)`.

Note: building clears `.next`, which breaks a running dev server — restart `npm run dev` after a build.

### Preview the exported site exactly as a static host serves it

```sh
npx serve out
```

## Deploying to Firebase Hosting

`firebase.json` contains a single `hosting` block that publishes `out/`, with `cleanUrls` and `trailingSlash` enabled and no functions, rewrites or App Hosting backend.

```sh
npm run build

npm install -g firebase-tools   # once
firebase login
firebase use --add              # pick your Firebase project
firebase deploy --only hosting

# or, using the package script (runs `npx firebase-tools`):
npm run deploy
```

- `/dashboard/`, `/auth/login/` and the other routes resolve to their prerendered `index.html` files; unknown paths are served from `out/404.html`.
- A custom domain is added in the Firebase console under **Hosting → Add custom domain**; no rebuild is needed because the site is fully static.
- If you later want the real backend (auth, Postgres, Redis, emails), remove `output: "export"` and deploy to Firebase App Hosting or another Node host instead.

## Project structure

```txt
empower-bond/
├── src/
│   ├── app/
│   │   ├── globals.css                  # Tailwind CSS 4 setup and design tokens
│   │   ├── favicon.ico
│   │   └── (static)/                    # Every route; all prerendered
│   │       ├── layout.tsx               # Shared header/footer shell
│   │       ├── page.tsx                 # Home
│   │       ├── robots.tsx, sitemaps.tsx # SEO
│   │       ├── about/, careers/, security/
│   │       ├── privacy-policy/, terms-of-service/
│   │       ├── auth/                    # login, register, forgot/reset password,
│   │       │                            #   confirm-code, two-factor, blocked
│   │       └── dashboard/               # layout, loading, overview, accounts,
│   │                                    #   transactions, cards, statements,
│   │                                    #   security, settings, support
│   ├── components/                      # Page sections, dashboard widgets, forms, ui/
│   ├── lib/
│   │   ├── demo.ts                      # Demo accounts, transactions, cards, statements
│   │   ├── demo-credentials.ts          # Sign-in credentials for the demo
│   │   ├── dashboard-session.ts         # DEMO_VIEWER used by dashboard pages
│   │   └── ...                          # formatting, cards, statements, shared utils
│   ├── hooks/, types/, config.ts
│   ├── db/, server/                     # Retained from the original backend; unused by
│   │                                    #   the static export and never imported by it
├── public/                              # Static assets
├── out/                                 # Generated by `npm run build` (deploy this)
├── next.config.ts                       # output: "export", unoptimized images
├── firebase.json                        # Hosting config for out/
└── package.json
```

`src/config.ts` is imported by several client components (logo, footer, banner, hero), so the whole config object is included in the public JavaScript bundle. Never hard-code secrets there — read them from `process.env` only.

## Environment variables

The demo build works without any of these. They are documented for reference in case the original backend is restored (`src/db`, `src/server`); `.env.example` lists the template's variables.

| Variable | Purpose |
| --- | --- |
| `TITLE`, `NEXT_PUBLIC_TITLE` | Site title; set both to the same value. Only `NEXT_PUBLIC_*` reaches client components. |
| `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL` | Real authentication (unused in the export) |
| `DATABASE_URL` | PostgreSQL connection for Drizzle (unused) |
| `REDIS_URL` | Redis URL for session/cache (unused) |
| `RESEND_API_KEY`, `NEXT_PUBLIC_FROM_EMAIL` | Transactional email (unused) |
| `EXCHANGERATE_KEY`, `COINLAYER_KEY` | Server-side FX/crypto rates (`src/server/currencyExchangeRates.ts`, unused in the export); client pages use the keyless feed plus bundled fallbacks |
| `NEXT_PUBLIC_CLOUDINARY_*` | Image upload hosting |
| `TG_TOKEN`, `TG_ADMIN` | Telegram notifications (optional) |
| `TRUSTED_ORIGINS`, `NEXT_PUBLIC_COMPLAINTS_EMAIL` | Origin allow-list and support address |

Keep real secrets in `.env.local` (git-ignored) or your host's secret manager, never in `src/config.ts`.

## Usage

- Sign in with the demo credentials to reach `/dashboard`; every dashboard page shows the same sample account data.
- Use the dashboard navigation to move between overview, accounts, transactions, cards, statements, security, settings and support.
- The auth pages under `/auth/*` render, but only login and sign-up do anything locally — password reset, email confirmation and two-factor submission require the removed backend and will not complete.

## Design credits

Based on the Figma design by Pragadesh ([Banking Company Website UI Template](https://www.figma.com/community/file/1298887728670431393/banking-company-website-ui-template-design-in-dark-theme-free-editable), free editable community file). Contact: [pragadesh37v@gmail.com](mailto:pragadesh37v@gmail.com).

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Add your name below after your first accepted pull request.

### Contributors

- [Jeremiah David](mailto:jeremiahedavid@gmail.com) (Initial Creator)

## License

Apache 2.0 — see [LICENSE](LICENSE).

## Support

Open an issue on [GitHub](https://github.com/david-jerry/empower-bond-free-template/issues), or email [support@empowerbonds.com](mailto:support@empowerbonds.com).
