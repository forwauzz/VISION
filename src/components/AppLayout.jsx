/**
 * App layout with left sidebar navigation.
 * Matches stitch_device_management sidebar pattern.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuth, clearAuth } from '../lib/auth.js'

const AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcga_wSdkRQTchXdjuyfVOc8J-ygzwH1sqf79dzyrncUtdKPfxtG4M-MZEZQzEtacZEZBHrsa_YNhM4Tt_W2bUXovl0XpeIdLEyA04r899Aaq915I9a7ImM5b1p7e9YPyxKtXB6IfizGQ5MfcjmfKXJBIJ3l-QHn3p1u4bh1423TqAIn5lqBuxWK_cWjhfNqj7oK6dcJ5U9uKYNN7jL4MtUfyMZc5juIrf0LGxj-THyz6glkG25VbtPnXOMrmC2Wcm3bvR1rMZkmI'

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/devices', icon: 'devices', label: 'Devices' },
  { path: '/establishment-selector', icon: 'storefront', label: 'Establishments' },
  { path: '/upload-video', icon: 'upload_file', label: 'Upload Video' },
]

export default function AppLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = getAuth()
  const displayName = auth?.displayName ?? 'User'

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex font-display selection:bg-primary/30">
      <aside className="w-64 border-r border-primary/10 bg-surface-dark flex flex-col fixed h-full z-40 shrink-0">
        <Link to="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-background-dark font-bold">visibility</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Vision</h1>
            <p className="text-xs text-primary uppercase tracking-widest font-semibold">Healthcare SaaS</p>
          </div>
        </Link>
        <nav className="flex-1 mt-6 px-3 space-y-1">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <Link
                key={path + label}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary border-r-[3px] border-primary -mr-[3px] rounded-r-none'
                    : 'text-slate-400 hover:text-primary hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-primary/10">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5 border border-primary/10">
            <img
              alt="User avatar"
              className="size-10 rounded-full object-cover border border-primary/20"
              src={AVATAR_URL}
            />
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
            title="Log out"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
