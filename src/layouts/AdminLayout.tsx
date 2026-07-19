import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Moon, Sun, LogOut, LayoutDashboard, GraduationCap, BookOpen, Users, UserSquare2,
  Package, Key, ShoppingCart, Wallet, ChevronRight, PanelRight,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/stages', label: 'المراحل', icon: GraduationCap },
  { href: '/admin/sections', label: 'الأقسام', icon: BookOpen },
  { href: '/admin/subjects', label: 'المواد', icon: Users },
  { href: '/admin/teachers', label: 'المدرسين', icon: UserSquare2 },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/codes', label: 'الأكواد', icon: Key },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/admin/payments', label: 'المدفوعات', icon: Wallet },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" dir="ltr">
      <aside className={cn(
        'bg-card border-l transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )} dir="rtl">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && <span className="font-bold text-lg">لوحة التحكم</span>}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            <PanelRight className={cn('w-4 h-4 transition', collapsed && 'rotate-180')} />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.href
            return (
              <Link key={item.href} to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggle}>
            {theme === 'light' ? <Moon className="w-4 h-4 ml-2" /> : <Sun className="w-4 h-4 ml-2" />}
            {!collapsed && (theme === 'light' ? 'داكن' : 'فاتح')}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/">
              <ChevronRight className="w-4 h-4 ml-2" />
              {!collapsed && 'العودة للمتجر'}
            </Link>
          </Button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className={cn('flex-1 min-w-0', collapsed && 'hidden')}>
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">مدير</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
