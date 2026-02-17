import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { contentApi } from '@/services/api';
import { Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react';

/** Strip HTML tags and return plain text for safe preview */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  publishedAt: string;
  tags: string[];
  author: {
    firstName: string;
    lastName: string;
  };
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag') || '';

  const setSelectedTag = (tag: string) => {
    if (tag) {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  };

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', selectedTag],
    queryFn: async () => {
      const params: any = {};
      if (selectedTag) params.tag = selectedTag;
      
      const response: any = await contentApi.getBlogPosts(params);
      return response.data || [];
    },
  });

  // Fetch ALL posts (unfiltered) to extract the full tag list
  const { data: allPosts } = useQuery({
    queryKey: ['blog-posts-all'],
    queryFn: async () => {
      const response: any = await contentApi.getBlogPosts({});
      return response.data || [];
    },
    staleTime: 60_000,
  });

  // Get unique tags from ALL posts, not just filtered ones
  const allTags = useMemo(() => {
    return (allPosts || []).reduce((tags: string[], post: BlogPost) => {
      post.tags?.forEach((tag) => {
        if (!tags.includes(tag)) tags.push(tag);
      });
      return tags;
    }, []);
  }, [allPosts]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Travel Blog</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover travel tips, destination guides, and inspiring stories from around the world
        </p>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedTag
                ? 'bg-primary-950 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Posts
          </button>
          {allTags.map((tag: string) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-primary-950 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading posts...</p>
        </div>
      ) : !posts?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No blog posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              {post.featuredImage ? (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-950 flex items-center justify-center">
                  <span className="text-4xl opacity-50">✈️</span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author?.firstName} {post.author?.lastName}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-950 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-gray-600 line-clamp-3 mb-4">
                  {post.excerpt || stripHtml(post.content).slice(0, 150) + '...'}
                </p>

                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Blog Post Detail Page
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const response: any = await contentApi.getBlogPost(slug!);
      return response.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        to="/blog" 
        className="inline-flex items-center text-gray-600 hover:text-primary-950 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blog
      </Link>

      <article className="max-w-4xl mx-auto">
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-80 object-cover rounded-xl mb-8"
          />
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author?.firstName} {post.author?.lastName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.ceil(post.content.length / 1000)} min read
            </span>
          </div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  to={`/blog?tag=${tag}`}
                  className="flex items-center gap-1 text-sm bg-primary-50 text-primary-900 px-3 py-1 rounded-full hover:bg-primary-100"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
      </article>
    </div>
  );
}
