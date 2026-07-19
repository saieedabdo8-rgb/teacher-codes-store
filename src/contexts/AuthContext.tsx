import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
}

interface AuthContextType extends AuthState {
  signIn: (phone: string, password: string) => Promise<{ error: string | null; role: string | null }>
  signUp: (fullName: string, phone: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
  })

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadProfile(session.user)
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    }
    restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user)
      } else {
        setState({ user: null, profile: null, loading: false, isAdmin: false })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  function roleFromMeta(user: User): 'student' | 'admin' {
    const r = (user.user_metadata as any)?.role
    return r === 'admin' ? 'admin' : 'student'
  }

  function buildProfile(user: User): Profile {
    const meta = (user.user_metadata ?? {}) as any
    return {
      id: user.id,
      full_name: meta.full_name ?? '',
      phone: meta.phone ?? '',
      role: roleFromMeta(user),
      created_at: user.created_at,
    }
  }

  async function loadProfile(user: User) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    const profile = (error ? null : data) as Profile | null
    setState({
      user,
      profile: profile ?? buildProfile(user),
      loading: false,
      isAdmin: profile?.role === 'admin' || roleFromMeta(user) === 'admin',
    })
  }

  async function signIn(phone: string, password: string): Promise<{ error: string | null; role: string | null }> {
    const email = `${phone}@student.local`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message, role: null }
    if (data.user) {
      let role: string | null = null
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      role = (profile as any)?.role ?? roleFromMeta(data.user)
      await loadProfile(data.user)
      return { error: null, role }
    }
    return { error: null, role: null }
  }

  async function signUp(fullName: string, phone: string, password: string): Promise<string | null> {
    const email = `${phone}@student.local`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role: 'student' },
      },
    })
    if (error) return error.message
    if (data.session) {
      if (data.user) {
        await loadProfile(data.user)
      }
      return null
    }
    return 'يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول'
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
