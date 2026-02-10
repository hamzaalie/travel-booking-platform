import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { contentApi } from '@/services/api';
import { ArrowLeft, FileText } from 'lucide-react';

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['page', slug],
    queryFn: async () => {
      const response: any = await contentApi.getPage(slug!);
      return response.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Update page title for SEO */}
      {page.metaTitle && (
        <title>{page.metaTitle}</title>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8 pb-8 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </p>
          </header>

          <div 
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-950 prose-a:hover:text-primary-950"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </>
  );
}
