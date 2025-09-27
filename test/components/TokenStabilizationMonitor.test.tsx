import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TokenStabilizationMonitor } from '@/components/dashboards/TokenStabilizationMonitor'
import { vi } from 'vitest'

// Mock the usePlanetaryPositions hook
const mockUsePlanetaryPositions = vi.fn()
vi.mock('@/hooks/usePlanetaryPositions', () => ({
  usePlanetaryPositions: mockUsePlanetaryPositions,
}))

// Mock logger
vi.mock('@/lib/structured-logger', () => ({
  logger: {
    log: vi.fn(),
  },
  LogLevel: {
    INFO: 'info',
  },
}))

describe('TokenStabilizationMonitor', () => {
  beforeEach(() => {
    mockUsePlanetaryPositions.mockReturnValue({
      alchmQuantities: {
        spirit: 0.5,
        essence: 0.8,
        matter: 0.7,
        substance: 0.4,
        Heat: 0.3,
        Entropy: 0.2,
        Reactivity: 0.1,
        Energy: 0.6,
      },
      planetaryPositions: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component with token data', () => {
    render(<TokenStabilizationMonitor />)

    expect(screen.getByText('Token Stabilization Monitor')).toBeInTheDocument()
    expect(screen.getByText('0.50')).toBeInTheDocument() // spirit value
    expect(screen.getByText('0.80')).toBeInTheDocument() // essence value
  })

  it('shows monitoring status', () => {
    render(<TokenStabilizationMonitor />)

    expect(screen.getByText('Monitoring')).toBeInTheDocument()
  })

  it('toggles monitoring state', async () => {
    render(<TokenStabilizationMonitor />)

    const monitoringButton = screen.getByText('Monitoring')
    fireEvent.click(monitoringButton)

    await waitFor(() => {
      expect(screen.getByText('Paused')).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    mockUsePlanetaryPositions.mockReturnValue({
      alchmQuantities: {
        spirit: 0,
        essence: 0,
        matter: 0,
        substance: 0,
        Heat: 0,
        Entropy: 0,
        Reactivity: 0,
        Energy: 0,
      },
      planetaryPositions: [],
      loading: true,
      error: null,
      refresh: vi.fn(),
    })

    render(<TokenStabilizationMonitor />)

    expect(screen.getByText('Token Stabilization Monitor')).toBeInTheDocument()
  })

  it('handles error state', () => {
    mockUsePlanetaryPositions.mockReturnValue({
      alchmQuantities: {
        spirit: 0,
        essence: 0,
        matter: 0,
        substance: 0,
        Heat: 0,
        Entropy: 0,
        Reactivity: 0,
        Energy: 0,
      },
      planetaryPositions: [],
      loading: false,
      error: 'Test error',
      refresh: vi.fn(),
    })

    render(<TokenStabilizationMonitor />)

    expect(screen.getByText('Token Stabilization Monitor')).toBeInTheDocument()
  })
})
