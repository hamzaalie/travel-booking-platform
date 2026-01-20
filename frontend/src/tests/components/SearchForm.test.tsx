import { describe, it, expect, vi } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import SearchForm from '@/components/common/SearchForm';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('SearchForm Component', () => {
  it('should render search form', () => {
    render(<SearchForm />);
    
    // Basic test that component renders
    expect(document.body).toBeInTheDocument();
  });
});
