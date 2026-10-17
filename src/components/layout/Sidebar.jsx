import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, GitBranch, Sparkles, Target, Activity, Presentation, Settings, Compass, X, PanelLeft, MessageCircle } from 'lucide-react'
export const NAV = [
  ['/', 'Overview', LayoutDashboard], ['/jobs', 'Job Opportunities', Briefcase], ['/repositories', 'My Repositories', GitBranch],
  ['/skills', 'Skill Analysis', Sparkles], ['/gaps', 'Skill Gaps', Target], ['/coach', 'Career Coach', MessageCircle], ['/timeline', 'Change Timeline', Activity],
  ['/demo', 'Demo Center', Presentation], ['/settings', 'Settings', Settings]]
export default function Sidebar({ collapsed, setCollapsed, open, setOpen, github }) {
  return (<>
    {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    <aside aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-white/10 dark:bg-deep ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet text-white"><Compass className="size-5" /></div>
        {!collapsed && <div className="leading-tight"><div className="font-semibold">AI Career Coach</div><div className="text-[10px] tracking-wider text-muted">CAREER INTELLIGENCE</div></div>}
        <button className="ml-auto lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} onClick={() => setOpen(false)}
            className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${isActive ? 'bg-brand/10 font-medium text-brand' : 'text-muted hover:bg-slate-100 dark:hover:bg-white/5'}`}>
            <Icon className="size-[18px] shrink-0 transition-transform group-hover:scale-110" />{!collapsed && label}</NavLink>))}
      </nav>
      <div className="space-y-2 border-t border-slate-200 p-3 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted"><span className={`size-2 rounded-full ${github ? 'bg-ok' : 'bg-slate-400'}`} />{!collapsed && (github ? `GitHub: ${github.login}` : 'GitHub not connected')}</div>
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="hidden rounded-lg p-2 text-muted hover:bg-slate-100 lg:block dark:hover:bg-white/5"><PanelLeft className="size-4" /></button>
      </div>
    </aside></>)
}
