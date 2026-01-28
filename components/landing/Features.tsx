import { FileCheck, Edit3, Search, BarChart3, FileText, Zap } from "lucide-react";

const features = [
  {
    icon: FileCheck,
    title: "ATS-Friendly DOCX Output",
    description: "Clean formatting that passes modern applicant tracking systems without issues.",
  },
  {
    icon: Edit3,
    title: "Tailoring, Not Rewriting",
    description: "We enhance your existing content. Your experience stays authentic.",
  },
  {
    icon: Search,
    title: "Transparent Keyword Matching",
    description: "See exactly which keywords were matched and how your resume was adjusted.",
  },
  {
    icon: BarChart3,
    title: "Skill Gap Analysis",
    description: "Understand what skills the job requires and where you might need to upskill.",
  },
  {
    icon: FileText,
    title: "Plain-Text Export",
    description: "TXT format for those annoying job portals that strip formatting.",
  },
  {
    icon: Zap,
    title: "Fast Bulk Applications",
    description: "Apply to dozens of jobs without manually rewriting your resume each time.",
  },
];

const Features = () => {
  return (
    <section id="features" className="border-y border-border bg-secondary/30 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for serious job seekers who apply at scale
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-elevated"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
