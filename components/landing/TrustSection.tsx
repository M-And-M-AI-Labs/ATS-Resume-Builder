import { ShieldCheck, Eye, CheckCircle2, Lock } from "lucide-react";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Never invents experience",
    description: "We don't add fake jobs, skills, or accomplishments. Your resume stays truthful.",
  },
  {
    icon: Eye,
    title: "Only edits what exists",
    description: "We refine and optimize your existing content, never fabricate new information.",
  },
  {
    icon: CheckCircle2,
    title: "Passes modern ATS systems",
    description: "Clean formatting designed to work with the hiring tools companies actually use.",
  },
  {
    icon: Lock,
    title: "Transparent changes",
    description: "See a clear diff of what changed and why. No black-box magic.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left content */}
            <div>
              <span className="mb-4 inline-block text-sm font-medium text-primary">
                Trust & Safety
              </span>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your Career, Protected
              </h2>
              <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                Most AI resume tools hallucinate experience and stuff keywords recklessly.
                We built this differently — with integrity as the foundation.
              </p>

              <div className="space-y-6">
                {trustPoints.map((point) => (
                  <div key={point.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <point.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-foreground">
                        {point.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                  <div className="h-3 w-3 rounded-full bg-green-400/60" />
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-accent/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Original</p>
                    <p className="text-sm text-foreground">
                      &quot;Developed web applications using React&quot;
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-2">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                    <p className="text-xs text-primary mb-1">Tailored</p>
                    <p className="text-sm text-foreground">
                      &quot;Developed <span className="bg-primary/20 px-1 rounded">scalable</span> web applications using <span className="bg-primary/20 px-1 rounded">React and TypeScript</span>&quot;
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Same experience, optimized for the role
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
