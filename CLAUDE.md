# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Next.js and TypeScript. The site generates static pages from markdown files stored in the `/posts` directory. Each markdown file contains frontmatter metadata that is parsed using gray-matter.

## Architecture

- **Pages**: Located in `/src/pages/`, follows Next.js routing conventions
  - `index.tsx`: Homepage displaying a list of blog posts
  - `[slug].tsx`: Dynamic route for individual blog posts
  - `tags/[tag].tsx`: Dynamic route for tag-filtered blog posts
  - `about.tsx`: Static about page
  - `_app.tsx`: Custom App component with global styles
  - `_document.tsx`: Custom Document component for HTML structure

- **Components**: Reusable UI components in `/src/components/`
  - `Layout.tsx`: Main layout wrapper with theme toggling
  - Post-related components (Post, PostTitle, PostMeta, etc.)
  - Navigation and footer components

- **Lib**: Utility functions in `/src/lib/`
  - `posts.ts`: Core functionality for fetching and parsing markdown posts
  - `markdown.ts`: Markdown processing with remark
  - `date.ts`: Date formatting utilities

- **Hooks**: Custom React hooks in `/src/hooks/`
  - `useTheme.ts`: Theme management
  - `useIsomorphicLayoutEffect.ts`: SSR-compatible layout effect

- **Styles**: SCSS modules in `/src/styles/`
  - Component-specific styles with `.module.scss` extension
  - Global styles and variables

## Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Linting

The project uses ESLint with TypeScript and React plugins. While there's no explicit lint script in package.json, you can run:

```bash
# Lint check
npx eslint --ext .ts,.tsx .

# Fix linting issues
npx eslint --ext .ts,.tsx . --fix
```

### TypeScript

```bash
# Type checking
npx tsc --noEmit
```

## Content Management

Blog posts are written in Markdown format and stored in the `/posts` directory. Each post should include frontmatter with metadata such as:

```md
---
title: Post Title
date: YYYY-MM-DD
tags: [tag1, tag2]
excerpt: Brief excerpt of the post
coverImage: /images/cover-image.jpg
author:
  name: Author Name
---

Post content goes here...
```

## Styling Conventions

- CSS Modules are used for component-specific styling
- Global variables and mixins are defined in `/src/styles/_vars.scss` and `/src/styles/_mixins.scss`
- The site supports light/dark theme toggling