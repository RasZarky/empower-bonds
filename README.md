# Empower Bonds

Welcome to **Empower Bonds**, an open-source Next.js banking website template designed to provide a secure, modern banking experience. Built with better-auth for robust authentication, Redis for session management, and Shadcn UI for a sleek, customizable interface, this project is free for use by the open-source community or anyone looking to build a banking solution.

## Overview

Empower Bonds integrates real-time financial data and secure user management, inspired by the dark-themed Figma design by [Pragadesh](mailto:pragadesh37v@gmail.com) ([Figma File](https://www.figma.com/community/file/1298887728670431393/banking-company-website-ui-template-design-in-dark-theme-free-editable)). It offers essential banking features with plans for a future dashboard.

### Key Features

- **Currency Converter**:
  - Crypto <-> Currency conversion
- **Authentication**:
  - Registration
  - Login
  - Password Reset
  - Forgot Password
  - Email Verification
  - Blocked Account Handling
- **Pages**:
  - Home
  - About
  - Career
  - Security
  - Authentication Pages (Registration, Blocked Account, Password Reset, Forgot Password, Login, Email Verification)
- **Technologies**:
  - **Next.js**: Server-side rendering and routing.
  - **better-auth**: Secure authentication with token management.
  - **Redis**: Session storage and caching.
  - **Shadcn UI**: Customizable, accessible UI components.
- **Future Plans**: Integration of a user dashboard for account management, transactions, and settings.

### Design Credits

This project is based on the Figma design by Pragadesh, available in the community: [Banking Company Website UI Template](https://www.figma.com/community/file/1298887728670431393/banking-company-website-ui-template-design-in-dark-theme-free-editable). For inquiries, contact Pragadesh at [pragadesh37v@gmail.com](mailto:pragadesh37v@gmail.com).

## Getting Started

### Prerequisites

- Node.js (v20.x or later)
- npm or pnpm
- Redis server (local or cloud instance)
- PostgreSQL database (local or cloud instance)
- Resend API (Sending transactional emails)

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/david-jerry/empower-bond-free-template.git
    cd empower-bonds
    ```

2. Install dependencies:

    ```sh
    npm install
    # or
    pnpm install
    ```

3. Set up environment variables:
    - Copy `.env.example` to `.env.local`:

        ```sh
        cp .env.example .env.local
        ```

    - Edit `.env.local` with your credentials and API keys (see `.env.example` for details).

4. Migrate Drizzle DB

    ```sh
    npm run push
    # or
    pnpm push
    ```

5. Start the development server:

    ```sh
    npm run dev
    # or
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deploying to Firebase Hosting

This project builds as a **static export**: `next.config.ts` sets `output: "export"`, so `next build` writes plain HTML, CSS, JS and assets to `out/`, and `firebase.json` publishes that folder from Firebase Hosting. The deployed site is the demo UI only — there is no server runtime, no API routes and no database connection. It works on the free Spark plan.

What works on the deployed site:

- Every marketing page (home, about, careers, security, privacy policy, terms of service).
- The sample dashboard under `/dashboard` (accounts, transactions, cards, statements, security, settings, support) using the local demo ledger for Gloria Morgan.
- Login accepts `gloria.morgan@gmail.com` / `Morgan2026!` and opens the dashboard in the browser; any other credentials show an authentication error.
- Sign Up goes to the "Getting your account ready" holding page.
- The currency converter uses fixed sample rates instead of a live API.

What is intentionally unavailable: real authentication, database-backed accounts, emails, and transfers (the secret code always returns "Wrong password").

### 1. Build the static site

```sh
pnpm build
# or: npm run build
```

The build must succeed with no server running; the output is written to `out/`.

### 2. Preview it locally

```sh
npx serve out
# or, with the Firebase emulator:
npx firebase-tools emulators:start --only hosting
```

Open the URL it prints and check `/` and `/dashboard/` (the dashboard is a prerendered page — no sign-in cookie is required).

### 3. Deploy

```sh
npm install -g firebase-tools   # once
firebase login
firebase use --add              # pick your Firebase project
firebase deploy --only hosting
# or the package script (uses npx firebase-tools):
pnpm deploy
```

`firebase.json` publishes `out/` with `cleanUrls` and `trailingSlash`, so `/dashboard/`, `/auth/login/` and the rest resolve to their prerendered `index.html` files. Firebase serves `out/404.html` for unknown paths.

### 4. Custom domain (optional)

Firebase console → **Hosting → Add custom domain**, then follow the DNS instructions. No rebuild is needed because the site is fully static.

### Notes

- `firebase.json` only contains a `hosting` block. There is no App Hosting backend and no Cloud Functions.
- If you later want the real backend (auth, Postgres, Redis, emails), revert `output: "export"` and deploy with Firebase App Hosting or another Node host.

## Configuration

Empower Bonds relies on environment variables for configuration. Below are the core variables defined in `.env.example`:

- **Application Title**: `TITLE=Empower Bonds` and `NEXT_PUBLIC_TITLE=Empower Bonds` — set both to the same value. `TITLE` is read on the server; `NEXT_PUBLIC_TITLE` is what the client-rendered sections (hero, testimonials, logo) read, because non-public variables are not available in the browser bundle.
- **Telegram Configuration** (optional): `TG_TOKEN`, `TG_ADMIN`
- **Cloudinary Configuration** (for image uploads): `NEXT_PUBLIC_CLOUDINARY_NAME`, `NEXT_PUBLIC_CLOUDINARY_API`, `NEXT_PUBLIC_CLOUDINARY_SECRET`
- **Authentication Configuration**: `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000`
- **Redis Configuration**: `REDIS_URL=redis://localhost:6379`
- **Database Configuration**: `DATABASE_URL=postgresql://username:password@localhost/db_name`
- **Email Configuration**: `RESEND_API_KEY`, `NEXT_PUBLIC_FROM_EMAIL='Empower Bonds <account@domain.tld>'`
- **Financial Data APIs**: `EXCHANGERATE_KEY`, `COINLAYER_KEY`
- **Security Configuration**: `TRUSTED_ORIGIN=empowerbonds.online,empowerbonds.io`, `COMPLAINTS_EMAIL=info@domain.tld`

**Note**: Keep sensitive values (e.g., `BETTER_AUTH_SECRET`, API keys) secret and exclude `.env.local` from version control (add to `.gitignore`).

## Usage

### Demo sign-in

The login form is pre-filled with the sample account credentials:

| Field    | Value                    |
| -------- | ------------------------ |
| Email    | `gloria.morgan@gmail.com` |
| Password | `Morgan2026!`            |

Signing in with these opens the sample dashboard, which is backed by local demo data (accounts, transactions, cards, statements and settings are read-only). The credentials live in `src/lib/demo-credentials.ts` and are public demo values — change or remove them before using this project for real accounts.

- Navigate to the Home, About, Career, and Security pages via the navigation menu.
- Access authentication pages (e.g., `/login`, `/register`) to test registration, login, password reset, and email verification.
- Blocked account scenarios are handled with a dedicated page.
- Financial data integration (via `EXCHANGERATE_KEY`, `COINLAYER_KEY`) is available for future dashboard features.

## Project Structure

```txt
empower-bonds/
├── src/
│   ├── app/                                # Main App
│   │   ├── global.css                      # Tailwindcss 4.0 Configuration and Styles
│   │   ├── favicon.ico                     # Favicon
│   │   ├── (static)/                       # Static Pages
│   │   │    ├── page.tsx                   # Home Page
│   │   │    ├── layout.tsx                 # Layout Template
│   │   │    ├── robots.tsx                 # Robots (SEO)
│   │   │    ├── sitemaps.tsx               # Sitemaps (SEO)
│   │   │    ├── about/                     # About Page
│   │   │    |   ├── page.tsx               
│   │   │    ├── careers/                   # Careers Page
│   │   │    |   ├── page.tsx               
│   │   │    ├── security/                  # Security Page
│   │   │    |   ├── page.tsx               
│   │   │    ├── auth/                      # Authentication Pages
│   │   │    |   ├── register/              # Registration page
│   │   │    |   |  ├── page.tsx               
│   │   │    |   ├── login/                 # Login page
│   │   │    |   |  ├── page.tsx               
│   │   │    |   ├── forgot-password/       # Forgot Password page
│   │   │    |   |  ├── page.tsx               
│   │   │    |   ├── reset-password/        # Password Reset page
│   │   │    |   |  ├── page.tsx               
│   │   │    |   ├── confirm-code/          # Email Verification page
│   │   │    |   |  ├── page.tsx               
│   │   │    |   ├── blocked/               # Blocked Account page
│   │   │    |   └──── page.tsx               
│   ├── components/                         # Shadcn Components, Custom Components and Forms
│   ├── db/                                 # Database Configuration
│   ├── hooks/                              # Custom Hooks
│   ├── lib/                                # Libraries (BetterAuth Setup)
│   ├── server/                             # Server actions
│   ├── types/                              # Typescript Types
│   └── config.ts                           # Configurations
│   └── middleware.ts                       # Middleware Configuration
├── public/                                 # Static assets
├── .env.example                            # Environment variable template
├── next.config.ts                          # Next.js configuration
├── package.json                            # Project dependencies and scripts
├── postcss.config.mjs                      # Postcss for tailwind
├── README.md                               # This file
├── LICENSE                                 # License Instructions
├── CONTRIBUTING.md                         # Contribution guidelines
└── CHANGELOG.md                            # Change log
```

## Contributing

This project is open-source and welcomes contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute, report bugs, or suggest features. Add your name to the contributors list below after your first accepted pull request.

### Contributors

- [Jeremiah David](mailto:jeremiahedavid@gmail.com) (Initial Creator)

## License

Empower Bonds is free to use under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

## Future Plans

- **Dashboard Integration**: Develop a dashboard for account management, transaction history, and financial insights using `EXCHANGERATE_KEY` and `COINLAYER_KEY`.
- **Enhanced Security**: Implement multi-factor authentication (MFA) and advanced fraud detection.
- **Email Enhancements**: Expand Resend email features for notifications and alerts.

### Notes

- **Test the Setup**: Set up `.env.local` and run `npm run dev` to verify the app loads with "Empower Bonds" as the title.
- **Environment Setup**: Ensure Redis and PostgreSQL are running locally or update URLs for cloud services.
- **Authentication**: Test better-auth flows with `BETTER_AUTH_SECRET` and `NEXT_PUBLIC_BETTER_AUTH_URL`.
- **Financial APIs**: Integrate `EXCHANGERATE_KEY` and `COINLAYER_KEY` in the future dashboard.

## Support

For issues or questions, open an issue on [GitHub](https://github.com/david-jerry/empower-bond-free-template/issues) or contact the maintainer at [jeremiahedavid@gmail.com](mailto:jeremiahedavid@gmail.com).
