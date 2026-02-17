import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEsimCommissionApi, esimApi } from '@/services/api';
import {
  Smartphone,
  Percent,
  DollarSign,
  Save,
  Plus,
  Edit,
  Trash2,
  Globe,
  Users,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EsimCommissionRule {
  id: string;
  name: string;
  type: 'B2B' | 'B2C' | 'GLOBAL';
  markupType: 'FIXED' | 'PERCENTAGE';
  markupValue: number;
  commissionType: 'FIXED' | 'PERCENTAGE';
  commissionValue: number;
  isActive: boolean;
  appliesTo: 'ALL' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_COUNTRIES';
  productIds: string[];
  countries: string[];
  agentId: string | null;
  priority: number;
  createdAt: string;
}


const DEFAULT_RULES: EsimCommissionRule[] = [
  {
    id: '1', name: 'Global B2C eSIM Markup', type: 'B2C', markupType: 'PERCENTAGE', markupValue: 15,
    commissionType: 'PERCENTAGE', commissionValue: 0, isActive: true, appliesTo: 'ALL',
    productIds: [], countries: [], agentId: null, priority: 1, createdAt: new Date().toISOString(),
  },
  {
    id: '2', name: 'B2B Agent eSIM Commission', type: 'B2B', markupType: 'PERCENTAGE', markupValue: 10,
    commissionType: 'PERCENTAGE', commissionValue: 5, isActive: true, appliesTo: 'ALL',
    productIds: [], countries: [], agentId: null, priority: 2, createdAt: new Date().toISOString(),
  },
  {
    id: '3', name: 'Nepal eSIM Special Rate', type: 'GLOBAL', markupType: 'FIXED', markupValue: 200,
    commissionType: 'FIXED', commissionValue: 50, isActive: true, appliesTo: 'SPECIFIC_COUNTRIES',
    productIds: [], countries: ['Nepal', 'India'], agentId: null, priority: 3, createdAt: new Date().toISOString(),
  },
];

const EMPTY_RULE: Omit<EsimCommissionRule, 'id' | 'createdAt'> = {
  name: '', type: 'B2C', markupType: 'PERCENTAGE', markupValue: 0,
  commissionType: 'PERCENTAGE', commissionValue: 0, isActive: true,
  appliesTo: 'ALL', productIds: [], countries: [], agentId: null, priority: 0,
};

export default function EsimCommissionPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(EMPTY_RULE);
  const [countryInput, setCountryInput] = useState('');

  const { data: rules = DEFAULT_RULES, isLoading } = useQuery({
    queryKey: ['esim-commissions'],
    queryFn: async () => {
      try {
        const response: any = await adminEsimCommissionApi.getRules();
        return response.data?.rules || DEFAULT_RULES;
      } catch {
        return DEFAULT_RULES;
      }
    },
  });

  const { data: _products } = useQuery({
    queryKey: ['esim-products'],
    queryFn: async () => {
      try {
        const response: any = await esimApi.getProducts({ limit: 100 });
        return response.data?.products || [];
      } catch {
        return [];
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; rule: any }) =>
      data.id
        ? adminEsimCommissionApi.updateRule(data.id, data.rule)
        : adminEsimCommissionApi.createRule(data.rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esim-commissions'] });
      resetForm();
      toast.success('Commission rule saved');
    },
    onError: () => toast.error('Failed to save commission rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminEsimCommissionApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esim-commissions'] });
      toast.success('Commission rule deleted');
    },
    onError: () => toast.error('Failed to delete commission rule'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminEsimCommissionApi.toggleRule(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esim-commissions'] });
      toast.success('Rule status updated');
    },
    onError: () => toast.error('Failed to update rule'),
  });

  const resetForm = () => {
    setFormData(EMPTY_RULE);
    setEditingId(null);
    setIsFormOpen(false);
    setCountryInput('');
  };

  const openEdit = (rule: EsimCommissionRule) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      type: rule.type,
      markupType: rule.markupType,
      markupValue: rule.markupValue,
      commissionType: rule.commissionType,
      commissionValue: rule.commissionValue,
      isActive: rule.isActive,
      appliesTo: rule.appliesTo,
      productIds: rule.productIds,
      countries: rule.countries,
      agentId: rule.agentId,
      priority: rule.priority,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Rule name is required');
      return;
    }
    saveMutation.mutate({ id: editingId || undefined, rule: formData });
  };

  const b2bRules = rules.filter((r: EsimCommissionRule) => r.type === 'B2B');
  const b2cRules = rules.filter((r: EsimCommissionRule) => r.type === 'B2C');
  const globalRules = rules.filter((r: EsimCommissionRule) => r.type === 'GLOBAL');

  if (isLoading) {
    return <div className="text-center py-8">Loading E-SIM commission settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">E-SIM Commission & Markup</h1>
          <p className="text-gray-600 mt-1">Configure E-SIM markup and commission rates for B2B and B2C channels</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-primary-900">{rules.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">B2C Rules</p>
              <p className="text-2xl font-bold text-green-700">{b2cRules.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-accent-50 border-accent-200">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary-950" />
            <div>
              <p className="text-sm text-gray-600">B2B Rules</p>
              <p className="text-2xl font-bold text-primary-900">{b2bRules.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Global Rules</p>
              <p className="text-2xl font-bold text-orange-700">{globalRules.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 text-sm font-medium text-gray-500">Rule Name</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Type</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Markup</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Commission</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Applies To</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                <th className="pb-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule: EsimCommissionRule) => (
                <tr key={rule.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-gray-500">Priority: {rule.priority}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      rule.type === 'B2B' ? 'bg-blue-100 text-blue-700' :
                      rule.type === 'B2C' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {rule.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-sm">
                      {rule.markupType === 'PERCENTAGE' ? (
                        <><Percent className="h-3 w-3 text-gray-400" />{rule.markupValue}%</>
                      ) : (
                        <><DollarSign className="h-3 w-3 text-gray-400" />NPR {rule.markupValue}</>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-sm">
                      {rule.commissionType === 'PERCENTAGE' ? (
                        <><Percent className="h-3 w-3 text-gray-400" />{rule.commissionValue}%</>
                      ) : (
                        <><DollarSign className="h-3 w-3 text-gray-400" />NPR {rule.commissionValue}</>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {rule.appliesTo === 'ALL' ? 'All Products' :
                     rule.appliesTo === 'SPECIFIC_COUNTRIES' ? rule.countries.join(', ') :
                     `${rule.productIds.length} Products`}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        rule.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(rule)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this rule?')) deleteMutation.mutate(rule.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-700">How E-SIM Commission Works</h4>
            <ul className="text-sm text-blue-600 mt-1 space-y-1">
              <li>• <strong>Markup</strong> is added to the base price for customers (B2C) or agents (B2B)</li>
              <li>• <strong>Commission</strong> is the amount earned by B2B agents on each sale</li>
              <li>• Rules with higher priority override lower priority rules</li>
              <li>• B2B agents can customize their own markup on top of admin-set base</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Commission Rule' : 'New Commission Rule'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g. B2B Agent Commission"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="B2C">B2C (Customers)</option>
                    <option value="B2B">B2B (Agents)</option>
                    <option value="GLOBAL">Global</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Markup Type</label>
                  <select
                    value={formData.markupType}
                    onChange={(e) => setFormData({ ...formData, markupType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Markup Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.markupValue}
                    onChange={(e) => setFormData({ ...formData, markupValue: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="ALL">All E-SIM Products</option>
                  <option value="SPECIFIC_COUNTRIES">Specific Countries</option>
                  <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                </select>
              </div>

              {formData.appliesTo === 'SPECIFIC_COUNTRIES' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Countries</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={countryInput}
                      onChange={(e) => setCountryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (countryInput.trim() && !formData.countries.includes(countryInput.trim())) {
                            setFormData({ ...formData, countries: [...formData.countries, countryInput.trim()] });
                            setCountryInput('');
                          }
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter country name"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.countries.map((c: string) => (
                      <span key={c} className="inline-flex items-center gap-1 bg-gray-100 text-sm px-2 py-1 rounded-full">
                        {c}
                        <button onClick={() => setFormData({ ...formData, countries: formData.countries.filter((x: string) => x !== c) })}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={resetForm} className="btn btn-outline">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
