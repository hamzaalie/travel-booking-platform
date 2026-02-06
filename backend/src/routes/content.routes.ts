import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/authorization.middleware';
import { contentService } from '../services/content.service';

const router = Router();

// ============================================================================
// PUBLIC PAGE ROUTES
// ============================================================================

// GET /api/content/pages/:slug - Get published page by slug
router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await contentService.getPageBySlug(req.params.slug);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  })
);

// ============================================================================
// PUBLIC BLOG ROUTES
// ============================================================================

// GET /api/content/blog - Get published blog posts
router.get(
  '/blog',
  asyncHandler(async (req, res) => {
    const { category, limit, page } = req.query;

    const result = await contentService.getPublishedBlogPosts({
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/content/blog/featured - Get featured blog posts
router.get(
  '/blog/featured',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const posts = await contentService.getFeaturedBlogPosts(limit);

    res.json({
      success: true,
      data: posts,
    });
  })
);

// GET /api/content/blog/categories - Get blog categories
router.get(
  '/blog/categories',
  asyncHandler(async (_req, res) => {
    const categories = await contentService.getBlogCategories();

    res.json({
      success: true,
      data: categories,
    });
  })
);

// GET /api/content/blog/:slug - Get blog post by slug
router.get(
  '/blog/:slug',
  asyncHandler(async (req, res) => {
    const post = await contentService.getBlogPostBySlug(req.params.slug);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  })
);

// ============================================================================
// ADMIN PAGE ROUTES
// ============================================================================

// GET /api/content/admin/pages - Get all pages (admin)
router.get(
  '/admin/pages',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const isPublished = req.query.isPublished === 'true' ? true : 
                        req.query.isPublished === 'false' ? false : undefined;
    
    const pages = await contentService.getAllPages({ isPublished });

    res.json({
      success: true,
      data: pages,
    });
  })
);

// GET /api/content/admin/pages/:id - Get page by ID (admin)
router.get(
  '/admin/pages/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const page = await contentService.getPageById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found',
      });
    }

    res.json({
      success: true,
      data: page,
    });
  })
);

// POST /api/content/admin/pages - Create page (admin)
router.post(
  '/admin/pages',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { slug, title, content, metaTitle, metaDescription, isPublished } = req.body;

    if (!slug || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: slug, title, content',
      });
    }

    const page = await contentService.createPage(
      { slug, title, content, metaTitle, metaDescription, isPublished },
      req.user!.id
    );

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      data: page,
    });
  })
);

// PUT /api/content/admin/pages/:id - Update page (admin)
router.put(
  '/admin/pages/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const page = await contentService.updatePage(
      req.params.id,
      req.body,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'Page updated successfully',
      data: page,
    });
  })
);

// DELETE /api/content/admin/pages/:id - Delete page (admin)
router.delete(
  '/admin/pages/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    await contentService.deletePage(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  })
);

// POST /api/content/admin/pages/initialize - Initialize default pages (admin)
router.post(
  '/admin/pages/initialize',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    await contentService.initializeDefaultPages(req.user!.id);

    res.json({
      success: true,
      message: 'Default pages initialized',
    });
  })
);

// ============================================================================
// ADMIN BLOG ROUTES
// ============================================================================

// GET /api/content/admin/blog - Get all blog posts (admin)
router.get(
  '/admin/blog',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { isPublished, category, isFeatured } = req.query;

    const posts = await contentService.getAllBlogPosts({
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      category: category as string,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: posts,
    });
  })
);

// GET /api/content/admin/blog/:id - Get blog post by ID (admin)
router.get(
  '/admin/blog/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await contentService.getBlogPostById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  })
);

// POST /api/content/admin/blog - Create blog post (admin)
router.post(
  '/admin/blog',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const { 
      slug, title, excerpt, content, featuredImage, 
      category, tags, metaTitle, metaDescription, 
      isPublished, isFeatured 
    } = req.body;

    if (!slug || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: slug, title, content',
      });
    }

    const post = await contentService.createBlogPost(
      { 
        slug, title, excerpt, content, featuredImage, 
        category, tags, metaTitle, metaDescription, 
        isPublished, isFeatured 
      },
      req.user!.id
    );

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post,
    });
  })
);

// PUT /api/content/admin/blog/:id - Update blog post (admin)
router.put(
  '/admin/blog/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await contentService.updateBlogPost(
      req.params.id,
      req.body,
      req.user!.id
    );

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: post,
    });
  })
);

// DELETE /api/content/admin/blog/:id - Delete blog post (admin)
router.delete(
  '/admin/blog/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: AuthRequest, res) => {
    await contentService.deleteBlogPost(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  })
);

export default router;
