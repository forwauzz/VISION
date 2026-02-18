/**
 * Vision Landing Page — derived from stitch-extracted/stitch/vision_landing_page/code.html
 * Structure and classes match Stitch UI; "Request Access" will route to login when wired.
 */
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 selection:bg-primary/30 selection:text-primary min-h-screen">
      {/* Navigation — Stitch glass-nav */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <span className="material-symbols-outlined text-3xl font-light select-none" aria-hidden>visibility</span>
            </div>
            <span className="text-xl font-extrabold tracking-widest uppercase dark:text-white">Vision</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-sm font-medium tracking-wide hover:text-primary transition-colors" href="#platform">Platform</a>
            <a className="text-sm font-medium tracking-wide hover:text-primary transition-colors" href="#standards">Clinical Standards</a>
            <a className="text-sm font-medium tracking-wide hover:text-primary transition-colors" href="#security">Security</a>
            <Link to="/login" className="bg-primary text-background-dark px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide hover:bg-primary/90 transition-all active:scale-95">
              Request Access
            </Link>
          </div>
          <button type="button" className="md:hidden text-primary" aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>

      {/* Hero — Stitch hero-gradient */}
      <header className="relative pt-44 pb-32 overflow-hidden hero-gradient">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-gold bg-primary/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Now Boarding Early Adopters</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight dark:text-white mb-8 leading-[1.1]">
            The Future of <span className="text-primary italic">Surgical</span> Intelligence
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Precision documentation for the modern surgeon. Multimodal. Seamless. <span className="dark:text-white font-medium">Exclusive.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/login" className="w-full sm:w-auto min-w-[200px] bg-primary text-background-dark px-8 py-4 rounded-lg text-base font-bold tracking-wide hover:shadow-[0_0_30px_rgba(198,166,93,0.3)] transition-all text-center">
              Request Access
            </Link>
            <button type="button" className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-semibold tracking-wide border border-slate-700 hover:border-primary transition-all">
              Watch Showcase
            </button>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      </header>

      {/* Value Proposition — Stitch section */}
      <section className="py-24 border-y border-white/5 bg-surface-dark/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-primary text-sm font-bold uppercase tracking-[0.3em] mb-4">The Vision Standard</h2>
              <h3 className="text-3xl md:text-4xl font-bold dark:text-white leading-tight">Clinical Excellence Meets Luxury Design.</h3>
            </div>
            <p className="text-slate-400 max-w-md font-light">
              Designed for the high-stakes environment of the modern operating room, where precision is paramount and every second counts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">fluid_med</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Medically Refined</h4>
              <p className="text-slate-400 font-light leading-relaxed">Interfaces built for gloved hands and high-pressure decision making.</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Zero Cognitive Load</h4>
              <p className="text-slate-400 font-light leading-relaxed">AI that operates in the background, allowing you to focus entirely on the patient.</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">shield_person</span>
              </div>
              <h4 className="text-xl font-bold mb-3 dark:text-white">Absolute Privacy</h4>
              <p className="text-slate-400 font-light leading-relaxed">End-to-end encryption with dedicated hardware-level security protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features — Stitch */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group aspect-video bg-surface-dark">
              <div className="absolute inset-0 bg-gradient-to-tr from-background-dark/80 to-transparent z-10" />
              <img alt="Surgical Video Interface" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAASCPAWW9S5VX_8UeG_b9YsA3eWw27fU8A6XC3x1Uvz1g_3p86l-Kzs9v5xuDgRpcMgl0PF4gZsx5EjRiuEngOW0qkBsor7tlYcaE1SZE7TdtoK016HwxCk1A2KbNspyIBwa52OFDct24nzLK4ZMIPE-g96h50RoC-GR3Fb5EJoNwmU1N5LNS_BC25PRxcy_WoewqMdVEWFnKD7NfdB68fTrh52WTWbjw63y7XtWgubqNWMz47zBJXl-ZgsF7uoVI4VmLO237IQL8" />
              <div className="absolute bottom-6 left-6 z-20">
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest mb-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Ultra-HD 8K REC
                </div>
              </div>
            </div>
            <div>
              <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-4 block">Precision Capture</span>
              <h3 className="text-3xl md:text-4xl font-bold dark:text-white mb-6">Ultra-HD Multimodal Video Capture</h3>
              <p className="text-slate-400 font-light text-lg mb-8 leading-relaxed">
                Zero-latency recording across all connected modalities. Seamlessly integrate laparoscopic, robotic, and overhead camera feeds into a single, unified surgical stream.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  Synchronized multi-channel audio
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  Real-time intraoperative marking
                </li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-2xl bg-surface-dark border border-white/5 gold-glow transition-all duration-300">
              <div className="text-primary mb-8">
                <span className="material-symbols-outlined text-4xl">mic_external_on</span>
              </div>
              <h4 className="text-2xl font-bold dark:text-white mb-4">Medically-Tuned Transcription</h4>
              <p className="text-slate-400 font-light leading-relaxed mb-6">
                Custom LLMs trained on millions of clinical hours. Vision understands the nuance of anatomical landmarks, prosthetic nomenclature, and specific surgical techniques in real-time.
              </p>
              <div className="h-20 bg-background-dark/50 rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-1.5 w-3/4 bg-primary/20 rounded" />
                  <div className="h-1.5 w-1/2 bg-slate-700 rounded" />
                </div>
                <span className="text-[10px] font-mono text-primary uppercase">Analyzing...</span>
              </div>
            </div>
            <div className="p-10 rounded-2xl bg-surface-dark border border-white/5 gold-glow transition-all duration-300">
              <div className="text-primary mb-8">
                <span className="material-symbols-outlined text-4xl">description</span>
              </div>
              <h4 className="text-2xl font-bold dark:text-white mb-4">AI-Powered Structured Reports</h4>
              <p className="text-slate-400 font-light leading-relaxed mb-6">
                From skin-to-skin, Vision generates audit-ready operative reports in seconds. Automate documentation while maintaining the highest level of detail and accuracy.
              </p>
              <div className="h-20 bg-background-dark/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                  <span className="text-xs font-semibold">Report Generated</span>
                </div>
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 px-3 py-1.5 rounded">View PDF</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof — Stitch */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mb-12">Trusted by Prestigious Institutions</h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl font-bold tracking-tighter dark:text-white">MAYO CLINIC</div>
            <div className="text-xl font-bold tracking-tighter dark:text-white">JOHNS HOPKINS</div>
            <div className="text-xl font-bold tracking-tighter dark:text-white">CLEVELAND CLINIC</div>
            <div className="text-xl font-bold tracking-tighter dark:text-white">STANFORD MEDICINE</div>
          </div>
        </div>
      </section>

      {/* CTA — Stitch */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-surface-dark border border-border-gold rounded-3xl p-12 md:p-20 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold dark:text-white mb-8">Join the Vanguard of Surgery</h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                Access is currently restricted to select surgical departments and private practices. Apply for our early access program.
              </p>
              <Link to="/login" className="inline-block bg-primary text-background-dark px-10 py-4 rounded-lg text-lg font-bold tracking-wide hover:shadow-[0_0_30px_rgba(198,166,93,0.4)] transition-all">
                Request Access
              </Link>
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" aria-hidden />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" aria-hidden />
          </div>
        </div>
      </section>

      {/* Footer — Stitch full */}
      <footer className="bg-surface-dark/50 border-t border-white/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-primary">
                  <span className="material-symbols-outlined text-3xl font-light select-none" aria-hidden>visibility</span>
                </div>
                <span className="text-xl font-extrabold tracking-widest uppercase dark:text-white">Vision</span>
              </div>
              <p className="text-slate-400 max-w-xs font-light text-sm leading-relaxed mb-8">
                The ultimate multimodal intelligence layer for modern surgical environments. Redefining excellence in medical documentation.
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-2 border border-primary/40 rounded-lg">
                <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Secured by Vision Core</span>
              </div>
            </div>
            <div>
              <h5 className="text-white font-bold text-sm mb-6">Company</h5>
              <ul className="space-y-4 text-slate-400 text-sm font-light">
                <li><a className="hover:text-primary transition-colors" href="#platform">About Us</a></li>
                <li><a className="hover:text-primary transition-colors" href="#standards">Clinical Standards</a></li>
                <li><a className="hover:text-primary transition-colors" href="#security">Security Architecture</a></li>
                <li><a className="hover:text-primary transition-colors" href="#contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold text-sm mb-6">Legal</h5>
              <ul className="space-y-4 text-slate-400 text-sm font-light">
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">HIPAA Compliance</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Trust Center</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">© 2024 Vision Intelligence Platform. All rights reserved.</p>
            <div className="flex gap-6 text-slate-500">
              <a className="hover:text-primary transition-colors" href="#" aria-label="Language"><span className="material-symbols-outlined text-xl">language</span></a>
              <a className="hover:text-primary transition-colors" href="#" aria-label="Security"><span className="material-symbols-outlined text-xl">shield</span></a>
              <a className="hover:text-primary transition-colors" href="#" aria-label="Account"><span className="material-symbols-outlined text-xl">account_circle</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
