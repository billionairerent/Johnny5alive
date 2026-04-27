const views = [
  { label: "Front View", angle: "3/4 perspective, dark background" },
  { label: "Side Profile", angle: "Right-side, showing barrel length" },
  { label: "Battery Display", angle: "Close-up of 18.5V smart display" },
  { label: "Cooling System", angle: "Top-down view of dual fans" },
];

export default function ProductGallery() {
  return (
    <section className="bg-[#080808] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-2xl font-bold tracking-tight text-[#f0f0f0]">
          Product Gallery
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {views.map((view, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] transition-all hover:border-[#00c8ff]/40"
            >
              {/* Placeholder image area */}
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#111] to-[#1a1a1a]">
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <div className="h-16 w-16 rounded-full border border-[#2a2a2a] bg-[#080808] flex items-center justify-center">
                    <span className="font-mono text-xl font-black text-[#00c8ff]">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-xs text-[#555]">{view.angle}</p>
                </div>
              </div>
              {/* Label */}
              <div className="border-t border-[#2a2a2a] px-4 py-3">
                <p className="text-sm font-semibold text-[#f0f0f0]">
                  {view.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
