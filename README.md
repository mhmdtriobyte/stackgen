# stackgen

[![npm version](https://img.shields.io/npm/v/stackgen.svg?style=flat-square)](https://www.npmjs.com/package/stackgen)
[![license](https://img.shields.io/npm/l/stackgen.svg?style=flat-square)](https://github.com/mhmdtriobyte/stackgen/blob/main/LICENSE)
[![build status](https://img.shields.io/github/actions/workflow/status/mhmdtriobyte/stackgen/ci.yml?branch=main&style=flat-square)](https://github.com/mhmdtriobyte/stackgen/actions)
[![downloads](https://img.shields.io/npm/dm/stackgen.svg?style=flat-square)](https://www.npmjs.com/package/stackgen)

> Opinionated full-stack project scaffolder for production-ready apps

<!-- TODO: Add demo GIF showing the interactive CLI in action -->
<!-- ![stackgen demo](./assets/demo.gif) -->

## Features

- **Interactive CLI** - Beautiful prompts powered by @clack/prompts
- **Next.js 15** - App Router with React Server Components, or **Vite + React + Express**
- **Database Ready** - PostgreSQL or SQLite with Drizzle ORM configured
- **Authentication** - Auth.js (NextAuth v5) or Lucia authentication built-in
- **Modern Styling** - Tailwind CSS v4 with CSS-first configuration
- **Deployment Ready** - Docker multi-stage builds or Vercel-optimized output
- **Code Quality** - ESLint 9 flat config + Prettier + Husky pre-commit hooks
- **CI/CD Included** - GitHub Actions workflow ready to go
- **Type Safety** - Zod-validated environment variables
- **Working Examples** - Public and authenticated routes out of the box
- **Database Seeds** - Example data to get started immediately

---

## Quick Start

Run with npx (no installation required):

```bash
npx stackgen
```

Follow the interactive prompts to configure your project, or use flags for a non-interactive setup:

```bash
npx stackgen --name my-app --frontend nextjs --database postgresql --auth authjs --deployment docker --yes
```

---

## CLI Options

| Flag             | Alias | Description             | Choices                    | Default      |
| ---------------- | ----- | ----------------------- | -------------------------- | ------------ |
| `--name`         | `-n`  | Project name            | `<string>`                 | `my-app`     |
| `--frontend`     |       | Frontend framework      | `nextjs`, `vite`           | `nextjs`     |
| `--database`     |       | Database                | `postgresql`, `sqlite`     | `postgresql` |
| `--auth`         |       | Authentication provider | `authjs`, `lucia`          | `authjs`     |
| `--deployment`   |       | Deployment target       | `docker`, `vercel`         | `docker`     |
| `--yes`          | `-y`  | Skip prompts, use defaults | `<boolean>`            | `false`      |
| `--help`         | `-h`  | Show help               |                            |              |
| `--version`      | `-v`  | Show version            |                            |              |

---

## Comparison

| Feature              | stackgen | create-t3-app | create-next-app |
| -------------------- | :------: | :-----------: | :-------------: |
| Full-stack ready     |    ✅    |      ✅       |       ❌        |
| Database included    |    ✅    |      ✅       |       ❌        |
| Auth included        |    ✅    |      ❌       |       ❌        |
| Docker ready         |    ✅    |      ❌       |       ❌        |
| CI/CD included       |    ✅    |      ❌       |       ❌        |
| Vite option          |    ✅    |      ❌       |       ❌        |
| Express backend      |    ✅    |      ❌       |       ❌        |
| SQLite option        |    ✅    |      ✅       |       ❌        |
| Lucia auth option    |    ✅    |      ❌       |       ❌        |
| Env validation       |    ✅    |      ✅       |       ❌        |

---

## Generated Project Structure

### Next.js Template

```
my-app/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (protected)/
│   │   │   └── dashboard/
│   │   ├── api/
│   │   │   └── auth/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── auth/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── env.ts
├── drizzle/
│   └── migrations/
├── public/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Vite + Express Template

```
my-app/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── index.ts
│   │   │   └── seed.ts
│   │   └── index.ts
│   └── tsconfig.json
├── shared/
│   └── types/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## Development

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/mhmdtriobyte/stackgen.git
cd stackgen

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run the CLI locally
npm start

# Link for global usage during development
npm link
```

### Scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run build` | Compile TypeScript to JavaScript     |
| `npm run dev`   | Watch mode for development           |
| `npm test`      | Run the test suite                   |
| `npm run lint`  | Run ESLint                           |
| `npm run format`| Format code with Prettier            |
| `npm start`     | Run the CLI                          |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/mhmdtriobyte">Mohammad Issa (@mhmd.triobyte)</a>
</p>
