import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Globe } from 'lucide-react';
import { AppDispatch, RootState } from '@/store';
import { fetchCurrencies, setCurrency, detectCurrency } from '@/store/slices/currencySlice';

export default function CurrencySelector() {
  const dispatch = useDispatch<AppDispatch>();
  const { currencies, currentCurrency, currencyInfo } = useSelector(
    (state: RootState) => state.currency
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch currencies on mount
    dispatch(fetchCurrencies());
    
    // Auto-detect currency based on location (only if not already set)
    const storedCurrency = localStorage.getItem('preferredCurrency');
    if (!storedCurrency) {
      dispatch(detectCurrency());
    }
  }, [dispatch]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencyChange = (code: string) => {
    dispatch(setCurrency(code));
    setIsOpen(false);
  };

  const activeCurrencies = currencies.filter(c => c.isActive);

  // Default currencies when API is unavailable
  const defaultCurrencies = [
    { id: '1', code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', exchangeRate: 1, isActive: true, isBase: true, decimalPlaces: 2 },
    { id: '2', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0075, isActive: true, isBase: false, decimalPlaces: 2 },
    { id: '3', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0069, isActive: true, isBase: false, decimalPlaces: 2 },
    { id: '4', code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0059, isActive: true, isBase: false, decimalPlaces: 2 },
    { id: '5', code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 0.63, isActive: true, isBase: false, decimalPlaces: 2 },
  ];

  const displayCurrencies = activeCurrencies.length > 0 ? activeCurrencies : defaultCurrencies;
  const displayCurrency = currencyInfo || displayCurrencies.find(c => c.code === currentCurrency) || displayCurrencies[0];

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Currency: ${currentCurrency || 'NPR'}`}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white 
                   hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">
          {displayCurrency?.symbol || 'रू'} {currentCurrency || 'NPR'}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Currency options" className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg 
                        border border-gray-200 py-2 z-[9999] max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
            Select Currency
          </div>
          {displayCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              role="option"
              aria-selected={currentCurrency === currency.code}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left
                         hover:bg-accent-50 transition-colors
                         ${currentCurrency === currency.code 
                           ? 'bg-accent-50 text-primary-950' 
                           : 'text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{currency.symbol}</span>
                <div>
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-gray-500 block">{currency.name}</span>
                </div>
              </div>
              {currentCurrency === currency.code && (
                <span className="text-accent-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
