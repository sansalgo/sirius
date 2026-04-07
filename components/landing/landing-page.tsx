"use client";

import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { StatsBar, Features, HowItWorks, Outcomes, Pricing, CTASection, Footer } from "./sections";

export function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Outcomes />
      <Pricing />
      <CTASection />
      <Footer />
    </>
  );
}
