"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 20);
  });

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 transition-colors group-hover:bg-white/15">
            <Star className="size-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Sirius</span>
        </Link>

        {/* Nav links – desktop only */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-white text-zinc-950 hover:bg-zinc-100"
          >
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
