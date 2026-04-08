"use client";

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
import { Logo } from "@/components/logo";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resume", href: "/resume", icon: FileText },
  { name: "Jobs", href: "/jobs", icon: Search },
  { name: "Applications", href: "/applications", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-100">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </aside>
  );
}
