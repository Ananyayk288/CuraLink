"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Boxes,
  History,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Rajiv Sharma, R.Ph");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qName = params.get("name") || params.get("pharmacistName");
      if (qName) {
        setUserName(decodeURIComponent(qName));
        try {
          localStorage.setItem("curalink_pharmacist_name", decodeURIComponent(qName));
        } catch {}
        return;
      }
      try {
        const saved = localStorage.getItem("curalink_pharmacist_name");
        if (saved) {
          setUserName(saved);
          return;
        }
      } catch {}
    }

    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.fullName) {
          setUserName(data.user.fullName);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/pharmacy/login");
    } catch {
      router.push("/pharmacy/login");
    }
  };

  const navLinks = [
    { href: "/pharmacy/dashboard", label: "Search & Dispense", shortLabel: "Search", icon: Search },
    { href: "/pharmacy/inventory", label: "Inventory", shortLabel: "Stock", icon: Boxes },
    { href: "/pharmacy/activity", label: "My Activity", shortLabel: "Activity", icon: History },
  ];

  if (pathname === "/pharmacy/login") {
    return null;
  }

  return (
    <>
      {/* Top Header for Desktop & Mobile Branding */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Brand */}
            <Link href="/pharmacy/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden group-hover:border-blue-300 transition-all">
                <img
                  src="/curalink-symbol.png"
                  alt="CuraLink Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">CuraLink</span>
                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">
                    Pharmacy
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:block -mt-0.5">Physical-to-Digital Care Coordination</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/pharmacy/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{userName}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                    <span>Licensed Station</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Designed for phones < 768px, >=48px tap targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 shadow-lg no-print pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/pharmacy/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                  isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-blue-600 stroke-[2.5]" : "text-slate-500"}`} />
                <span className="text-[11px] font-medium tracking-tight">{link.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
