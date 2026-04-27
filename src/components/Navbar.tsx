"use client";

import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Products", href: "#" },
  { label: "Specs", href: "#specs" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a2a2a] bg-[#080808]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#00c8ff]" />
          <span className="text-lg font-bold tracking-widest text-[#f0f0f0]">
            LASER<span className="text-[#00c8ff]">PLAYS</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-medium tracking-wide text-[#888] transition-colors hover:text-[#f0f0f0]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="hidden rounded-md bg-[#00c8ff] px-5 py-2 text-sm font-semibold text-[#080808] transition-opacity hover:opacity-90 md:block"
          onClick={() => {}}
        >
          Order Now
        </button>

        <button
          className="text-[#888] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[#2a2a2a] bg-[#080808] px-6 pb-6 pt-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-[#888] hover:text-[#f0f0f0]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full rounded-md bg-[#00c8ff] py-2.5 text-sm font-semibold text-[#080808]">
            Order Now
          </button>
        </div>
      )}
    </header>
  );
}
