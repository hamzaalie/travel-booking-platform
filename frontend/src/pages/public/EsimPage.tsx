import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { esimApi } from '@/services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Globe, Wifi, Clock, Search, Check, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface EsimProduct {
  id: string;
  name: string;
  country: string;
  region: string;
  dataAmount: string;
  validity: number;
  price: number;
  currency: string;
  provider: string;
  description: string;
  features: string[];
}

export default function EsimPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<EsimProduct | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['esim-products', searchTerm, selectedRegion],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.country = searchTerm;
      if (selectedRegion !== 'all') params.region = selectedRegion;
      
      const response: any = await esimApi.getProducts(params);
      const result = response.data?.data || response.data || {};
      const items = result.products || result || [];
      
      // Normalize API response fields to match component expectations
      return Array.isArray(items) ? items.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        country: Array.isArray(p.countries) ? p.countries.join(', ') : (p.country || ''),
        region: Array.isArray(p.regions) ? p.regions[0] : (p.region || ''),
        dataAmount: p.dataAmount || p.data_amount || '',
        validity: p.validityDays || p.validity || 0,
        price: p.price || 0,
        currency: p.currency || 'USD',
        provider: p.providerName || p.provider || 'Airalo',
        features: p.features || [],
      })) : [];
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: (productId: string) => esimApi.purchase(productId),
    onSuccess: (data: any) => {
      toast.success('eSIM purchased successfully!');
      if (data?.data?.orderId) {
        navigate(`/customer/esim/${data.data.orderId}`);
      }
    },
    onError: () => {
      toast.error('Failed to purchase eSIM');
    },
  });

  const handlePurchase = (product: EsimProduct) => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase eSIM');
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
  };

  const confirmPurchase = () => {
    if (selectedProduct) {
      purchaseMutation.mutate(selectedProduct.id);
    }
  };

  const regions = ['all', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania', 'Global'];

  const popularCountries = [
    { code: 'Nepal', flag: '🇳🇵' },
    { code: 'India', flag: '🇮🇳' },
    { code: 'Thailand', flag: '🇹🇭' },
    { code: 'Japan', flag: '🇯🇵' },
    { code: 'USA', flag: '🇺🇸' },
    { code: 'UK', flag: '🇬🇧' },
    { code: 'UAE', flag: '🇦🇪' },
    { code: 'Australia', flag: '🇦🇺' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-accent-500 to-primary-950 py-12 px-4">
        <div className="max-w-7xl mx-auto text-white">
          <h1 className="text-4xl font-bold mb-4">Stay Connected Anywhere</h1>
          <p className="text-xl text-white/90 mb-6">
            Get instant data connectivity with eSIM. No physical SIM needed. 
            Works in 190+ countries.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>No Roaming Charges</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Keep Your Number</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="input w-48"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
              ))}
            </select>
          </div>

          {/* Popular Countries */}
          <div className="mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500 mr-3">Popular:</span>
            <div className="inline-flex flex-wrap gap-2">
              {popularCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSearchTerm(country.code)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    searchTerm === country.code
                      ? 'bg-primary-100 border-primary-500 text-primary-900'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
              >
                {country.flag} {country.code}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading eSIM plans...</p>
          </div>
        ) : !products?.length ? (
          <div className="text-center py-12">
            <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No eSIM plans found</h3>
            <p className="text-gray-500">Try searching for a different country or region</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: EsimProduct) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary-950" />
                    <span className="font-semibold text-gray-900">{product.country}</span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.provider}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wifi className="h-4 w-4" />
                    <span>{product.dataAmount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{product.validity} days validity</span>
                  </div>
                </div>

                {product.features?.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {product.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-primary-950">
                      {product.currency} {product.price}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePurchase(product)}
                    className="btn btn-primary"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Choose Plan', desc: 'Select an eSIM plan for your destination' },
              { step: 2, title: 'Purchase', desc: 'Complete your purchase securely' },
              { step: 3, title: 'Receive QR', desc: 'Get QR code instantly via email' },
              { step: 4, title: 'Activate', desc: 'Scan QR code to activate eSIM' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-900 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Confirm Purchase</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Product</span>
                <span className="font-medium">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Country</span>
                <span className="font-medium">{selectedProduct.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Data</span>
                <span className="font-medium">{selectedProduct.dataAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Validity</span>
                <span className="font-medium">{selectedProduct.validity} days</span>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-xl font-bold text-primary-950">
                  {selectedProduct.currency} {selectedProduct.price}
                </span>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3 rounded-b-xl">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn btn-secondary flex-1"
                disabled={purchaseMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="btn btn-primary flex-1"
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
