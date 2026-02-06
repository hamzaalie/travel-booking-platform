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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 
                   hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">
          {currencyInfo?.symbol || ''} {currentCurrency}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg 
                        border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
            Select Currency
          </div>
          {activeCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left
                         hover:bg-primary-50 transition-colors
                         ${currentCurrency === currency.code 
                           ? 'bg-primary-50 text-primary-700' 
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
                <span className="text-primary-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
