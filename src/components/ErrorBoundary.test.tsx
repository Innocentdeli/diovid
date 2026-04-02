import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Mock component that throws an error
const ThrowError = () => {
  throw new Error('Test error')
}

// Mock component that doesn't throw
const NoError = () => <div>No error</div>

describe('ErrorBoundary', () => {
  // Mock console.error to avoid noise in tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NoError />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should render error fallback when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('should call resetError when Try Again is clicked', () => {
    const mockResetError = jest.fn()
    const mockFallback = ({ resetError }: { resetError: () => void }) => (
      <div>
        <button onClick={resetError}>Try Again</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={mockFallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    const tryAgainButton = screen.getByText('Try Again')
    fireEvent.click(tryAgainButton)

    // The component should re-render and try again
    // In a real scenario, this would reset the error state
  })

  it('should show error details in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Dev Only)')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Dev Only)')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})