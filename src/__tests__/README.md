# Testing

This project uses [Vitest](https://vitest.dev/) for testing, chosen for its speed, modern developer experience, and excellent TypeScript support.

## Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/production)
npm run test:run

# Run tests with UI (visual interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- **`src/__tests__/`** - All test files
- **`*.test.ts`** - Test file naming convention
- **`vitest.config.ts`** - Test configuration

## Test Categories

### Content Validation Tests (`content-validation.test.ts`)
- Validates blog post frontmatter with Zod schema
- Tests required/optional fields
- Tests data format validation (dates, URLs, enums)
- Tests error handling and messages

### Posts Integration Tests (`posts.test.ts`)
- Tests blog post loading and parsing
- Validates all existing posts have correct structure
- Tests post retrieval functions
- Content consistency checks

### Utility Tests (`date.test.ts`)
- Tests date formatting and parsing utilities
- Example of simple unit testing patterns

## Writing New Tests

### For new utilities:
```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../lib/your-module'

describe('Your Module', () => {
  it('should do what it says', () => {
    expect(yourFunction('input')).toBe('expected')
  })
})
```

### For components (future):
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import YourComponent from '../components/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests focused and isolated**
4. **Test edge cases and error conditions**
5. **Use the content validation tests as validation during post creation**

## Continuous Integration

Tests run automatically on:
- **Development**: Watch mode during development
- **Build**: CI/CD pipeline (run `npm run test:run` in CI)
- **Pre-commit**: Consider adding to git hooks