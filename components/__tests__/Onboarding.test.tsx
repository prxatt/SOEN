import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Onboarding from '../Onboarding'

describe('Onboarding', () => {
  const mockGoals = []
  const mockSetGoals = vi.fn()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    mockSetGoals.mockClear()
    mockOnComplete.mockClear()
  })

  it('should render with brand-cohesive styling', () => {
    const { container } = render(
      <Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />
    )
    
    // Check that the main container has correct background classes
    const onboardingContainer = container.firstChild as HTMLElement
    expect(onboardingContainer).toHaveClass('bg-white', 'dark:bg-black')
  })

  it('should render the first step with proper colors', () => {
    render(<Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />)
    
    const heading = screen.getByText('Welcome to Praxis')
    expect(heading).toHaveClass('text-black', 'dark:text-white')
  })

  it('should have proper card styling', () => {
    const { container } = render(
      <Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />
    )
    
    const card = container.querySelector('.bg-white\\/90')
    expect(card).toBeInTheDocument()
  })

  it('should progress through steps', () => {
    render(<Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />)
    
    // Should show first step
    expect(screen.getByText('Welcome to Praxis')).toBeInTheDocument()
    
    // Click next
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    // Should show second step
    expect(screen.getByText('Define Your Vision')).toBeInTheDocument()
  })

  it('should handle input fields with proper styling', () => {
    render(<Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />)
    
    // Navigate to step with input (step 4 - hobbies)
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3
    fireEvent.click(nextButton) // Step 4 (hobbies input)
    
    const input = screen.getByPlaceholderText(/Boxing, DJing, art galleries/)
    expect(input).toHaveClass('text-black', 'dark:text-white')
    expect(input).toHaveClass('bg-white/80', 'dark:bg-black/80')
  })

  it('should complete onboarding and call onComplete', () => {
    render(<Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />)
    
    // Navigate to final step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3
    fireEvent.click(nextButton) // Step 4
    fireEvent.click(nextButton) // Step 5 (final)
    
    // Should show final step
    expect(screen.getByText('What is your ultimate goal?')).toBeInTheDocument()
    
    // Complete onboarding
    const finishButton = screen.getByText("Let's Begin")
    fireEvent.click(finishButton)
    
    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('should have close button with proper styling', () => {
    const { container } = render(
      <Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />
    )
    
    const closeButton = container.querySelector('.absolute.top-4.right-4')
    expect(closeButton).toHaveClass('text-black/70', 'dark:text-white/70')
  })

  it('should be full screen overlay', () => {
    const { container } = render(
      <Onboarding goals={mockGoals} setGoals={mockSetGoals} onComplete={mockOnComplete} />
    )
    
    const onboardingContainer = container.firstChild as HTMLElement
    expect(onboardingContainer).toHaveClass('fixed', 'inset-0', 'z-50')
  })
})
