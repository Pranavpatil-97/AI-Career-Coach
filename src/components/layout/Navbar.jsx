import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { NAV } from './Sidebar'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
export default function Navbar({ onMenu, github, online }) {
  const { dark, setDark } = useApp(); const { user, signOut } = useAuth(); const { pathname } = useLocation(); const nav = useNavigate()
  const [q, setQ] = useState(''); const [menu, setMenu] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const title = NAV.find(([p]) => p === pathname)?.[1] || 'Overview'
  const go = (e) => { e.preventDefault(); const m = NAV.find(([, l]) => l.toLowerCase().includes(q.trim().toLowerCase())); if (q && m) { nav(m[0]); setQ('') } }
  const handleSignOut = async () => {
    setLogoutError('')
    try { await signOut(); setMenu(false); nav('/login', { replace: true }) }
    catch (error) { setLogoutError(error.message) }
  }
  const accountName = user?.name || user?.email || github?.login || 'Account'
  const btn = 'rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5'
  return (<header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-canvas/80 px-4 backdrop-blur dark:border-white/10 dark:bg-deep/80">
    <button className="lg:hidden" aria-label="Open menu" onClick={onMenu}><Menu className="size-5" /></button>
    <div className="min-w-0"><div className="truncate text-xs text-muted">Career Coach / {title}</div><h1 className="truncate text-base font-semibold">{title}</h1></div>
    <form onSubmit={go} className="relative ml-auto hidden w-64 md:block" role="search">
      <Search className="absolute left-3 top-2.5 size-4 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Jump to page" placeholder="Jump to page…" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/5" /></form>
    <span className="ml-auto flex items-center gap-1.5 text-xs text-muted md:ml-0"><span className={`size-2 rounded-full ${online ? 'bg-ok' : 'bg-bad'}`} /><span className="hidden sm:inline">{online ? 'Backend online' : 'Backend offline'}</span></span>
    <button aria-label="Notifications" className={btn}><Bell className="size-5" /></button>
    <button aria-label="Toggle theme" onClick={() => setDark(!dark)} className={btn}>{dark ? <Sun className="size-5" /> : <Moon className="size-5" />}</button>
    <div className="relative"><button aria-haspopup="menu" aria-expanded={menu} aria-label={`Account: ${accountName}`} onClick={() => { setMenu(!menu); setLogoutError('') }} className="grid size-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-violet text-sm font-semibold text-white">
      {github?.avatarUrl ? <img src={github.avatarUrl} alt="" /> : accountName[0].toUpperCase()}</button>
      {menu && <div role="menu" className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg dark:border-white/10 dark:bg-deep">
        <p className="truncate px-3 py-2 text-xs text-muted">{accountName}</p>
        <button role="menuitem" className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => { nav('/settings'); setMenu(false) }}>Settings</button>
        <button role="menuitem" className="w-full rounded-lg px-3 py-2 text-left text-bad hover:bg-slate-100 dark:hover:bg-white/5" onClick={handleSignOut}>Sign out</button>
        {logoutError && <p role="alert" className="px-3 py-2 text-xs text-bad">{logoutError}</p>}
      </div>}</div>
  </header>)
}
