"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, Sparkles, ClipboardList, Trophy } from "lucide-react";
import CoachingBookingDrawer from "@/components/programs/CoachingBookingDrawer";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Hide on umpire scoring console to give full touch screen to the umpire pad
  const isUmpireScoring = pathname?.startsWith("/umpire/") && pathname.split("/").length > 3;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down -> hide bottom bar for maximum viewing area
        setIsVisible(false);
      } else {
        // Scrolling up -> show bottom bar
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (isUmpireScoring) {
    return null;
  }

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(15);
      } catch {
        // ignore
      }
    }
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Tournaments",
      href: "/#tournaments",
      icon: Trophy,
      isActive: pathname?.startsWith("/tournaments") && !pathname.includes("/live"),
    },
    {
      label: "Live Arena",
      href: "/live",
      icon: Radio,
      hasPulse: true,
      isActive: pathname?.includes("/live"),
    },
    {
      label: "Trial",
      onClick: () => {
        triggerHaptic();
        setIsBookingOpen(true);
      },
      icon: Sparkles,
      isSpecial: true,
    },
    {
      label: "Umpire",
      href: "/umpire/cuddalore-open-2026",
      icon: ClipboardList,
      isActive: pathname?.startsWith("/umpire"),
    },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation Dock"
        className={`fixed bottom-0 inset-x-0 z-40 block md:hidden transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Glassmorphic Container with Safe Area Inset for Notched iPhones */}
        <div className="mx-3 mb-2.5 rounded-2xl border border-off-white/15 bg-black/85 px-2 py-2 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
          <div className="grid grid-cols-5 items-center justify-items-center">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="group relative flex flex-col items-center justify-center p-1.5 focus:outline-none"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-court-green text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform active:scale-90">
                      <Icon className="size-4" />
                    </span>
                    <span className="mt-1 font-display text-[10px] font-bold uppercase tracking-wider text-court-green">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={triggerHaptic}
                  className={`group relative flex flex-col items-center justify-center p-1.5 transition-colors focus:outline-none ${
                    item.isActive ? "text-court-green" : "text-muted hover:text-off-white"
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <Icon className="size-5 transition-transform group-active:scale-90" />
                    {item.hasPulse && (
                      <span className="absolute -top-1 -right-1 flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-1 font-display text-[10px] tracking-wider uppercase font-semibold ${
                      item.isActive ? "text-court-green font-bold" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Embedded Drawer callable from Mobile Bottom Nav */}
      <CoachingBookingDrawer
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}
