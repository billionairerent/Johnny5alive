import { Package2, Battery, Zap, FileText, Cable } from "lucide-react";

const items = [
  { icon: Zap, name: "JGX3-120 Laser Cannon", note: "×1" },
  { icon: Battery, name: "Main Battery (18.5V 1.1Ah)", note: "×1" },
  { icon: Battery, name: "Spare Battery (18.5V 1.1Ah)", note: "×1" },
  { icon: Cable, name: "Charging Cable", note: "×1" },
  { icon: FileText, name: "User Manual & Safety Guide", note: "×1" },
];

export default function InTheBox() {
  return (
    <section className="bg-[#080808] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 lg:p-12">
          <div className="mb-8 flex items-center gap-3">
            <Package2 className="h-6 w-6 text-[#00c8ff]" />
            <h2 className="text-2xl font-bold text-[#f0f0f0]">
              What&apos;s in the Box
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ icon: Icon, name, note }) => (
              <div
                key={name}
                className="flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00c8ff]/10">
                  <Icon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f0f0f0] leading-tight">
                    {name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[#888]">{note}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-[#555]">
            ⚠ This device emits Class IV laser radiation. Always use appropriate
            laser safety eyewear. Authorized use only.
          </p>
        </div>
      </div>
    </section>
  );
}
