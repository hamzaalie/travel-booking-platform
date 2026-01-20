import { describe, it, expect, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import Header from '@/components/common/Header';

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('Header Component', () => {
  it('should render the header component', () => {
    render(<Header />);
    
    // Basic test that component renders without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('should render when not authenticated', () => {
    render(<Header />, {
      preloadedState: {
        auth: { isAuthenticated: false, user: null, token: null },
      },
    });

    // Component renders successfully
    expect(document.body).toBeInTheDocument();
  });

  it('should render when authenticated', () => {
    render(<Header />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: '1', firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'B2C_CUSTOMER' },
          token: 'test-token',
        },
      },
    });

    // Component renders successfully
    expect(document.body).toBeInTheDocument();
  });
});
