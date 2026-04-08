"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  Search,
  ClipboardList,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resume", href: "/resume", icon: FileText },
  { name: "Jobs", href: "/jobs", icon: Search },
  { name: "Applications", href: "/applications", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" />
        </div>

        <div className="hidden lg:block" />

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </header>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="flex h-12 items-center px-3 mb-4">
              <Logo />
            </div>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
