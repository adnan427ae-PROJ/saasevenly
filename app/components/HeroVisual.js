// HeroVisual — the animated hero graphic: a globe with a slowly spinning
// meridian grid, a pulsing "signal" ring, and floating localized-price chips.
// Pure SVG + CSS animations, no libraries.

// Real prices computed at the suggested 20% max-discount cap (base $19).
// A modest, credible discount — not a fire sale.
const CHIPS = [
  { flag: "🇺🇸", price: "$19", note: "base", cls: "left-[4%] top-[6%]", delay: "0s" },
  { flag: "🇮🇳", price: "₹1,449", note: "-20%", cls: "right-[2%] top-[16%]", delay: "0.8s" },
  { flag: "🇧🇷", price: "R$89", note: "-10%", cls: "left-[0%] bottom-[22%]", delay: "1.6s" },
  { flag: "🇨🇭", price: "CHF 19", note: "+24%", cls: "right-[6%] bottom-[10%]", delay: "2.4s" },
  { flag: "🇳🇬", price: "₦20,819", note: "-20%", cls: "left-[30%] bottom-[-2%]", delay: "3.2s" },
];

export default function HeroVisual() {
  return (
    <div className="relative mx-auto mt-14 h-[300px] w-full max-w-md select-none sm:h-[340px]">
      {/* Pulsing ring behind the globe */}
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/40 animate-pulse-ring" />
      <div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/30 animate-pulse-ring"
        style={{ animationDelay: "1.1s" }}
      />

      {/* The globe */}
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300 via-accent to-orange-500 shadow-[0_24px_60px_-18px_rgba(245,158,11,0.55)]">
        {/* Spinning meridian grid */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full animate-spin-slow opacity-40"
          aria-hidden="true"
        >
          <g fill="none" stroke="white" strokeWidth="1.4">
            <circle cx="100" cy="100" r="96" />
            <ellipse cx="100" cy="100" rx="96" ry="38" />
            <ellipse cx="100" cy="100" rx="96" ry="72" />
            <ellipse cx="100" cy="100" rx="38" ry="96" />
            <ellipse cx="100" cy="100" rx="72" ry="96" />
            <line x1="4" y1="100" x2="196" y2="100" />
          </g>
        </svg>
        {/* Soft highlight so it reads as a sphere */}
        <div className="absolute left-6 top-5 h-14 w-14 rounded-full bg-white/35 blur-xl" />
      </div>

      {/* Floating localized-price chips */}
      {CHIPS.map((c) => (
        <div
          key={c.flag}
          className={`absolute ${c.cls} animate-float rounded-xl border border-neutral-200 bg-white/95 px-3 py-1.5 shadow-lg shadow-neutral-900/5`}
          style={{ animationDelay: c.delay }}
        >
          <span className="mr-1.5">{c.flag}</span>
          <span className="text-sm font-bold tracking-tight">{c.price}</span>
          <span
            className={
              "ml-1.5 text-[11px] font-semibold " +
              (c.note.startsWith("+")
                ? "text-emerald-600"
                : c.note.startsWith("-")
                ? "text-accent-dark"
                : "text-neutral-400")
            }
          >
            {c.note}
          </span>
        </div>
      ))}
    </div>
  );
}
