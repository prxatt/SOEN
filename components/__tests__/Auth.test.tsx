import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Auth from '../auth/Auth'

describe('Auth', () => {
  const mockOnLogin = vi.fn()

  beforeEach(() => {
    mockOnLogin.mockClear()
  })

  it('should render with brand-cohesive styling', () => {
    const { container } = render(<Auth onLogin={mockOnLogin} />)
    
    // Check that the main container has correct background classes
    const authContainer = container.firstChild as HTMLElement
    expect(authContainer).toHaveClass('bg-white', 'dark:bg-black')
  })

  it('should render the Praxis logo with correct colors', () => {
    const { container } = render(<Auth onLogin={mockOnLogin} />)
    
    // Check that the SVG logo is rendered with brand colors
    const logo = container.querySelector('svg')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass('text-black', 'dark:text-white')
  })

  it('should render welcome text with proper colors', () => {
    render(<Auth onLogin={mockOnLogin} />)
    
    const heading = screen.getByText('Welcome to Praxis')
    expect(heading).toHaveClass('text-black', 'dark:text-white')
    
    const subtitle = screen.getByText('Your AI-powered command center.')
    expect(subtitle).toHaveClass('text-black/70', 'dark:text-white/70')
  })

  it('should toggle between login and signup views', () => {
    render(<Auth onLogin={mockOnLogin} />)
    
    const toggleButton = screen.getByText("Don't have an account? Sign Up")
    fireEvent.click(toggleButton)
    
    expect(screen.getByText("Already have an account? Login")).toBeInTheDocument()
  })

  it('should handle keyboard bypass C+1+0', () => {
    render(<Auth onLogin={mockOnLogin} />)
    
    // Simulate pressing C, 1, and 0 simultaneously
    fireEvent.keyDown(window, { key: 'c' })
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: '0' })
    
    expect(mockOnLogin).toHaveBeenCalled()
  })

  it('should show keyboard bypass indicator when keys are pressed', () => {
    render(<Auth onLogin={mockOnLogin} />)
    
    // Press one key
    fireEvent.keyDown(window, { key: 'c' })
    
    expect(screen.getByText(/Testing bypass:/)).toBeInTheDocument()
  })

  it('should have full screen layout', () => {
    const { container } = render(<Auth onLogin={mockOnLogin} />)
    
    const authContainer = container.firstChild as HTMLElement
    expect(authContainer).toHaveClass('min-h-screen', 'flex', 'flex-col', 'items-center', 'justify-center')
  })
})
