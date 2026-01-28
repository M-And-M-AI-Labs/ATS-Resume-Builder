"use client";

import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  "Up to 500 resume customizations per month",
  "Unlimited job link submissions",
  "ATS-friendly DOCX export",
  "Plain-text TXT export",
  "Keyword matching transparency",
  "Cancel anytime",
];

const Pricing = () => {
  return (
    <section id="pricing" className="border-y border-border bg-secondary/30 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            One plan. Everything included. No surprises.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            {/* Price */}
            <div className="mb-6 text-center">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-foreground">$5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cheaper than one coffee per week
              </p>
            </div>

            {/* Divider */}
            <div className="mb-6 h-px bg-border" />

            {/* Features */}
            <ul className="mb-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link href="/login">
              <Button variant="hero" size="xl" className="w-full">
                Start for $5/month
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {/* Security note */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Secure payment via Stripe. Cancel in one click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
