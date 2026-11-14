# Contributing to Empower Bonds

Thank you for your interest in contributing to **Empower Bonds**, an open-source Next.js banking website template. We welcome developers, designers, and enthusiasts to help enhance this secure, modern banking solution built with better-auth, Redis, and Shadcn UI. Your contributions will support the global open-source community in creating accessible financial tools.

## Resources

- **Task Tracking and Bug Reports**: [GitHub Issues](https://github.com/david-jerry/empower-bond-free-template/issues)
- **Discussion**: Join the conversation on [GitHub Discussions](https://github.com/david-jerry/empower-bond-free-template/discussions) or contact the maintainer at [jeremiahedavid@gmail.com](mailto:jeremiahedavid@gmail.com)

## Code Standards

- **Compatibility**: Ensure compatibility with Node.js v18.x+, PostgreSQL, and Redis.
- **Style**: Adhere to [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) standards, enforced via pre-commit hooks.
- **Security**: Follow best practices for authentication (e.g., secure handling of `BETTER_AUTH_SECRET`) and data privacy.
- **Inclusivity**: Maintain a respectful environment; avoid offensive language or content.

## Checklist Before Submitting a Pull Request

- [ ] All tests pass locally:
  - `npm run test`
  - `npm run lint`
- [ ] Update the [CHANGELOG.md](CHANGELOG.md) for non-trivial changes (e.g., new features, bug fixes).
- [ ] Add your name to the contributors list in [README.md](README.md).
- [ ] Ensure code is formatted with Prettier (`npm run format`).

## Checklist Before a Pull Request Will Be Merged

- [ ] All GitHub Actions CI tests pass (linting, testing, build).
- [ ] Code reviewed by at least one maintainer.
- [ ] Apache 2.0 License notices are preserved with attributions to:
  - Developer: [Jeremiah David](jeremiahedavid@gmail.com)
  - Designer: [Pragadesh](pragadesh37v@gmail.com), based on [Figma Design](https://www.figma.com/community/file/1298887728670431393/banking-company-website-ui-template-design-in-dark-theme-free-editable).

## Where to Contribute

### Good for Beginners

- Testing authentication flows (login, registration, email verification) across platforms.
- Reporting bugs in the UI or API integrations (e.g., Cloudinary, Resend).
- Improving documentation (e.g., adding examples to `README.md`).
- Adding unit tests for existing components (e.g., `pages/auth/login.js`).

### Main Areas of Focus

- Enhancing the better-auth implementation with multi-factor authentication (MFA).
- Developing the future dashboard for account management and transactions.
- Optimizing Redis caching for session and financial data (e.g., `EXCHANGERATE_KEY`, `COINLAYER_KEY`).
- Improving Shadcn UI components for accessibility and dark theme consistency.

### Platform and Environment Testing

Testing across diverse environments ensures reliability. Run the app on your setup and report issues or fixes:

- **Key Platforms**: Linux, macOS, Windows with PostgreSQL and Redis.
- **Special Interest**: Cloud-hosted Redis (e.g., Redis Labs) and production-like PostgreSQL setups.

### Sample Data Collection

Contribute sample data to improve testing:

1. Simulate API responses (e.g., Cloudinary uploads, Resend emails).
2. Save to `data/` (e.g., `data/sample-email.json`).
3. Submit a PR with a description of the data.

## Getting Started

1. Fork the repository via the GitHub web interface ([Guide](https://gist.github.com/Chaser324/ce0505fbed06b947d962)).
2. Clone your fork:

   ```sh:disable-run
   git clone https://github.com/david-jerry/empower-bond-free-template.git
   cd empower-bonds
   ```

3. Create a branch (e.g., `your-username` or `feature-name`):

   ```sh
   git checkout -b <branch-name>
   ```

4. Set up a development environment:
   - Install Node.js (v18.x+) and a package manager (npm or yarn).
   - Install Redis and PostgreSQL locally or use cloud instances.
   - Install dependencies:

     ```sh
     npm install
     ```

   - Set up environment variables:

     ```sh
     cp .env.example .env.local
     # Edit .env.local with your credentials (see .env.example)
     ```

5. Install pre-commit hooks:

   ```sh
   npx husky install
   npm run prepare
   ```

6. Run the development server:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.
7. Run tests and linting:

   ```sh
   npm run test
   npm run lint
   ```

8. Write code with descriptive Git commit messages (e.g., "Add MFA to better-auth").
9. Follow the checklist and submit a pull request!

## Bug Reports

To file a bug report:

1. Answer these questions:
   - [ ] What version of Empower Bonds are you using? (Check `package.json` or Git tag)
   - [ ] What OS, Node.js version, and database setup are you using?
   - [ ] What did you do? (e.g., `npm run dev` with specific actions)
   - [ ] What did you expect to see?
   - [ ] What did you see instead?
2. Attach logs or API responses to a [GitHub Gist](https://gist.github.com/) and link in the issue.
3. Tag the issue with "Bug".

**Note**: For security vulnerabilities (e.g., `BETTER_AUTH_SECRET` exposure), email [jeremiahedavid@gmail.com](mailto:jeremiahedavid@gmail.com) instead of opening an issue.

## Features and Ideas

We welcome feature suggestions! Open an issue on GitHub with details and tag it (e.g., "Feature" for new functionality or "Enhancement" for improvements). Ideas for dashboard features, financial API integrations, or UI enhancements are especially encouraged.
