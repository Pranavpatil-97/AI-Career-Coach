import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApi } from '../../hooks/useApi'
import { getGithubStatus, getHealth } from '../../services/api'
export default function Layout() {
  const [collapsed, setCollapsed] = useState(false); const [open, setOpen] = useState(false)
  const gh = useApi(getGithubStatus); const health = useApi(getHealth)
  const github = gh.data?.connected ? gh.data : null
  return (<div className="min-h-screen">
    <Sidebar {...{ collapsed, setCollapsed, open, setOpen, github }} />
    <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
      <Navbar onMenu={() => setOpen(true)} github={github} online={!health.error && !health.loading} />
      <main className="mx-auto max-w-7xl overflow-x-hidden p-4 sm:p-6"><Outlet /></main></div></div>)
}
