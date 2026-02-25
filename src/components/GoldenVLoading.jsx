/**
 * Vision — full-screen loading overlay: golden "V" (brand mark) + message.
 * Use when the system is loading or thinking (login, starting session, generating report, etc.).
 * Optional steps/activeStep for step-based progress (e.g. Transcribing → Extracting → Building).
 */
export default function GoldenVLoading({ message = 'Loading…', subMessage, steps, activeStep = 0 }) {
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
          {steps && steps.length > 0 && (
            <ol className="mt-4 flex flex-col gap-1.5 text-left text-sm text-white/70 font-light" aria-label="Progress">
              {steps.map((label, i) => (
                <li key={i} className={`flex items-center gap-2 ${i + 1 <= activeStep ? 'text-primary' : 'text-white/40'}`}>
                  <span className="material-symbols-outlined text-base">{i + 1 <= activeStep ? 'check_circle' : 'radio_button_unchecked'}</span>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
