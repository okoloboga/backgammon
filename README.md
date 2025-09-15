# Backgammon Online - TON Blockchain Game

A web-based online backgammon game with betting functionality, utilizing the TON blockchain for deposits and transactions.

## Architecture

The project consists of two main parts:

### Backend (NestJS)
- **Users Module** - Manages users and their balances.
- **Transactions Module** - Handles TON transactions.
- **TON Module** - Integrates with the TON blockchain.
- **WebSocket (Colyseus)** - For real-time gameplay.

### Frontend (React + Vite)
- A modern UI for playing backgammon.
- Integration with TON Connect for wallet interactions.
- WebSocket connection for online gameplay.

## Tech Stack

- **Backend**: NestJS, TypeScript, TON SDK
- **Frontend**: React, TypeScript, Vite
- **Blockchain**: TON (The Open Network)
- **Real-time**: WebSocket (Colyseus)
- **Database**: PostgreSQL (planned)

## Project Structure

```
backgammon/
├── .github/
│   └── workflows/
│       └── linter.yml      # GitHub Actions CI for linting
├── client/                 # React frontend
│   ├── src/
│   ├── .eslintrc.cjs       # ESLint configuration
│   └── Dockerfile
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── users/         # Users module
│   │   ├── transactions/  # Transactions module
│   │   ├── ton/           # TON integration module
│   │   └── config/        # App configuration
│   └── Dockerfile
├── docker-compose.yml      # Docker configuration
└── README.md
```

## License

MIT