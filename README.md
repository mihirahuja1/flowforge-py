# AI Workflow Builder

An open-source, all-in-one visual workflow builder for AI automation.

## Project Structure

```
ai-workflow-builder/
├─ apps/
│  ├─ frontend/       # React + React-Flow (TypeScript, Vite)
│  └─ backend/        # Python (FastAPI)
├─ packages/
│  ├─ shared-schemas/     # Pydantic models for nodes & runs
│  └─ nodes-library/      # Pure-python funcs & LLM wrappers
├─ docker-compose.yml     # dev / prod stack
├─ turbo.json            # Turbo monorepo task runner
├─ nx.json               # NX monorepo task runner (alternative)
└─ package.json          # Root package configuration
```

## Features

- **Frontend**: Drag-and-drop visual workflow builder using React Flow
- **Backend**: FastAPI Python server that executes workflows as DAGs
- **Real-time**: Stream live results from workflow execution
- **LLM Integration**: Built-in wrappers for various LLM providers
- **Cost Tracking**: Monitor tokens and costs for AI operations
- **Monorepo**: Organized codebase with shared schemas and libraries

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- pnpm 8+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-workflow-builder
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start with Docker**
   ```bash
   pnpm docker:up
   ```

4. **Or start services individually**
   ```bash
   pnpm dev
   ```

### Available Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start development servers
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm type-check` - TypeScript type checking
- `pnpm clean` - Clean build artifacts

## Architecture

### Frontend (`apps/frontend`)
- React with TypeScript
- Vite for fast development
- React Flow for visual workflow creation
- Real-time updates via WebSocket

### Backend (`apps/backend`)
- FastAPI for high-performance API
- DAG execution engine
- LLM provider integrations
- Token and cost tracking

### Shared Packages
- **shared-schemas**: Pydantic models for type safety
- **nodes-library**: Reusable workflow node implementations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License 