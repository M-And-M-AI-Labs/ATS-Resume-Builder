const testimonials = [
  {
    quote: "I used this for backend roles and finally stopped rewriting my resume manually. The ATS-safe DOCX export is clutch.",
    name: "Rahul S.",
    role: "Software Engineer",
  },
  {
    quote: "Most tools just rewrite everything and ruin your resume. This one actually understands constraints.",
    name: "Emily T.",
    role: "Product Analyst",
  },
  {
    quote: "Applied to 40+ roles in a week without worrying about formatting or keywords. Game changer for bulk applications.",
    name: "Daniel K.",
    role: "New Grad",
  },
  {
    quote: "Clean output. No hallucinated nonsense. Exactly what I wanted from a resume tool.",
    name: "Ananya M.",
    role: "Data Engineer",
  },
  {
    quote: "The transparency is what sold me. I can see exactly what changed and why. No black box AI magic.",
    name: "Marcus L.",
    role: "DevOps Engineer",
  },
  {
    quote: "As a career switcher, I was nervous about AI messing up my narrative. This tool respects what I wrote.",
    name: "Sarah J.",
    role: "Career Switcher",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by Job Seekers
          </h2>
          <p className="text-lg text-muted-foreground">
            Real feedback from professionals who take their careers seriously
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-6 shadow-soft"
              >
                {/* Quote */}
                <p className="mb-6 text-sm leading-relaxed text-foreground">
                  &quot;{testimonial.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {testimonial.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
