import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingScreen from '../LoadingScreen'

describe('LoadingScreen', () => {
  it('should render with brand-cohesive styling', () => {
    const { container } = render(<LoadingScreen />)
    
    // Check that the main container has correct background classes
    const loadingContainer = container.firstChild as HTMLElement
    expect(loadingContainer).toHaveClass('bg-white', 'dark:bg-black')
  })

  it('should render the Soen logo with correct colors', () => {
    const { container } = render(<LoadingScreen />)
    
    // Check that the SVG logo is rendered with brand colors
    const logo = container.querySelector('svg')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass('text-black', 'dark:text-white')
  })

  it('should render the loading message', () => {
    render(<LoadingScreen />)
    
    expect(screen.getByText('Synchronizing with Mira...')).toBeInTheDocument()
  })

  it('should have proper text colors for light and dark modes', () => {
    render(<LoadingScreen />)
    
    const messageElement = screen.getByText('Synchronizing with Mira...')
    expect(messageElement).toHaveClass('text-black/80', 'dark:text-white/80')
  })

  it('should have full screen coverage', () => {
    const { container } = render(<LoadingScreen />)
    
    const loadingContainer = container.firstChild as HTMLElement
    expect(loadingContainer).toHaveClass('fixed', 'inset-0', 'z-[100]')
  })

  it('should center content properly', () => {
    const { container } = render(<LoadingScreen />)
    
    const loadingContainer = container.firstChild as HTMLElement
    expect(loadingContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
  })
})
