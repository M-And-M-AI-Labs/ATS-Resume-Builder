"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stop Rewriting Resumes.
            <br />
            Start Applying Smarter.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of professionals who&apos;ve streamlined their job search.
          </p>

          <Link href="/login">
            <Button variant="hero" size="xl">
              Get Started for $5/month
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required to explore. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
