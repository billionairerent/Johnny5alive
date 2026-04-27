import { ShoppingCart, Zap, Target, Wind, Battery } from "lucide-react";

const stats = [
  { icon: Zap, label: "120W", sub: "Peak Output" },
  { icon: Target, label: "10m", sub: "Effective Range" },
  { icon: Battery, label: "18.5V", sub: "Battery System" },
  { icon: Wind, label: "Dual", sub: "Fan Cooling" },
];

export default function ProductHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080808] pt-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c8ff]/5 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-[#ff6b00]/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#00c8ff]/30 bg-[#00c8ff]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#00c8ff]">
              CLASS IV LASER
            </span>
            <span className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs font-medium text-[#888]">
              SKU: JGX3-120
            </span>
          </div>

          <h1 className="text-5xl font-black leading-none tracking-tight text-[#f0f0f0] lg:text-7xl">
            JGX3-120
            <br />
            <span className="text-[#00c8ff]">LASER</span>
            <br />
            CANNON
          </h1>

          <p className="max-w-md text-lg text-[#888] leading-relaxed">
            120 Watts of precision-engineered laser output. Dual active cooling.
            Smart battery monitoring. Built for professionals who demand
            performance.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-md bg-[#00c8ff] px-8 py-3.5 text-sm font-bold text-[#080808] transition-all hover:bg-[#00c8ff]/90 hover:shadow-[0_0_20px_rgba(0,200,255,0.3)]">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button className="rounded-md border border-[#2a2a2a] px-8 py-3.5 text-sm font-semibold text-[#f0f0f0] transition-colors hover:border-[#00c8ff]/50 hover:text-[#00c8ff]">
              View Specs
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-4 text-center"
              >
                <Icon className="mb-2 h-5 w-5 text-[#00c8ff]" />
                <span className="font-mono text-xl font-black text-[#f0f0f0]">
                  {label}
                </span>
                <span className="mt-0.5 text-xs text-[#888]">{sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product visual */}
        <div className="relative flex items-center justify-center">
          <div className="relative flex h-[420px] w-full items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#111111] lg:h-[520px]">
            {/* Glow behind product */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-[#00c8ff]/10 blur-[80px]" />
            </div>

            {/* Product silhouette placeholder */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <svg
                viewBox="0 0 320 200"
                className="w-72 drop-shadow-[0_0_30px_rgba(0,200,255,0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Barrel */}
                <rect x="20" y="88" width="140" height="24" rx="4" fill="#1e1e1e" stroke="#333" strokeWidth="1"/>
                {/* Lens */}
                <ellipse cx="20" cy="100" rx="14" ry="14" fill="#0a1a2e" stroke="#00c8ff" strokeWidth="1.5"/>
                <ellipse cx="20" cy="100" rx="8" ry="8" fill="#001833" stroke="#00c8ff" strokeWidth="1" opacity="0.8"/>
                <ellipse cx="20" cy="100" rx="4" ry="4" fill="#00c8ff" opacity="0.6"/>
                {/* Body */}
                <rect x="160" y="72" width="100" height="56" rx="6" fill="#222" stroke="#333" strokeWidth="1"/>
                {/* Fan 1 */}
                <circle cx="192" cy="100" r="20" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
                <circle cx="192" cy="100" r="8" fill="#111" stroke="#555" strokeWidth="1"/>
                {/* Fan 2 */}
                <circle cx="228" cy="100" r="20" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
                <circle cx="228" cy="100" r="8" fill="#111" stroke="#555" strokeWidth="1"/>
                {/* Display */}
                <rect x="165" y="77" width="44" height="22" rx="2" fill="#001218" stroke="#00c8ff" strokeWidth="0.75"/>
                <text x="170" y="92" fontFamily="monospace" fontSize="9" fill="#00c8ff">18.5V</text>
                {/* Handle */}
                <rect x="185" y="128" width="50" height="60" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
                {/* Trigger guard */}
                <path d="M 195 128 Q 210 145 215 158 Q 225 158 235 128" stroke="#333" strokeWidth="1" fill="none"/>
                {/* Laser hazard sticker */}
                <rect x="164" y="103" width="22" height="14" rx="1" fill="#ff6b00" opacity="0.9"/>
                <text x="167" y="113" fontFamily="monospace" fontSize="6" fill="white" fontWeight="bold">⚠ LP</text>
              </svg>

              <p className="text-xs font-mono text-[#444] tracking-widest">
                JGX3-120 — PRODUCT RENDER
              </p>
            </div>

            {/* Corner labels */}
            <span className="absolute bottom-4 right-4 font-mono text-xs text-[#333]">
              120W / 10M RANGE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
