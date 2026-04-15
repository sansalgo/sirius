"use client";

import { useState } from "react";
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
        scrolled ? "border-b border-zinc-100 bg-white/95 backdrop-blur-md" : "bg-transparent"
      }`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-6 items-center justify-center rounded-md bg-zinc-900 transition-colors group-hover:bg-zinc-700">
            <Star className="size-3 fill-white text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold text-zinc-900">Sirius</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-sm"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-zinc-900 text-white hover:bg-zinc-700 text-sm font-medium"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
