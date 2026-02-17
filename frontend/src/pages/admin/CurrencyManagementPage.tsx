import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyApi } from '@/services/api';
import { Coins, Plus, Edit, Trash2, Save, X, Check, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CurrencyManagementPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1,
    isActive: true,
  });

  const { data: currencies, isLoading } = useQuery({
    queryKey: ['admin-currencies'],
    queryFn: async () => {
      const response: any = await currencyApi.getCurrencies();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => currencyApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-currencies'] });
      setIsEditing(false);
      resetForm();
      toast.success('Currency created successfully');
    },
    onError: () => {
      toast.error('Failed to create currency');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => currencyApi.updateCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-currencies'] });
      setIsEditing(false);
      setSelectedCurrency(null);
      resetForm();
      toast.success('Currency updated successfully');
    },
    onError: () => {
      toast.error('Failed to update currency');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => currencyApi.deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-currencies'] });
      toast.success('Currency deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete currency');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => currencyApi.setDefaultCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-currencies'] });
      toast.success('Default currency updated');
    },
    onError: () => {
      toast.error('Failed to set default currency');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: 1,
      isActive: true,
    });
  };

  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      isActive: currency.isActive,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exchangeRate || formData.exchangeRate <= 0) {
      toast.error('Exchange rate must be greater than 0');
      return;
    }
    if (selectedCurrency) {
      updateMutation.mutate({ id: selectedCurrency.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (currency: Currency) => {
    if (currency.isDefault) {
      toast.error('Cannot delete the default currency');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${currency.name}?`)) {
      deleteMutation.mutate(currency.id);
    }
  };

  const popularCurrencies = [
    { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Currency Management</h1>
          <p className="text-gray-600 mt-1">Manage currencies and exchange rates</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              resetForm();
              setSelectedCurrency(null);
              setIsEditing(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Currency
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-primary-950 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary-950">Currency Detection</h3>
            <p className="text-sm text-primary-900 mt-1">
              The system automatically detects user location and suggests appropriate currency.
              NPR (Nepalese Rupee) is the base currency for price calculations.
              All prices are stored in NPR and converted on display.
            </p>
          </div>
        </div>
      </div>

      {!isEditing ? (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-8">Loading currencies...</div>
          ) : !currencies?.length ? (
            <div className="text-center py-8 text-gray-500">
              <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No currencies configured. Add your first currency.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Exchange Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currencies.map((currency: Currency) => (
                    <tr key={currency.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{currency.name}</span>
                          {currency.isDefault && (
                            <span className="bg-primary-100 text-primary-900 text-xs px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{currency.code}</code>
                      </td>
                      <td className="px-4 py-3 text-lg">
                        {currency.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono">
                          1 NPR = {currency.exchangeRate.toFixed(4)} {currency.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          currency.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currency.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!currency.isDefault && currency.isActive && (
                            <button
                              onClick={() => setDefaultMutation.mutate(currency.id)}
                              disabled={setDefaultMutation.isPending}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Set as Default"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(currency)}
                            className="p-1 text-gray-400 hover:text-primary-950"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          {!currency.isDefault && (
                            <button
                              onClick={() => handleDelete(currency)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4">
            <h3 className="text-lg font-semibold">
              {selectedCurrency ? 'Edit Currency' : 'Add New Currency'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSelectedCurrency(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Select */}
          {!selectedCurrency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
              <div className="flex flex-wrap gap-2">
                {popularCurrencies
                  .filter(c => !currencies?.some((curr: Currency) => curr.code === c.code))
                  .map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        code: c.code,
                        name: c.name,
                        symbol: c.symbol,
                      })}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        formData.code === c.code
                          ? 'bg-primary-100 border-primary-500 text-primary-900'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input w-full"
                required
                maxLength={3}
                placeholder="USD"
                disabled={!!selectedCurrency}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="input w-full"
                required
                placeholder="$"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              required
              placeholder="US Dollar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate (1 NPR = ? {formData.code || 'XXX'})
            </label>
            <input
              type="number"
              value={formData.exchangeRate}
              onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })}
              className="input w-full"
              required
              step="0.0001"
              min="0"
              placeholder="0.0075"
            />
            <p className="text-sm text-gray-500 mt-1">
              Example: If 1 USD = 133 NPR, enter 0.0075 (1/133)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedCurrency(null);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Saving...' 
                  : selectedCurrency ? 'Update Currency' : 'Add Currency'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
