/**
 * Vision Establishment Selector — establishments from auth (user-added; no mock data).
 * Empty state: Add your first establishment. Otherwise: grid + Add New Establishment (functional).
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAuth, setActiveEstablishment, addEstablishment } from '../lib/auth.js'

const CARD_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80'

export default function EstablishmentSelector() {
  const navigate = useNavigate()
  const auth = getAuth()
  const establishments = auth?.establishments ?? []
  const [showAddForm, setShowAddForm] = useState(establishments.length === 0)
  const [addName, setAddName] = useState('')
  const [addType, setAddType] = useState('')
  const [addLocation, setAddLocation] = useState('')
  const [addError, setAddError] = useState('')

  function handleAddSubmit(e) {
    e.preventDefault()
    setAddError('')
    const est = addEstablishment({ name: addName, type: addType || undefined, location: addLocation || undefined })
    if (!est) {
      setAddError('Name is required.')
      return
    }
    setActiveEstablishment(est.id)
    setAddName('')
    setAddType('')
    setAddLocation('')
    setShowAddForm(false)
    navigate('/dashboard')
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-white font-display overflow-x-hidden min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-4 bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                <span className="material-symbols-outlined text-3xl select-none" aria-hidden>visibility</span>
              </div>
              <h2 className="text-xl font-light tracking-[0.2em] uppercase">Vision</h2>
            </div>
            {establishments.length > 0 && (
              <Link to="/dashboard" className="text-sm font-medium text-white/60 hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">dashboard</span>
                Dashboard
              </Link>
            )}
          </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-3">
            <button type="button" className="flex size-10 items-center justify-center rounded-lg bg-neutral-charcoal text-white/70 hover:text-primary hover:bg-neutral-charcoal/80 transition-colors border border-white/5">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button type="button" className="flex size-10 items-center justify-center rounded-lg bg-neutral-charcoal text-white/70 hover:text-primary hover:bg-neutral-charcoal/80 transition-colors border border-white/5">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          </div>
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{auth?.displayName ?? 'User'}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Administrator</p>
            </div>
            <div className="rounded-full size-10 border border-primary/30 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuA82NsT0sWCzjqkA2o7h-MbtCRUkI2Ih0G82nemwUboPnM3AXzZoR-ufL4vZ_O2PHtdxeCyS4KK5Si2KVIc-UkIlo5Nh7gTIRJTmt23hK2o_NBQ52YGRgvFMePD_HRSjsW-3PUVPy0qbjhWcvzWGOD_7aAMKVsuIUGBzx0QyuInpV0XT6LgLCLL9hHRpe_i8iCPOJXLGgY1x4aC1M8Zaeufs1UU2H6EHC5ibFqwZzyt33aCdz4B7v5X25zB_dDU5YAaAN1QLLUgkpE)' }} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-[1200px] flex flex-col gap-10">
          <div className="flex flex-col gap-2 text-center items-center">
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-white mb-2">
              Select <span className="text-primary font-medium">Establishment</span>
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-xl font-light leading-relaxed">
              Choose a facility to manage your clinical data, staff scheduling, and daily operations.
            </p>
          </div>

          <div className="flex justify-center px-4">
            <div className="relative w-full max-w-xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
              <input className="w-full bg-neutral-charcoal border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm tracking-wide" placeholder="Search by facility name or location..." type="text" />
            </div>
          </div>

          {showAddForm ? (
            <div className="w-full max-w-md mx-auto mt-8 p-6 bg-neutral-charcoal/40 border border-white/10 rounded-xl">
              <h2 className="text-lg font-semibold text-white mb-4">{establishments.length === 0 ? 'Add your first establishment' : 'Add New Establishment'}</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label htmlFor="est-name" className="block text-xs font-bold uppercase tracking-widest text-primary/80 mb-1">Name (required)</label>
                  <input id="est-name" type="text" value={addName} onChange={(e) => setAddName(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:ring-1 focus:ring-primary/50" placeholder="Clinic or facility name" required autoFocus />
                </div>
                <div>
                  <label htmlFor="est-type" className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Type (optional)</label>
                  <input id="est-type" type="text" value={addType} onChange={(e) => setAddType(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:ring-1 focus:ring-primary/50" placeholder="e.g. Orthopedic clinic" />
                </div>
                <div>
                  <label htmlFor="est-location" className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Location (optional)</label>
                  <input id="est-location" type="text" value={addLocation} onChange={(e) => setAddLocation(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:ring-1 focus:ring-primary/50" placeholder="Address or city" />
                </div>
                {addError && <p className="text-sm text-red-400">{addError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-background-dark font-bold text-sm uppercase tracking-wider hover:bg-primary/90">Add & continue</button>
                  {establishments.length > 0 && (
                    <button type="button" onClick={() => { setShowAddForm(false); setAddError(''); }} className="px-4 py-3 rounded-lg border border-white/20 text-white/80 text-sm font-medium">Cancel</button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {establishments.map((est) => (
                <div
                  key={est.id}
                  role="button"
                  tabIndex={0}
                  className="card-hover-effect flex flex-col bg-neutral-charcoal/40 border border-white/5 rounded-xl overflow-hidden cursor-pointer group text-left"
                  onClick={() => { setActiveEstablishment(est.id); navigate('/dashboard'); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveEstablishment(est.id); navigate('/dashboard'); } }}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/0 transition-colors z-0" />
                    <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${est.image || CARD_IMAGE_FALLBACK})` }} />
                    {est.logo && (
                      <div className="absolute top-4 left-4 z-20 flex size-12 items-center justify-center rounded-lg bg-white/95 shadow-md border border-white/20 p-1.5">
                        <img src={est.logo} alt="" className="size-full object-contain" />
                      </div>
                    )}
                    {est.primary && (
                      <div className="absolute bottom-4 left-4 z-20">
                        <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-md border border-primary/30">Primary Center</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      {est.logo && (
                        <div className="size-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center p-1.5 border border-white/10">
                          <img src={est.logo} alt="" className="size-full object-contain" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-white text-xl font-semibold group-hover:text-primary transition-colors">{est.name}</h3>
                        <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{est.type || 'Establishment'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="text-sm font-light">{est.location || '—'}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white/30 text-[11px]">Last active: {est.lastActive ?? '—'}</span>
                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                      </div>
                      {est.url && (
                        <a href={est.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1 w-fit" onClick={(e) => e.stopPropagation()}>Visit site</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setShowAddForm(true)} className="flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-white/10 rounded-xl min-h-[280px] hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-white/40 text-3xl group-hover:text-primary">add</span>
                </div>
                <p className="text-white/60 font-medium group-hover:text-white transition-colors">Add New Establishment</p>
                <p className="text-white/30 text-xs mt-2 text-center px-8">Add a medical facility or clinic.</p>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 py-8 border-t border-white/5">
            <div className="flex items-center gap-8 text-white/40 text-sm">
              <a className="hover:text-primary transition-colors" href="#">System Status</a>
              <a className="hover:text-primary transition-colors" href="#">Support Center</a>
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/30 text-xs tracking-widest uppercase">Secured by Vision Core</span>
              <div className="flex size-8 items-center justify-center rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
