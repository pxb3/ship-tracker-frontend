import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchResultsModal } from './SearchResultsModal';

const suggestionWithStatic = {
  id: '1',
  position: [10.12345, 20.6789],
  raw: {
    id: '1',
    mmsi: '111',
    name: 'Alpha',
    heading: 90,
    sog: 12,
    ShipStaticData: {
      callSign: 'ABC123',
      destination: 'Rotterdam',
      dimensionA: 1,
      dimensionB: 2,
      dimensionC: 3,
      dimensionD: 4,
      etaDay: 1,
      etaMonth: 2,
      etaHour: 3,
      etaMinute: 4,
      maximumStaticDraught: 5,
      valid: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  },
};

const suggestionNoStatic = {
  id: '2',
  position: [11, 21],
  raw: { id: '2', mmsi: '222', name: 'Beta' },
};

function baseProps(overrides: Partial<React.ComponentProps<typeof SearchResultsModal>> = {}) {
  return {
    suggestions: [suggestionWithStatic, suggestionNoStatic],
    highlightIndex: 0,
    onHighlightChange: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    page: 0,
    pageSize: 10,
    totalResults: null,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    graphqlUrl: 'http://test/graphql',
    ...overrides,
  };
}

describe('SearchResultsModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders "No results" when there are no suggestions', () => {
    render(<SearchResultsModal {...baseProps({ suggestions: [], highlightIndex: -1 })} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('No item highlighted')).toBeInTheDocument();
  });

  it('renders each suggestion with its name, mmsi, and position', () => {
    // Use highlightIndex -1 so the preview panel doesn't duplicate the list item's text.
    render(<SearchResultsModal {...baseProps({ highlightIndex: -1 })} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('MMSI: 1')).toBeInTheDocument();
    expect(screen.getByText(/Lon 10.12345, Lat 20.67890/)).toBeInTheDocument();
  });

  it('calls onHighlightChange when hovering a row and onSelect when clicked', async () => {
    const onHighlightChange = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<SearchResultsModal {...baseProps({ onHighlightChange, onSelect })} />);

    await user.hover(screen.getByText('Beta'));
    expect(onHighlightChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith(suggestionNoStatic);
  });

  it('calls onClose from the Close button and the backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SearchResultsModal {...baseProps({ onClose })} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables Prev on the first page and calls onPageChange for Next', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchResultsModal {...baseProps({ page: 0, onPageChange, pageSize: 1 })} />);

    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Next when totalResults is exhausted', () => {
    render(
      <SearchResultsModal
        {...baseProps({ page: 0, pageSize: 2, totalResults: 2, suggestions: [suggestionWithStatic, suggestionNoStatic] })}
      />
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('calls onPageSizeChange when the per-page select changes', async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchResultsModal {...baseProps({ onPageSizeChange })} />);
    await user.selectOptions(screen.getByRole('combobox'), '20');

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('shows cached static data immediately for the highlighted suggestion', () => {
    render(<SearchResultsModal {...baseProps({ highlightIndex: 0 })} />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Rotterdam')).toBeInTheDocument();
  });

  it('lazily fetches and displays preview data when not already available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          findUniqueShip: {
            ShipStaticData: { callSign: 'XYZ999', destination: 'Hamburg' },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<SearchResultsModal {...baseProps({ highlightIndex: 1 })} />);

    expect(screen.getByText('Loading details…')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('XYZ999')).toBeInTheDocument());
    expect(screen.getByText('Hamburg')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://test/graphql',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows a fallback message when no static data is available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { findUniqueShip: null } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<SearchResultsModal {...baseProps({ highlightIndex: 1 })} />);

    await waitFor(() =>
      expect(screen.getByText('No static data available for this ship.')).toBeInTheDocument()
    );
  });
});
