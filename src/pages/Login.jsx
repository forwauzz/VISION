/**
 * Vision Login — derived from stitch-extracted/stitch/login_screen_(desktop)_-_v1/code.html
 * Phase 4: simulated auth only; mockLogin stores user (establishments empty; user adds via selector).
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { mockLogin } from '../lib/auth.js'
import GoldenVLoading from '../components/GoldenVLoading.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const form = e.target
    setIsSubmitting(true)
    // Brief delay so user sees loading state (simulated auth)
    setTimeout(() => {
      const result = mockLogin(form.email.value, form.password.value)
      if (!result.ok) {
        setError(result.error || 'Login failed')
        setIsSubmitting(false)
        return
      }
      navigate(result.redirect === 'dashboard' ? '/dashboard' : '/establishment-selector', { replace: true })
    }, 400)
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display flex items-center justify-center min-h-screen overflow-hidden">
      {isSubmitting && (
        <GoldenVLoading
          message="Signing you in…"
          subMessage="Verifying your credentials and loading your workspace."
        />
      )}
      {/* Background — Stitch */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl text-white tracking-widest mb-2 italic">Vision</h1>
          <div className="logo-underline" />
          <p className="mt-4 text-primary/60 text-[10px] uppercase tracking-[0.3em] font-medium">Surgical Intelligence Portal</p>
        </div>

        <div className="bg-matte-charcoal/80 backdrop-blur-md border border-primary/20 rounded-xl p-8 gold-glow">
          <div className="mb-8">
            <h2 className="text-white text-lg font-light tracking-tight">Private Access</h2>
            <p className="text-white/40 text-xs mt-1">Authorized Medical Personnel Only</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-widest text-primary/80 font-semibold ml-1" htmlFor="email">Email Identifier</label>
              <input
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-4 px-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-white/10"
                id="email"
                name="email"
                placeholder="name@surgical.vision"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[11px] uppercase tracking-widest text-primary/80 font-semibold" htmlFor="password">Security Key</label>
                <a className="text-[10px] text-white/30 hover:text-primary transition-colors uppercase tracking-tighter" href="#">Forgot?</a>
              </div>
              <div className="relative flex items-center">
                <input
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-4 px-4 pr-12 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-white/10"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <button type="button" className="absolute right-4 text-white/20 hover:text-primary transition-colors" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                  <span className="material-symbols-outlined text-sm select-none" aria-hidden>visibility</span>
                </button>
              </div>
            </div>
            {error && <p className="text-red-400/90 text-xs" role="alert">{error}</p>}
            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-xs uppercase tracking-[0.2em] py-5 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/10 mt-4">
              Enter Vision
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-white/30 text-[11px]">New to the platform?</p>
            <button type="button" className="mt-2 text-primary/80 hover:text-primary text-xs font-medium uppercase tracking-widest transition-colors">
              Request Credentials
            </button>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center px-2">
          <div className="flex gap-4 items-center">
            <Link to="/" className="text-[9px] text-white/30 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to home
            </Link>
            <a className="text-[9px] text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors" href="#">Privacy</a>
            <a className="text-[9px] text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors" href="#">Security</a>
          </div>
          <p className="text-[9px] text-white/10 uppercase tracking-[0.2em]">© 2024 Vision Surgical Systems</p>
        </div>
      </div>

      <div className="fixed top-8 left-8 hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-white/20 uppercase tracking-[0.3em]">System Secure</span>
        </div>
      </div>
      <div className="fixed bottom-8 right-8 hidden lg:block">
        <div className="text-right">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-1">Node Status</p>
          <div className="flex gap-1 justify-end">
            <div className="w-4 h-[2px] bg-primary/40" />
            <div className="w-4 h-[2px] bg-primary/40" />
            <div className="w-4 h-[2px] bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}
