import { useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

const sections = [
  { id: 'general', label: 'عام' },
  { id: 'branding', label: 'المظهر' },
  { id: 'support', label: 'الدعم' },
  { id: 'social', label: 'التواصل الاجتماعي' },
  { id: 'homepage', label: 'الصفحة الرئيسية' },
  { id: 'footer', label: 'التذييل' },
  { id: 'seo', label: 'تحسين محركات البحث' },
  { id: 'system', label: 'النظام' },
]

const fields: Record<string, { key: string; label: string; type: 'text' | 'color' | 'textarea' | 'number' | 'boolean' }[]> = {
  general: [
    { key: 'app_name', label: 'اسم التطبيق', type: 'text' },
    { key: 'logo', label: 'رابط الشعار', type: 'text' },
    { key: 'favicon', label: 'رابط الأيقونة', type: 'text' },
    { key: 'slogan', label: 'الشعار النصي', type: 'text' },
    { key: 'homepage_title', label: 'عنوان الصفحة الرئيسية', type: 'text' },
    { key: 'homepage_description', label: 'وصف الصفحة الرئيسية', type: 'textarea' },
  ],
  branding: [
    { key: 'primary_color', label: 'اللون الأساسي', type: 'color' },
    { key: 'secondary_color', label: 'اللون الثانوي', type: 'color' },
    { key: 'accent_color', label: 'لون التمييز', type: 'color' },
  ],
  support: [
    { key: 'whatsapp', label: 'رقم واتساب', type: 'text' },
    { key: 'phone', label: 'رقم الهاتف', type: 'text' },
    { key: 'support_email', label: 'البريد الإلكتروني', type: 'text' },
    { key: 'business_hours', label: 'ساعات العمل', type: 'text' },
  ],
  social: [
    { key: 'facebook_url', label: 'فيسبوك', type: 'text' },
    { key: 'instagram_url', label: 'إنستغرام', type: 'text' },
    { key: 'telegram_url', label: 'تيليغرام', type: 'text' },
    { key: 'youtube_url', label: 'يوتيوب', type: 'text' },
    { key: 'tiktok_url', label: 'تيك توك', type: 'text' },
    { key: 'website_url', label: 'الموقع الإلكتروني', type: 'text' },
  ],
  homepage: [
    { key: 'hero_title', label: 'عنوان الشريط الرئيسي', type: 'text' },
    { key: 'hero_subtitle', label: 'العنوان الفرعي', type: 'text' },
    { key: 'hero_image', label: 'صورة الشريط', type: 'text' },
    { key: 'promo_banner', label: 'لافتة ترويجية', type: 'textarea' },
  ],
  footer: [
    { key: 'copyright_text', label: 'نص حقوق النشر', type: 'text' },
    { key: 'about_us', label: 'عن الموقع', type: 'textarea' },
    { key: 'contact_us', label: 'اتصل بنا', type: 'textarea' },
    { key: 'privacy_policy', label: 'سياسة الخصوصية', type: 'textarea' },
    { key: 'terms_conditions', label: 'الشروط والأحكام', type: 'textarea' },
  ],
  seo: [
    { key: 'meta_title', label: 'العنوان الافتراضي', type: 'text' },
    { key: 'meta_description', label: 'الوصف الافتراضي', type: 'textarea' },
    { key: 'og_image', label: 'صورة المشاركة', type: 'text' },
  ],
  system: [
    { key: 'maintenance_mode', label: 'وضع الصيانة', type: 'boolean' },
    { key: 'registration_enabled', label: 'فتح التسجيل', type: 'boolean' },
    { key: 'products_enabled', label: 'تفعيل المنتجات', type: 'boolean' },
    { key: 'currency', label: 'العملة', type: 'text' },
  ],
}

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const [tab, setTab] = useState('general')
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  async function handleSave(key: string, value: string) {
    setSaving(prev => ({ ...prev, [key]: true }))
    await updateSetting(key, value)
    setSaving(prev => ({ ...prev, [key]: false }))
    toast.success('تم الحفظ')
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">إعدادات الموقع</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto mb-6">
          {sections.map(s => (
            <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>
          ))}
        </TabsList>

        {sections.map(section => (
          <TabsContent key={section.id} value={section.id}>
            <div className="space-y-4">
              {fields[section.id].map(field => (
                <Card key={field.key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{field.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSave(field.key, settings[field.key] === 'true' ? 'false' : 'true')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[field.key] === 'true' ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[field.key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-sm text-muted-foreground">
                          {settings[field.key] === 'true' ? 'مفعل' : 'معطل'}
                        </span>
                      </div>
                    ) : field.type === 'color' ? (
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={settings[field.key] || '#000000'}
                          onChange={e => handleSave(field.key, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border"
                        />
                        <Input
                          value={settings[field.key] || ''}
                          onChange={e => handleSave(field.key, e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <div className="flex gap-3 items-start">
                        <Textarea
                          value={settings[field.key] || ''}
                          onChange={e => handleSave(field.key, e.target.value)}
                          className="min-h-[80px]"
                        />
                        {saving[field.key] && <span className="text-xs text-muted-foreground shrink-0 mt-2">جاري الحفظ...</span>}
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <Input
                          value={settings[field.key] || ''}
                          onChange={e => handleSave(field.key, e.target.value)}
                        />
                        {saving[field.key] && <span className="text-xs text-muted-foreground shrink-0">جاري الحفظ...</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
