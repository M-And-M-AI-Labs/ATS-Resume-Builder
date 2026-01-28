"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is the output actually ATS-safe?",
    answer: "Yes. We use clean DOCX formatting without tables, headers, footers, or complex layouts that trip up applicant tracking systems. The format has been tested against major ATS platforms like Workday, Greenhouse, and Lever.",
  },
  {
    question: "Will it add fake experience to my resume?",
    answer: "Absolutely not. We only edit and optimize what you've already written. We never invent jobs, skills, certifications, or accomplishments. Your resume stays 100% truthful.",
  },
  {
    question: "What formats can I download?",
    answer: "You can download your tailored resume in DOCX format (recommended for most applications) or plain TXT format (useful for job portals that strip formatting).",
  },
  {
    question: "How many resumes can I generate per month?",
    answer: "Your $5/month subscription includes up to 500 tailored resumes. That's enough for serious job seekers applying to multiple roles daily.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no contracts or commitments. Cancel in one click from your account settings, and you won't be charged again.",
  },
  {
    question: "How does keyword matching work?",
    answer: "We analyze the job posting to identify key skills, technologies, and qualifications. Then we look for matching content in your resume and help surface it more prominently. You can always see exactly what was changed.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="border-t border-border bg-secondary/30 py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Common questions about our resume tailoring service
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-card px-6 shadow-soft"
              >
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
