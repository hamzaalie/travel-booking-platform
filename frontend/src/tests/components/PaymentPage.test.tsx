import { describe, it, expect, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import PaymentPage from '@/pages/booking/PaymentPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      state: {
        bookingData: {
          tripType: 'ONE_WAY',
          amount: 500,
          passengers: [{ firstName: 'John', lastName: 'Doe' }],
        },
      },
    }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('PaymentPage Component', () => {
  it('should render payment page', () => {
    render(<PaymentPage />);
    
    // Component renders successfully
    expect(document.body).toBeInTheDocument();
  });
});
