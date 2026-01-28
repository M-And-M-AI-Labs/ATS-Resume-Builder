"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent))_0%,transparent_50%)]" />

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm text-muted-foreground shadow-soft animate-fade-in">
            <Shield className="h-4 w-4 text-primary" />
            <span>ATS-safe resume tailoring</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl animate-fade-in [animation-delay:100ms] opacity-0">
            Tailor Your Resume to Every Job —{" "}
            <span className="text-primary">Without Breaking ATS Rules</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-fade-in [animation-delay:200ms] opacity-0 text-balance">
            Paste a job link. Get a clean, ATS-friendly resume tailored to that role in seconds.
          </p>

          {/* CTAs */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in [animation-delay:300ms] opacity-0">
            <Link href="/login">
              <Button variant="hero" size="xl">
                Get Started — $5/month
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="hero-secondary" size="xl">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground animate-fade-in [animation-delay:400ms] opacity-0">
            No fake experience. No keyword stuffing. Built for real hiring systems.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
