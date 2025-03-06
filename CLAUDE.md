# Ysera Edge Project Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting

## Code Style Guidelines

### TypeScript
- Use TypeScript for all files (`*.ts`, `*.tsx`)
- Apply strict typing with proper interfaces/types
- Use explicit return types for functions, especially exported ones
- Prefer `type` over `interface` for object definitions

### React
- Use functional components with hooks
- Follow React 18+ patterns (Next.js 14)
- Use "use client" directive for client components
- Group imports: React/Next.js first, then external libraries, then local imports

### File Organization
- Keep components modular and focused on a single responsibility
- Use named exports for utility functions
- Follow Next.js 14 app directory structure conventions

### Formatting
- Double quotes for strings
- Semi-colons at the end of statements
- Use proper JSDoc comments for exported functions
- Use meaningful variable/function names in camelCase
- Use PascalCase for component names and types