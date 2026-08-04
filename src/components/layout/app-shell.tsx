import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, List, PlusCircle, Moon, Sun, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import logo from '../../assets/icon.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/quotations', label: 'Quotations', icon: List },
]

export function AppShell() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as 'light' | 'dark' | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const resolved = stored ?? system
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        navigate('/quotations/new')
      }
      if (event.key === 'Escape') {
        navigate('/quotations')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.16),_transparent_24%),linear-gradient(135deg,_#fff8fa_0%,_#fffdfd_45%,_#f7f5f2_100%)] text-slate-800 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.22),_transparent_26%),linear-gradient(135deg,_#05070d_0%,_#121827_45%,_#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[32px] border border-rose-100/80 bg-white/80 px-4 py-3 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-2 shadow-[0_10px_30px_-12px_rgba(225,29,72,0.35)]">
                <img src={logo} alt="LoveLaundry logo" className="h-9 w-9 rounded-xl object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-600">LoveLaundry</p>
                <h1 className="text-xl font-semibold tracking-tight">Quotation Studio</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-rose-100/80 bg-white/75 px-3 py-2 text-sm text-slate-500 shadow-sm sm:flex dark:border-slate-800 dark:bg-slate-900/80">
                <Search className="h-4 w-4" />
                <span>Ctrl+N to create</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/quotations/new')}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Quote
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <aside className="w-full rounded-[32px] border border-rose-100/70 bg-white/70 p-3 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 lg:w-64">
            <nav className="flex gap-2 lg:flex-col">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
