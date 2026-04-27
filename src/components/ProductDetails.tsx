import { ShoppingCart, CreditCard, Check, Package, Shield } from "lucide-react";

const quickSpecs = [
  { label: "Model", value: "JGX3-120" },
  { label: "Power", value: "120W" },
  { label: "Range", value: "10 meters" },
  { label: "Battery", value: "18.5V 1.1Ah" },
  { label: "In Box", value: "2× Batteries" },
];

export default function ProductDetails() {
  return (
    <section className="bg-[#080808] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            {/* Left: Pricing + CTA */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 px-3 py-1 text-xs font-semibold text-[#00c8ff] tracking-wider">
                    IN STOCK
                  </span>
                  <span className="text-xs text-[#888]">Ships within 3–5 business days</span>
                </div>
                <div className="mt-4 font-mono text-4xl font-black text-[#f0f0f0]">
                  Contact for Pricing
                </div>
                <p className="mt-1 text-sm text-[#888]">
                  WhatsApp: +86 180 5869 6320
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button className="flex items-center justify-center gap-2 rounded-md bg-[#00c8ff] py-4 text-sm font-bold text-[#080808] transition-all hover:bg-[#00c8ff]/90 hover:shadow-[0_0_20px_rgba(0,200,255,0.25)]">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button className="flex items-center justify-center gap-2 rounded-md border border-[#00c8ff]/40 py-4 text-sm font-semibold text-[#00c8ff] transition-colors hover:bg-[#00c8ff]/5">
                  <CreditCard className="h-4 w-4" />
                  Buy Now
                </button>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#2a2a2a] pt-6">
                {[
                  { icon: Shield, text: "Professional-grade build quality" },
                  { icon: Package, text: "Includes 2 batteries (main + spare)" },
                  { icon: Check, text: "Safety lock mechanism included" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-[#888]">
                    <Icon className="h-4 w-4 shrink-0 text-[#00c8ff]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick specs */}
            <div>
              <h3 className="mb-4 text-xs font-semibold tracking-widest text-[#888] uppercase">
                Quick Specs
              </h3>
              <div className="flex flex-col divide-y divide-[#2a2a2a]">
                {quickSpecs.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm text-[#888]">{label}</span>
                    <span className="font-mono text-sm font-semibold text-[#f0f0f0]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
