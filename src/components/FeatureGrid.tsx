import { Zap, Target, Battery, Wind, Shield, Monitor } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "120W Peak Output",
    description:
      "Industry-leading laser output power for professional-grade performance in demanding conditions.",
  },
  {
    icon: Target,
    title: "10m Effective Range",
    description:
      "Precision-calibrated optics deliver consistent, focused beam intensity at up to 10 meters.",
  },
  {
    icon: Battery,
    title: "Dual Battery System",
    description:
      "18.5V 1.1Ah high-density battery. Two batteries included — keep one charged, keep working.",
  },
  {
    icon: Wind,
    title: "Active Dual-Fan Cooling",
    description:
      "Twin high-CFM cooling fans maintain optimal operating temperature during extended sessions.",
  },
  {
    icon: Shield,
    title: "Integrated Safety Lock",
    description:
      "Multi-stage safety mechanism prevents accidental activation. Engineered for authorized use.",
  },
  {
    icon: Monitor,
    title: "Smart Battery Display",
    description:
      "Real-time voltage monitoring with digital readout. Know your charge state at a glance.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="bg-[#080808] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-[#f0f0f0] lg:text-4xl">
            Built Different
          </h2>
          <p className="mt-3 text-[#888]">
            Every component engineered for precision, durability, and control.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-[#2a2a2a] bg-[#111111] p-6 transition-all hover:border-[#00c8ff]/30 hover:bg-[#1a1a1a]"
            >
              <div className="mb-4 inline-flex rounded-lg bg-[#00c8ff]/10 p-3">
                <Icon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="mb-2 font-bold text-[#f0f0f0]">{title}</h3>
              <p className="text-sm leading-relaxed text-[#888]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
