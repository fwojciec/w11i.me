// Test setup file
// Add global test utilities or mocks here if needed

// Extend Vitest's expect with Jest DOM matchers
import '@testing-library/jest-dom/vitest'

// Example: Mock next/image for component tests
// vi.mock('next/image', () => ({
//   default: (props: any) => <img {...props} />
// }))

// Example: Mock next/router for component tests
// vi.mock('next/router', () => ({
//   useRouter: () => ({
//     push: vi.fn(),
//     pathname: '/',
//   })
// }))

export {}
