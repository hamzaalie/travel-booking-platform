import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import {
  Settings, Menu, Type, Globe, Search as SearchIcon, Save, Plus, Trash2,
  ChevronDown, ChevronUp, GripVertical, Link as LinkIcon, Phone, Mail, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  isExternal?: boolean;
}

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  url: string;
}

interface BottomLink {
  label: string;
  href: string;
}

export default function SettingsManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'branding' | 'seo' | 'general'>('header');

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
        header: header.data || {},
        footer: footer.data || {},
        branding: branding.data || {},
        seo: seo.data || {},
        general: general.data || {},
      };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      switch (type) {
        case 'header': return settingsApi.updateHeader(data);
        case 'footer': return settingsApi.updateFooter(data);
        case 'branding': return settingsApi.updateBranding(data);
        case 'seo': return settingsApi.updateSeo(data);
        case 'general': return settingsApi.updateGeneral(data);
        default: throw new Error('Invalid settings type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-header-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-footer-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-general-settings'] });
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-950"></div>
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage header, footer, branding, and SEO settings</p>
      </div>

      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-950 text-primary-950'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

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

/* ============================================
   HEADER SETTINGS
   ============================================ */
function HeaderSettings({ data, onSave, isSaving }: { data: any; onSave: (d: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    logo: data.logo || '',
    showTopBar: data.showTopBar ?? true,
    topBarContent: data.topBarContent || data.topBarMessage || '',
    phoneNumber: data.phoneNumber || '',
    email: data.email || '',
    navigationItems: (data.navigationItems || data.menuItems || []).map((item: any) => ({
      label: item.label || '',
      href: item.href || item.url || '',
      icon: item.icon || '',
      isExternal: item.isExternal || false,
    })),
  });

  const addNavItem = () => {
    setFormData({
      ...formData,
      navigationItems: [...formData.navigationItems, { label: '', href: '/', icon: '', isExternal: false }],
    });
  };

  const updateNavItem = (index: number, field: string, value: any) => {
    const updated = [...formData.navigationItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, navigationItems: updated });
  };

  const removeNavItem = (index: number) => {
    setFormData({
      ...formData,
      navigationItems: formData.navigationItems.filter((_: any, i: number) => i !== index),
    });
  };

  const moveNavItem = (index: number, direction: 'up' | 'down') => {
    const items = [...formData.navigationItems];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setFormData({ ...formData, navigationItems: items });
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
          placeholder="/images/logo.png or https://..."
        />
        {formData.logo && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-block">
            <img src={formData.logo} alt="Logo preview" className="h-12 w-auto" onError={(e) => { (e.target as any).style.display = 'none'; }} />
          </div>
        )}
      </div>

      {/* Top Bar Settings */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Top Bar</label>
            <p className="text-sm text-gray-500">Show announcement bar above header</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, showTopBar: !formData.showTopBar })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.showTopBar ? 'bg-primary-950' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              formData.showTopBar ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {formData.showTopBar && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Top Bar Message</label>
            <input
              type="text"
              value={formData.topBarContent}
              onChange={(e) => setFormData({ ...formData, topBarContent: e.target.value })}
              className="input w-full"
              placeholder="24/7 Customer Support"
            />
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="h-4 w-4 inline mr-1" />Phone Number
          </label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="input w-full"
            placeholder="+977 1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="h-4 w-4 inline mr-1" />Email
          </label>
          <input
            type="text"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input w-full"
            placeholder="support@example.com"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <label className="font-medium">Navigation Items</label>
            <p className="text-sm text-gray-500">Menu items displayed in the header</p>
          </div>
          <button onClick={addNavItem} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {formData.navigationItems.map((item: NavItem, index: number) => (
            <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveNavItem(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveNavItem(index, 'down')}
                  disabled={index === formData.navigationItems.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                className="input flex-1"
                placeholder="Label"
              />
              <input
                type="text"
                value={item.href}
                onChange={(e) => updateNavItem(index, 'href', e.target.value)}
                className="input flex-1"
                placeholder="/path or URL"
              />
              <select
                value={item.icon || ''}
                onChange={(e) => updateNavItem(index, 'icon', e.target.value)}
                className="input w-28"
              >
                <option value="">Icon</option>
                <option value="home">Home</option>
                <option value="flights">Flights</option>
                <option value="hotels">Hotels</option>
                <option value="cars">Cars</option>
                <option value="esim">eSIM</option>
                <option value="search">Search</option>
                <option value="briefcase">Briefcase</option>
              </select>
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={item.isExternal || false}
                  onChange={(e) => updateNavItem(index, 'isExternal', e.target.checked)}
                />
                External
              </label>
              <button onClick={() => removeNavItem(index)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {formData.navigationItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No navigation items. Click "Add Item" to create one.</p>
          )}
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

/* ============================================
   FOOTER SETTINGS
   ============================================ */
function FooterSettings({ data, onSave, isSaving }: { data: any; onSave: (d: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    copyrightText: data.copyrightText || '',
    poweredByText: data.poweredByText || '',
    showNewsletter: data.showNewsletter ?? true,
    newsletterTitle: data.newsletterTitle || 'Subscribe to our newsletter',
    newsletterDescription: data.newsletterDescription || 'Get exclusive deals and travel tips delivered to your inbox.',
    columns: (data.columns || []) as FooterColumn[],
    socialLinks: (data.socialLinks || []) as SocialLink[],
    bottomLinks: (data.bottomLinks || []) as BottomLink[],
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
  });

  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);

  // --- Column management ---
  const addColumn = () => {
    setFormData({
      ...formData,
      columns: [...formData.columns, { title: 'New Column', links: [] }],
    });
    setExpandedColumn(formData.columns.length);
  };

  const updateColumnTitle = (colIdx: number, title: string) => {
    const cols = [...formData.columns];
    cols[colIdx] = { ...cols[colIdx], title };
    setFormData({ ...formData, columns: cols });
  };

  const removeColumn = (colIdx: number) => {
    setFormData({
      ...formData,
      columns: formData.columns.filter((_: any, i: number) => i !== colIdx),
    });
    if (expandedColumn === colIdx) setExpandedColumn(null);
  };

  const moveColumn = (colIdx: number, direction: 'up' | 'down') => {
    const cols = [...formData.columns];
    const target = direction === 'up' ? colIdx - 1 : colIdx + 1;
    if (target < 0 || target >= cols.length) return;
    [cols[colIdx], cols[target]] = [cols[target], cols[colIdx]];
    setFormData({ ...formData, columns: cols });
    setExpandedColumn(target);
  };

  // --- Link management within columns ---
  const addLinkToColumn = (colIdx: number) => {
    const cols = [...formData.columns];
    cols[colIdx] = {
      ...cols[colIdx],
      links: [...cols[colIdx].links, { label: '', href: '/', isExternal: false }],
    };
    setFormData({ ...formData, columns: cols });
  };

  const updateLinkInColumn = (colIdx: number, linkIdx: number, field: string, value: any) => {
    const cols = [...formData.columns];
    const links = [...cols[colIdx].links];
    links[linkIdx] = { ...links[linkIdx], [field]: value };
    cols[colIdx] = { ...cols[colIdx], links };
    setFormData({ ...formData, columns: cols });
  };

  const removeLinkFromColumn = (colIdx: number, linkIdx: number) => {
    const cols = [...formData.columns];
    cols[colIdx] = {
      ...cols[colIdx],
      links: cols[colIdx].links.filter((_: any, i: number) => i !== linkIdx),
    };
    setFormData({ ...formData, columns: cols });
  };

  // --- Social links ---
  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: 'facebook', url: '' }],
    });
  };

  const updateSocialLink = (idx: number, field: string, value: string) => {
    const links = [...formData.socialLinks];
    links[idx] = { ...links[idx], [field]: value };
    setFormData({ ...formData, socialLinks: links });
  };

  const removeSocialLink = (idx: number) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter((_: any, i: number) => i !== idx),
    });
  };

  // --- Bottom links ---
  const addBottomLink = () => {
    setFormData({
      ...formData,
      bottomLinks: [...formData.bottomLinks, { label: '', href: '/' }],
    });
  };

  const updateBottomLink = (idx: number, field: string, value: string) => {
    const links = [...formData.bottomLinks];
    links[idx] = { ...links[idx], [field]: value };
    setFormData({ ...formData, bottomLinks: links });
  };

  const removeBottomLink = (idx: number) => {
    setFormData({
      ...formData,
      bottomLinks: formData.bottomLinks.filter((_: any, i: number) => i !== idx),
    });
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Type className="h-5 w-5" />
        Footer Settings
      </h3>

      {/* Copyright & Powered By */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text</label>
          <input
            type="text"
            value={formData.copyrightText}
            onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
            className="input w-full"
            placeholder="&copy; 2025 Your Company. All rights reserved."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Powered By Text</label>
          <input
            type="text"
            value={formData.poweredByText}
            onChange={(e) => setFormData({ ...formData, poweredByText: e.target.value })}
            className="input w-full"
            placeholder="Powered by Amadeus GDS"
          />
        </div>
      </div>

      {/* Newsletter Settings */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Newsletter Signup</label>
            <p className="text-sm text-gray-500">Show newsletter subscription in footer</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, showNewsletter: !formData.showNewsletter })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.showNewsletter ? 'bg-primary-950' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              formData.showNewsletter ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        {formData.showNewsletter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Newsletter Title</label>
              <input
                type="text"
                value={formData.newsletterTitle}
                onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
                className="input w-full"
                placeholder="Subscribe to our newsletter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Newsletter Description</label>
              <input
                type="text"
                value={formData.newsletterDescription}
                onChange={(e) => setFormData({ ...formData, newsletterDescription: e.target.value })}
                className="input w-full"
                placeholder="Get exclusive deals"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Columns */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <label className="font-medium text-base">Footer Columns</label>
            <p className="text-sm text-gray-500">Manage link columns displayed in the footer</p>
          </div>
          <button onClick={addColumn} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Column
          </button>
        </div>
        <div className="space-y-3">
          {formData.columns.map((column: FooterColumn, colIdx: number) => (
            <div key={colIdx} className="border rounded-lg overflow-hidden">
              {/* Column header */}
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveColumn(colIdx, 'up')} disabled={colIdx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => moveColumn(colIdx, 'down')} disabled={colIdx === formData.columns.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                  className="input flex-1 text-sm font-medium"
                  placeholder="Column Title"
                />
                <span className="text-xs text-gray-400">{column.links.length} links</span>
                <button
                  onClick={() => setExpandedColumn(expandedColumn === colIdx ? null : colIdx)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  {expandedColumn === colIdx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button onClick={() => removeColumn(colIdx)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Column links (expanded) */}
              {expandedColumn === colIdx && (
                <div className="px-4 py-3 bg-white space-y-2">
                  {column.links.map((link: FooterLink, linkIdx: number) => (
                    <div key={linkIdx} className="flex gap-2 items-center">
                      <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLinkInColumn(colIdx, linkIdx, 'label', e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="Link label"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => updateLinkInColumn(colIdx, linkIdx, 'href', e.target.value)}
                        className="input flex-1 text-sm"
                        placeholder="/path or URL"
                      />
                      <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={link.isExternal || false}
                          onChange={(e) => updateLinkInColumn(colIdx, linkIdx, 'isExternal', e.target.checked)}
                        />
                        Ext
                      </label>
                      <button onClick={() => removeLinkFromColumn(colIdx, linkIdx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addLinkToColumn(colIdx)}
                    className="text-sm text-primary-950 hover:text-primary-800 flex items-center gap-1 pt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Link
                  </button>
                </div>
              )}
            </div>
          ))}
          {formData.columns.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No footer columns. Click "Add Column" to create one.</p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div>
        <label className="font-medium text-base mb-3 block">Contact Information</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="h-4 w-4 inline mr-1" />Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input w-full"
              placeholder="+977 1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4 inline mr-1" />Email
            </label>
            <input
              type="text"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input w-full"
              placeholder="support@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input w-full"
              placeholder="Kathmandu, Nepal"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="font-medium">Social Links</label>
          <button onClick={addSocialLink} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Social
          </button>
        </div>
        <div className="space-y-2">
          {formData.socialLinks.map((link: SocialLink, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                value={link.platform}
                onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                className="input w-full sm:w-40"
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
                onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                className="input flex-1"
                placeholder="https://facebook.com/..."
              />
              <button onClick={() => removeSocialLink(idx)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {formData.socialLinks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No social links added.</p>
          )}
        </div>
      </div>

      {/* Bottom Links */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <label className="font-medium">Bottom Bar Links</label>
            <p className="text-sm text-gray-500">Links shown in the copyright bar</p>
          </div>
          <button onClick={addBottomLink} className="btn btn-sm btn-secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Link
          </button>
        </div>
        <div className="space-y-2">
          {formData.bottomLinks.map((link: BottomLink, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateBottomLink(idx, 'label', e.target.value)}
                className="input flex-1"
                placeholder="Label"
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => updateBottomLink(idx, 'href', e.target.value)}
                className="input flex-1"
                placeholder="/privacy-policy"
              />
              <button onClick={() => removeBottomLink(idx)} className="text-red-500 hover:text-red-700 p-1">
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

/* ============================================
   BRANDING SETTINGS
   ============================================ */
function BrandingSettings({ data, onSave, isSaving }: { data: any; onSave: (d: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    primaryColor: data.primaryColor || '#05014A',
    secondaryColor: data.secondaryColor || '#F48C1B',
    accentColor: data.accentColor || '#f59e0b',
    logo: data.logo || data.logoUrl || '',
    logoDark: data.logoDark || '',
    favicon: data.favicon || data.faviconUrl || '',
    fontFamily: data.fontFamily || 'Inter, sans-serif',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Globe className="h-5 w-5" />
        Branding Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'primaryColor', label: 'Primary Color' },
          { key: 'secondaryColor', label: 'Secondary Color' },
          { key: 'accentColor', label: 'Accent Color' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={(formData as any)[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="h-10 w-16 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={(formData as any)[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="input flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Light)</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className="input w-full"
            placeholder="/images/logo.png"
          />
          {formData.logo && (
            <div className="mt-2 p-2 bg-gray-50 rounded inline-block">
              <img src={formData.logo} alt="Logo" className="h-10 w-auto" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Dark / Footer)</label>
          <input
            type="text"
            value={formData.logoDark}
            onChange={(e) => setFormData({ ...formData, logoDark: e.target.value })}
            className="input w-full"
            placeholder="/images/logo-dark.png"
          />
          {formData.logoDark && (
            <div className="mt-2 p-2 bg-gray-800 rounded inline-block">
              <img src={formData.logoDark} alt="Dark Logo" className="h-10 w-auto" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
          <input
            type="text"
            value={formData.favicon}
            onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
            className="input w-full"
            placeholder="/favicon.ico"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
          <input
            type="text"
            value={formData.fontFamily}
            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
            className="input w-full"
            placeholder="Inter, sans-serif"
          />
        </div>
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

/* ============================================
   SEO SETTINGS
   ============================================ */
function SeoSettings({ data, onSave, isSaving }: { data: any; onSave: (d: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    defaultTitle: data.defaultTitle || '',
    titleSuffix: data.titleSuffix || data.titleTemplate || '',
    defaultDescription: data.defaultDescription || '',
    keywords: Array.isArray(data.defaultKeywords || data.keywords)
      ? (data.defaultKeywords || data.keywords).join(', ')
      : (data.defaultKeywords || data.keywords || ''),
    ogImage: data.ogImage || '',
    twitterHandle: data.twitterHandle || '',
    googleAnalyticsId: data.googleAnalyticsId || '',
    googleTagManagerId: data.googleTagManagerId || '',
    facebookPixelId: data.facebookPixelId || '',
  });

  const handleSave = () => {
    onSave({
      ...formData,
      defaultKeywords: formData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <SearchIcon className="h-5 w-5" />
        SEO Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Title Suffix</label>
          <input
            type="text"
            value={formData.titleSuffix}
            onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
            className="input w-full"
            placeholder=" | Peakpass Travel"
          />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Analytics & Tracking</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
            <input
              type="text"
              value={formData.googleAnalyticsId}
              onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
              className="input w-full"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Tag Manager ID</label>
            <input
              type="text"
              value={formData.googleTagManagerId}
              onChange={(e) => setFormData({ ...formData, googleTagManagerId: e.target.value })}
              className="input w-full"
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
            <input
              type="text"
              value={formData.facebookPixelId}
              onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
              className="input w-full"
              placeholder="XXXXXXXXXXXXXXXX"
            />
          </div>
        </div>
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

/* ============================================
   GENERAL SETTINGS
   ============================================ */
function GeneralSettings({ data, onSave, isSaving }: { data: any; onSave: (d: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    siteName: data.siteName || '',
    siteDescription: data.siteDescription || '',
    supportEmail: data.supportEmail || data.contactEmail || '',
    supportPhone: data.supportPhone || '',
    whatsappNumber: data.whatsappNumber || '',
    address: data.address || '',
    defaultCurrency: data.defaultCurrency || 'NPR',
    timezone: data.timezone || 'Asia/Kathmandu',
    dateFormat: data.dateFormat || 'DD/MM/YYYY',
    maintenanceMode: data.maintenanceMode || false,
    maintenanceMessage: data.maintenanceMessage || '',
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="h-5 w-5" />
        General Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
          <input
            type="text"
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            className="input w-full"
            placeholder="Peakpass Travel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
          <input
            type="text"
            value={formData.siteDescription}
            onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
            className="input w-full"
            placeholder="Your Journey Starts Here"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            placeholder="+977 1234567890"
          />
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="input w-full"
          rows={2}
          placeholder="Kathmandu, Nepal"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
          <select
            value={formData.defaultCurrency}
            onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
            className="input w-full"
          >
            <option value="NPR">NPR - Nepalese Rupee</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
          </select>
        </div>
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
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
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

      {/* Maintenance Mode */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-yellow-800">Maintenance Mode</label>
            <p className="text-sm text-yellow-600">When enabled, visitors will see a maintenance page</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              formData.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        {formData.maintenanceMode && (
          <div>
            <label className="block text-sm font-medium text-yellow-800 mb-1">Maintenance Message</label>
            <textarea
              value={formData.maintenanceMessage}
              onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="We are currently performing scheduled maintenance..."
            />
          </div>
        )}
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
