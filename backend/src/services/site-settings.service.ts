import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { auditService } from './audit.service';

/**
 * Site Settings Service
 * Handles site configuration, branding, header, footer, and general settings
 */

interface HeaderSettings {
  logo: string;
  logoAlt: string;
  favicon: string;
  siteName: string;
  tagline: string;
  showTopBar: boolean;
  topBarContent: string;
  topBarBgColor: string;
  topBarTextColor: string;
  phoneNumber: string;
  email: string;
  showSocialLinks: boolean;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
  };
  navigationItems: Array<{
    label: string;
    href: string;
    isExternal: boolean;
    children?: Array<{ label: string; href: string }>;
  }>;
}

interface FooterSettings {
  showFooter: boolean;
  copyrightText: string;
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
      isExternal: boolean;
    }>;
  }>;
  showNewsletter: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  showSocialLinks: boolean;
  showPaymentMethods: boolean;
  paymentMethods: string[];
  bottomLinks: Array<{
    label: string;
    href: string;
  }>;
  address: string;
  phone: string;
  email: string;
}

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  faviconUrl: string;
}

interface SeoSettings {
  defaultTitle: string;
  titleSuffix: string;
  defaultDescription: string;
  defaultKeywords: string[];
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
}

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
}

// Default settings
const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  logo: '/logo.png',
  logoAlt: 'Travel Booking Platform',
  favicon: '/favicon.ico',
  siteName: 'TravelBook',
  tagline: 'Your Journey Starts Here',
  showTopBar: true,
  topBarContent: 'Book with confidence - Best price guarantee!',
  topBarBgColor: '#1e40af',
  topBarTextColor: '#ffffff',
  phoneNumber: '+977 1234567890',
  email: 'info@travelbook.com',
  showSocialLinks: true,
  socialLinks: {
    facebook: 'https://facebook.com/travelbook',
    twitter: 'https://twitter.com/travelbook',
    instagram: 'https://instagram.com/travelbook',
    linkedin: '',
    youtube: '',
    whatsapp: '+9771234567890',
  },
  navigationItems: [
    { label: 'Flights', href: '/search', isExternal: false },
    { label: 'Hotels', href: '/hotels', isExternal: false },
    { label: 'Cars', href: '/cars', isExternal: false },
    { label: 'eSIM', href: '/esim', isExternal: false },
    { label: 'About', href: '/about', isExternal: false },
    { label: 'Contact', href: '/contact', isExternal: false },
  ],
};

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  showFooter: true,
  copyrightText: '© 2026 TravelBook. All rights reserved.',
  columns: [
    {
      title: 'Quick Links',
      links: [
        { label: 'Flight Search', href: '/search', isExternal: false },
        { label: 'Hotel Booking', href: '/hotels', isExternal: false },
        { label: 'Car Rental', href: '/cars', isExternal: false },
        { label: 'eSIM', href: '/esim', isExternal: false },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help', isExternal: false },
        { label: 'Contact Us', href: '/contact', isExternal: false },
        { label: 'FAQs', href: '/faqs', isExternal: false },
        { label: 'Track Booking', href: '/track-booking', isExternal: false },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about', isExternal: false },
        { label: 'Careers', href: '/careers', isExternal: false },
        { label: 'Blog', href: '/blog', isExternal: false },
        { label: 'Press', href: '/press', isExternal: false },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy', isExternal: false },
        { label: 'Terms of Service', href: '/terms', isExternal: false },
        { label: 'Cookie Policy', href: '/cookies', isExternal: false },
        { label: 'Refund Policy', href: '/refund-policy', isExternal: false },
      ],
    },
  ],
  showNewsletter: true,
  newsletterTitle: 'Subscribe to our newsletter',
  newsletterDescription: 'Get exclusive deals and travel tips',
  showSocialLinks: true,
  showPaymentMethods: true,
  paymentMethods: ['visa', 'mastercard', 'amex', 'esewa', 'khalti'],
  bottomLinks: [
    { label: 'Privacy', href: '/privacy-policy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
  address: 'Kathmandu, Nepal',
  phone: '+977 1234567890',
  email: 'support@travelbook.com',
};

const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, sans-serif',
  logoUrl: '/logo.png',
  logoWidth: 150,
  logoHeight: 40,
  faviconUrl: '/favicon.ico',
};

const DEFAULT_SEO_SETTINGS: SeoSettings = {
  defaultTitle: 'TravelBook - Book Flights, Hotels & Cars',
  titleSuffix: ' | TravelBook',
  defaultDescription: 'Book flights, hotels, and car rentals at the best prices. Your one-stop travel booking platform.',
  defaultKeywords: ['travel booking', 'flights', 'hotels', 'car rental', 'Nepal travel'],
  ogImage: '/og-image.jpg',
  twitterHandle: '@travelbook',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'TravelBook',
  siteDescription: 'Your Journey Starts Here',
  defaultCurrency: 'NPR',
  defaultLanguage: 'en',
  timezone: 'Asia/Kathmandu',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
  contactEmail: 'contact@travelbook.com',
  supportPhone: '+977 1234567890',
  address: 'Kathmandu, Nepal',
};

export class SiteSettingsService {
  /**
   * Get setting by key
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    return setting.value as T;
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string) {
    return await prisma.siteSetting.findMany({
      where: { category },
    });
  }

  /**
   * Set setting
   */
  async setSetting(key: string, value: any, category: string, userId?: string) {
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value, category },
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'SETTING_UPDATED',
        entity: 'SiteSetting',
        entityId: key,
        changes: { value },
      });
    }

    return setting;
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { category: 'asc' },
    });

    const grouped: Record<string, any> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      grouped[setting.category][setting.key] = setting.value;
    }

    return grouped;
  }

  /**
   * Initialize default settings
   */
  async initializeSettings(): Promise<void> {
    try {
      const defaultSettings = [
        { key: 'header', value: DEFAULT_HEADER_SETTINGS as unknown as object, category: 'layout' },
        { key: 'footer', value: DEFAULT_FOOTER_SETTINGS as unknown as object, category: 'layout' },
        { key: 'branding', value: DEFAULT_BRANDING_SETTINGS as unknown as object, category: 'branding' },
        { key: 'seo', value: DEFAULT_SEO_SETTINGS as unknown as object, category: 'seo' },
        { key: 'general', value: DEFAULT_GENERAL_SETTINGS as unknown as object, category: 'general' },
      ];

      for (const setting of defaultSettings) {
        const existing = await prisma.siteSetting.findUnique({
          where: { key: setting.key },
        });

        if (!existing) {
          await prisma.siteSetting.create({
            data: setting,
          });
          logger.info(`Default setting created: ${setting.key}`);
        }
      }

      logger.info('Site settings initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize site settings:', error);
    }
  }

  /**
   * Get header settings
   */
  async getHeaderSettings(): Promise<HeaderSettings> {
    const setting = await this.getSetting<HeaderSettings>('header');
    return setting || DEFAULT_HEADER_SETTINGS;
  }

  /**
   * Update header settings
   */
  async updateHeaderSettings(settings: Partial<HeaderSettings>, userId: string) {
    const current = await this.getHeaderSettings();
    const updated = { ...current, ...settings };
    return await this.setSetting('header', updated, 'layout', userId);
  }

  /**
   * Get footer settings
   */
  async getFooterSettings(): Promise<FooterSettings> {
    const setting = await this.getSetting<FooterSettings>('footer');
    return setting || DEFAULT_FOOTER_SETTINGS;
  }

  /**
   * Update footer settings
   */
  async updateFooterSettings(settings: Partial<FooterSettings>, userId: string) {
    const current = await this.getFooterSettings();
    const updated = { ...current, ...settings };
    return await this.setSetting('footer', updated, 'layout', userId);
  }

  /**
   * Get branding settings
   */
  async getBrandingSettings(): Promise<BrandingSettings> {
    const setting = await this.getSetting<BrandingSettings>('branding');
    return setting || DEFAULT_BRANDING_SETTINGS;
  }

  /**
   * Update branding settings
   */
  async updateBrandingSettings(settings: Partial<BrandingSettings>, userId: string) {
    const current = await this.getBrandingSettings();
    const updated = { ...current, ...settings };
    return await this.setSetting('branding', updated, 'branding', userId);
  }

  /**
   * Get SEO settings
   */
  async getSeoSettings(): Promise<SeoSettings> {
    const setting = await this.getSetting<SeoSettings>('seo');
    return setting || DEFAULT_SEO_SETTINGS;
  }

  /**
   * Update SEO settings
   */
  async updateSeoSettings(settings: Partial<SeoSettings>, userId: string) {
    const current = await this.getSeoSettings();
    const updated = { ...current, ...settings };
    return await this.setSetting('seo', updated, 'seo', userId);
  }

  /**
   * Get general settings
   */
  async getGeneralSettings(): Promise<GeneralSettings> {
    const setting = await this.getSetting<GeneralSettings>('general');
    return setting || DEFAULT_GENERAL_SETTINGS;
  }

  /**
   * Update general settings
   */
  async updateGeneralSettings(settings: Partial<GeneralSettings>, userId: string) {
    const current = await this.getGeneralSettings();
    const updated = { ...current, ...settings };
    return await this.setSetting('general', updated, 'general', userId);
  }
}

export const siteSettingsService = new SiteSettingsService();
