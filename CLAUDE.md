# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run prettier` - Format all files with Prettier
- `npm run prettier:check` - Check if files are formatted correctly

**Testing:**
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Open Vitest UI interface
- `npm run test:coverage` - Run tests with coverage report

**Individual Test Execution:**
- `npx vitest run src/__tests__/content-validation.test.ts` - Run specific test file
- `npx vitest --reporter=verbose` - Detailed test output

**Code Quality Workflow:**
Run these commands before committing to ensure code quality:
1. `npm run prettier` - Format code
2. `npm run lint` - Check for linting issues
3. `npm run typecheck` - Verify TypeScript types
4. `npm run test:run` - Run all tests
5. `npm run build` - Verify production build works

## Architecture Overview

### Next.js App Router Structure
This is a Next.js 15 blog using the App Router with TypeScript. The codebase follows these key patterns:

**Page Structure:**
- `src/app/page.tsx` - Home page listing all blog posts
- `src/app/[slug]/page.tsx` - Individual blog post pages 
- `src/app/tags/[tag]/page.tsx` - Tag-filtered post listings
- `src/app/rss.xml/route.ts` - RSS feed API route
- `src/app/sitemap.xml/route.ts` - XML sitemap API route

### Content Management System

**Blog Posts:**
- Stored as `.mdx` files in the `/posts` directory
- Frontmatter validated using Zod schemas in `src/lib/content-validation.ts`
- Content processed via `src/lib/posts.ts` with in-memory caching
- All posts must include: title, date, author, excerpt, tags (minimum required fields)

**Content Validation:**
The site uses strict Zod validation for frontmatter. When adding new posts:
1. Follow the frontmatter schema in `src/lib/content-validation.ts`
2. Run `npm test` to validate all content
3. Check validation errors in `src/__tests__/content-validation.test.ts`

### Theme System

**Implementation:**
- Uses `next-themes` library for dark/light mode switching
- CSS custom properties for theme variables in `src/styles/_vars.css`
- Theme toggle in `src/components/Navbar.tsx`
- Provider configured in `src/app/layout.tsx` with `suppressHydrationWarning={true}` on html element

**Theme Variables Pattern:**
```css
:root { /* light theme defaults */ }
[data-theme="dark"] { /* dark theme overrides */ }
```

### Component Architecture

**Key Component Patterns:**
- CSS Modules for styling (`.module.css` files co-located with components)
- Server components by default, `'use client'` only when needed
- Path aliases: `@/components`, `@/lib`, `@/styles` configured in tsconfig.json

**Critical Components:**
- `src/components/Layout.tsx` - Page wrapper with nav/footer
- `src/components/MarkdownContent.tsx` - Client-side MDX renderer with syntax highlighting
- `src/contexts/ThemeContext.tsx` - Legacy theme context (prefer next-themes)

### SEO and Metadata

**SEO Implementation:**
- Dynamic metadata generation in page components using Next.js metadata API
- OpenGraph and Twitter Card support in root layout
- JSON-LD structured data for blog posts
- RSS feed and XML sitemap auto-generation

### Testing Infrastructure

**Test Setup:**
- Vitest configured with TypeScript support and path aliases
- JSDOM environment for React component testing
- React Testing Library for component tests
- Test files located in `src/__tests__/`
- Content validation tests ensure all blog posts meet schema requirements
- Integration tests validate post loading and metadata consistency

**Test Categories:**
- `content-validation.test.ts` - Frontmatter schema validation
- `posts.test.ts` - Blog post loading and integration tests
- `markdown.test.ts` - Markdown processing and Callout component tests
- `components/PostTitle.test.tsx` - React component tests with Testing Library
- `date.test.ts` - Date utility function tests
- `reading-time.test.ts` - Reading time estimation tests

## Development Guidelines

**Adding New Blog Posts:**
1. Create `.mdx` file in `/posts` directory
2. Include all required frontmatter fields per Zod schema
3. Run `npm test` to validate content
4. Use `npm run typecheck` before committing

**Code Quality:**
- TypeScript strict mode enabled
- Prettier with semicolon-free style and single quotes
- ESLint with Next.js, accessibility, and React hooks plugins
- CSS Modules with TypeScript plugin for type safety

**Performance Considerations:**
- Posts are cached in memory during build
- Syntax highlighting loads lazily on client side
- Use Next.js Image component for optimized images
- Static generation with `generateStaticParams` for post pages

**Theme Development:**
- Always test both light and dark themes
- Use CSS custom properties for themeable values
- Follow the data-attribute pattern: `[data-theme="dark"]`
- Theme state persists across page loads via localStorage

**Node.js Version:**
- Requires Node.js >= 20.x (specified in package.json engines)