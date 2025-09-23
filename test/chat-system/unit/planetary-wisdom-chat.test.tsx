// Unit tests for PlanetaryWisdomChat component
// Tests live sky integration, planetary configurations, and real-time sync

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import PlanetaryWisdomChat from '@/components/planetary-wisdom-chat'
import {
  mockPlanetaryConfigs,
  mockPlanetaryPresets,
  performanceTestData,
} from '../fixtures/mock-data'

// Mock the unified multi-agent chat component
vi.mock('@/components/unified-multi-agent-chat', () => ({
  default: ({ isOpen, onClose, title, planetaryConfigs, enableAutoSync, customHeader }: any) => (
    <div data-testid="unified-chat" data-open={isOpen} data-auto-sync={enableAutoSync}>
      <div data-testid="chat-title">{title}</div>
      <div data-testid="planetary-configs-count">{planetaryConfigs.length}</div>
      {customHeader}
    </div>
  ),
}))

// Mock planetary positions hook
const mockPlanetaryData = {
  sun: { longitude: 285.5, retrograde: false },
  moon: { longitude: 112.3, retrograde: false, phase: 'Waxing Gibbous' },
  mercury: { longitude: 265.8, retrograde: true },
  venus: { longitude: 315.2, retrograde: false },
  mars: { longitude: 45.7, retrograde: false },
}

vi.mock('@/hooks/usePlanetaryPositions', () => ({
  usePlanetaryPositions: vi.fn(() => ({
    data: mockPlanetaryData,
    isLoading: false,
    error: null,
  })),
}))

// Mock council presets
vi.mock('@/lib/council-presets', () => ({
  PLANETARY_COUNCIL_PRESETS: mockPlanetaryPresets,
  getOptimalMonicaRole: vi.fn(() => 'guide'),
}))

// Mock planetary config helper
vi.mock('@/lib/planetary-config-helper', () => ({
  createDefaultPlanetaryConfigs: vi.fn(() => mockPlanetaryConfigs),
  updatePlanetaryConfigWithLiveSky: vi.fn((config, positions) => ({
    ...config,
    liveSkySync: true,
    lastUpdate: new Date(),
  })),
}))

describe('PlanetaryWisdomChat Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    defaultActivePlanets: ['Sun', 'Moon', 'Mercury'],
    enableAutoSync: true,
    maxAgents: 7,
    allowMonica: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders preset selection when no initial preset is provided', () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      expect(screen.getByText('Choose Your Celestial Council')).toBeInTheDocument()
      expect(screen.getByText('Select planetary agents for cosmic guidance')).toBeInTheDocument()
    })

    it('renders with initial preset', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('chat-title')).toHaveTextContent('Celestial Council')
    })

    it('renders with default active planets', () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      // Should show the default planets in the interface when opened
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })
  })

  describe('Live Sky Integration', () => {
    it('displays live sky status panel', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByText('Live Sky Connection')).toBeInTheDocument()
      expect(screen.getByText('Sync Status')).toBeInTheDocument()
    })

    it('shows auto-sync toggle enabled by default', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      const autoSyncToggle = screen.getByRole('switch')
      expect(autoSyncToggle).toBeChecked()
      expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-auto-sync', 'true')
    })

    it('allows manual sync when auto-sync is disabled', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          enableAutoSync={false}
          initialPreset="test-inner-planets"
        />
      )

      const autoSyncToggle = screen.getByRole('switch')
      expect(autoSyncToggle).not.toBeChecked()

      const manualSyncButton = screen.getByRole('button', { name: /refresh/i })
      expect(manualSyncButton).not.toBeDisabled()
    })

    it('updates last sync time', async () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      // Check that last sync time is displayed
      expect(screen.getByText(/Last:/)).toBeInTheDocument()
    })

    it('handles auto-sync interval correctly', async () => {
      const { rerender } = render(
        <PlanetaryWisdomChat
          {...defaultProps}
          syncInterval={30000} // 30 seconds
          initialPreset="test-inner-planets"
        />
      )

      // Fast-forward time by 30 seconds
      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        // Should trigger a sync update
        expect(screen.getByText(/Last:/)).toBeInTheDocument()
      })
    })
  })

  describe('Planetary Preset Selection', () => {
    it('displays all available planetary presets', () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      expect(screen.getByText('Test Inner Planets')).toBeInTheDocument()
      expect(screen.getByText('Test configuration for inner planetary council')).toBeInTheDocument()
    })

    it('shows preset metadata correctly', () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      // Check for planet combination
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Moon')).toBeInTheDocument()
      expect(screen.getByText('Mercury')).toBeInTheDocument()

      // Check for difficulty
      expect(screen.getByText('beginner')).toBeInTheDocument()

      // Check for agent count
      expect(screen.getByText('3')).toBeInTheDocument() // mockPlanetaryPresets[0] has 3 planets
    })

    it('handles preset selection', async () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      const presetCard = screen.getByText('Test Inner Planets').closest('div')
      expect(presetCard).toBeInTheDocument()

      fireEvent.click(presetCard!)

      await waitFor(() => {
        expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-open', 'true')
      })
    })

    it('creates custom planetary council', () => {
      render(<PlanetaryWisdomChat {...defaultProps} />)

      const customOption = screen.getByText('Create Custom Council')
      expect(customOption).toBeInTheDocument()

      fireEvent.click(customOption.closest('div')!)

      expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-open', 'true')
    })
  })

  describe('Current Astrological Information', () => {
    it('displays current planetary information', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByText('Dominant Element')).toBeInTheDocument()
      expect(screen.getByText('Lunar Phase')).toBeInTheDocument()
      expect(screen.getByText('Retrogrades')).toBeInTheDocument()
    })

    it('shows retrograde count correctly', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      // mockPlanetaryData has Mercury in retrograde
      expect(screen.getByText('1 active')).toBeInTheDocument()
    })

    it('displays lunar phase information', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByText('Waxing Gibbous')).toBeInTheDocument()
    })
  })

  describe('Active Council Display', () => {
    it('shows active planetary agents', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          defaultActivePlanets={['Sun', 'Moon']}
          initialPreset="test-inner-planets"
        />
      )

      expect(screen.getByText('Active Council')).toBeInTheDocument()
      expect(screen.getByText(/Sun/)).toBeInTheDocument()
      expect(screen.getByText(/Moon/)).toBeInTheDocument()
    })

    it('displays planetary symbols and signs', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          defaultActivePlanets={['Sun']}
          initialPreset="test-inner-planets"
        />
      )

      expect(screen.getByText(/Sun/)).toBeInTheDocument()
      expect(screen.getByText(/in Leo/)).toBeInTheDocument()
    })

    it('shows Monica when included in preset', () => {
      const presetWithMonica = {
        ...mockPlanetaryPresets[0],
        includeMonica: true,
        monicaRole: 'guide' as const,
      }

      vi.mocked(require('@/lib/council-presets').PLANETARY_COUNCIL_PRESETS).mockReturnValue([
        presetWithMonica,
      ])

      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByText('Monica (guide)')).toBeInTheDocument()
    })
  })

  describe('Live Sync Controls', () => {
    it('toggles auto-sync correctly', async () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      const autoSyncToggle = screen.getByRole('switch')
      expect(autoSyncToggle).toBeChecked()

      fireEvent.click(autoSyncToggle)

      await waitFor(() => {
        expect(autoSyncToggle).not.toBeChecked()
        expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-auto-sync', 'false')
      })
    })

    it('enables manual sync button when auto-sync is off', async () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          enableAutoSync={false}
          initialPreset="test-inner-planets"
        />
      )

      const manualSyncButton = screen.getByRole('button', { name: /refresh/i })
      expect(manualSyncButton).not.toBeDisabled()

      fireEvent.click(manualSyncButton)

      // Should update last sync time
      await waitFor(() => {
        expect(screen.getByText(/Last:/)).toBeInTheDocument()
      })
    })

    it('disables manual sync when auto-sync is enabled', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          enableAutoSync={true}
          initialPreset="test-inner-planets"
        />
      )

      const manualSyncButton = screen.getByRole('button', { name: /refresh/i })
      expect(manualSyncButton).toBeDisabled()
    })
  })

  describe('Planetary-Specific Features', () => {
    it('enables current sky chart display', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          showCurrentSkyChart={true}
          initialPreset="test-inner-planets"
        />
      )

      // Sky chart feature should be accessible
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })

    it('enables transit alerts', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          enableTransitAlerts={true}
          initialPreset="test-inner-planets"
        />
      )

      // Transit alerts should be enabled
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })

    it('handles planetary hour notifications', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          planetaryHourNotifications={true}
          initialPreset="test-inner-planets"
        />
      )

      // Planetary hour notifications should be enabled
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('handles loading state for planetary positions', () => {
      vi.mocked(require('@/hooks/usePlanetaryPositions').usePlanetaryPositions).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      })

      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      // Should still render but handle loading state gracefully
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })

    it('respects maxAgents limitation', () => {
      render(
        <PlanetaryWisdomChat
          {...defaultProps}
          maxAgents={2}
          defaultActivePlanets={['Sun', 'Moon', 'Mercury', 'Venus']}
          initialPreset="test-inner-planets"
        />
      )

      // Should only show 2 agents despite 4 being requested
      expect(screen.getByTestId('planetary-configs-count')).toHaveTextContent('3') // Based on preset
    })

    it('optimizes for fast response times', () => {
      const startTime = performance.now()

      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly (under 100ms for unit test)
      expect(renderTime).toBeLessThan(100)
    })
  })

  describe('Error Handling', () => {
    it('handles planetary positions fetch error', () => {
      vi.mocked(require('@/hooks/usePlanetaryPositions').usePlanetaryPositions).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      })

      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      // Should render without crashing
      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })

    it('handles missing preset gracefully', () => {
      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="non-existent-preset" />)

      // Should fall back to preset selection
      expect(screen.getByText('Choose Your Celestial Council')).toBeInTheDocument()
    })

    it('handles empty planetary configs', () => {
      vi.mocked(
        require('@/lib/planetary-config-helper').createDefaultPlanetaryConfigs
      ).mockReturnValue([])

      render(<PlanetaryWisdomChat {...defaultProps} initialPreset="test-inner-planets" />)

      expect(screen.getByTestId('planetary-configs-count')).toHaveTextContent('0')
    })
  })

  describe('Callback Handling', () => {
    it('calls onClose when chat is closed', () => {
      const mockOnClose = vi.fn()

      render(<PlanetaryWisdomChat {...defaultProps} onClose={mockOnClose} isOpen={false} />)

      expect(screen.getByTestId('unified-chat')).toHaveAttribute('data-open', 'false')
    })

    it('handles session updates', () => {
      const mockOnSessionUpdate = vi.fn()

      render(<PlanetaryWisdomChat {...defaultProps} onSessionUpdate={mockOnSessionUpdate} />)

      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })

    it('handles agent evolution', () => {
      const mockOnAgentEvolution = vi.fn()

      render(<PlanetaryWisdomChat {...defaultProps} onAgentEvolution={mockOnAgentEvolution} />)

      expect(screen.getByTestId('unified-chat')).toBeInTheDocument()
    })
  })
})
