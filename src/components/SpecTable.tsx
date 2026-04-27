const specs = [
  { category: "Performance", rows: [
    { spec: "Model", value: "JGX3-120" },
    { spec: "Output Power", value: "120W" },
    { spec: "Effective Range", value: "10 meters" },
    { spec: "Laser Class", value: "Class IV" },
  ]},
  { category: "Power System", rows: [
    { spec: "Battery Voltage", value: "18.5V" },
    { spec: "Battery Capacity", value: "1.1Ah" },
    { spec: "Batteries Included", value: "2× (1 main + 1 spare)" },
    { spec: "Battery Display", value: "Smart digital readout" },
  ]},
  { category: "Cooling & Build", rows: [
    { spec: "Cooling System", value: "Dual active fans" },
    { spec: "Safety", value: "Integrated lock mechanism" },
    { spec: "Build Material", value: "CNC machined aluminum alloy" },
    { spec: "Connector", value: "XT60 high-current" },
  ]},
];

export default function SpecTable() {
  return (
    <section id="specs" className="bg-[#080808] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-2xl font-bold tracking-tight text-[#f0f0f0]">
          Full Specifications
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {specs.map(({ category, rows }) => (
            <div
              key={category}
              className="rounded-xl border border-[#2a2a2a] bg-[#111111] overflow-hidden"
            >
              <div className="border-b border-[#2a2a2a] bg-[#1a1a1a] px-6 py-3">
                <h3 className="text-xs font-semibold tracking-widest text-[#00c8ff] uppercase">
                  {category}
                </h3>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {rows.map(({ spec, value }) => (
                  <div
                    key={spec}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <span className="text-sm text-[#888]">{spec}</span>
                    <span className="font-mono text-sm font-semibold text-[#f0f0f0] text-right">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
