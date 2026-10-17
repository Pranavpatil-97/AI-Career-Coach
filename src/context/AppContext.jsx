import { createContext, useContext, useEffect, useState } from 'react'
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
export function AppProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [selected, setSelected] = useState(() => { try { return JSON.parse(sessionStorage.getItem('careerpilot.selectedRepos') || '[]') } catch { return [] } })
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { sessionStorage.setItem('careerpilot.selectedRepos', JSON.stringify(selected)) }, [selected])
  const toggleRepo = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  return <Ctx.Provider value={{ dark, setDark, selected, toggleRepo, setSelected }}>{children}</Ctx.Provider>
}
