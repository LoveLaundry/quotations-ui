import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, List, PlusCircle, Moon, Sun, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
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
    <div className="min-h-screen bg-transparent text-slate-800 transition-colors dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[24px] border border-stone-200/80 bg-white/90 px-4 py-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.2)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-2">
                <img src={logo} alt="LoveLaundry logo" className="h-8 w-8 rounded-xl object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">LoveLaundry</p>
                <h1 className="text-[1rem] font-semibold tracking-tight">Quotation Studio</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-sm text-slate-500 sm:flex dark:border-slate-800 dark:bg-slate-900/80">
                <Search className="h-4 w-4" />
                <span>Quick create</span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Quote
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader className="space-y-2">
                    <DialogTitle>Create a quotation</DialogTitle>
                    <p className="text-sm leading-6 text-slate-500">
                      Start a fresh client-ready quotation with item details, options, and pricing.
                    </p>
                  </DialogHeader>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-slate-600">
                    This opens the quotation form where you can add services, sizes, and pricing options.
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => navigate('/quotations/new')}>Continue</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <aside className="w-full rounded-[24px] border border-stone-200/80 bg-white/80 p-3 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:w-64">
            <nav className="flex gap-2 lg:flex-col">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-700' : 'text-slate-600 hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-slate-800/70',
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
