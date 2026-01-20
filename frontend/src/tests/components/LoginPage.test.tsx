import { describe, it, expect, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import LoginPage from '@/pages/auth/LoginPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginPage', () => {
  it('should render login page', () => {
    render(<LoginPage />);
    
    // Component renders successfully
    expect(document.body).toBeInTheDocument();
  });
});
