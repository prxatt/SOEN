import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default message', () => {
    render(<LoadingSpinner />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    const customMessage = 'Processing your request...'
    render(<LoadingSpinner message={customMessage} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('should render the Soen logo', () => {
    const { container } = render(<LoadingSpinner />)
    
    // Check that the SVG logo is rendered
    const logo = container.querySelector('svg')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass('w-16', 'h-16', 'text-accent')
  })

  it('should have proper CSS classes for styling', () => {
    const { container } = render(<LoadingSpinner />)
    
    const spinnerContainer = container.firstChild as HTMLElement
    expect(spinnerContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'p-8', 'text-center')
  })

  it('should render message with proper styling classes', () => {
    render(<LoadingSpinner message="Test message" />)
    
    const messageElement = screen.getByText('Test message')
    expect(messageElement).toHaveClass('mt-4', 'text-light-text-secondary', 'dark:text-dark-text-secondary', 'font-semibold')
  })
})
