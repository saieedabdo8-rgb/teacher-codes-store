import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type SettingsMap = Record<string, string>

interface SettingsContextType {
  settings: SettingsMap
  loading: boolean
  getSetting: (key: string, fallback?: string) => string
  updateSetting: (key: string, value: string) => Promise<void>
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const defaults: SettingsMap = {
  app_name: 'أنجز نفسك',
  slogan: 'أكاديمية تعليمية متكاملة',
  homepage_title: 'أنجز نفسك',
  homepage_description: 'اختر المرحلة التعليمية المناسبة لك',
  primary_color: '#2563eb',
  secondary_color: '#7c3aed',
  accent_color: '#f59e0b',
  theme_mode: 'light',
  currency: 'EGP',
  registration_enabled: 'true',
  products_enabled: 'true',
  maintenance_mode: 'false',
  copyright_text: '© 2026 أنجز نفسك. جميع الحقوق محفوظة.',
  meta_title: 'أنجز نفسك',
  meta_description: 'منصة لبيع أكواد التفعيل التعليمية',
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({ ...defaults })
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const map: SettingsMap = { ...defaults }
      for (const row of data) {
        map[row.key] = row.value
      }
      setSettings(map)
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (!loading && settings.primary_color) {
      document.documentElement.style.setProperty('--primary', settings.primary_color)
    }
  }, [loading, settings.primary_color])

  function getSetting(key: string, fallback = ''): string {
    return settings[key] ?? fallback
  }

  async function updateSetting(key: string, value: string) {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, getSetting, updateSetting, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
