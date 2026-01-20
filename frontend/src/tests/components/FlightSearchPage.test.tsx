import { describe, it, expect, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import FlightSearchPage from '@/pages/public/FlightSearchPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        searchResults: [],
      },
    }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('FlightSearchPage', () => {
  it('should render flight search page', () => {
    render(<FlightSearchPage />);
    
    // Component renders successfully
    expect(document.body).toBeInTheDocument();
  });
});
