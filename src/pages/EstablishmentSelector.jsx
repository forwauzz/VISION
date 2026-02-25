/**
 * Vision Establishment Selector — establishments from auth (existing only; no creation in UI).
 * Empty state: No establishments assigned; contact administrator. Otherwise: grid of existing establishments.
 */
import { useNavigate, Link } from 'react-router-dom'
import { getAuth, setActiveEstablishment } from '../lib/auth.js'
import AppLayout from '../components/AppLayout.jsx'

const CARD_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80'

export default function EstablishmentSelector() {
  const navigate = useNavigate()
  const auth = getAuth()
  const establishments = auth?.establishments ?? []

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center px-4 py-12 lg:py-20">
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

          {establishments.length === 0 ? (
            <div className="w-full max-w-md mx-auto mt-8 p-8 bg-neutral-charcoal/40 border border-white/10 rounded-xl text-center">
              <span className="material-symbols-outlined text-4xl text-white/30 mb-4 block">business</span>
              <h2 className="text-lg font-semibold text-white mb-2">No establishments assigned</h2>
              <p className="text-white/50 text-sm">You do not have access to any facility yet. Contact your administrator to be assigned to an establishment.</p>
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
      </div>
    </AppLayout>
  )
}
