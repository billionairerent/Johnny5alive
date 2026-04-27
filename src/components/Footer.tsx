import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#080808] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#00c8ff]" />
            <span className="font-bold tracking-widest text-[#f0f0f0]">
              LASER<span className="text-[#00c8ff]">PLAYS</span>
            </span>
          </div>

          <p className="text-sm text-[#888]">
            © {new Date().getFullYear()} LaserPlays. All rights reserved.
          </p>

          <nav className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-[#888] transition-colors hover:text-[#f0f0f0]"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-[#444]">
          ⚠ This product emits high-powered laser radiation. For professional
          and authorized use only. Always use appropriate safety equipment.
        </p>
      </div>
    </footer>
  );
}
