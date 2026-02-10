import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/services/api';
import { FileText, Plus, Edit, Trash2, Eye, Save, X, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PageManagementPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const response: any = await contentApi.getAdminPages();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.createPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      setIsEditing(false);
      resetForm();
      toast.success('Page created successfully');
    },
    onError: () => {
      toast.error('Failed to create page');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contentApi.updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      setIsEditing(false);
      setSelectedPage(null);
      resetForm();
      toast.success('Page updated successfully');
    },
    onError: () => {
      toast.error('Failed to update page');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      toast.success('Page deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete page');
    },
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      isPublished: true,
      metaTitle: '',
      metaDescription: '',
    });
  };

  const handleEdit = (page: Page) => {
    setSelectedPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      isPublished: page.isPublished,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPage) {
      updateMutation.mutate({ id: selectedPage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (page: Page) => {
    if (window.confirm(`Are you sure you want to delete "${page.title}"?`)) {
      deleteMutation.mutate(page.id);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Page Management</h1>
          <p className="text-gray-600 mt-1">Manage static pages (Privacy, Terms, About, etc.)</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              resetForm();
              setSelectedPage(null);
              setIsEditing(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Page
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-8">Loading pages...</div>
          ) : !pages?.length ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pages found. Create your first page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Page
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pages.map((page: Page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{page.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          page.isPublished 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {page.isPublished ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {page.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/page/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-primary-950"
                            title="View Page"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                          <button
                            onClick={() => handleEdit(page)}
                            className="p-1 text-gray-400 hover:text-primary-950"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(page)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
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
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-lg font-semibold">
              {selectedPage ? 'Edit Page' : 'Create New Page'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSelectedPage(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: !selectedPage ? generateSlug(e.target.value) : formData.slug,
                  });
                }}
                className="input w-full"
                required
                placeholder="Privacy Policy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="privacy-policy"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input w-full font-mono text-sm"
              rows={15}
              required
              placeholder="Enter page content... (HTML supported)"
            />
            <p className="text-sm text-gray-500 mt-1">You can use HTML for formatting</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">SEO Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="input w-full"
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Brief description for search engines"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Publish immediately</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPage(null);
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
                  : selectedPage ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
