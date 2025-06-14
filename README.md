# Deliverable Tracking System

A web-based dashboard for managing media deliverables, integrating with Pipedrive and QuickBooks.

## Prerequisites

- Node.js v23.6.0 or later
- pnpm v10.12.1 or later
- PostgreSQL 17.5 or later
- Git

## Development Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd deliverable-tracking
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up PostgreSQL**
   - Install PostgreSQL 17.5 or later
   - Create a new database named `deliverable_tracking`
   - Note your PostgreSQL password

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL credentials:
     ```
     DATABASE_URL="postgresql://postgres:your_password@localhost:5432/deliverable_tracking?schema=public"
     ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Development Workflow

1. Create a new branch for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. Push your changes and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - React components
- `/src/lib` - Utility functions and shared code
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
