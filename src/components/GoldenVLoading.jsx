/**
 * Vision — full-screen loading overlay: golden "V" (brand mark) + message.
 * Use when the system is loading or thinking (login, starting session, generating report, etc.).
 */
export default function GoldenVLoading({ message = 'Loading…', subMessage }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background-dark/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="vision-v-mark flex size-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 shadow-gold-glow">
          <span
            className="material-symbols-outlined text-5xl text-primary vision-v-pulse select-none"
            aria-hidden
          >
            visibility
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold tracking-wide text-white font-display">
            {message}
          </p>
          {subMessage && (
            <p className="text-sm text-white/60 max-w-xs font-light">
              {subMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
