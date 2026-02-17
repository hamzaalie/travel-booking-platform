import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, settingsApi } from '@/services/api';
import { TrendingUp, Plus, Edit, Trash2, Save, X, Percent, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MarkupManagementPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: 'PERCENTAGE',
    value: '',
    description: '',
  });

  // Platform Markup State
  const [platformPercentage, setPlatformPercentage] = useState<string>('5');
  const [platformEnabled, setPlatformEnabled] = useState(true);

  const { data: _platformMarkup, isLoading: platformLoading } = useQuery({
    queryKey: ['platformMarkup'],
    queryFn: async () => {
      const response: any = await settingsApi.getPlatformMarkup();
      return response.data?.data || response.data;
    },
  });

  useEffect(() => {
    if (_platformMarkup) {
      setPlatformPercentage(_platformMarkup.percentage?.toString() ?? '5');
      setPlatformEnabled(_platformMarkup.enabled ?? true);
    }
  }, [_platformMarkup]);

  const updatePlatformMarkupMutation = useMutation({
    mutationFn: async (data: { percentage: number; enabled: boolean }) => {
      return await settingsApi.updatePlatformMarkup(data);
    },
    onSuccess: () => {
      toast.success('Platform markup updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['platformMarkup'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update platform markup');
    },
  });

  const handlePlatformMarkupSave = () => {
    const pct = parseFloat(platformPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Percentage must be between 0 and 100');
      return;
    }
    updatePlatformMarkupMutation.mutate({ percentage: pct, enabled: platformEnabled });
  };

  const { data: markups, isLoading } = useQuery({
    queryKey: ['globalMarkups'],
    queryFn: async () => {
      const response: any = await adminApi.getMarkups();
      return response.data;
    },
  });

  const createMarkupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminApi.createMarkup(data);
    },
    onSuccess: () => {
      toast.success('Markup created successfully!');
      setShowAddForm(false);
      setFormData({ type: 'PERCENTAGE', value: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['globalMarkups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create markup');
    },
  });

  const updateMarkupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await adminApi.updateMarkup(id.toString(), data);
    },
    onSuccess: () => {
      toast.success('Markup updated successfully!');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['globalMarkups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update markup');
    },
  });

  const deleteMarkupMutation = useMutation({
    mutationFn: async (id: number) => {
      return await adminApi.deleteMarkup(id.toString());
    },
    onSuccess: () => {
      toast.success('Markup deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['globalMarkups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete markup');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: formData.type,
      value: parseFloat(formData.value),
      description: formData.description,
      isGlobal: true,
    };

    if (editingId) {
      updateMarkupMutation.mutate({ id: editingId, data });
    } else {
      createMarkupMutation.mutate(data);
    }
  };

  const handleEdit = (markup: any) => {
    setEditingId(markup.id);
    setFormData({
      type: markup.type,
      value: markup.value.toString(),
      description: markup.description || '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ type: 'PERCENTAGE', value: '', description: '' });
  };

  const globalMarkups = markups?.filter((m: any) => m.isGlobal && !m.agentId) || [];
  const agentMarkups = markups?.filter((m: any) => !m.isGlobal && m.agentId) || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Markup Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Global Markup
        </button>
      </div>

      {/* Platform Markup Section */}
      <div className="card mb-6 border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Percent className="h-6 w-6 text-primary-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Platform Markup (B2C)</h2>
              <p className="text-sm text-gray-600">
                This percentage is added to all prices for customers. Applied on top of provider prices for flights, hotels, and car rentals.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setPlatformEnabled(!platformEnabled);
            }}
            className="flex items-center space-x-2 text-sm font-medium"
          >
            {platformEnabled ? (
              <ToggleRight className="h-8 w-8 text-green-600" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-400" />
            )}
            <span className={platformEnabled ? 'text-green-600' : 'text-gray-500'}>
              {platformEnabled ? 'Active' : 'Disabled'}
            </span>
          </button>
        </div>

        {platformLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-950"></div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={platformPercentage}
                  onChange={(e) => setPlatformPercentage(e.target.value)}
                  className="input pr-8"
                  placeholder="5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Example: If provider price is $100</p>
                <p className="text-lg font-bold text-primary-950">
                  Customer pays: ${(100 + (100 * (parseFloat(platformPercentage) || 0) / 100)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Your profit: ${(100 * (parseFloat(platformPercentage) || 0) / 100).toFixed(2)} per $100
                </p>
              </div>
            </div>
            <button
              onClick={handlePlatformMarkupSave}
              disabled={updatePlatformMarkupMutation.isPending}
              className="btn btn-primary py-3 px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePlatformMarkupMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card bg-accent-50 border-accent-200 mb-6">
        <div className="flex items-start space-x-3">
          <TrendingUp className="h-6 w-6 text-primary-950 mt-1" />
          <div>
            <h3 className="font-semibold text-primary-950 mb-1">About Markups</h3>
            <p className="text-sm text-primary-950">
              Global markups apply to all bookings. Agent-specific markups override global markups.
              Use PERCENTAGE for % markup or FIXED for flat NPR amount.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card mb-6 border-2 border-primary-300">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Markup' : 'Add New Global Markup'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (NPR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="input"
                  placeholder={formData.type === 'PERCENTAGE' ? 'e.g., 10 for 10%' : 'e.g., 50 for NPR 50'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="e.g., Standard markup for all flights"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createMarkupMutation.isPending || updateMarkupMutation.isPending}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Markup' : 'Create Markup'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Markups */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Global Markups ({globalMarkups.length})</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
          </div>
        ) : globalMarkups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalMarkups.map((markup: any) => (
              <div key={markup.id} className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-3xl font-bold text-primary-900">
                      {markup.type === 'PERCENTAGE' ? `${markup.value}%` : `NPR ${markup.value}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {markup.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Global
                  </span>
                </div>
                {markup.description && (
                  <p className="text-sm text-gray-600 mb-3">{markup.description}</p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(markup)}
                    className="flex-1 btn btn-secondary text-sm py-2"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this markup?')) {
                        deleteMarkupMutation.mutate(markup.id);
                      }
                    }}
                    disabled={deleteMarkupMutation.isPending}
                    className="flex-1 btn btn-danger btn-sm flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No global markups configured</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              Add First Markup
            </button>
          </div>
        )}
      </div>

      {/* Agent-Specific Markups */}
      {agentMarkups.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Agent-Specific Markups ({agentMarkups.length})</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agentMarkups.map((markup: any) => (
                  <tr key={markup.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{markup.agent?.agencyName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm">{markup.type}</td>
                    <td className="px-4 py-3 text-sm font-bold">
                      {markup.type === 'PERCENTAGE' ? `${markup.value}%` : `NPR ${markup.value}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{markup.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
