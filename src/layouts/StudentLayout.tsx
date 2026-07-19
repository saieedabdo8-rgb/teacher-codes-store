import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Button } from '@/components/ui/button'
import { Moon, Sun, LogOut, ShoppingBag, User, Home } from 'lucide-react'

export default function StudentLayout() {
  const { profile, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { getSetting } = useSettings()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">{getSetting('app_name')}</Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="w-4 h-4 ml-1" />الرئيسية</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/purchases"><ShoppingBag className="w-4 h-4 ml-1" />مشترياتي</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={toggle}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile"><User className="w-4 h-4 ml-1" />{profile?.full_name}</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
