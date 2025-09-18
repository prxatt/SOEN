# Testing Guide for Praxis AI

This project uses **Vitest** for unit testing with React Testing Library for component tests.

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (interactive)
npm run test

# Run all tests once
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests
- **Location**: `utils/__tests__/`
- **Purpose**: Test utility functions and business logic
- **Examples**: 
  - `taskUtils.test.ts` - Task calculation and processing functions
  - `jsonUtils.test.ts` - JSON parsing and extraction utilities

### Component Tests
- **Location**: `components/__tests__/`
- **Purpose**: Test React component rendering and behavior
- **Examples**:
  - `LoadingSpinner.test.tsx` - Loading component tests

## Test Configuration

- **Framework**: Vitest (fast Vite-native test runner)
- **Environment**: jsdom (simulates browser environment)
- **Testing Library**: @testing-library/react for component testing
- **Setup**: `src/test/setup.ts` - Global test configuration and mocks

## Writing Tests

### For Utility Functions
```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../yourUtility'

describe('yourUtility', () => {
  it('should do something specific', () => {
    const result = yourFunction(input)
    expect(result).toBe(expectedOutput)
  })
})
```

### For React Components
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Test Coverage

Run `npm run test:coverage` to generate a coverage report showing:
- Line coverage
- Function coverage  
- Branch coverage
- Statement coverage

Coverage reports are generated in the `coverage/` directory.

## Continuous Testing

For development, use `npm run test` to run tests in watch mode. Tests will automatically re-run when files change.

## Stability Testing

The test suite helps ensure stability by:
- ✅ Testing critical utility functions
- ✅ Validating component rendering
- ✅ Checking edge cases and error handling
- ✅ Providing regression protection

All tests should pass before deploying changes to maintain application stability.
