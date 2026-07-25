"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { CompareHeaderLink } from "@/components/compare/CompareHeaderLink";
import { MotionLink } from "@/components/motion/Reveal";

const easeOut = "easeOut" as const;

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const NAV_MENUS = [
  {
    id: "residential",
    label: "Residential Lighting",
    href: "/collections/residential-lighting",
    children: [
      { label: "Bulbs", href: "/collections/bulbs" },
      { label: "Down Lights", href: "/collections/downlights" },
      { label: "Battens", href: "/collections/battens-tube-lights" },
      { label: "Panels", href: "/collections/led-recessed-surface-panels" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial Lighting",
    href: "/collections/commercial-lighting",
    children: [
      { label: "Flood Lights", href: "/collections/flood-lights" },
      { label: "High Bay Lights", href: "/collections/highbay-lights" },
      { label: "Street Light", href: "/collections/street-light" },
    ],
  },
] as const;

function NavUnderlineLink({
  href,
  children,
  overlay,
}: {
  href: string;
  children: React.ReactNode;
  reduce?: boolean | null;
  overlay: boolean;
}) {
  return (
    <Link
      href={href}
      className={`nav-sweep-link relative inline-flex text-sm font-medium uppercase tracking-wide ${
        overlay ? "text-white hover:text-white/80" : "text-brand-dark hover:text-brand"
      }`}
    >
      {children}
    </Link>
  );
}

function MegaMenu({
  menu,
  open,
  onOpen,
  onClose,
  reduce,
  overlay,
}: {
  menu: (typeof NAV_MENUS)[number];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  reduce: boolean | null;
  overlay: boolean;
}) {
  const panelTransition: Transition = {
    duration: reduce ? 0 : 0.2,
    ease: easeOut,
  };

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <NavUnderlineLink href={menu.href} reduce={reduce} overlay={overlay}>
        {menu.label}
      </NavUnderlineLink>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={panelTransition}
            className="absolute left-0 top-full z-50 mt-3 min-w-[220px] rounded-md border border-brand-border bg-white p-3 shadow-lg"
          >
            <ul className="space-y-1">
              {menu.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className="block rounded px-2 py-1.5 text-sm text-brand-dark hover:bg-slate-50 hover:text-brand"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function IconMotion({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean | null;
}) {
  return (
    <motion.span
      className="inline-flex"
      whileHover={reduce ? undefined : { scale: 1.08 }}
      transition={{ duration: reduce ? 0 : 0.15, ease: easeOut }}
    >
      {children}
    </motion.span>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastY = useRef(0);

  const overlay = isHome && !scrolled && !drawerOpen;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (isHome) setScrolled(y > 48);

      if (reduce) {
        setHidden(false);
        return;
      }
      // Don't auto-hide while the transparent hero header is showing
      if (isHome && y < 48) {
        setHidden(false);
        lastY.current = y;
        return;
      }
      const goingDown = y > lastY.current;
      if (goingDown && y > 64) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce, isHome]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const headerTransition: Transition = {
    duration: reduce ? 0 : 0.2,
    ease: easeOut,
  };

  return (
    <>
      <header className={`z-40 ${overlay ? "absolute inset-x-0 top-0" : "sticky top-0"}`}>
        <motion.div
          className={`will-change-transform ${
            overlay
              ? "border-b border-transparent bg-transparent"
              : scrolled
                ? "border-b border-brand-border/80 bg-white/90 shadow-sm backdrop-blur-md"
                : "border-b border-brand-border bg-white/95 backdrop-blur"
          }`}
          initial={false}
          animate={{
            y: hidden ? "-100%" : "0%",
            scale: reduce ? 1 : scrolled && !overlay ? 0.985 : 1,
          }}
          transition={headerTransition}
        >
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[padding] duration-300 ${
              scrolled && !overlay ? "py-3 sm:py-3.5" : "py-4 sm:py-5"
            }`}
          >
            <motion.div
              className="shrink-0"
              whileHover={reduce ? undefined : { scale: 1.04 }}
              transition={{ duration: reduce ? 0 : 0.15, ease: easeOut }}
            >
              <Link href="/" className="block" aria-label="Orient Lighting home">
                <BrandLogo
                  variant="header"
                  priority
                  className={overlay ? "brightness-0 invert" : undefined}
                />
              </Link>
            </motion.div>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV_MENUS.map((menu) => (
                <MegaMenu
                  key={menu.id}
                  menu={menu}
                  open={openMenu === menu.id}
                  onOpen={() => setOpenMenu(menu.id)}
                  onClose={() => setOpenMenu(null)}
                  reduce={reduce}
                  overlay={overlay}
                />
              ))}
            </nav>

            <div
              className={`flex items-center gap-3 ${overlay ? "text-white" : "text-brand-navy"}`}
            >
              {!overlay ? (
                <IconMotion reduce={reduce}>
                  <CompareHeaderLink />
                </IconMotion>
              ) : (
                <MotionLink
                  href="/collections/best-sellers"
                  className="hidden rounded-full bg-brand px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white hover:text-brand sm:inline-flex"
                >
                  Shop Now
                </MotionLink>
              )}
              <IconMotion reduce={reduce}>
                <Link
                  href="/search"
                  aria-label="Search"
                  className={overlay ? "hover:text-white/80" : "hover:text-brand"}
                >
                  <IconSearch />
                </Link>
              </IconMotion>
              <IconMotion reduce={reduce}>
                <button
                  type="button"
                  className={`inline-flex lg:hidden ${overlay ? "hover:text-white/80" : "hover:text-brand"}`}
                  aria-label={drawerOpen ? "Close menu" : "Open menu"}
                  aria-expanded={drawerOpen}
                  onClick={() => setDrawerOpen((v) => !v)}
                >
                  {drawerOpen ? <IconClose /> : <IconMenu />}
                </button>
              </IconMotion>
            </div>
          </div>

          {!overlay ? (
            <div className="flex gap-3 overflow-x-auto border-t border-brand-border px-4 py-2 text-xs lg:hidden">
              <Link href="/collections/residential-lighting" className="whitespace-nowrap text-brand-dark">
                Residential
              </Link>
              <Link href="/collections/commercial-lighting" className="whitespace-nowrap text-brand-dark">
                Commercial
              </Link>
            </div>
          ) : null}
        </motion.div>
      </header>

      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              key="drawer-backdrop"
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.25, ease: easeOut }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer-panel"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col bg-white shadow-xl lg:hidden"
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "100%" }}
              transition={{ duration: reduce ? 0 : 0.25, ease: easeOut }}
            >
              <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
                <span className="text-sm font-semibold text-brand-navy">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="text-brand-navy hover:text-brand"
                  onClick={() => setDrawerOpen(false)}
                >
                  <IconClose />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  {NAV_MENUS.map((menu) => (
                    <div key={menu.id}>
                      <Link
                        href={menu.href}
                        className="text-sm font-medium text-brand-dark hover:text-brand"
                        onClick={() => setDrawerOpen(false)}
                      >
                        {menu.label}
                      </Link>
                      <div className="mt-2 space-y-1 border-l border-brand-border pl-3">
                        {menu.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block py-1 text-sm text-brand-muted hover:text-brand"
                            onClick={() => setDrawerOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/compare"
                    className="block text-sm font-medium text-brand-dark hover:text-brand"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Compare Products
                  </Link>
                </div>
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
