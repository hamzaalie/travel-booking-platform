import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPopularDestinationsApi } from '@/services/api';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PopularDestination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  iataCode: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  searchCount: number;
  startingPrice: number;
  currency: string;
  tags: string[];
  createdAt: string;
}

const DEFAULT_DESTINATIONS: PopularDestination[] = [
  {
    id: '1', name: 'Kathmandu', country: 'Nepal', description: 'Capital city with rich cultural heritage, ancient temples, and vibrant bazaars.',
    imageUrl: '/images/destinations/kathmandu.jpg', iataCode: 'KTM', isActive: true, isFeatured: true,
    sortOrder: 1, searchCount: 15420, startingPrice: 5000, currency: 'NPR', tags: ['cultural', 'temples', 'trekking'], createdAt: new Date().toISOString(),
  },
  {
    id: '2', name: 'Pokhara', country: 'Nepal', description: 'Lakeside paradise with stunning Himalayan views and adventure sports.',
    imageUrl: '/images/destinations/pokhara.jpg', iataCode: 'PKR', isActive: true, isFeatured: true,
    sortOrder: 2, searchCount: 12300, startingPrice: 4500, currency: 'NPR', tags: ['adventure', 'lakes', 'mountains'], createdAt: new Date().toISOString(),
  },
  {
    id: '3', name: 'Bangkok', country: 'Thailand', description: 'Vibrant capital with ornate shrines, street food, and bustling markets.',
    imageUrl: '/images/destinations/bangkok.jpg', iataCode: 'BKK', isActive: true, isFeatured: true,
    sortOrder: 3, searchCount: 18500, startingPrice: 15000, currency: 'NPR', tags: ['shopping', 'temples', 'food'], createdAt: new Date().toISOString(),
  },
  {
    id: '4', name: 'Dubai', country: 'UAE', description: 'Ultra-modern city with luxury shopping, ultramodern architecture, and nightlife.',
    imageUrl: '/images/destinations/dubai.jpg', iataCode: 'DXB', isActive: true, isFeatured: true,
    sortOrder: 4, searchCount: 9800, startingPrice: 35000, currency: 'NPR', tags: ['luxury', 'shopping', 'modern'], createdAt: new Date().toISOString(),
  },
  {
    id: '5', name: 'Delhi', country: 'India', description: 'Historic capital blending old-world charm with modern sophistication.',
    imageUrl: '/images/destinations/delhi.jpg', iataCode: 'DEL', isActive: true, isFeatured: false,
    sortOrder: 5, searchCount: 11200, startingPrice: 8000, currency: 'NPR', tags: ['historic', 'cultural', 'food'], createdAt: new Date().toISOString(),
  },
  {
    id: '6', name: 'Singapore', country: 'Singapore', description: 'Garden city with stunning skyline, diverse food scene, and world-class attractions.',
    imageUrl: '/images/destinations/singapore.jpg', iataCode: 'SIN', isActive: true, isFeatured: false,
    sortOrder: 6, searchCount: 7600, startingPrice: 25000, currency: 'NPR', tags: ['modern', 'food', 'family'], createdAt: new Date().toISOString(),
  },
];

const EMPTY_DESTINATION: Omit<PopularDestination, 'id' | 'createdAt'> = {
  name: '', country: '', description: '', imageUrl: '', iataCode: '',
  isActive: true, isFeatured: false, sortOrder: 0, searchCount: 0,
  startingPrice: 0, currency: 'NPR', tags: [],
};

export default function PopularDestinationsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(EMPTY_DESTINATION);
  const [tagInput, setTagInput] = useState('');

  const { data: destinations = DEFAULT_DESTINATIONS, isLoading } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: async () => {
      try {
        const response: any = await adminPopularDestinationsApi.getAll();
        return response.data?.destinations || DEFAULT_DESTINATIONS;
      } catch {
        return DEFAULT_DESTINATIONS;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminPopularDestinationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popular-destinations'] });
      resetForm();
      toast.success('Destination created successfully');
    },
    onError: () => toast.error('Failed to create destination'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminPopularDestinationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popular-destinations'] });
      resetForm();
      toast.success('Destination updated successfully');
    },
    onError: () => toast.error('Failed to update destination'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminPopularDestinationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popular-destinations'] });
      toast.success('Destination deleted');
    },
    onError: () => toast.error('Failed to delete destination'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPopularDestinationsApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popular-destinations'] });
      toast.success('Destination visibility updated');
    },
    onError: () => toast.error('Failed to update destination'),
  });

  const resetForm = () => {
    setFormData(EMPTY_DESTINATION);
    setEditingId(null);
    setIsFormOpen(false);
    setTagInput('');
  };

  const openEdit = (dest: PopularDestination) => {
    setEditingId(dest.id);
    setFormData({
      name: dest.name,
      country: dest.country,
      description: dest.description,
      imageUrl: dest.imageUrl,
      iataCode: dest.iataCode,
      isActive: dest.isActive,
      isFeatured: dest.isFeatured,
      sortOrder: dest.sortOrder,
      startingPrice: dest.startingPrice,
      currency: dest.currency,
      tags: dest.tags,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.country) {
      toast.error('Name and country are required');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) });
  };

  const activeCount = destinations.filter((d: PopularDestination) => d.isActive).length;
  const featuredCount = destinations.filter((d: PopularDestination) => d.isFeatured).length;

  if (isLoading) {
    return <div className="text-center py-8">Loading destinations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Popular Destinations</h1>
          <p className="text-gray-600 mt-1">Manage and set popular destinations displayed on the homepage</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">Total Destinations</p>
              <p className="text-2xl font-bold text-primary-900">{destinations.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-700">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-accent-500" />
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-primary-900">{featuredCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Total Searches</p>
              <p className="text-2xl font-bold text-orange-700">
                {destinations.reduce((s: number, d: PopularDestination) => s + d.searchCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations
          .sort((a: PopularDestination, b: PopularDestination) => a.sortOrder - b.sortOrder)
          .map((dest: PopularDestination) => (
          <div key={dest.id} className={`card border-2 overflow-hidden ${!dest.isActive ? 'opacity-60' : ''}`}>
            {/* Image */}
            <div className="relative h-40 -mx-6 -mt-6 mb-4 bg-gray-200 flex items-center justify-center overflow-hidden">
              {dest.imageUrl ? (
                <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <h3 className="text-xl font-bold">{dest.name}</h3>
                <p className="text-sm opacity-90">{dest.country} • {dest.iataCode}</p>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                {dest.isFeatured && (
                  <span className="bg-accent-500 text-white text-xs px-2 py-1 rounded-full">⭐ Featured</span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${dest.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {dest.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>

            {/* Info */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{dest.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {dest.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-gray-500">Starting from</span>
              <span className="font-bold text-primary-900">NPR {dest.startingPrice.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>{dest.searchCount.toLocaleString()} searches</span>
              <span>Order: #{dest.sortOrder}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleMutation.mutate({ id: dest.id, isActive: !dest.isActive })}
                className="btn btn-outline text-sm flex-1 flex items-center justify-center gap-1"
              >
                {dest.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {dest.isActive ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => openEdit(dest)}
                className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this destination?')) {
                    deleteMutation.mutate(dest.id);
                  }
                }}
                className="btn btn-outline text-sm px-3 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Destination' : 'Add New Destination'}</h2>
              <button onClick={resetForm}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. Kathmandu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. Nepal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IATA Code</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.iataCode}
                    onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. KTM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Brief description of the destination"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://example.com/image.jpg or /images/destinations/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price (NPR)</label>
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="NPR">NPR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Add a tag and press Enter"
                  />
                  <button onClick={addTag} className="btn btn-outline">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible on site)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-accent-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured (highlighted)</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={resetForm} className="btn btn-outline">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingId ? 'Update Destination' : 'Create Destination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
