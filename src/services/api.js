import axios from 'axios'
const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const api = axios.create({ baseURL: base, timeout: 30000, withCredentials: true })
const get = (u) => api.get(u).then((r) => r.data)
const post = (u, b) => api.post(u, b).then((r) => r.data)
export const getRepos = () => get('/github/repositories')
export const getGithubStatus = () => get('/github/status')
export const getJobs = () => get('/jobs')
export const addJobUrl = (url) => post('/jobs', { url })
export const analyzeJob = (id) => post(`/jobs/${id}/analyze`, {})
export const analyzeRepos = async (ids) => {
  await post('/github/repositories/select', { repositoryIds: ids })
  return post('/analysis/run', { repositoryIds: ids })
}
export const getSkills = () => get('/skills/evidence')
export const getChanges = () => get('/changes')
export const getHealth = () => get('/health')
export const getDemo = () => get('/demo')
export const getSummary = () => get('/summary')
export const disconnectGithub = () => post('/github/disconnect', {})
export const connectGithub = (username = '', returnTo = '') => {
  const params = new URLSearchParams()
  if (username.trim()) params.set('login', username.trim())
  if (returnTo) params.set('returnTo', returnTo)
  const query = params.toString()
  window.location.href = `${base}/auth/github${query ? `?${query}` : ''}`
}
export const fetchJobs = (search) => post('/jobs/fetch', { search })
export const getGaps = () => get('/jobs/gaps')
export const askCareerCoach = (message) => post('/ai/coach', { message })