import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import { Settings, Menu, Type, Globe, Search as SearchIcon, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuItem {
  label: string;
  url: string;
  isExternal?: boolean;
  children?: MenuItem[];
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export default function SettingsManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'branding' | 'seo' | 'general'>('header');

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const [header, footer, branding, seo, general]: any[] = await Promise.all([
        settingsApi.getHeader(),
        settingsApi.getFooter(),
        settingsApi.getBranding(),
        settingsApi.getSeo(),
        settingsApi.getGeneral(),
      ]);
      return {
        header: header.data || { logo: '', menuItems: [], topBarEnabled: true, topBarMessage: '' },
        footer: footer.data || { columns: [], socialLinks: [], copyrightText: '', showNewsletter: true },
        branding: branding.data || { primaryColor: '#3B82F6', secondaryColor: '#1E40AF', logo: '', favicon: '' },
        seo: seo.data || { defaultTitle: '', titleTemplate: '', defaultDescription: '', keywords: [] },
        general: general.data || { siteName: '', supportEmail: '', supportPhone: '', address: '' },
      };
    },
  });

  // Update mutations
  const updateMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      switch (type) {
        case 'header':
          return settingsApi.updateHeader(data);
        case 'footer':
          return settingsApi.updateFooter(data);
        case 'branding':
          return settingsApi.updateBranding(data);
        case 'seo':
          return settingsApi.updateSeo(data);
        case 'general':
          return settingsApi.updateGeneral(data);
        default:
          throw new Error('Invalid settings type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const tabs = [
    { id: 'header', label: 'Header', icon: Menu },
    { id: 'footer', label: 'Footer', icon: Type },
    { id: 'branding', label: 'Branding', icon: Globe },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
    { id: 'general', label: 'General', icon: Settings },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600 mt-1">Manage header, footer, branding, and SEO settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Panels */}
      <div className="card">
        {activeTab === 'header' && settings && (
          <HeaderSettings 
            data={settings.header} 
            onSave={(data) => updateMutation.mutate({ type: 'header', data })}
            isSaving={updateMutation.isPending}
          />
        )}
        {activeTab === 'footer' && settings && (
          <FooterSettings 
            data={settings.footer} 
            onSave={(data) => updateMutation.mutate({ type: 'footer', data })}
            isSaving={updateMutation.isPending}
          />
        )}
        {activeTab === 'branding' && settings && (
          <BrandingSettings 
            data={settings.branding} 
            onSave={(data) => updateMutation.mutate({ type: 'branding', data })}
            isSaving={updateMutation.isPending}
          />
        )}
        {activeTab === 'seo' && settings && (
          <SeoSettings 
            data={settings.seo} 
            onSave={(data) => updateMutation.mutate({ type: 'seo', data })}
            isSaving={updateMutation.isPending}
          />
        )}
        {activeTab === 'general' && settings && (
          <GeneralSettings 
            data={settings.general} 
            onSave={(data) => updateMutation.mutate({ type: 'general', data })}
            isSaving={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// Header Settings Component
function HeaderSettings({ data, onSave, isSaving }: { data: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    logo: data.logo || '',
    topBarEnabled: data.topBarEnabled ?? true,
    topBarMessage: data.topBarMessage || '',
    menuItems: data.menuItems || [],
  });

  const addMenuItem = () => {
    setFormData({
      ...formData,
      menuItems: [...formData.menuItems, { label: '', url: '', isExternal: false }],
    });
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    const updated = [...formData.menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, menuItems: updated });
  };

  const removeMenuItem = (index: number) => {
    setFormData({
      ...formData,
      menuItems: formData.menuItems.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Menu className="h-5 w-5" />
        Header Settings
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          type="text"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          className="input w-full"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="font-medium">Top Bar</label>
          <p className="text-sm text-gray-500">Show announcement bar at the top</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, topBarEnabled: !formData.topBarEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            formData.topBarEnabled ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            formData.topBarEnabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {formData.topBarEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Top Bar Message</label>
          <input
            type="text"
            value={formData.topBarMessage}
            onChange={(e) => setFormData({ ...formData, topBarMessage: e.target.value })}
            className="input w-full"
            placeholder="Welcome to our travel platform!"
          />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium">Menu Items</label>
          <button onClick={addMenuItem} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {formData.menuItems.map((item: MenuItem, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                className="input flex-1"
                placeholder="Label"
              />
              <input
                type="text"
                value={item.url}
                onChange={(e) => updateMenuItem(index, 'url', e.target.value)}
                className="input flex-1"
                placeholder="URL"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={item.isExternal}
                  onChange={(e) => updateMenuItem(index, 'isExternal', e.target.checked)}
                />
                External
              </label>
              <button onClick={() => removeMenuItem(index)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={() => onSave(formData)} className="btn btn-primary" disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save Header Settings'}
        </button>
      </div>
    </div>
  );
}

// Footer Settings Component
function FooterSettings({ data, onSave, isSaving }: { data: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    copyrightText: data.copyrightText || '',
    showNewsletter: data.showNewsletter ?? true,
    columns: data.columns || [],
    socialLinks: data.socialLinks || [],
  });

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: '', url: '', icon: '' }],
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Type className="h-5 w-5" />
        Footer Settings
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text</label>
        <input
          type="text"
          value={formData.copyrightText}
          onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
          className="input w-full"
          placeholder="© 2025 Your Company. All rights reserved."
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="font-medium">Newsletter Signup</label>
          <p className="text-sm text-gray-500">Show newsletter subscription form in footer</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, showNewsletter: !formData.showNewsletter })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            formData.showNewsletter ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            formData.showNewsletter ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium">Social Links</label>
          <button onClick={addSocialLink} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Social
          </button>
        </div>
        <div className="space-y-2">
          {formData.socialLinks.map((link: SocialLink, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={link.platform}
                onChange={(e) => {
                  const updated = [...formData.socialLinks];
                  updated[index] = { ...link, platform: e.target.value };
                  setFormData({ ...formData, socialLinks: updated });
                }}
                className="input w-40"
              >
                <option value="">Platform</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
              </select>
              <input
                type="text"
                value={link.url}
                onChange={(e) => {
                  const updated = [...formData.socialLinks];
                  updated[index] = { ...link, url: e.target.value };
                  setFormData({ ...formData, socialLinks: updated });
                }}
                className="input flex-1"
                placeholder="URL"
              />
              <button 
                onClick={() => {
                  setFormData({
                    ...formData,
                    socialLinks: formData.socialLinks.filter((_: any, i: number) => i !== index),
                  });
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={() => onSave(formData)} className="btn btn-primary" disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save Footer Settings'}
        </button>
      </div>
    </div>
  );
}

// Branding Settings Component
function BrandingSettings({ data, onSave, isSaving }: { data: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    primaryColor: data.primaryColor || '#3B82F6',
    secondaryColor: data.secondaryColor || '#1E40AF',
    logo: data.logo || '',
    logoDark: data.logoDark || '',
    favicon: data.favicon || '',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Globe className="h-5 w-5" />
        Branding Settings
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="h-10 w-20 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="input flex-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              className="h-10 w-20 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              className="input flex-1"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          type="text"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          className="input w-full"
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dark Mode Logo URL</label>
        <input
          type="text"
          value={formData.logoDark}
          onChange={(e) => setFormData({ ...formData, logoDark: e.target.value })}
          className="input w-full"
          placeholder="https://example.com/logo-dark.png"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
        <input
          type="text"
          value={formData.favicon}
          onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
          className="input w-full"
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={() => onSave(formData)} className="btn btn-primary" disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save Branding Settings'}
        </button>
      </div>
    </div>
  );
}

// SEO Settings Component
function SeoSettings({ data, onSave, isSaving }: { data: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    defaultTitle: data.defaultTitle || '',
    titleTemplate: data.titleTemplate || '%s | Your Site',
    defaultDescription: data.defaultDescription || '',
    keywords: data.keywords?.join(', ') || '',
    ogImage: data.ogImage || '',
    twitterHandle: data.twitterHandle || '',
  });

  const handleSave = () => {
    onSave({
      ...formData,
      keywords: formData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <SearchIcon className="h-5 w-5" />
        SEO Settings
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Title</label>
        <input
          type="text"
          value={formData.defaultTitle}
          onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
          className="input w-full"
          placeholder="Your Travel Platform"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title Template</label>
        <input
          type="text"
          value={formData.titleTemplate}
          onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
          className="input w-full"
          placeholder="%s | Your Site"
        />
        <p className="text-sm text-gray-500 mt-1">Use %s as placeholder for page title</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Description</label>
        <textarea
          value={formData.defaultDescription}
          onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
          className="input w-full"
          rows={3}
          placeholder="Book flights, hotels, and more..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          className="input w-full"
          placeholder="travel, flights, hotels, booking"
        />
        <p className="text-sm text-gray-500 mt-1">Comma-separated keywords</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
        <input
          type="text"
          value={formData.ogImage}
          onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
          className="input w-full"
          placeholder="https://example.com/og-image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
        <input
          type="text"
          value={formData.twitterHandle}
          onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
          className="input w-full"
          placeholder="@yourhandle"
        />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save SEO Settings'}
        </button>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ data, onSave, isSaving }: { data: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    siteName: data.siteName || '',
    supportEmail: data.supportEmail || '',
    supportPhone: data.supportPhone || '',
    whatsappNumber: data.whatsappNumber || '',
    address: data.address || '',
    timezone: data.timezone || 'Asia/Kathmandu',
    dateFormat: data.dateFormat || 'DD/MM/YYYY',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="h-5 w-5" />
        General Settings
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
        <input
          type="text"
          value={formData.siteName}
          onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
          className="input w-full"
          placeholder="Your Travel Platform"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
          <input
            type="email"
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
            className="input w-full"
            placeholder="support@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
          <input
            type="text"
            value={formData.supportPhone}
            onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
            className="input w-full"
            placeholder="+977-1-1234567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
        <input
          type="text"
          value={formData.whatsappNumber}
          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
          className="input w-full"
          placeholder="+9779812345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="input w-full"
          rows={2}
          placeholder="Your business address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="input w-full"
          >
            <option value="Asia/Kathmandu">Asia/Kathmandu (NPT)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
          <select
            value={formData.dateFormat}
            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
            className="input w-full"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={() => onSave(formData)} className="btn btn-primary" disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save General Settings'}
        </button>
      </div>
    </div>
  );
}
