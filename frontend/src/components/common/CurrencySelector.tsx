// --- MULTI-CURRENCY MODEL REMOVED ---
// CurrencySelector is disabled. Only NPR currency is supported.
// The component returns null to avoid breaking any imports.

// import { useState, useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { ChevronDown, Globe } from 'lucide-react';
// import { AppDispatch, RootState } from '@/store';
// import { fetchCurrencies, setCurrency, detectCurrency } from '@/store/slices/currencySlice';

export default function CurrencySelector() {
  // Multi-currency model removed - only NPR is supported
  return null;

  // --- Original multi-currency CurrencySelector commented out ---
  // const dispatch = useDispatch<AppDispatch>();
  // const { currencies, currentCurrency, currencyInfo } = useSelector(
  //   (state: RootState) => state.currency
  // );
  // const [isOpen, setIsOpen] = useState(false);
  // const dropdownRef = useRef<HTMLDivElement>(null);
  //
  // useEffect(() => {
  //   dispatch(fetchCurrencies());
  //   const storedCurrency = localStorage.getItem('preferredCurrency');
  //   if (!storedCurrency) {
  //     dispatch(detectCurrency());
  //   }
  // }, [dispatch]);
  //
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       setIsOpen(false);
  //     }
  //   };
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);
  //
  // ... rest of CurrencySelector was here ...
}
