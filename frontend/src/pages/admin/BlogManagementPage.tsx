import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/services/api';
import { BookOpen, Plus, Edit, Trash2, Eye, Save, X, Calendar, User, Tag, Image } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  author: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagementPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    isPublished: false,
    tags: '',
    metaTitle: '',
    metaDescription: '',
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const response: any = await contentApi.getAdminBlogPosts();
      return response.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.createBlogPost({
      ...data,
      tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      setIsEditing(false);
      resetForm();
      toast.success('Blog post created successfully');
    },
    onError: () => {
      toast.error('Failed to create blog post');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contentApi.updateBlogPost(id, {
      ...data,
      tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      setIsEditing(false);
      setSelectedPost(null);
      resetForm();
      toast.success('Blog post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update blog post');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete blog post');
    },
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      isPublished: false,
      tags: '',
      metaTitle: '',
      metaDescription: '',
    });
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || '',
      isPublished: post.isPublished,
      tags: post.tags?.join(', ') || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPost) {
      updateMutation.mutate({ id: selectedPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (post: BlogPost) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      deleteMutation.mutate(post.id);
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              resetForm();
              setSelectedPost(null);
              setIsEditing(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Post
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="card">
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : !posts?.length ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No blog posts found. Create your first post.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: BlogPost) => (
                <div key={post.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {post.excerpt || post.content.slice(0, 150) + '...'}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        post.isPublished 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author?.firstName} {post.author?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </span>
                      {post.tags?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {post.tags.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-primary-950 rounded-lg hover:bg-gray-100"
                      title="View"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 text-gray-400 hover:text-primary-950 rounded-lg hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-lg font-semibold">
              {selectedPost ? 'Edit Blog Post' : 'Create New Post'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSelectedPost(null);
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
                    slug: !selectedPost ? generateSlug(e.target.value) : formData.slug,
                  });
                }}
                className="input w-full"
                required
                placeholder="10 Best Places to Visit in Nepal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="10-best-places-nepal"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="A brief summary of the post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input w-full font-mono text-sm"
              rows={15}
              required
              placeholder="Write your blog post content... (Markdown or HTML supported)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
              <input
                type="text"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                className="input w-full"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input w-full"
                placeholder="travel, nepal, tourism"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated tags</p>
            </div>
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
                  placeholder="Post title for search engines"
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
                  setSelectedPost(null);
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
                  : selectedPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
