import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminExtendedApi } from '@/services/api';
import { Search, Building2, Eye, Edit, Check, X, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface B2BUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  role: string;
  markupPercentage: number | null;
  creditLimit: number | null;
  creditBalance: number | null;
  companyName: string | null;
  companyAddress: string | null;
  panNumber: string | null;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

export default function B2BUserManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<B2BUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    markupPercentage: 0,
    creditLimit: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['b2b-users', searchTerm, roleFilter, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      
      const response: any = await adminExtendedApi.getB2BUsers(params);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminExtendedApi.updateB2BUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-users'] });
      setIsEditModalOpen(false);
      toast.success('B2B user updated successfully');
    },
    onError: () => {
      toast.error('Failed to update B2B user');
    },
  });

  const handleEdit = (user: B2BUser) => {
    setSelectedUser(user);
    setEditForm({
      markupPercentage: user.markupPercentage || 0,
      creditLimit: user.creditLimit || 0,
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: editForm });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">B2B User Management</h1>
          <p className="text-gray-600 mt-1">Manage travel agents and operators</p>
        </div>
        <div className="flex items-center gap-2 bg-accent-50 px-4 py-2 rounded-lg">
          <Building2 className="h-5 w-5 text-primary-950" />
          <span className="text-primary-900 font-semibold">
            {data?.total || 0} Total B2B Users
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="all">All Roles</option>
            <option value="AGENT">Agents</option>
            <option value="CORPORATE">Corporate</option>
            <option value="OPERATOR">Operators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8">Loading B2B users...</div>
        ) : !data?.users?.length ? (
          <div className="text-center py-8 text-gray-500">No B2B users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User / Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Markup %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Credit Limit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Credit Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bookings
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
                {data.users.map((user: B2BUser) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.companyName && (
                          <div className="text-sm text-primary-950 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.companyName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${user.role === 'AGENT' ? 'bg-accent-100 text-accent-600' :
                          user.role === 'CORPORATE' ? 'bg-accent-100 text-primary-900' :
                          user.role === 'OPERATOR' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{user.markupPercentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.creditLimit ? `NPR ${user.creditLimit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.creditBalance ? `NPR ${user.creditBalance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {user._count.bookings}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1 text-gray-400 hover:text-primary-950"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-gray-400 hover:text-primary-950"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
            {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? 'bg-primary-950 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsEditModalOpen(false); }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Edit B2B User" className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Edit B2B User</h3>
            
            <div className="mb-4">
              <p className="text-gray-600">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Markup Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editForm.markupPercentage}
                  onChange={(e) => setEditForm({ ...editForm, markupPercentage: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit (NPR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editForm.creditLimit}
                  onChange={(e) => setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Active Status
                </label>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  role="switch"
                  aria-checked={editForm.isActive}
                  aria-label="Toggle active status"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${editForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${editForm.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-secondary"
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Sidebar */}
      {selectedUser && !isEditModalOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl p-4 sm:p-6 overflow-y-auto z-40">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Details</h3>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-primary-950 font-bold text-lg">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-gray-500">{selectedUser.role}</div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <span className="text-sm text-gray-500 block">Email</span>
                <span>{selectedUser.email}</span>
              </div>
              {selectedUser.phone && (
                <div>
                  <span className="text-sm text-gray-500 block">Phone</span>
                  <span>{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.companyName && (
                <div>
                  <span className="text-sm text-gray-500 block">Company</span>
                  <span>{selectedUser.companyName}</span>
                </div>
              )}
              {selectedUser.companyAddress && (
                <div>
                  <span className="text-sm text-gray-500 block">Address</span>
                  <span>{selectedUser.companyAddress}</span>
                </div>
              )}
              {selectedUser.panNumber && (
                <div>
                  <span className="text-sm text-gray-500 block">PAN Number</span>
                  <span>{selectedUser.panNumber}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 block">Member Since</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-accent-50 p-3 rounded-lg">
                <div className="text-accent-500 text-sm">Markup</div>
                <div className="text-xl font-bold text-accent-600">
                  {selectedUser.markupPercentage || 0}%
                </div>
              </div>
              <div className="bg-accent-50 p-3 rounded-lg">
                <div className="text-primary-950 text-sm">Bookings</div>
                <div className="text-xl font-bold text-primary-900">
                  {selectedUser._count.bookings}
                </div>
              </div>
            </div>

            {selectedUser.creditLimit && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Credit</div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    NPR {(selectedUser.creditBalance || 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {selectedUser.creditLimit.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ 
                      width: `${Math.min(100, ((selectedUser.creditBalance || 0) / selectedUser.creditLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => handleEdit(selectedUser)}
              className="btn btn-primary w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
