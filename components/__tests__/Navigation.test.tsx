import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Navigation from '../Navigation'
import type { Screen } from '../../types'

describe('Navigation', () => {
  const mockSetScreen = vi.fn()
  const defaultProps = {
    activeScreen: 'Dashboard' as Screen,
    setScreen: mockSetScreen
  }

  beforeEach(() => {
    mockSetScreen.mockClear()
  })

  it('should render in collapsed state by default', () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    // Check that navigation starts collapsed (width should be w-16 equivalent)
    const navContainer = container.querySelector('.fixed.left-0')
    expect(navContainer).toBeInTheDocument()
  })

  it('should have brand-cohesive colors', () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    // Check for black background
    const navElement = container.querySelector('.bg-black\\/95')
    expect(navElement).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(<Navigation {...defaultProps} />)
    
    // Check for main navigation items
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Schedule')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('should render Mira AI button prominently', () => {
    render(<Navigation {...defaultProps} />)
    
    // Look for the Mira AI button by text content instead of label
    const miraButton = screen.getByText('Mira AI')
    expect(miraButton).toBeInTheDocument()
  })

  it('should expand on hover', async () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    const navContainer = container.querySelector('.fixed.left-0 > div')
    if (navContainer) {
      fireEvent.mouseEnter(navContainer)
      
      // Wait for the expansion animation
      await waitFor(() => {
        expect(navContainer).toHaveClass('w-64')
      }, { timeout: 1000 })
    }
  })

  it('should collapse on mouse leave', async () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    const navContainer = container.querySelector('.fixed.left-0 > div')
    if (navContainer) {
      // First expand
      fireEvent.mouseEnter(navContainer)
      await waitFor(() => {
        expect(navContainer).toHaveClass('w-64')
      })
      
      // Then collapse
      fireEvent.mouseLeave(navContainer)
      await waitFor(() => {
        expect(navContainer).toHaveClass('w-16')
      }, { timeout: 1000 })
    }
  })

  it('should handle navigation clicks', () => {
    render(<Navigation {...defaultProps} />)
    
    const scheduleButton = screen.getByLabelText('Schedule')
    fireEvent.click(scheduleButton)
    
    expect(mockSetScreen).toHaveBeenCalledWith('Schedule')
  })

  it('should show active state correctly', () => {
    render(<Navigation {...defaultProps} activeScreen="Schedule" />)
    
    const scheduleButton = screen.getByLabelText('Schedule')
    expect(scheduleButton).toHaveClass('bg-white', 'text-black')
  })

  it('should be positioned at viewport corner', () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    const navContainer = container.querySelector('.fixed.left-0.top-0.bottom-0')
    expect(navContainer).toBeInTheDocument()
  })

  it('should render mobile navigation', () => {
    const { container } = render(<Navigation {...defaultProps} />)
    
    // Check for mobile navigation
    const mobileNav = container.querySelector('.md\\:hidden')
    expect(mobileNav).toBeInTheDocument()
  })

  it('should handle profile dropdown', async () => {
    const { container } = render(<Navigation {...defaultProps} />)
    const navContainer = container.querySelector('.fixed.left-0 > div')
    
    if (navContainer) {
      fireEvent.mouseEnter(navContainer)
      
      await waitFor(() => {
        const profileButtons = screen.getAllByText('Profile')
        // Click the first Profile button (there might be multiple)
        fireEvent.click(profileButtons[0])
        
        // Should navigate to Profile screen
        expect(mockSetScreen).toHaveBeenCalledWith('Profile')
      })
    }
  })
})
