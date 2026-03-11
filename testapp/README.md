# testapp

A full-stack TypeScript application with Vite + React frontend and Express backend.

## Project Structure

```
testapp/
  client/     # Vite + React frontend
  server/     # Express.js backend
```

## Getting Started

### Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend (port 3000)
npm run dev:server

# Terminal 2 - Frontend (port 5173)
npm run dev:client
```

### Database Setup

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Build

```bash
npm run build
```

## Environment Variables

### Server (.env in /server)

See `server/.env.example` for required environment variables.

### Client (.env in /client)

See `client/.env.example` for optional environment variables.

## License

MIT
