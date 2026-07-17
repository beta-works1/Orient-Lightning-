"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { CompareHeaderLink } from "@/components/compare/CompareHeaderLink";

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
  reduce,
}: {
  href: string;
  children: React.ReactNode;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      className="relative inline-flex"
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
    >
      <Link href={href} className="text-sm font-medium text-brand-dark hover:text-brand">
        {children}
      </Link>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-brand"
        style={{ originX: 0 }}
        variants={{
          rest: { scaleX: 0, opacity: 0 },
          hover: { scaleX: 1, opacity: 1 },
        }}
        transition={{ duration: reduce ? 0 : 0.15, ease: easeOut }}
      />
    </motion.div>
  );
}

function MegaMenu({
  menu,
  open,
  onOpen,
  onClose,
  reduce,
}: {
  menu: (typeof NAV_MENUS)[number];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  reduce: boolean | null;
}) {
  const panelTransition: Transition = {
    duration: reduce ? 0 : 0.2,
    ease: easeOut,
  };

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <NavUnderlineLink href={menu.href} reduce={reduce}>
        {menu.label}
      </NavUnderlineLink>
      <AnimatePresence>
        {open ? (
          <motion.div
            key={menu.id}
            className="absolute left-0 top-full z-50 min-w-[220px] pt-2"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={panelTransition}
          >
            <div className="rounded-md border border-brand-border bg-white py-2 shadow-lg">
              {menu.children.map((child) => (
                <Link
                  key={child.href}
                  className="block px-4 py-2 text-sm hover:bg-slate-50"
                  href={child.href}
                >
                  {child.label}
                </Link>
              ))}
            </div>
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
      whileHover={reduce ? undefined : { scale: 1.1 }}
      transition={{ duration: reduce ? 0 : 0.15, ease: easeOut }}
    >
      {children}
    </motion.span>
  );
}

export function Header() {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (reduce) {
        setHidden(false);
        return;
      }
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      if (goingDown && y > 64) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);

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
      <motion.header
        className="sticky top-0 z-40 border-b border-brand-border bg-white/95 backdrop-blur will-change-transform"
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={headerTransition}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <motion.div
            className="shrink-0"
            whileHover={reduce ? undefined : { scale: 1.04 }}
            transition={{ duration: reduce ? 0 : 0.15, ease: easeOut }}
          >
            <Link href="/" className="block" aria-label="Orient Lighting home">
              <BrandLogo variant="header" priority />
            </Link>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_MENUS.map((menu) => (
              <MegaMenu
                key={menu.id}
                menu={menu}
                open={openMenu === menu.id}
                onOpen={() => setOpenMenu(menu.id)}
                onClose={() => setOpenMenu(null)}
                reduce={reduce}
              />
            ))}
            <NavUnderlineLink href="/collections/smart-lights" reduce={reduce}>
              Smart Lights
            </NavUnderlineLink>
          </nav>

          <div className="flex items-center gap-3 text-brand-navy">
            <IconMotion reduce={reduce}>
              <CompareHeaderLink />
            </IconMotion>
            <IconMotion reduce={reduce}>
              <Link href="/search" aria-label="Search" className="hover:text-brand">
                <IconSearch />
              </Link>
            </IconMotion>
            <IconMotion reduce={reduce}>
              <button
                type="button"
                className="inline-flex lg:hidden hover:text-brand"
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen((v) => !v)}
              >
                {drawerOpen ? <IconClose /> : <IconMenu />}
              </button>
            </IconMotion>
          </div>
        </div>

        <div className="flex lg:hidden gap-3 overflow-x-auto border-t border-brand-border px-4 py-2 text-xs">
          <Link href="/collections/bulbs" className="whitespace-nowrap text-brand-dark">
            Bulbs
          </Link>
          <Link href="/collections/downlights" className="whitespace-nowrap text-brand-dark">
            Downlights
          </Link>
          <Link href="/collections/led-recessed-surface-panels" className="whitespace-nowrap text-brand-dark">
            Panels
          </Link>
          <Link href="/collections/flood-lights" className="whitespace-nowrap text-brand-dark">
            Flood
          </Link>
          <Link href="/collections/smart-lights" className="whitespace-nowrap text-brand-dark">
            Smart
          </Link>
        </div>
      </motion.header>

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
                    href="/collections/smart-lights"
                    className="block text-sm font-medium text-brand-dark hover:text-brand"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Smart Lights
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
