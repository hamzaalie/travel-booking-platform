import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { auditService } from './audit.service';
import { AppError } from '../middleware/error.middleware';

/**
 * Content Management Service
 * Handles pages and blog posts
 */

interface CreatePageData {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

interface UpdatePageData {
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

interface CreateBlogPostData {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

interface UpdateBlogPostData {
  title?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export class ContentService {
  // ============================================================================
  // PAGES
  // ============================================================================

  /**
   * Create a new page
   */
  async createPage(data: CreatePageData, userId: string) {
    // Check if slug already exists
    const existing = await prisma.page.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError('A page with this slug already exists', 400);
    }

    const page = await prisma.page.create({
      data: {
        ...data,
        createdBy: userId,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    await auditService.log({
      userId,
      action: 'PAGE_CREATED',
      entity: 'Page',
      entityId: page.id,
      changes: { title: data.title, slug: data.slug },
    });

    logger.info(`Page created: ${data.slug} by user ${userId}`);
    return page;
  }

  /**
   * Update a page
   */
  async updatePage(id: string, data: UpdatePageData, userId: string) {
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new AppError('Page not found', 404);
    }

    const wasPublished = page.isPublished;
    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        publishedAt: data.isPublished && !wasPublished ? new Date() : page.publishedAt,
      },
    });

    await auditService.log({
      userId,
      action: 'PAGE_UPDATED',
      entity: 'Page',
      entityId: id,
      changes: data,
    });

    logger.info(`Page updated: ${page.slug} by user ${userId}`);
    return updatedPage;
  }

  /**
   * Delete a page
   */
  async deletePage(id: string, userId: string) {
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new AppError('Page not found', 404);
    }

    await prisma.page.delete({
      where: { id },
    });

    await auditService.log({
      userId,
      action: 'PAGE_DELETED',
      entity: 'Page',
      entityId: id,
      changes: { slug: page.slug },
    });

    logger.info(`Page deleted: ${page.slug} by user ${userId}`);
    return { success: true };
  }

  /**
   * Get page by slug (public)
   */
  async getPageBySlug(slug: string) {
    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page || !page.isPublished) {
      return null;
    }

    return page;
  }

  /**
   * Get page by ID (admin)
   */
  async getPageById(id: string) {
    return await prisma.page.findUnique({
      where: { id },
    });
  }

  /**
   * Get all pages (admin)
   */
  async getAllPages(params?: { isPublished?: boolean }) {
    return await prisma.page.findMany({
      where: params?.isPublished !== undefined ? { isPublished: params.isPublished } : {},
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Initialize default pages
   */
  async initializeDefaultPages(userId: string): Promise<void> {
    const defaultPages = [
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: `
          <h1>Privacy Policy</h1>
          <p>Last updated: February 2026</p>
          
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support.</p>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          
          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We share information only as described in this policy.</p>
          
          <h2>4. Security</h2>
          <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.</p>
          
          <h2>5. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@travelbook.com.</p>
        `,
        isPublished: true,
      },
      {
        slug: 'terms',
        title: 'Terms of Service',
        content: `
          <h1>Terms of Service</h1>
          <p>Last updated: February 2026</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using TravelBook, you accept and agree to be bound by these Terms of Service.</p>
          
          <h2>2. Booking Terms</h2>
          <p>All bookings are subject to availability and confirmation. Prices are subject to change without notice until booking is confirmed.</p>
          
          <h2>3. Cancellation Policy</h2>
          <p>Cancellation policies vary by booking type and service provider. Please review the specific terms before completing your booking.</p>
          
          <h2>4. User Responsibilities</h2>
          <p>You are responsible for providing accurate information and maintaining the confidentiality of your account.</p>
          
          <h2>5. Limitation of Liability</h2>
          <p>TravelBook acts as an intermediary and is not liable for services provided by third-party vendors.</p>
        `,
        isPublished: true,
      },
      {
        slug: 'about',
        title: 'About Us',
        content: `
          <h1>About TravelBook</h1>
          
          <h2>Our Mission</h2>
          <p>To make travel accessible, affordable, and enjoyable for everyone. We connect travelers with the best flight, hotel, and car rental options.</p>
          
          <h2>Who We Are</h2>
          <p>TravelBook is a leading travel booking platform based in Nepal, serving customers worldwide. We partner with major airlines, hotels, and car rental companies to bring you the best deals.</p>
          
          <h2>Why Choose Us</h2>
          <ul>
            <li>Competitive prices and exclusive deals</li>
            <li>24/7 customer support</li>
            <li>Secure booking platform</li>
            <li>Multiple payment options including local payment methods</li>
            <li>B2B partnership opportunities</li>
          </ul>
        `,
        isPublished: true,
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: `
          <h1>Contact Us</h1>
          
          <h2>Get in Touch</h2>
          <p>We're here to help! Reach out to us through any of the following channels:</p>
          
          <h3>Customer Support</h3>
          <p>Email: support@travelbook.com</p>
          <p>Phone: +977 1234567890</p>
          <p>Hours: 24/7</p>
          
          <h3>Business Inquiries</h3>
          <p>Email: business@travelbook.com</p>
          
          <h3>B2B Partnerships</h3>
          <p>Email: partners@travelbook.com</p>
          
          <h3>Office Address</h3>
          <p>TravelBook Headquarters</p>
          <p>Kathmandu, Nepal</p>
        `,
        isPublished: true,
      },
      {
        slug: 'refund-policy',
        title: 'Refund Policy',
        content: `
          <h1>Refund Policy</h1>
          <p>Last updated: February 2026</p>
          
          <h2>1. Flight Refunds</h2>
          <p>Flight refund eligibility depends on the fare rules of your ticket. Refundable tickets can be cancelled for a full or partial refund as per airline policy.</p>
          
          <h2>2. Hotel Refunds</h2>
          <p>Hotel cancellation and refund policies vary by property. Please review the specific terms during booking.</p>
          
          <h2>3. Processing Time</h2>
          <p>Approved refunds are typically processed within 7-14 business days. The time for the refund to appear in your account depends on your payment method.</p>
          
          <h2>4. Cancellation Fees</h2>
          <p>Some bookings may be subject to cancellation fees as specified in the booking terms.</p>
          
          <h2>5. How to Request a Refund</h2>
          <p>Log in to your account and navigate to your booking to initiate a cancellation request, or contact our support team.</p>
        `,
        isPublished: true,
      },
      {
        slug: 'faqs',
        title: 'Frequently Asked Questions',
        content: `
          <h1>Frequently Asked Questions</h1>
          
          <h2>Booking Questions</h2>
          
          <h3>How do I book a flight?</h3>
          <p>Use our search tool to find flights, select your preferred option, enter passenger details, and complete payment.</p>
          
          <h3>Can I change my booking?</h3>
          <p>Yes, depending on the fare rules. Log in to your account and go to My Bookings to request changes.</p>
          
          <h2>Payment Questions</h2>
          
          <h3>What payment methods do you accept?</h3>
          <p>We accept eSewa, Khalti, credit/debit cards, and PayPal.</p>
          
          <h3>Is my payment secure?</h3>
          <p>Yes, all payments are processed through secure, encrypted channels.</p>
          
          <h2>Account Questions</h2>
          
          <h3>How do I create an account?</h3>
          <p>Click on "Register" and fill in your details. You can also register as a B2B agent for business benefits.</p>
        `,
        isPublished: true,
      },
    ];

    for (const pageData of defaultPages) {
      const existing = await prisma.page.findUnique({
        where: { slug: pageData.slug },
      });

      if (!existing) {
        await this.createPage(pageData, userId);
        logger.info(`Default page created: ${pageData.slug}`);
      }
    }
  }

  // ============================================================================
  // BLOG POSTS
  // ============================================================================

  /**
   * Create a blog post
   */
  async createBlogPost(data: CreateBlogPostData, userId: string) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError('A blog post with this slug already exists', 400);
    }

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        createdBy: userId,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    await auditService.log({
      userId,
      action: 'BLOG_POST_CREATED',
      entity: 'BlogPost',
      entityId: post.id,
      changes: { title: data.title, slug: data.slug },
    });

    logger.info(`Blog post created: ${data.slug} by user ${userId}`);
    return post;
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(id: string, data: UpdateBlogPostData, userId: string) {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    const wasPublished = post.isPublished;
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        publishedAt: data.isPublished && !wasPublished ? new Date() : post.publishedAt,
      },
    });

    await auditService.log({
      userId,
      action: 'BLOG_POST_UPDATED',
      entity: 'BlogPost',
      entityId: id,
      changes: data,
    });

    logger.info(`Blog post updated: ${post.slug} by user ${userId}`);
    return updatedPost;
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string, userId: string) {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    await auditService.log({
      userId,
      action: 'BLOG_POST_DELETED',
      entity: 'BlogPost',
      entityId: id,
      changes: { slug: post.slug },
    });

    logger.info(`Blog post deleted: ${post.slug} by user ${userId}`);
    return { success: true };
  }

  /**
   * Get blog post by slug (public)
   */
  async getBlogPostBySlug(slug: string) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      return null;
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  /**
   * Get blog post by ID (admin)
   */
  async getBlogPostById(id: string) {
    return await prisma.blogPost.findUnique({
      where: { id },
    });
  }

  /**
   * Get all blog posts (admin)
   */
  async getAllBlogPosts(params?: {
    isPublished?: boolean;
    category?: string;
    isFeatured?: boolean;
  }) {
    const where: any = {};
    
    if (params?.isPublished !== undefined) {
      where.isPublished = params.isPublished;
    }
    if (params?.category) {
      where.category = params.category;
    }
    if (params?.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    return await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Get published blog posts (public)
   */
  async getPublishedBlogPosts(params?: {
    category?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = params?.limit || 10;
    const page = params?.page || 1;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (params?.category) {
      where.category = params.category;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          tags: true,
          publishedAt: true,
          viewCount: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedBlogPosts(limit: number = 5) {
    return await prisma.blogPost.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
      },
    });
  }

  /**
   * Get blog categories
   */
  async getBlogCategories() {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { category: true },
    });

    const categories = new Set(posts.map(p => p.category).filter(Boolean));
    return Array.from(categories);
  }
}

export const contentService = new ContentService();
