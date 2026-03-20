import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App, { useAuth, useCart } from './App';

// ✅ Mock your contexts
jest.mock('./App', () => ({
  ...jest.requireActual('./App'),
  useAuth: jest.fn(),
  useCart: jest.fn(),
}));

// ✅ Test wrapper with Router + Context mocks
const AllProviders = ({ children }) => (
  <BrowserRouter>
    <div suppressHydrationWarning>{children}</div>
  </BrowserRouter>
);

describe('App', () => {
  beforeEach(() => {
    // ✅ Mock auth logged out
    useAuth.mockReturnValue({
      user: null,
      isLoggedIn: false,
      loading: false,
      logout: jest.fn(),
    });
    
    // ✅ Mock cart empty
    useCart.mockReturnValue({
      cart: [],
      cartCount: 0,
      addToCart: jest.fn(),
    });
  });

  test('renders navbar with Bon Gout logo', () => {
    render(<App />, { wrapper: AllProviders });
    
    expect(screen.getByText('Bon Gout')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  test('renders Home page on /', async () => {
    render(<App />, { wrapper: AllProviders });
    
    await waitFor(() => {
      expect(screen.getByText(/menu/i)).toBeInTheDocument(); // Home content
    });
  });

  test('shows Sign In button when logged out', () => {
    render(<App />, { wrapper: AllProviders });
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows cart icon', () => {
    render(<App />, { wrapper: AllProviders });
    
    expect(screen.getByText('🛒')).toBeInTheDocument();
  });

  test('shows loading spinner during auth check', async () => {
    useAuth.mockReturnValue({ loading: true });
    
    render(<App />, { wrapper: AllProviders });
    
    expect(screen.getByText('🍽️')).toBeInTheDocument(); // Loading spinner
  });
});
