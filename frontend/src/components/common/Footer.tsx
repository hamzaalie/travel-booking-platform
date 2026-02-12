import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import {
  Mail, Phone, MapPin, Facebook, Twitter, Instagram,
  Linkedin, Youtube, Globe, Clock, Shield, Award,
} from 'lucide-react';

const SOCIAL_ICONS: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

const DEFAULT_FOOTER = {
  copyrightText: '',
  showNewsletter: true,
  newsletterTitle: 'Subscribe to our newsletter',
  newsletterDescription: 'Get exclusive deals and travel tips delivered to your inbox.',
  showSocialLinks: true,
  socialLinks: [] as { platform: string; url: string }[],
  columns: [
    {
      title: 'Quick Links',
      links: [
        { label: 'Search Flights', href: '/search', isExternal: false },
        { label: 'Hotels', href: '/hotels', isExternal: false },
        { label: 'Car Rental', href: '/cars', isExternal: false },
        { label: 'eSIM', href: '/esim', isExternal: false },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'B2B Agent Portal', href: '/agent/login', isExternal: false },
        { label: 'B2C Booking', href: '/search', isExternal: false },
        { label: 'Corporate Travel', href: '#', isExternal: false },
        { label: 'Group Bookings', href: '#', isExternal: false },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy', isExternal: false },
        { label: 'Terms of Service', href: '/terms-of-service', isExternal: false },
        { label: 'Cookie Policy', href: '/cookie-policy', isExternal: false },
        { label: 'Refund Policy', href: '/refund-policy', isExternal: false },
      ],
    },
  ],
  bottomLinks: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
  address: '123 Travel Street, Suite 100\nNew York, NY 10001, USA',
  phone: '+1 (234) 567-890',
  email: 'support@peakpasstravel.com',
  poweredByText: 'Powered by Amadeus GDS | Peakpass Travel - Your Journey Partner',
};

const DEFAULT_GENERAL = {
  supportPhone: '+1 (234) 567-890',
  supportEmail: 'support@peakpasstravel.com',
  address: '123 Travel Street, Suite 100\nNew York, NY 10001, USA',
  siteName: 'Peakpass Travel',
};

const DEFAULT_BRANDING = {
  logo: '/images/logo.png',
  logoDark: '/images/logo-dark.png',
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const { data: footerSettings } = useQuery({
    queryKey: ['public-footer-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getFooter();
        return response.data || DEFAULT_FOOTER;
      } catch {
        return DEFAULT_FOOTER;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: generalSettings } = useQuery({
    queryKey: ['public-general-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getGeneral();
        return response.data || DEFAULT_GENERAL;
      } catch {
        return DEFAULT_GENERAL;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandingSettings } = useQuery({
    queryKey: ['public-branding-settings'],
    queryFn: async () => {
      try {
        const response: any = await settingsApi.getBranding();
        return response.data || DEFAULT_BRANDING;
      } catch {
        return DEFAULT_BRANDING;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const footer = footerSettings || DEFAULT_FOOTER;
  const general = generalSettings || DEFAULT_GENERAL;
  const branding = brandingSettings || DEFAULT_BRANDING;

  const contactPhone = footer.phone || general.supportPhone || DEFAULT_GENERAL.supportPhone;
  const contactEmail = footer.email || general.supportEmail || DEFAULT_GENERAL.supportEmail;
  const contactAddress = footer.address || general.address || DEFAULT_GENERAL.address;
  const siteName = general.siteName || DEFAULT_GENERAL.siteName;
  const logoUrl = branding.logoDark || branding.logo || DEFAULT_BRANDING.logoDark;
  const copyright = footer.copyrightText || `\u00A9 ${currentYear} ${siteName}. All rights reserved.`;
  const columns = footer.columns?.length > 0 ? footer.columns : DEFAULT_FOOTER.columns;
  const socialLinks = footer.socialLinks?.length > 0 ? footer.socialLinks : DEFAULT_FOOTER.socialLinks;
  const bottomLinks = footer.bottomLinks?.length > 0 ? footer.bottomLinks : DEFAULT_FOOTER.bottomLinks;

  return (
    <footer className="bg-gradient-to-br from-primary-950 via-gray-900 to-primary-950 text-white">
      {/* Newsletter Section */}
      {footer.showNewsletter && (
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold">{footer.newsletterTitle || 'Subscribe to our newsletter'}</h3>
                <p className="text-gray-400 mt-1">{footer.newsletterDescription || 'Get exclusive deals and travel tips.'}</p>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-accent-500 w-full md:w-72"
                />
                <button className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-semibold transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center space-x-3">
              <img src={logoUrl} alt={siteName} className="h-12 w-auto" onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.png'; }} />
            </div>
            <p className="text-gray-400 leading-relaxed">
              The most advanced B2B & B2C travel booking platform with Amadeus GDS integration,
              trusted by travel agencies worldwide.
            </p>

            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((link: any, idx: number) => {
                  const Icon = SOCIAL_ICONS[link.platform?.toLowerCase()] || Globe;
                  return (
                    <a
                      key={idx}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 p-2.5 rounded-lg hover:bg-accent-500 transition-all duration-300 hover:scale-110"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}

            <div className="space-y-3 lg:hidden">
              {contactPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-accent-500 flex-shrink-0" />
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {contactPhone}
                  </a>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-accent-500 flex-shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Footer Columns */}
          {columns.map((column: any, idx: number) => (
            <div key={idx}>
              <h4 className="text-lg font-display font-bold mb-6 text-white">{column.title}</h4>
              <ul className="space-y-3">
                {column.links?.map((link: any, linkIdx: number) => (
                  <li key={linkIdx}>
                    {link.isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Row (desktop) */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-800">
          {contactAddress && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-accent-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-400 leading-relaxed whitespace-pre-line text-sm">{contactAddress}</span>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-accent-500 flex-shrink-0" />
              <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                {contactPhone}
              </a>
            </div>
          )}
          {contactEmail && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-accent-500 flex-shrink-0" />
              <a href={`mailto:${contactEmail}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                {contactEmail}
              </a>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="h-6 w-6 text-green-500" />
              <div>
                <div className="text-xs font-semibold text-white">SSL Secured</div>
                <div className="text-xs">256-bit Encryption</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Award className="h-6 w-6 text-accent-500" />
              <div>
                <div className="text-xs font-semibold text-white">PCI Certified</div>
                <div className="text-xs">Secure Payments</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Globe className="h-6 w-6 text-accent-500" />
              <div>
                <div className="text-xs font-semibold text-white">IATA Accredited</div>
                <div className="text-xs">Trusted Partner</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="h-6 w-6 text-accent-500" />
              <div>
                <div className="text-xs font-semibold text-white">24/7 Support</div>
                <div className="text-xs">Always Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>{copyright}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              {bottomLinks.map((link: any, idx: number) => (
                <Link key={idx} to={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>{footer.poweredByText || 'Powered by Amadeus GDS | Peakpass Travel - Your Journey Partner'}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
