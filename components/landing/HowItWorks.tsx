import { Upload, Link2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your resume",
    description: "Upload or paste your existing resume. We'll keep your real experience intact.",
  },
  {
    icon: Link2,
    title: "Paste the job link",
    description: "Add the job posting URL. We analyze the role's requirements automatically.",
  },
  {
    icon: Download,
    title: "Download tailored resume",
    description: "Get an ATS-friendly DOCX or TXT file, ready to submit.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to a tailored resume
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative text-center"
              >
                {/* Connector line (hidden on mobile, visible between items on desktop) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-10 hidden h-px w-full bg-border md:block" />
                )}

                {/* Step number and icon */}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface-elevated shadow-soft transition-shadow group-hover:shadow-elevated">
                  <step.icon className="h-8 w-8 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
